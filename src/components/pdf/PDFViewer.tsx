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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { IPDF } from "@/models/PDF";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFViewerProps {
  pdf: IPDF;
}

export function PDFViewer({ pdf }: PDFViewerProps) {
  const router = useRouter();
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [searchText, setSearchText] = useState("");
  
  // Track views
  useEffect(() => {
    fetch(`/api/pdfs/${pdf.publicId}/view`, { method: "POST" }).catch(console.error);
  }, [pdf.publicId]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === "ArrowRight") {
        changePage(1);
      } else if (e.key === "ArrowLeft") {
        changePage(-1);
      } else if (e.key === "+" || e.key === "=") {
        changeZoom(0.2);
      } else if (e.key === "-") {
        changeZoom(-0.2);
      } else if (e.key === "Home") {
        setPageNumber(1);
      } else if (e.key === "End") {
        if (numPages) setPageNumber(numPages);
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
    setPageNumber((prevPageNumber) => {
      const newPage = prevPageNumber + offset;
      if (newPage >= 1 && numPages && newPage <= numPages) {
        return newPage;
      }
      return prevPageNumber;
    });
  };

  const changeZoom = (delta: number) => {
    setScale((prevScale) => Math.min(Math.max(0.5, prevScale + delta), 3.0));
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
    // In a real app with S3, if CORS allows, we can fetch and download.
    // Easiest is to open link in a new tab.
    window.open(pdf.storageUrl, "_blank");
  };

  // Basic custom text renderer for highlight (native react-pdf search is complex without a full UI)
  const textRenderer = React.useCallback(
    (textItem: any) => {
      return highlightPattern(textItem.str, searchText) as unknown as string;
    },
    [searchText]
  );

  return (
    <div
      ref={containerRef}
      className={`flex h-screen w-full flex-col bg-background/50 bg-grid-pattern overflow-hidden ${
        isFullscreen ? "fixed inset-0 z-50 bg-background" : ""
      }`}
    >
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-border/50 bg-background/80 backdrop-blur-xl px-4 py-3 shadow-sm z-20">
        <div className="flex items-center space-x-3 w-1/3">
          <Button variant="ghost" size="icon" onClick={() => router.push('/')} className="h-8 w-8 rounded-full">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="truncate text-sm sm:text-base font-semibold text-foreground">
            {pdf.title}
          </h1>
        </div>

        <div className="hidden md:flex items-center space-x-1">
          <Button variant="ghost" size="icon" onClick={() => changeZoom(-0.2)} className="h-8 w-8 rounded-full">
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="w-14 text-center text-xs font-medium bg-neutral-100 dark:bg-neutral-800 py-1 rounded-md">
            {Math.round(scale * 100)}%
          </span>
          <Button variant="ghost" size="icon" onClick={() => changeZoom(0.2)} className="h-8 w-8 rounded-full">
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center justify-end space-x-2 w-1/3">
          <div className="relative hidden lg:flex items-center max-w-[200px] group">
            <Search className="absolute left-3 h-4 w-4 text-neutral-400 group-focus-within:text-primary transition-colors" />
            <Input
              className="h-8 pl-9 text-xs bg-neutral-100/50 dark:bg-neutral-900/50 border-transparent focus:border-border transition-all rounded-full"
              placeholder="Find in document..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>
          <Button variant="ghost" size="icon" onClick={downloadPdf} title="Download" className="rounded-full">
            <Download className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={toggleFullscreen} className="hidden sm:inline-flex rounded-full" title="Fullscreen">
            {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Viewer Canvas */}
      <div className="flex-1 overflow-auto flex justify-center p-4 sm:p-8 relative">
        <Document
          file={pdf.storageUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          className="flex justify-center"
          loading={
            <div className="flex flex-col items-center justify-center h-full text-neutral-500 gap-4">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <p className="text-sm font-medium">Loading document...</p>
            </div>
          }
          error={
            <div className="flex flex-col items-center justify-center h-full text-red-500 text-center bg-red-50 dark:bg-red-900/10 p-6 rounded-2xl">
              <p className="font-semibold mb-2">Failed to load PDF</p>
              <p className="text-sm opacity-80">Check your internet connection or the file permissions.</p>
            </div>
          }
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Page
              pageNumber={pageNumber}
              scale={scale}
              className="shadow-2xl rounded-sm overflow-hidden"
              customTextRenderer={textRenderer}
            />
          </motion.div>
        </Document>
      </div>

      {/* Floating Bottom Toolbar (Mobile friendly) */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center justify-center z-20">
        <div className="flex items-center space-x-2 bg-background/80 backdrop-blur-xl border border-border/50 p-1.5 rounded-full shadow-lg">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => changePage(-1)}
            disabled={pageNumber <= 1}
            className="h-8 w-8 rounded-full"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <div className="flex items-center px-2 text-sm font-medium text-foreground">
            <span className="w-5 text-right">{pageNumber}</span>
            <span className="mx-1 text-neutral-400">/</span>
            <span className="w-5 text-left">{numPages || "--"}</span>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => changePage(1)}
            disabled={numPages === null || pageNumber >= numPages}
            className="h-8 w-8 rounded-full"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          
          {/* Mobile Zoom Controls in floating bar */}
          <div className="flex items-center md:hidden border-l border-border/50 pl-2 ml-1">
            <Button variant="ghost" size="icon" onClick={() => changeZoom(-0.2)} className="h-8 w-8 rounded-full">
              <ZoomOut className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => changeZoom(0.2)} className="h-8 w-8 rounded-full">
              <ZoomIn className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
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
          <mark key={i}>{part}</mark>
        ) : (
          part
        )
      )}
    </>
  );
}
