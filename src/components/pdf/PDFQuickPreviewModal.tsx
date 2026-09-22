"use client";

import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { IPDF } from "@/models/PDF";
import { ExternalLink, Download, FileText, Calendar, Eye } from "lucide-react";
import Link from "next/link";
import { formatBytes } from "@/lib/utils";
import { format } from "date-fns";

interface PDFQuickPreviewModalProps {
  pdf: IPDF | null;
  isOpen: boolean;
  onClose: () => void;
}

export function PDFQuickPreviewModal({ pdf, isOpen, onClose }: PDFQuickPreviewModalProps) {
  if (!pdf) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl w-[94vw] h-[88vh] flex flex-col p-0 overflow-hidden bg-card border-border shadow-2xl">
        <DialogHeader className="px-6 py-4 border-b border-border bg-card flex flex-row items-center justify-between shrink-0">
          <div className="flex items-center space-x-3 min-w-0 pr-8">
            <div className="h-9 w-9 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
              <FileText className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="truncate text-base font-semibold text-foreground">
                {pdf.title}
              </DialogTitle>
              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                <span>{formatBytes(pdf.fileSize)}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  {pdf.views} views
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(pdf.createdAt), "MMM d, yyyy")}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0 pr-6">
            <a href={pdf.storageUrl} target="_blank" rel="noopener noreferrer" download>
              <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
                <Download className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Download</span>
              </Button>
            </a>
            <Link href={`/view/${pdf.publicId}`} prefetch={true} onClick={onClose}>
              <Button size="sm" className="h-8 gap-1.5 text-xs">
                <ExternalLink className="h-3.5 w-3.5" />
                <span>Full Viewer</span>
              </Button>
            </Link>
          </div>
        </DialogHeader>

        {/* Embedded viewer frame */}
        <div className="flex-1 w-full bg-secondary/30 relative">
          <iframe
            src={`${pdf.storageUrl}#toolbar=1`}
            className="w-full h-full border-0"
            title={pdf.title}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
