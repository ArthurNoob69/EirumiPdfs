"use client";

import React, { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { FileText, Loader2 } from "lucide-react";

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFThumbnailProps {
  url: string;
  compact?: boolean;
}

export function PDFThumbnail({ url, compact = false }: PDFThumbnailProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-secondary/30">
      <Document
        file={url}
        onLoadSuccess={() => setIsLoaded(true)}
        loading={
          <div className="flex h-full w-full flex-col items-center justify-center p-4 text-muted-foreground/60 gap-2">
            <div className="h-12 w-9 rounded-md border border-border/80 bg-card/80 shadow-xs flex flex-col justify-between p-1.5 animate-pulse">
              <div className="h-1 w-full rounded-full bg-muted-foreground/30" />
              <div className="h-1 w-3/4 rounded-full bg-muted-foreground/20" />
              <div className="h-1 w-5/6 rounded-full bg-muted-foreground/20" />
              <div className="h-1 w-1/2 rounded-full bg-muted-foreground/20" />
            </div>
            <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground/50" />
          </div>
        }
        error={
          <div className="flex h-full w-full flex-col items-center justify-center p-4 text-muted-foreground/60 gap-1.5 text-center">
            <div className="h-10 w-8 rounded-md border border-border/80 bg-card/80 shadow-xs flex items-center justify-center text-red-500/80">
              <FileText className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-medium text-muted-foreground">PDF Document</span>
          </div>
        }
        className="flex items-center justify-center"
      >
        <Page
          pageNumber={1}
          width={compact ? 220 : 340}
          renderTextLayer={false}
          renderAnnotationLayer={false}
          className={`shadow-md transition-opacity duration-300 ${
            isLoaded ? "opacity-100" : "opacity-0"
          }`}
        />
      </Document>
    </div>
  );
}
