"use client";

import React, { useState, useEffect, useRef } from "react";
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
  Printer,
  Share2,
  Scroll,
  Layers,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { IPDF } from "@/models/PDF";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ThemeToggle } from "@/components/theme-toggle";
import { useToast } from "@/components/ui/toast";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFViewerProps {
  pdf: IPDF;
}

export function PDFViewer({ pdf }: PDFViewerProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [inputPage, setInputPage] = useState("1");
  const [scale, setScale] = useState(1.0);
  const [rotation, setRotation] = useState(0);
  const [isContinuous, setIsContinuous] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [searchText, setSearchText] = useState("");
  const [isCopied, setIsCopied] = useState(false);

  // Track views
  useEffect(() => {
    fetch(`/api/pdfs/${pdf.publicId}/view`, { method: "POST" }).catch(console.error);
  }, [pdf.publicId]);

  // Keep inputPage synced with current pageNumber
  useEffect(() => {
    setInputPage(pageNumber.toString());
  }, [pageNumber]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === "ArrowRight" || e.key === "PageDown") {
        changePage(1);
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        changePage(-1);
      } else if (e.key === "+" || e.key === "=") {
        changeZoom(0.15);
      } else if (e.key === "-") {
        changeZoom(-0.15);
      } else if (e.key === "Home") {
        setPageNumber(1);
      } else if (e.key === "End") {
        if (numPages) setPageNumber(numPages);
      } else if (e.key === "r" && (e.ctrlKey || e.metaKey)) {
        // let default browser refresh work
      } else if (e.key === "r") {
        rotateClockwise();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [numPages, pageNumber]);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setPageNumber(1);
  };

  const changePage = (offset: number) => {
    setPageNumber((prev) => {
      const newPage = prev + offset;
      if (newPage >= 1 && numPages && newPage <= numPages) {
        return newPage;
      }
      return prev;
    });
  };

  const handlePageJump = (e: React.FormEvent) => {
    e.preventDefault();
    const p = parseInt(inputPage, 10);
    if (!isNaN(p) && p >= 1 && numPages && p <= numPages) {
      setPageNumber(p);
    } else {
      setInputPage(pageNumber.toString());
    }
  };

  const changeZoom = (delta: number) => {
    setScale((prev) => Math.min(Math.max(0.4, Number((prev + delta).toFixed(2))), 3.0));
  };

  const rotateClockwise = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
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

  const downloadPdf = () => {
    window.open(pdf.storageUrl, "_blank");
    toast("Opening PDF download...", "info");
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    const url = typeof window !== "undefined" ? `${window.location.origin}/view/${pdf.publicId}` : "";
    navigator.clipboard.writeText(url);
    setIsCopied(true);
    toast("Share link copied to clipboard!");
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Custom text renderer for search highlighting
  const textRenderer = React.useCallback(
    (textItem: any) => {
      if (!searchText.trim()) return textItem.str;
      return highlightPattern(textItem.str, searchText) as unknown as string;
    },
    [searchText]
  );

  return (
    <div
      ref={containerRef}
      className={`flex h-screen w-full flex-col bg-background text-foreground overflow-hidden ${
        isFullscreen ? "fixed inset-0 z-50 bg-background" : ""
      }`}
    >
      {/* Top Header */}
      <header className="flex items-center justify-between border-b border-border bg-card/80 backdrop-blur-xl px-4 py-2.5 shadow-xs z-20 shrink-0">
        {/* Left: Back & Document Title */}
        <div className="flex items-center space-x-3 min-w-0 max-w-[40%]">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/")}
            className="h-9 w-9 rounded-full shrink-0"
            title="Back to gallery"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0">
            <h1 className="truncate text-sm sm:text-base font-semibold text-foreground" title={pdf.title}>
              {pdf.title}
            </h1>
            <p className="text-[11px] text-muted-foreground truncate hidden sm:block">
              {pdf.originalFileName}
            </p>
          </div>
        </div>

        {/* Center: Zoom Controls & Mode Switcher */}
        <div className="hidden md:flex items-center space-x-1.5 bg-secondary/60 p-1 rounded-xl border border-border/50">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => changeZoom(-0.15)}
            className="h-8 w-8 rounded-lg"
            title="Zoom Out (-)"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="w-14 text-center text-xs font-semibold text-foreground select-none">
            {Math.round(scale * 100)}%
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => changeZoom(0.15)}
            className="h-8 w-8 rounded-lg"
            title="Zoom In (+)"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>

          <div className="h-4 w-px bg-border mx-1" />

          <Button
            variant="ghost"
            size="icon"
            onClick={rotateClockwise}
            className="h-8 w-8 rounded-lg"
            title="Rotate 90° (R)"
          >
            <RotateCw className="h-4 w-4" />
          </Button>

          <Button
            variant={isContinuous ? "secondary" : "ghost"}
            size="icon"
            onClick={() => setIsContinuous(!isContinuous)}
            className="h-8 w-8 rounded-lg"
            title={isContinuous ? "Switch to Page-by-page" : "Switch to Continuous Scroll"}
          >
            {isContinuous ? <Scroll className="h-4 w-4 text-primary" /> : <Layers className="h-4 w-4" />}
          </Button>
        </div>

        {/* Right: Search, Share, Actions & Theme */}
        <div className="flex items-center justify-end space-x-1.5 sm:space-x-2">
          {/* Search bar */}
          <div className="relative hidden lg:flex items-center w-44 group">
            <Search className="absolute left-2.5 h-3.5 w-3.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              className="h-8 pl-8 text-xs rounded-full bg-background border-border"
              placeholder="Find in page..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
            className="h-8 px-2.5 text-xs gap-1.5 rounded-full hidden sm:flex"
            title="Copy Share Link"
          >
            {isCopied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Share2 className="h-3.5 w-3.5" />}
            <span>{isCopied ? "Copied" : "Share"}</span>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={handlePrint}
            title="Print"
            className="h-8 w-8 rounded-full hidden sm:flex"
          >
            <Printer className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={downloadPdf}
            title="Download"
            className="h-8 w-8 rounded-full"
          >
            <Download className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleFullscreen}
            className="h-8 w-8 rounded-full hidden sm:flex"
            title="Fullscreen"
          >
            {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          </Button>

          <ThemeToggle />
        </div>
      </header>

      {/* Viewer Canvas */}
      <main className="flex-1 overflow-auto flex justify-center p-4 sm:p-8 relative bg-secondary/30">
        <Document
          file={pdf.storageUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          className="flex flex-col items-center"
          loading={
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-muted-foreground gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-3 border-primary border-t-transparent" />
              <p className="text-sm font-medium">Loading document...</p>
            </div>
          }
          error={
            <div className="flex flex-col items-center justify-center min-h-[40vh] text-red-500 text-center bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 p-6 rounded-2xl max-w-md">
              <p className="font-semibold mb-1">Failed to load PDF</p>
              <p className="text-xs opacity-80 mb-4">Please check your network connection or verify the file permissions.</p>
              <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                Retry
              </Button>
            </div>
          }
        >
          {isContinuous ? (
            /* Continuous Multi-Page Scroll Mode */
            <div className="flex flex-col items-center space-y-6 pb-20">
              {Array.from(new Array(numPages || 0), (_, index) => (
                <div key={`page_${index + 1}`} className="shadow-2xl rounded-sm overflow-hidden border border-border/50">
                  <Page
                    pageNumber={index + 1}
                    scale={scale}
                    rotate={rotation}
                    customTextRenderer={searchText.trim() ? textRenderer : undefined}
                    className="overflow-hidden"
                  />
                </div>
              ))}
            </div>
          ) : (
            /* Instant Single Page Mode with Adjacent Pre-rendering */
            <div className="relative flex flex-col items-center">
              <motion.div
                key={`${pageNumber}_${rotation}`}
                initial={{ opacity: 0.85 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.15 }}
                className="shadow-2xl rounded-sm overflow-hidden border border-border/50 bg-card"
              >
                <Page
                  pageNumber={pageNumber}
                  scale={scale}
                  rotate={rotation}
                  customTextRenderer={searchText.trim() ? textRenderer : undefined}
                  className="overflow-hidden"
                />
              </motion.div>

              {/* Pre-render next and previous pages offscreen to warm up PDF.js cache */}
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
        </Document>
      </main>

      {/* Floating Bottom Toolbar (Visible in single-page mode or on mobile) */}
      {!isContinuous && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center justify-center z-30 pointer-events-auto">
          <div className="flex items-center space-x-1 sm:space-x-2 bg-card/90 text-card-foreground backdrop-blur-xl border border-border p-1.5 rounded-full shadow-2xl">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => changePage(-1)}
              disabled={pageNumber <= 1}
              className="h-8 w-8 rounded-full"
              title="Previous Page (Left Arrow)"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {/* Jump to page form */}
            <form onSubmit={handlePageJump} className="flex items-center px-1.5 text-xs font-semibold">
              <input
                type="text"
                value={inputPage}
                onChange={(e) => setInputPage(e.target.value)}
                className="w-8 text-center bg-secondary/80 text-foreground font-semibold rounded-md py-0.5 outline-none border border-transparent focus:border-border"
                title="Type page number and press Enter"
              />
              <span className="mx-1 text-muted-foreground">/</span>
              <span className="text-muted-foreground">{numPages || "--"}</span>
            </form>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => changePage(1)}
              disabled={numPages === null || pageNumber >= numPages}
              className="h-8 w-8 rounded-full"
              title="Next Page (Right Arrow)"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>

            {/* Mobile Zoom & Rotation Controls */}
            <div className="flex items-center md:hidden border-l border-border pl-1 ml-1 space-x-0.5">
              <Button variant="ghost" size="icon" onClick={() => changeZoom(-0.15)} className="h-7 w-7 rounded-full">
                <ZoomOut className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => changeZoom(0.15)} className="h-7 w-7 rounded-full">
                <ZoomIn className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={rotateClockwise} className="h-7 w-7 rounded-full">
                <RotateCw className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      )}
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
