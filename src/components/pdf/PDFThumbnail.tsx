"use client";

import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { Loader2 } from "lucide-react";

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFThumbnailProps {
  url: string;
}

export function PDFThumbnail({ url }: PDFThumbnailProps) {
  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-neutral-100">
      <Document
        file={url}
        loading={
          <div className="flex h-full w-full items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
          </div>
        }
        error={
          <div className="flex h-full w-full items-center justify-center bg-neutral-100 text-xs text-neutral-400">
            Preview unavailable
          </div>
        }
        className="flex items-center justify-center"
      >
        <Page
          pageNumber={1}
          width={300}
          renderTextLayer={false}
          renderAnnotationLayer={false}
          className="shadow-sm"
        />
      </Document>
    </div>
  );
}
