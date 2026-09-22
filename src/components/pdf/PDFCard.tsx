"use client";

import React, { useState } from "react";
import { format } from "date-fns";
import {
  MoreVertical,
  ExternalLink,
  Link2,
  Edit2,
  Trash2,
  Eye,
  Calendar,
  FileText,
  Star,
  Download,
  Check,
} from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { IPDF } from "@/models/PDF";
import { formatBytes } from "@/lib/utils";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/toast";

const PDFThumbnail = dynamic(
  () => import("./PDFThumbnail").then((mod) => mod.PDFThumbnail),
  { ssr: false }
);

interface PDFCardProps {
  pdf: IPDF;
  isStarred?: boolean;
  onToggleStar?: (id: string, e: React.MouseEvent) => void;
  onQuickPreview?: (pdf: IPDF) => void;
  onRename: (pdf: IPDF) => void;
  onDelete: (pdf: IPDF) => void;
  compact?: boolean;
}

export function PDFCard({
  pdf,
  isStarred = false,
  onToggleStar,
  onQuickPreview,
  onRename,
  onDelete,
  compact = false,
}: PDFCardProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const handleCopyLink = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/view/${pdf.publicId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast("Share link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      whileHover={{ y: -5, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 350, damping: 25 }}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-xs transition-all hover:border-border hover:shadow-xl dark:hover:shadow-primary/5"
    >
      {/* Thumbnail Area with Next.js Link for instant prefetching */}
      <Link
        href={`/view/${pdf.publicId}`}
        prefetch={true}
        className={`relative w-full overflow-hidden bg-secondary/50 border-b border-border/50 block cursor-pointer ${
          compact ? "aspect-[4/3]" : "aspect-[3/4]"
        }`}
      >
        <div className="absolute inset-0 flex items-center justify-center transition-transform duration-500 group-hover:scale-[1.03]">
          <PDFThumbnail url={pdf.storageUrl} />
        </div>

        {/* Format Badge Top Left */}
        <div className="absolute left-2.5 top-2.5 z-10">
          <span className="inline-flex items-center gap-1 rounded-md bg-background/85 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-foreground shadow-xs backdrop-blur-md border border-border/50">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
            PDF
          </span>
        </div>

        {/* Action Buttons Top Right */}
        <div className="absolute right-2.5 top-2.5 z-10 flex items-center space-x-1">
          {/* Star Button */}
          {onToggleStar && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onToggleStar(pdf.publicId, e);
              }}
              className={`flex h-8 w-8 items-center justify-center rounded-full bg-background/85 backdrop-blur-md border border-border/50 shadow-xs transition-transform active:scale-95 ${
                isStarred
                  ? "text-amber-500"
                  : "text-muted-foreground hover:text-amber-500 opacity-0 group-hover:opacity-100"
              }`}
              title={isStarred ? "Unstar" : "Star"}
            >
              <Star className={`h-4 w-4 ${isStarred ? "fill-amber-400" : ""}`} />
            </button>
          )}

          {/* Quick Preview Button */}
          {onQuickPreview && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onQuickPreview(pdf);
              }}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-background/85 text-muted-foreground hover:text-foreground backdrop-blur-md border border-border/50 shadow-xs opacity-0 transition-opacity group-hover:opacity-100"
              title="Quick Preview"
            >
              <Eye className="h-4 w-4" />
            </button>
          )}

          {/* Menu dropdown */}
          <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full bg-background/85 text-muted-foreground hover:text-foreground backdrop-blur-md border border-border/50 shadow-xs"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link href={`/view/${pdf.publicId}`} prefetch={true} className="flex items-center">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Open in Viewer
                  </Link>
                </DropdownMenuItem>
                {onQuickPreview && (
                  <DropdownMenuItem onClick={() => onQuickPreview(pdf)}>
                    <Eye className="mr-2 h-4 w-4" />
                    Quick Preview
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={handleCopyLink}>
                  {copied ? <Check className="mr-2 h-4 w-4 text-emerald-500" /> : <Link2 className="mr-2 h-4 w-4" />}
                  {copied ? "Copied!" : "Copy link"}
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href={pdf.storageUrl} target="_blank" rel="noopener noreferrer" download className="flex items-center">
                    <Download className="mr-2 h-4 w-4" />
                    Download PDF
                  </a>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onRename(pdf)}>
                  <Edit2 className="mr-2 h-4 w-4" />
                  Rename
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onDelete(pdf)}
                  className="text-red-600 focus:bg-red-500/10 focus:text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </Link>

      {/* Card Info Details */}
      <div className="flex flex-col p-3.5 bg-card z-10">
        <Link
          href={`/view/${pdf.publicId}`}
          prefetch={true}
          className="group/title block cursor-pointer"
        >
          <h3
            className="line-clamp-1 text-sm font-semibold text-foreground group-hover/title:text-primary transition-colors"
            title={pdf.title}
          >
            {pdf.title}
          </h3>
        </Link>

        <div className="mt-2.5 flex items-center justify-between text-xs text-muted-foreground font-medium">
          <span className="flex items-center gap-1">
            <FileText className="h-3.5 w-3.5 opacity-60" />
            {formatBytes(pdf.fileSize)}
          </span>
          <span className="inline-flex items-center gap-1 bg-secondary/80 px-2 py-0.5 rounded-full text-foreground text-[11px] font-medium">
            <Eye className="h-3 w-3 opacity-60" />
            {pdf.views}
          </span>
        </div>

        <div className="mt-2.5 pt-2.5 border-t border-border/50 flex items-center justify-between text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3 opacity-60" />
            {format(new Date(pdf.createdAt), "MMM d, yyyy")}
          </span>
          <button
            onClick={handleCopyLink}
            className="text-xs hover:text-foreground transition-colors flex items-center gap-1"
          >
            {copied ? (
              <span className="text-emerald-500 font-medium">Copied!</span>
            ) : (
              <span className="opacity-70 hover:opacity-100">Share</span>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
