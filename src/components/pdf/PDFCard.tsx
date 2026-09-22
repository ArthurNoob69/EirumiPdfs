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
  Folder as FolderIcon,
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
  folderName?: string;
  onToggleStar?: (id: string, e: React.MouseEvent) => void;
  onQuickPreview?: (pdf: IPDF) => void;
  onMoveToFolder?: (pdf: IPDF) => void;
  onFolderClick?: (folderId: string) => void;
  onRename: (pdf: IPDF) => void;
  onDelete: (pdf: IPDF) => void;
  compact?: boolean;
}

export function PDFCard({
  pdf,
  isStarred = false,
  folderName,
  onToggleStar,
  onQuickPreview,
  onMoveToFolder,
  onFolderClick,
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

  if (compact) {
    /* =========================================================================
       COMPACT VIEW TILE: Clean, high-density, perfectly proportioned
       ========================================================================= */
    return (
      <motion.div
        whileHover={{ y: -3, scale: 1.01 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-xs transition-all hover:border-primary/40 hover:shadow-md"
      >
        {/* Compact Thumbnail Container */}
        <Link
          href={`/view/${pdf.publicId}`}
          prefetch={true}
          className="relative aspect-[4/3] w-full overflow-hidden bg-secondary/40 border-b border-border/50 block cursor-pointer"
        >
          <div className="absolute inset-0 flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
            <PDFThumbnail url={pdf.storageUrl} compact={true} />
          </div>

          {/* Star Button & Folder Badge Top-Left */}
          <div className="absolute left-2 top-2 z-10 flex items-center gap-1">
            {onToggleStar && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onToggleStar(pdf.publicId, e);
                }}
                className={`flex h-7 w-7 items-center justify-center rounded-lg bg-background/90 backdrop-blur-md border border-border/60 shadow-xs transition-all active:scale-95 ${
                  isStarred
                    ? "text-amber-500 opacity-100"
                    : "text-muted-foreground hover:text-amber-500 opacity-0 group-hover:opacity-100"
                }`}
                title={isStarred ? "Unstar" : "Star"}
              >
                <Star className={`h-3.5 w-3.5 ${isStarred ? "fill-amber-400" : ""}`} />
              </button>
            )}

            {folderName && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (pdf.folderId && onFolderClick) {
                    onFolderClick(pdf.folderId);
                  }
                }}
                className="inline-flex items-center gap-1 rounded-lg bg-background/90 px-2 py-1 text-[10px] font-medium text-muted-foreground hover:text-foreground hover:bg-background shadow-xs backdrop-blur-md border border-border/60 truncate max-w-[85px] cursor-pointer transition-colors"
                title={`Folder: ${folderName}`}
              >
                <FolderIcon className="h-3 w-3 text-primary shrink-0" />
                <span className="truncate">{folderName}</span>
              </button>
            )}
          </div>

          {/* Quick Preview & Menu Buttons Top-Right */}
          <div className="absolute right-2 top-2 z-10 flex items-center space-x-1">
            {onQuickPreview && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onQuickPreview(pdf);
                }}
                className="flex h-7 w-7 items-center justify-center rounded-lg bg-background/90 text-muted-foreground hover:text-foreground backdrop-blur-md border border-border/60 shadow-xs opacity-0 transition-opacity group-hover:opacity-100"
                title="Quick Preview"
              >
                <Eye className="h-3.5 w-3.5" />
              </button>
            )}

            <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-lg bg-background/90 text-muted-foreground hover:text-foreground backdrop-blur-md border border-border/60 shadow-xs"
                  >
                    <MoreVertical className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuItem asChild>
                    <Link href={`/view/${pdf.publicId}`} prefetch={true} className="flex items-center">
                      <ExternalLink className="mr-2 h-3.5 w-3.5" />
                      Open Viewer
                    </Link>
                  </DropdownMenuItem>
                  {onQuickPreview && (
                    <DropdownMenuItem onClick={() => onQuickPreview(pdf)}>
                      <Eye className="mr-2 h-3.5 w-3.5" />
                      Quick Preview
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={handleCopyLink}>
                    {copied ? <Check className="mr-2 h-3.5 w-3.5 text-emerald-500" /> : <Link2 className="mr-2 h-3.5 w-3.5" />}
                    {copied ? "Copied!" : "Copy link"}
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <a href={pdf.storageUrl} target="_blank" rel="noopener noreferrer" download className="flex items-center">
                      <Download className="mr-2 h-3.5 w-3.5" />
                      Download
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {onMoveToFolder && (
                    <DropdownMenuItem onClick={() => onMoveToFolder(pdf)}>
                      <FolderIcon className="mr-2 h-3.5 w-3.5" />
                      Move to Folder
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => onRename(pdf)}>
                    <Edit2 className="mr-2 h-3.5 w-3.5" />
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onDelete(pdf)}
                    className="text-red-600 focus:bg-red-500/10 focus:text-red-600"
                  >
                    <Trash2 className="mr-2 h-3.5 w-3.5" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </Link>

        {/* Compact Card Info */}
        <div className="p-2.5 bg-card">
          <Link
            href={`/view/${pdf.publicId}`}
            prefetch={true}
            className="block cursor-pointer"
          >
            <h4
              className="line-clamp-1 text-xs font-semibold text-foreground hover:text-primary transition-colors"
              title={pdf.title}
            >
              {pdf.title}
            </h4>
          </Link>
          <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>{formatBytes(pdf.fileSize)}</span>
            <span className="flex items-center gap-1">
              <Eye className="h-3 w-3 opacity-60" />
              {pdf.views}
            </span>
          </div>
        </div>
      </motion.div>
    );
  }

  /* =========================================================================
     STANDARD GRID CARD: Premium book-style presentation with rich hover actions
     ========================================================================= */
  return (
    <motion.div
      whileHover={{ y: -5, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 350, damping: 25 }}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-border/80 bg-card shadow-xs transition-all hover:border-border hover:shadow-xl dark:hover:shadow-primary/5"
    >
      {/* Thumbnail Container with Next.js prefetch link */}
      <Link
        href={`/view/${pdf.publicId}`}
        prefetch={true}
        className="relative aspect-[3/4] w-full overflow-hidden bg-secondary/30 border-b border-border/60 block cursor-pointer"
      >
        {/* Paper Spine & Cover Presentation */}
        <div className="absolute inset-0 flex items-center justify-center p-3 transition-transform duration-500 group-hover:scale-[1.03]">
          <div className="relative h-full w-full max-w-[90%] rounded-md shadow-md overflow-hidden border border-border/60 bg-card">
            {/* Subtle paper spine line on left edge */}
            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-r from-black/15 to-transparent z-10 pointer-events-none" />
            <PDFThumbnail url={pdf.storageUrl} compact={false} />
          </div>
        </div>

        {/* Ambient subtle hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100 pointer-events-none" />

        {/* Format Badge & Folder Tag Top-Left */}
        <div className="absolute left-3 top-3 z-10 flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-md bg-background/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-foreground shadow-xs backdrop-blur-md border border-border/60">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
            PDF
          </span>

          {folderName && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (pdf.folderId && onFolderClick) {
                  onFolderClick(pdf.folderId);
                }
              }}
              className="inline-flex items-center gap-1 rounded-md bg-background/90 px-2 py-0.5 text-[10px] font-medium text-muted-foreground hover:text-foreground hover:bg-background shadow-xs backdrop-blur-md border border-border/60 truncate max-w-[110px] transition-colors cursor-pointer"
              title={`Folder: ${folderName}`}
            >
              <FolderIcon className="h-3 w-3 text-primary shrink-0" />
              <span className="truncate">{folderName}</span>
            </button>
          )}
        </div>

        {/* Action Buttons Top-Right */}
        <div className="absolute right-3 top-3 z-10 flex items-center space-x-1.5">
          {/* Star Button */}
          {onToggleStar && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onToggleStar(pdf.publicId, e);
              }}
              className={`flex h-8 w-8 items-center justify-center rounded-xl bg-background/90 backdrop-blur-md border border-border/60 shadow-xs transition-all active:scale-95 ${
                isStarred
                  ? "text-amber-500 opacity-100"
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
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-background/90 text-muted-foreground hover:text-foreground backdrop-blur-md border border-border/60 shadow-xs opacity-0 transition-opacity group-hover:opacity-100"
              title="Quick Preview"
            >
              <Eye className="h-4 w-4" />
            </button>
          )}

          {/* Menu Dropdown */}
          <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-xl bg-background/90 text-muted-foreground hover:text-foreground backdrop-blur-md border border-border/60 shadow-xs"
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
                {onMoveToFolder && (
                  <DropdownMenuItem onClick={() => onMoveToFolder(pdf)}>
                    <FolderIcon className="mr-2 h-4 w-4" />
                    Move to Folder
                  </DropdownMenuItem>
                )}
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

      {/* Standard Card Details */}
      <div className="flex flex-col p-4 bg-card z-10">
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
          <span className="flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5 opacity-60" />
            {formatBytes(pdf.fileSize)}
          </span>
          <span className="inline-flex items-center gap-1 bg-secondary/80 px-2 py-0.5 rounded-full text-foreground text-[11px] font-medium">
            <Eye className="h-3 w-3 opacity-60" />
            {pdf.views}
          </span>
        </div>

        <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3 opacity-60" />
            {format(new Date(pdf.createdAt), "MMM d, yyyy")}
          </span>
          <button
            onClick={handleCopyLink}
            className="text-xs hover:text-foreground transition-colors flex items-center gap-1 font-medium"
          >
            {copied ? (
              <span className="text-emerald-500">Copied!</span>
            ) : (
              <span className="opacity-70 hover:opacity-100">Share</span>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
