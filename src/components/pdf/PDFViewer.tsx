"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import {
  ZoomIn,
  ZoomOut,
  Download,
  Maximize,
  Minimize,
  ChevronLeft,
  ChevronRight,
  Search,
  ArrowLeft,
  RotateCw,
  RotateCcw,
  Printer,
  Share2,
  Scroll,
  Layers,
  Check,
  Star,
  FileText,
  Folder as FolderIcon,
  MoreVertical,
  Info,
  PanelLeftClose,
  PanelLeft,
  SlidersHorizontal,
  X,
  Copy,
  BookOpen,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { IPDF } from "@/models/PDF";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ThemeToggle } from "@/components/theme-toggle";
import { useToast } from "@/components/ui/toast";
import { formatBytes } from "@/lib/utils";
import { format } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFViewerProps {
  pdf: IPDF;
}

type ViewerMode = "scroll" | "book" | "single";

const ZOOM_PRESETS = [
  { label: "50%", value: 0.5 },
  { label: "75%", value: 0.75 },
  { label: "100%", value: 1.0 },
  { label: "125%", value: 1.25 },
  { label: "150%", value: 1.5 },
  { label: "200%", value: 2.0 },
];

// Synthesize a gentle paper turning rustle using Web Audio API
function playPageTurnSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    if (ctx.state === "suspended") {
      ctx.resume();
    }
    const duration = 0.12;
    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.35));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 1400;
    filter.Q.value = 2.2;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start();
  } catch (err) {
    // Ignore audio autoplay restrictions
  }
}

