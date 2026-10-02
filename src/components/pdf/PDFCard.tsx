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

  /* ===== Shared Dropdown Menu ===== */
  const renderDropdownContent = () => (
    <DropdownMenuContent align="end" className="w-48 rounded-xl border-border/60 bg-card/95 backdrop-blur-xl shadow-xl">
      <DropdownMenuItem asChild className="rounded-lg">
        <Link href={`/view/${pdf.publicId}`} prefetch={true} className="flex items-center">
          <ExternalLink className="mr-2 h-4 w-4 text-muted-foreground" />
          Open Viewer
        </Link>
      </DropdownMenuItem>
      {onQuickPreview && (
        <DropdownMenuItem onClick={() => onQuickPreview(pdf)} className="rounded-lg">
          <Eye className="mr-2 h-4 w-4 text-muted-foreground" />
          Quick Preview
        </DropdownMenuItem>
      )}
      <DropdownMenuItem onClick={handleCopyLink} className="rounded-lg">
        {copied ? <Check className="mr-2 h-4 w-4 text-emerald-500" /> : <Link2 className="mr-2 h-4 w-4 text-muted-foreground" />}
        {copied ? "Copied!" : "Copy Link"}
      </DropdownMenuItem>
      <DropdownMenuItem asChild className="rounded-lg">
        <a href={pdf.storageUrl} target="_blank" rel="noopener noreferrer" download className="flex items-center">
          <Download className="mr-2 h-4 w-4 text-muted-foreground" />
          Download
        </a>
      </DropdownMenuItem>
      <DropdownMenuSeparator className="bg-border/50" />
      {onMoveToFolder && (
        <DropdownMenuItem onClick={() => onMoveToFolder(pdf)} className="rounded-lg">
          <FolderIcon className="mr-2 h-4 w-4 text-muted-foreground" />
          Move to Folder
        </DropdownMenuItem>
      )}
      <DropdownMenuItem onClick={() => onRename(pdf)} className="rounded-lg">
        <Edit2 className="mr-2 h-4 w-4 text-muted-foreground" />
        Rename
      </DropdownMenuItem>
      <DropdownMenuItem
        onClick={() => onDelete(pdf)}
        className="text-red-600 focus:bg-red-500/10 focus:text-red-600 rounded-lg"
      >
        <Trash2 className="mr-2 h-4 w-4" />
        Delete
      </DropdownMenuItem>
    </DropdownMenuContent>
  );

  if (compact) {
    /* ===================================================================
       COMPACT VIEW TILE
       =================================================================== */
    return (
      <motion.div
        whileHover={{ y: -2 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className="group relative flex flex-col overflow-hidden rounded-xl border border-border/50 bg-card shadow-sm transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
      >
        <Link
          href={`/view/${pdf.publicId}`}
          prefetch={true}
          className="relative aspect-[4/3] w-full overflow-hidden bg-secondary/20 border-b border-border/40 block"
        >
          <div className="absolute inset-0 flex items-center justify-center transition-transform duration-500 group-hover:scale-[1.03]">
            <PDFThumbnail url={pdf.storageUrl} compact={true} />
          </div>

          {/* Hover gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 pointer-events-none" />

          {/* Star & Folder - Top Left */}
          <div className="absolute left-1.5 top-1.5 z-10 flex items-center gap-1">
            {onToggleStar && (
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleStar(pdf.publicId, e); }}
                className={`flex h-7 w-7 items-center justify-center rounded-lg bg-card/90 backdrop-blur-sm border border-border/40 shadow-sm transition-all active:scale-90 ${
                  isStarred
                    ? "text-amber-500 opacity-100"
                    : "text-muted-foreground hover:text-amber-500 opacity-0 group-hover:opacity-100"
                }`}
              >
                <Star className={`h-3.5 w-3.5 ${isStarred ? "fill-amber-400" : ""}`} />
              </button>
            )}
            {folderName && (
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (pdf.folderId && onFolderClick) onFolderClick(pdf.folderId); }}
                className="inline-flex items-center gap-1 rounded-lg bg-card/90 backdrop-blur-sm px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground hover:text-foreground border border-border/40 shadow-sm truncate max-w-[80px] transition-colors"
              >
                <FolderIcon className="h-2.5 w-2.5 text-primary shrink-0" />
                <span className="truncate">{folderName}</span>
              </button>
            )}
          </div>

          {/* Actions - Top Right */}
          <div className="absolute right-1.5 top-1.5 z-10 flex items-center gap-1">
            {onQuickPreview && (
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onQuickPreview(pdf); }}
                className="flex h-7 w-7 items-center justify-center rounded-lg bg-card/90 backdrop-blur-sm text-muted-foreground hover:text-foreground border border-border/40 shadow-sm opacity-0 transition-all group-hover:opacity-100"
              >
                <Eye className="h-3.5 w-3.5" />
              </button>
            )}
            <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg bg-card/90 backdrop-blur-sm text-muted-foreground hover:text-foreground border border-border/40 shadow-sm">
                    <MoreVertical className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                {renderDropdownContent()}
              </DropdownMenu>
            </div>
          </div>
        </Link>

        {/* Info */}
        <div className="p-2.5">
          <Link href={`/view/${pdf.publicId}`} prefetch={true} className="block">
            <h4 className="line-clamp-1 text-xs font-semibold text-foreground hover:text-primary transition-colors" title={pdf.title}>
              {pdf.title}
            </h4>
          </Link>
          <div className="mt-1.5 flex items-center justify-between text-[10px] text-muted-foreground">
            <span className="font-medium">{formatBytes(pdf.fileSize)}</span>
            <span className="flex items-center gap-0.5 bg-secondary/60 px-1.5 py-0.5 rounded-md font-medium text-foreground/70">
              <Eye className="h-2.5 w-2.5" />
              {pdf.views}
            </span>
          </div>
        </div>
      </motion.div>
    );
  }

  /* ===================================================================
     STANDARD GRID CARD
     =================================================================== */
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 350, damping: 25 }}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm transition-all hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5"
    >
      {/* Thumbnail */}
      <Link
        href={`/view/${pdf.publicId}`}
        prefetch={true}
        className="relative aspect-[3/4] w-full overflow-hidden bg-secondary/20 border-b border-border/40 block"
      >
        <div className="absolute inset-0 flex items-center justify-center p-3 transition-transform duration-500 group-hover:scale-[1.02]">
          <div className="relative h-full w-full max-w-[90%] rounded-lg shadow-lg overflow-hidden border border-border/40 bg-card">
            {/* Paper spine effect */}
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-r from-black/10 to-transparent z-10 pointer-events-none" />
            <PDFThumbnail url={pdf.storageUrl} compact={false} />
          </div>
        </div>

        {/* Hover gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100 pointer-events-none" />

        {/* Badges - Top Left */}
        <div className="absolute left-3 top-3 z-10 flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-lg bg-card/90 backdrop-blur-sm px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-foreground shadow-sm border border-border/40">
            <span className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-red-500 to-rose-500" />
            PDF
          </span>
          {folderName && (
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (pdf.folderId && onFolderClick) onFolderClick(pdf.folderId); }}
              className="inline-flex items-center gap-1 rounded-lg bg-card/90 backdrop-blur-sm px-2 py-1 text-[10px] font-medium text-muted-foreground hover:text-foreground shadow-sm border border-border/40 truncate max-w-[110px] transition-colors"
            >
              <FolderIcon className="h-3 w-3 text-primary shrink-0" />
              <span className="truncate">{folderName}</span>
            </button>
          )}
        </div>

        {/* Action Buttons - Top Right */}
        <div className="absolute right-3 top-3 z-10 flex items-center gap-1.5">
          {onToggleStar && (
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleStar(pdf.publicId, e); }}
              className={`flex h-8 w-8 items-center justify-center rounded-xl bg-card/90 backdrop-blur-sm border border-border/40 shadow-sm transition-all active:scale-90 ${
                isStarred
                  ? "text-amber-500 opacity-100"
                  : "text-muted-foreground hover:text-amber-500 opacity-0 group-hover:opacity-100"
              }`}
            >
              <Star className={`h-4 w-4 ${isStarred ? "fill-amber-400" : ""}`} />
            </button>
          )}
          {onQuickPreview && (
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onQuickPreview(pdf); }}
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-card/90 backdrop-blur-sm text-muted-foreground hover:text-foreground border border-border/40 shadow-sm opacity-0 transition-all group-hover:opacity-100"
            >
              <Eye className="h-4 w-4" />
            </button>
          )}
          <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl bg-card/90 backdrop-blur-sm text-muted-foreground hover:text-foreground border border-border/40 shadow-sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              {renderDropdownContent()}
            </DropdownMenu>
          </div>
        </div>
      </Link>

      {/* Card Details */}
      <div className="flex flex-col p-4 bg-card z-10">
        <Link href={`/view/${pdf.publicId}`} prefetch={true} className="group/title block">
          <h3 className="line-clamp-1 text-sm font-semibold text-foreground group-hover/title:text-primary transition-colors" title={pdf.title}>
            {pdf.title}
          </h3>
        </Link>

        <div className="mt-2.5 flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5 font-medium">
            <FileText className="h-3.5 w-3.5 opacity-50" />
            {formatBytes(pdf.fileSize)}
          </span>
          <span className="inline-flex items-center gap-1 bg-secondary/60 px-2 py-0.5 rounded-lg text-foreground/70 text-[11px] font-semibold">
            <Eye className="h-3 w-3 opacity-50" />
            {pdf.views}
          </span>
        </div>

        <div className="mt-3 pt-3 border-t border-border/40 flex items-center justify-between text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1 font-medium">
            <Calendar className="h-3 w-3 opacity-50" />
            {format(new Date(pdf.createdAt), "MMM d, yyyy")}
          </span>
          <button
            onClick={handleCopyLink}
            className="text-xs hover:text-primary transition-colors flex items-center gap-1 font-semibold"
          >
            {copied ? (
              <span className="text-emerald-500 flex items-center gap-1">
                <Check className="h-3 w-3" /> Copied
              </span>
            ) : (
              <span className="flex items-center gap-1 opacity-60 hover:opacity-100">
                <Link2 className="h-3 w-3" /> Share
              </span>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