export function PDFViewer({ pdf }: PDFViewerProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [inputPage, setInputPage] = useState("1");
  const [scale, setScale] = useState(1.0);
  const [rotation, setRotation] = useState(0);

  // View Mode: Scroll-based (default), Book Mode (interactive 3D flip), or Single page
  const [viewMode, setViewMode] = useState<ViewerMode>("scroll");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [flipDirection, setFlipDirection] = useState<"next" | "prev">("next");

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showThumbnails, setShowThumbnails] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Search in document
  const [showSearchBar, setShowSearchBar] = useState(false);
  const [searchText, setSearchText] = useState("");

  // Starred persistence
  const [isStarred, setIsStarred] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Track view count
  useEffect(() => {
    fetch(`/api/pdfs/${pdf.publicId}/view`, { method: "POST" }).catch(console.error);
  }, [pdf.publicId]);

  // Starred sync
  useEffect(() => {
    try {
      const stored = localStorage.getItem("eirumipdfs_starred");
      if (stored) {
        const ids: string[] = JSON.parse(stored);
        setIsStarred(ids.includes(pdf.publicId));
      }
    } catch (e) {
      console.error(e);
    }
  }, [pdf.publicId]);

  const toggleStar = () => {
    try {
      const stored = localStorage.getItem("eirumipdfs_starred");
      const ids: string[] = stored ? JSON.parse(stored) : [];
      const next = isStarred ? ids.filter((id) => id !== pdf.publicId) : [...ids, pdf.publicId];
      localStorage.setItem("eirumipdfs_starred", JSON.stringify(next));
      setIsStarred(!isStarred);
      toast(!isStarred ? "Added to Starred" : "Removed from Starred");
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    setInputPage(pageNumber.toString());
  }, [pageNumber]);

  // Scroll Mode Intersection Observer: dynamically update pageNumber as user scrolls
  useEffect(() => {
    if (viewMode !== "scroll" || !numPages || !scrollContainerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        let bestEntry: IntersectionObserverEntry | null = null;
        for (const entry of entries) {
          if (entry.isIntersecting) {
            if (!bestEntry || entry.intersectionRatio > bestEntry.intersectionRatio) {
              bestEntry = entry;
            }
          }
        }
        if (bestEntry) {
          const pageAttr = bestEntry.target.getAttribute("data-page-number");
          if (pageAttr) {
            const parsed = parseInt(pageAttr, 10);
            if (!isNaN(parsed)) {
              setPageNumber(parsed);
            }
          }
        }
      },
      {
        root: scrollContainerRef.current,
        threshold: [0.1, 0.5, 0.9],
      }
    );

    const pageElements = scrollContainerRef.current.querySelectorAll("[data-page-number]");
    pageElements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [viewMode, numPages]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === "ArrowRight" || e.key === "PageDown") {
        turnPage("next");
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        turnPage("prev");
      } else if (e.key === "+" || e.key === "=") {
        changeZoom(0.15);
      } else if (e.key === "-") {
        changeZoom(-0.15);
      } else if (e.key === "Home") {
        jumpToPage(1);
      } else if (e.key === "End") {
        if (numPages) jumpToPage(numPages);
      } else if (e.key === "r" && !e.ctrlKey && !e.metaKey) {
        rotateClockwise();
      } else if (e.key === "b" && !e.ctrlKey && !e.metaKey) {
        setViewMode((m) => (m === "book" ? "scroll" : "book"));
      } else if (e.key === "f" && !e.ctrlKey && !e.metaKey) {
        toggleFullscreen();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [numPages, pageNumber, viewMode]);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setPageNumber(1);
  };

  // Jump to specific page and scroll to it if in scroll mode
  const jumpToPage = (target: number) => {
    if (!numPages || target < 1 || target > numPages) return;
    setPageNumber(target);

    if (viewMode === "scroll") {
      const el = document.getElementById(`pdf-page-${target}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  };

  // Page turning with book effect
  const turnPage = (direction: "next" | "prev") => {
    setFlipDirection(direction);

    if (viewMode === "book") {
      if (soundEnabled) playPageTurnSound();

      if (direction === "next") {
        if (pageNumber === 1) {
          jumpToPage(Math.min(numPages || 1, 2));
        } else {
          jumpToPage(Math.min(numPages || 1, pageNumber + 2));
        }
      } else {
        if (pageNumber <= 3) {
          jumpToPage(1);
        } else {
          jumpToPage(Math.max(1, pageNumber - 2));
        }
      }
    } else {
      const offset = direction === "next" ? 1 : -1;
      const target = pageNumber + offset;
      if (target >= 1 && numPages && target <= numPages) {
        jumpToPage(target);
      }
    }
  };

  const handlePageJumpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const p = parseInt(inputPage, 10);
    if (!isNaN(p) && p >= 1 && numPages && p <= numPages) {
      jumpToPage(p);
    } else {
      setInputPage(pageNumber.toString());
    }
  };

  const changeZoom = (delta: number) => {
    setScale((prev) => Math.min(Math.max(0.4, Number((prev + delta).toFixed(2))), 3.0));
  };

  const fitToWidth = () => {
    if (containerRef.current) {
      const width = containerRef.current.clientWidth - 80;
      const targetScale = Math.min(1.8, Math.max(0.6, width / (viewMode === "book" ? 1100 : 700)));
      setScale(Number(targetScale.toFixed(2)));
    }
  };

  const rotateClockwise = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const rotateCounterClockwise = () => {
    setRotation((prev) => (prev + 270) % 360);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(console.error);
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = pdf.storageUrl;
    link.download = `${pdf.title}.pdf`;
    link.target = "_blank";
    link.click();
    toast("Opening download...", "info");
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyShareLink = () => {
    const url = typeof window !== "undefined" ? `${window.location.origin}/view/${pdf.publicId}` : "";
    navigator.clipboard.writeText(url);
    setIsCopied(true);
    toast("Link copied to clipboard!");
    setTimeout(() => setIsCopied(false), 2000);
  };

  const textRenderer = useCallback(
    (textItem: any) => {
      if (!searchText.trim()) return textItem.str;
      return highlightPattern(textItem.str, searchText) as unknown as string;
    },
    [searchText]
  );

  // Book Spread Calculation
  // Cover is Page 1 on the right.
  // When pageNumber > 1: Left page is even, Right page is odd (or null if beyond numPages)
  const leftBookPage = pageNumber === 1 ? null : pageNumber % 2 === 0 ? pageNumber : pageNumber - 1;
  const rightBookPage =
    pageNumber === 1
      ? 1
      : pageNumber % 2 === 0
      ? pageNumber + 1 <= (numPages || 0)
        ? pageNumber + 1
        : null
      : pageNumber;

  return (
    <div
      ref={containerRef}
      className={`flex h-screen w-full flex-col bg-[#f0f4f9] dark:bg-[#131314] text-foreground overflow-hidden select-none ${
        isFullscreen ? "fixed inset-0 z-50" : ""
      }`}
    >
      {/* ═══════════════ GOOGLE DRIVE STYLE TOP VIEWER BAR ═══════════════ */}
      <header className="h-14 px-3 sm:px-4 flex items-center justify-between border-b border-border/50 bg-background/95 backdrop-blur-xl z-30 shrink-0">
        {/* Left: Back Arrow, PDF Badge, Title, Star */}
        <div className="flex items-center gap-2.5 min-w-0 max-w-[35%]">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/")}
            className="h-8 w-8 rounded-full shrink-0 text-muted-foreground hover:text-foreground hover:bg-secondary"
            title="Back to EirumiView"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>

          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-red-500/10 text-red-500 shrink-0">
            <FileText className="h-4 w-4" />
          </div>

          <div className="flex items-center gap-2 min-w-0">
            <h1 className="truncate text-sm font-semibold text-foreground" title={pdf.title}>
              {pdf.title}
            </h1>

            <button
              onClick={toggleStar}
              className={`h-7 w-7 rounded-full flex items-center justify-center transition-all shrink-0 ${
                isStarred
                  ? "text-amber-500"
                  : "text-muted-foreground/50 hover:text-amber-500 hover:bg-secondary"
              }`}
              title={isStarred ? "Remove from Starred" : "Add to Starred"}
            >
              <Star className={`h-4 w-4 ${isStarred ? "fill-amber-400" : ""}`} />
            </button>
          </div>
        </div>

        {/* Center: Drive Nav + Mode Switcher (Scroll, Book View, Single Page) */}
        <div className="hidden md:flex items-center gap-1.5 bg-secondary/50 px-2 py-1 rounded-full border border-border/50">
          {/* Previous Page */}
          <button
            onClick={() => turnPage("prev")}
            disabled={pageNumber <= 1}
            className="p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary disabled:opacity-30 transition-colors"
            title="Previous page (Left arrow)"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {/* Jump Form */}
          <form onSubmit={handlePageJumpSubmit} className="flex items-center text-xs font-semibold px-1">
            <input
              type="text"
              value={inputPage}
              onChange={(e) => setInputPage(e.target.value)}
              className="w-8 text-center bg-card text-foreground font-semibold rounded py-0.5 outline-none border border-border/60"
            />
            <span className="mx-1 text-muted-foreground">/</span>
            <span className="text-muted-foreground">{numPages || "--"}</span>
          </form>

          {/* Next Page */}
          <button
            onClick={() => turnPage("next")}
            disabled={numPages === null || (viewMode === "book" ? rightBookPage === null || rightBookPage >= (numPages || 1) : pageNumber >= numPages)}
            className="p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary disabled:opacity-30 transition-colors"
            title="Next page (Right arrow)"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          <div className="h-3.5 w-px bg-border mx-1" />

          {/* View Mode Buttons (Scroll vs Book vs Single) */}
          <div className="flex items-center bg-card p-0.5 rounded-full border border-border/50">
            {/* Scroll Mode */}
            <button
              onClick={() => setViewMode("scroll")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
                viewMode === "scroll"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="Continuous Scroll Mode"
            >
              <Scroll className="h-3.5 w-3.5" />
              <span>Scroll</span>
            </button>

            {/* Book Mode */}
            <button
              onClick={() => setViewMode("book")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
                viewMode === "book"
                  ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="Open Book View (Realistic 3D Page Turning)"
            >
              <BookOpen className="h-3.5 w-3.5" />
              <span>Book View</span>
            </button>

            {/* Single Page */}
            <button
              onClick={() => setViewMode("single")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
                viewMode === "single"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="Single Page Mode"
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Single</span>
            </button>
          </div>

          <div className="h-3.5 w-px bg-border mx-1" />

          {/* Zoom controls */}
          <button
            onClick={() => changeZoom(-0.15)}
            className="p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            title="Zoom out (-)"
          >
            <ZoomOut className="h-4 w-4" />
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="px-1.5 py-0.5 text-xs font-medium text-foreground hover:bg-secondary rounded transition-colors">
                {Math.round(scale * 100)}%
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="w-28 rounded-2xl border-border bg-card shadow-2xl p-1">
              {ZOOM_PRESETS.map((p) => (
                <DropdownMenuItem
                  key={p.value}
                  onClick={() => setScale(p.value)}
                  className="rounded-xl py-1.5 cursor-pointer text-xs"
                >
                  {p.label}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator className="my-1 bg-border/60" />
              <DropdownMenuItem onClick={fitToWidth} className="rounded-xl py-1.5 cursor-pointer text-xs">
                Fit to width
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <button
            onClick={() => changeZoom(0.15)}
            className="p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            title="Zoom in (+)"
          >
            <ZoomIn className="h-4 w-4" />
          </button>

          {/* Book mode sound toggle */}
          {viewMode === "book" && (
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-1 rounded-full transition-colors ${
                soundEnabled ? "text-amber-500" : "text-muted-foreground hover:text-foreground"
              }`}
              title={soundEnabled ? "Mute page turn sound" : "Enable page turn sound"}
            >
              {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </button>
          )}
        </div>

        {/* Right: Thumbnails, Search, Print, Download, Blue Share Button, 3-dots */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Toggle Thumbnails Sidebar */}
          <button
            onClick={() => setShowThumbnails(!showThumbnails)}
            className={`h-8 w-8 rounded-full flex items-center justify-center transition-colors ${
              showThumbnails
                ? "bg-[#c2e7ff] text-[#001d35] dark:bg-[#004a77] dark:text-[#c2e7ff]"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            }`}
            title="Toggle page thumbnails"
          >
            {showThumbnails ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
          </button>

          {/* Search Toggle */}
          <button
            onClick={() => setShowSearchBar(!showSearchBar)}
            className={`h-8 w-8 rounded-full flex items-center justify-center transition-colors ${
              showSearchBar
                ? "bg-[#c2e7ff] text-[#001d35] dark:bg-[#004a77] dark:text-[#c2e7ff]"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            }`}
            title="Find in document"
          >
            <Search className="h-4 w-4" />
          </button>

          {/* Print */}
          <button
            onClick={handlePrint}
            className="hidden sm:flex h-8 w-8 rounded-full items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            title="Print"
          >
            <Printer className="h-4 w-4" />
          </button>

          {/* Download */}
          <button
            onClick={handleDownload}
            className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            title="Download"
          >
            <Download className="h-4 w-4" />
          </button>

          {/* Google Drive Iconic Blue Share Button */}
          <button
            onClick={() => setShowShareDialog(true)}
            className="h-8 px-3.5 rounded-full bg-[#0b57d0] hover:bg-[#0842a0] text-white font-medium text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
          >
            <Share2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Share</span>
          </button>

          {/* 3-dots Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                title="More options"
              >
                <MoreVertical className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 rounded-2xl border-border bg-card shadow-2xl p-1.5">
              <DropdownMenuItem onClick={() => setShowDetailsDialog(true)} className="rounded-xl cursor-pointer text-xs">
                <Info className="mr-2.5 h-4 w-4 text-muted-foreground" />
                Document details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={rotateClockwise} className="rounded-xl cursor-pointer text-xs">
                <RotateCw className="mr-2.5 h-4 w-4 text-muted-foreground" />
                Rotate clockwise (90°)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={rotateCounterClockwise} className="rounded-xl cursor-pointer text-xs">
                <RotateCcw className="mr-2.5 h-4 w-4 text-muted-foreground" />
                Rotate counter-clockwise
              </DropdownMenuItem>
              <DropdownMenuSeparator className="my-1 bg-border/60" />
              <DropdownMenuItem onClick={toggleFullscreen} className="rounded-xl cursor-pointer text-xs">
                {isFullscreen ? (
                  <Minimize className="mr-2.5 h-4 w-4 text-muted-foreground" />
                ) : (
                  <Maximize className="mr-2.5 h-4 w-4 text-muted-foreground" />
                )}
                {isFullscreen ? "Exit fullscreen" : "Fullscreen"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <ThemeToggle />
        </div>
      </header>

      {/* Search Input Dropdown */}
      <AnimatePresence>
        {showSearchBar && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b border-border/60 bg-card px-4 py-2 z-20 overflow-hidden"
          >
            <div className="max-w-md mx-auto relative flex items-center">
              <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Find text in document..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                autoFocus
                className="h-9 pl-9 pr-8 text-xs rounded-full bg-secondary/50 border-border"
              />
              {searchText && (
                <button
                  onClick={() => setSearchText("")}
                  className="absolute right-3 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════════ MAIN VIEWPORT (Document Context wraps Thumbnails & Canvas) ═══════════════ */}
      <div className="flex flex-1 min-h-0 relative overflow-hidden">
        <Document
          file={pdf.storageUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          className="flex flex-1 min-h-0 w-full h-full relative overflow-hidden"
          loading={
            <div className="flex flex-1 min-h-0 w-full flex-col items-center justify-center min-h-[50vh] text-muted-foreground gap-3">
              <div className="h-9 w-9 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
              <p className="text-xs font-semibold text-muted-foreground animate-pulse">
                Opening in EirumiView...
              </p>
            </div>
          }
          error={
            <div className="flex flex-1 min-h-0 w-full flex-col items-center justify-center min-h-[40vh] text-red-500 text-center bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 p-6 rounded-2xl max-w-md mx-auto my-auto">
              <p className="font-semibold text-sm mb-1">Failed to display PDF</p>
              <p className="text-xs opacity-80 mb-4">Please check file permissions or network access.</p>
              <Button variant="outline" size="sm" onClick={() => window.location.reload()} className="rounded-xl">
                Reload
              </Button>
            </div>
          }
        >
          {/* Left Thumbnails Drawer */}
          <AnimatePresence>
            {showThumbnails && (
              <motion.aside
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 170, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="border-r border-border/50 bg-card/90 backdrop-blur-md flex flex-col shrink-0 overflow-hidden z-20"
              >
                <div className="p-3 border-b border-border/40 flex items-center justify-between text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <span>Pages ({numPages || 0})</span>
                  <button
                    onClick={() => setShowThumbnails(false)}
                    className="p-1 rounded-full hover:bg-secondary text-muted-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                  {Array.from(new Array(numPages || 0), (_, index) => {
                    const pNum = index + 1;
                    const isActive =
                      viewMode === "book"
                        ? pNum === leftBookPage || pNum === rightBookPage
                        : pageNumber === pNum;

                    return (
                      <div
                        key={`thumb_${pNum}`}
                        onClick={() => jumpToPage(pNum)}
                        className={`flex flex-col items-center p-1.5 rounded-xl cursor-pointer transition-all ${
                          isActive
                            ? "bg-[#c2e7ff] text-[#001d35] ring-2 ring-primary dark:bg-[#004a77] dark:text-[#c2e7ff]"
                            : "hover:bg-secondary/60 text-muted-foreground"
                        }`}
                      >
                        <div className="w-24 aspect-[3/4] bg-white text-black shadow-xs rounded border border-border/40 overflow-hidden flex items-center justify-center pointer-events-none">
                          <Page
                            pageNumber={pNum}
                            width={96}
                            renderTextLayer={false}
                            renderAnnotationLayer={false}
                          />
                        </div>
                        <span className="text-[11px] font-semibold mt-1">Page {pNum}</span>
                      </div>
                    );
                  })}
                </div>
              </motion.aside>
            )}
          </AnimatePresence>

          {/* ═══════════════ MAIN READING CANVAS ═══════════════ */}
          <main
            ref={scrollContainerRef}
            className={`flex-1 overflow-auto flex justify-center p-4 sm:p-8 relative ${
              viewMode === "book"
                ? "bg-[#18181b] dark:bg-[#09090b] text-foreground"
                : "bg-[#e9eef6]/60 dark:bg-[#0e0e0e]"
            }`}
          >
            {/* ═══════════════════════════════════════════════════════
                1. CONTINUOUS SCROLL MODE (Default, Seamless Flow)
                ═══════════════════════════════════════════════════════ */}
            {viewMode === "scroll" && (
              <div className="flex flex-col items-center space-y-6 pb-24 w-full max-w-4xl">
                {Array.from(new Array(numPages || 0), (_, index) => {
                  const pNum = index + 1;
                  return (
                    <div
                      key={`page_${pNum}`}
                      id={`pdf-page-${pNum}`}
                      data-page-number={pNum}
                      className="shadow-2xl rounded-sm overflow-hidden border border-black/10 bg-white transition-all relative group"
                    >
                      <Page
                        pageNumber={pNum}
                        scale={scale}
                        rotate={rotation}
                        customTextRenderer={searchText.trim() ? textRenderer : undefined}
                        className="overflow-hidden"
                      />
                      {/* Subtle floating page indicator on page corner */}
                      <div className="absolute bottom-2 right-3 text-[10px] font-medium text-black/40 pointer-events-none select-none">
                        {pNum} / {numPages}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════
                2. REALISTIC OPEN BOOK VIEW (3D Page Turn Animation)
                ═══════════════════════════════════════════════════════ */}
            {viewMode === "book" && (
              <div className="flex flex-col items-center justify-center min-h-full pb-20 w-full max-w-6xl">
                {/* Book Desk Ambient Shadow & 3D Stage */}
                <div
                  className="relative flex items-center justify-center p-4 sm:p-8"
                  style={{ perspective: "2500px" }}
                >
                  {/* Left / Right Interactive Turn Click Overlays */}
                  <button
                    onClick={() => turnPage("prev")}
                    disabled={pageNumber <= 1}
                    className="absolute left-0 top-0 bottom-0 w-12 sm:w-16 z-30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity disabled:pointer-events-none group"
                    title="Turn to previous page"
                  >
                    <div className="h-12 w-12 rounded-full bg-black/60 backdrop-blur-md text-white flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
                      <ChevronLeft className="h-6 w-6" />
                    </div>
                  </button>

                  <button
                    onClick={() => turnPage("next")}
                    disabled={numPages === null || (rightBookPage === null || rightBookPage >= (numPages || 1))}
                    className="absolute right-0 top-0 bottom-0 w-12 sm:w-16 z-30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity disabled:pointer-events-none group"
                    title="Turn to next page"
                  >
                    <div className="h-12 w-12 rounded-full bg-black/60 backdrop-blur-md text-white flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
                      <ChevronRight className="h-6 w-6" />
                    </div>
                  </button>

                  {/* ─── REAL OPEN BOOK SPREAD ─── */}
                  <motion.div
                    key={`book_spread_${leftBookPage}_${rightBookPage}`}
                    initial={{
                      rotateY: flipDirection === "next" ? 3 : -3,
                      opacity: 0.9,
                    }}
                    animate={{ rotateY: 0, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 28 }}
                    className="relative flex items-stretch shadow-2xl rounded-lg bg-[#27272a] p-1.5 sm:p-2.5 border border-zinc-700/60"
                    style={{ transformStyle: "preserve-3d" }}
                  >
                    {/* Left Page (Even Page or Inside Front Cover) */}
                    <div
                      onClick={() => leftBookPage && turnPage("prev")}
                      className={`relative min-w-[280px] sm:min-w-[380px] md:min-w-[440px] bg-white rounded-l-md overflow-hidden flex flex-col items-center justify-center cursor-pointer transition-shadow ${
                        leftBookPage
                          ? "shadow-[inset_-18px_0_24px_-10px_rgba(0,0,0,0.35)]"
                          : "bg-gradient-to-r from-zinc-200 to-zinc-300 dark:from-zinc-800 dark:to-zinc-900 shadow-inner"
                      }`}
                      style={{
                        transform: `scale(${scale})`,
                        transformOrigin: "right center",
                      }}
                    >
                      {leftBookPage ? (
                        <div className="relative">
                          <Page
                            pageNumber={leftBookPage}
                            scale={0.85 * scale}
                            rotate={rotation}
                            customTextRenderer={searchText.trim() ? textRenderer : undefined}
                            className="overflow-hidden"
                          />
                          {/* Page Number Footer */}
                          <div className="absolute bottom-2 left-4 text-[11px] font-serif text-black/50 select-none">
                            — {leftBookPage} —
                          </div>
                        </div>
                      ) : (
                        /* Inside Cover Texture when on Page 1 */
                        <div className="h-full w-full min-h-[480px] flex flex-col items-center justify-center p-6 text-center text-muted-foreground/60">
                          <BookOpen className="h-10 w-10 mb-2 opacity-40" />
                          <p className="text-xs font-serif italic">EirumiView Reader</p>
                          <p className="text-[10px] mt-1 opacity-70">Inside Cover</p>
                        </div>
                      )}
                    </div>

                    {/* Central Book Spine Crease & Shadow Gutter */}
                    <div className="relative w-3 sm:w-4 bg-gradient-to-r from-black/45 via-black/15 to-black/45 z-20 shrink-0 pointer-events-none shadow-sm">
                      <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[1px] bg-black/40" />
                    </div>

                    {/* Right Page (Odd Page or Page 1 Cover) */}
                    <div
                      onClick={() => rightBookPage && turnPage("next")}
                      className={`relative min-w-[280px] sm:min-w-[380px] md:min-w-[440px] bg-white rounded-r-md overflow-hidden flex flex-col items-center justify-center cursor-pointer transition-shadow ${
                        rightBookPage
                          ? "shadow-[inset_18px_0_24px_-10px_rgba(0,0,0,0.35)]"
                          : "bg-gradient-to-r from-zinc-300 to-zinc-200 dark:from-zinc-900 dark:to-zinc-800 shadow-inner"
                      }`}
                      style={{
                        transform: `scale(${scale})`,
                        transformOrigin: "left center",
                      }}
                    >
                      {rightBookPage ? (
                        <div className="relative">
                          <Page
                            pageNumber={rightBookPage}
                            scale={0.85 * scale}
                            rotate={rotation}
                            customTextRenderer={searchText.trim() ? textRenderer : undefined}
                            className="overflow-hidden"
                          />
                          {/* Page Number Footer */}
                          <div className="absolute bottom-2 right-4 text-[11px] font-serif text-black/50 select-none">
                            — {rightBookPage} —
                          </div>
                        </div>
                      ) : (
                        /* End of book inside cover */
                        <div className="h-full w-full min-h-[480px] flex flex-col items-center justify-center p-6 text-center text-muted-foreground/60">
                          <p className="text-xs font-serif italic">End of Document</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                </div>

                {/* Book Spread Navigation Banner */}
                <div className="mt-4 flex items-center gap-3 text-xs text-zinc-400">
                  <span className="font-serif">
                    {pageNumber === 1
                      ? "Cover • Page 1"
                      : `Pages ${leftBookPage || ""} & ${rightBookPage || ""}`}
                  </span>
                  <span className="opacity-40">•</span>
                  <span>Click left or right page to flip</span>
                </div>
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════
                3. SINGLE PAGE PRESENTATION MODE
                ═══════════════════════════════════════════════════════ */}
            {viewMode === "single" && (
              <div className="relative flex flex-col items-center pb-24">
                <motion.div
                  key={`${pageNumber}_${rotation}`}
                  initial={{ opacity: 0.9, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.15 }}
                  className="shadow-2xl rounded-sm overflow-hidden border border-black/10 bg-white"
                >
                  <Page
                    pageNumber={pageNumber}
                    scale={scale}
                    rotate={rotation}
                    customTextRenderer={searchText.trim() ? textRenderer : undefined}
                    className="overflow-hidden"
                  />
                </motion.div>

                {/* Pre-render adjacent pages for instantaneous switching */}
                {numPages && pageNumber < numPages && (
                  <div className="sr-only" aria-hidden="true">
                    <Page pageNumber={pageNumber + 1} scale={scale} rotate={rotation} />
                  </div>
                )}
                {numPages && pageNumber > 1 && (
                  <div className="sr-only" aria-hidden="true">
                    <Page pageNumber={pageNumber - 1} scale={scale} rotate={rotation} />
                  </div>
                )}
              </div>
            )}
          </main>
        </Document>
      </div>

      {/* ═══════════════ FLOATING BOTTOM TOOLBAR (Drive Signature) ═══════════════ */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center justify-center z-30 pointer-events-auto">
        <div className="flex items-center gap-1 sm:gap-2 bg-card/90 text-foreground backdrop-blur-xl border border-border/70 px-3.5 py-1.5 rounded-full shadow-2xl">
          {/* Previous Page */}
          <button
            onClick={() => turnPage("prev")}
            disabled={pageNumber <= 1}
            className="p-1.5 rounded-full hover:bg-secondary disabled:opacity-30 transition-colors"
            title="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {/* Jump Form */}
          <form onSubmit={handlePageJumpSubmit} className="flex items-center text-xs font-semibold px-1">
            <input
              type="text"
              value={inputPage}
              onChange={(e) => setInputPage(e.target.value)}
              className="w-8 text-center bg-secondary/80 text-foreground font-semibold rounded py-0.5 outline-none border border-transparent focus:border-border"
            />
            <span className="mx-1 text-muted-foreground">/</span>
            <span className="text-muted-foreground">{numPages || "--"}</span>
          </form>

          {/* Next Page */}
          <button
            onClick={() => turnPage("next")}
            disabled={numPages === null || (viewMode === "book" ? rightBookPage === null || rightBookPage >= (numPages || 1) : pageNumber >= numPages)}
            className="p-1.5 rounded-full hover:bg-secondary disabled:opacity-30 transition-colors"
            title="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          <div className="h-4 w-px bg-border mx-1" />

          {/* Quick Mode Toggle on Floating Toolbar */}
          <button
            onClick={() => setViewMode(viewMode === "book" ? "scroll" : "book")}
            className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
              viewMode === "book"
                ? "bg-amber-500 text-white"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            }`}
            title="Toggle Book View"
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{viewMode === "book" ? "In Book" : "Book View"}</span>
          </button>

          <div className="h-4 w-px bg-border mx-1" />

          {/* Zoom controls */}
          <button
            onClick={() => changeZoom(-0.15)}
            className="p-1.5 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
            title="Zoom out"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <span className="text-xs font-semibold px-1 select-none">{Math.round(scale * 100)}%</span>
          <button
            onClick={() => changeZoom(0.15)}
            className="p-1.5 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
            title="Zoom in"
          >
            <ZoomIn className="h-4 w-4" />
          </button>

          <div className="h-4 w-px bg-border mx-1" />

          {/* Fit to width */}
          <button
            onClick={fitToWidth}
            className="p-1.5 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
            title="Fit to width"
          >
            <Maximize className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* ═══════════════ SHARE DIALOG ═══════════════ */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="sm:max-w-md bg-card text-card-foreground border-border shadow-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <Share2 className="h-5 w-5 text-primary" />
              Share &quot;{pdf.title}&quot;
            </DialogTitle>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">General access</p>
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-secondary/40 border border-border/50">
                <div className="h-8 w-8 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-sm shrink-0">
                  🌍
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground">Anyone with the link</p>
                  <p className="text-[11px] text-muted-foreground">Anyone on the internet with this link can view this document</p>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Document link</label>
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={typeof window !== "undefined" ? `${window.location.origin}/view/${pdf.publicId}` : ""}
                  className="h-10 text-xs rounded-xl bg-secondary/50 border-border select-all"
                />
                <Button
                  onClick={handleCopyShareLink}
                  className="rounded-xl h-10 px-4 text-xs font-semibold bg-primary text-primary-foreground gap-1.5 shrink-0"
                >
                  {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {isCopied ? "Copied" : "Copy"}
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={() => setShowShareDialog(false)}
              className="rounded-full text-xs px-5 bg-secondary text-foreground hover:bg-secondary/80 font-semibold"
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══════════════ DOCUMENT DETAILS DIALOG ═══════════════ */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="sm:max-w-md bg-card text-card-foreground border-border shadow-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <Info className="h-5 w-5 text-primary" />
              Document Details
            </DialogTitle>
          </DialogHeader>

          <div className="py-3 space-y-2 text-xs">
            <div className="flex justify-between py-1.5 border-b border-border/40">
              <span className="text-muted-foreground">Title</span>
              <span className="font-semibold text-foreground truncate max-w-[200px]">{pdf.title}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-border/40">
              <span className="text-muted-foreground">Original File</span>
              <span className="font-medium text-foreground truncate max-w-[200px]">{pdf.originalFileName}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-border/40">
              <span className="text-muted-foreground">Type</span>
              <span className="font-medium text-foreground">Portable Document Format (PDF)</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-border/40">
              <span className="text-muted-foreground">Size</span>
              <span className="font-medium text-foreground">{formatBytes(pdf.fileSize)}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-border/40">
              <span className="text-muted-foreground">Total Pages</span>
              <span className="font-medium text-foreground">{numPages || "Calculating..."}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-border/40">
              <span className="text-muted-foreground">Total Views</span>
              <span className="font-medium text-foreground">{pdf.views} times</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-border/40">
              <span className="text-muted-foreground">Created</span>
              <span className="font-medium text-foreground">{format(new Date(pdf.createdAt), "MMMM d, yyyy 'at' h:mm a")}</span>
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={() => setShowDetailsDialog(false)}
              className="rounded-full text-xs px-5 bg-secondary text-foreground hover:bg-secondary/80 font-semibold"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function highlightPattern(text: string, pattern: string) {
  if (!pattern) return text;
  const parts = text.split(new RegExp(`(${pattern})`, "gi"));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === pattern.toLowerCase() ? (
          <mark key={i} className="bg-yellow-300 dark:bg-yellow-600/70 text-black dark:text-white rounded-xs px-0.5">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
}
