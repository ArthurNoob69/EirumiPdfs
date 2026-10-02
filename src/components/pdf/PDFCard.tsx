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
  Info,
} from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { IPDF } from "@/models/PDF";
import { formatBytes } from "@/lib/utils";
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
  isSelected?: boolean;
  isStarred?: boolean;
  folderName?: string;
  onSelect?: (pdf: IPDF) => void;
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
  isSelected = false,
  isStarred = false,
  folderName,
  onSelect,
  onToggleStar,
  onQuickPreview,
  onMoveToFolder,
  onFolderClick,
  onRename,
  onDelete,
  compact = false,
}: PDFCardProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const handleCopyLink = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/view/${pdf.publicId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast("Link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const renderDropdownContent = () => (
    <DropdownMenuContent align="end" className="w-52 rounded-2xl border-border bg-card shadow-2xl p-1.5">
      <DropdownMenuItem asChild className="rounded-xl cursor-pointer">
        <Link href={`/view/${pdf.publicId}`} prefetch={true} className="flex items-center">
          <ExternalLink className="mr-2.5 h-4 w-4 text-muted-foreground" />
          Open in Viewer
        </Link>
      </DropdownMenuItem>
      {onQuickPreview && (
        <DropdownMenuItem onClick={() => onQuickPreview(pdf)} className="rounded-xl cursor-pointer">
          <Eye className="mr-2.5 h-4 w-4 text-muted-foreground" />
          Preview
        </DropdownMenuItem>
      )}
      <DropdownMenuItem onClick={handleCopyLink} className="rounded-xl cursor-pointer">
        {copied ? <Check className="mr-2.5 h-4 w-4 text-emerald-500" /> : <Link2 className="mr-2.5 h-4 w-4 text-muted-foreground" />}
        {copied ? "Copied!" : "Copy link"}
      </DropdownMenuItem>
      <DropdownMenuItem asChild className="rounded-xl cursor-pointer">
        <a href={pdf.storageUrl} target="_blank" rel="noopener noreferrer" download className="flex items-center">
          <Download className="mr-2.5 h-4 w-4 text-muted-foreground" />
          Download
        </a>
      </DropdownMenuItem>
      <DropdownMenuSeparator className="my-1 bg-border/60" />
      {onMoveToFolder && (
        <DropdownMenuItem onClick={() => onMoveToFolder(pdf)} className="rounded-xl cursor-pointer">
          <FolderIcon className="mr-2.5 h-4 w-4 text-muted-foreground" />
          Move to folder
        </DropdownMenuItem>
      )}
      <DropdownMenuItem onClick={() => onRename(pdf)} className="rounded-xl cursor-pointer">
        <Edit2 className="mr-2.5 h-4 w-4 text-muted-foreground" />
        Rename
      </DropdownMenuItem>
      <DropdownMenuSeparator className="my-1 bg-border/60" />
      <DropdownMenuItem
        onClick={() => onDelete(pdf)}
        className="text-red-600 focus:bg-red-500/10 focus:text-red-600 rounded-xl cursor-pointer"
      >
        <Trash2 className="mr-2.5 h-4 w-4" />
        Move to trash
      </DropdownMenuItem>
    </DropdownMenuContent>
  );

  const handleClick = (e: React.MouseEvent) => {
    if (onSelect) {
      onSelect(pdf);
    }
  };

  const handleDoubleClick = () => {
    router.push(`/view/${pdf.publicId}`);
  };

  if (compact) {
    return (
      <div
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        className={`group relative flex flex-col overflow-hidden rounded-2xl border transition-all cursor-pointer select-none ${
          isSelected
            ? "border-primary bg-primary/5 ring-2 ring-primary/30 shadow-md"
            : "border-border/50 bg-secondary/20 hover:bg-secondary/50 hover:border-border hover:shadow-sm"
        }`}
      >
        {/* Top bar with icon, title & action */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-border/40 gap-1.5">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="flex h-5 w-5 items-center justify-center rounded bg-red-500/10 text-red-500 shrink-0">
              <FileText className="h-3.5 w-3.5" />
            </div>
            <p className="truncate text-xs font-medium text-foreground leading-none" title={pdf.title}>
              {pdf.title}
            </p>
          </div>
          <div className="flex items-center gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="h-6 w-6 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreVertical className="h-3.5 w-3.5" />
                </button>
              </DropdownMenuTrigger>
              {renderDropdownContent()}
            </DropdownMenu>
          </div>
        </div>

        {/* Thumbnail Preview Area */}
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-background/50 flex items-center justify-center p-2">
          <div className="h-full w-full max-w-[85%] rounded shadow-sm overflow-hidden border border-border/40 bg-card">
            <PDFThumbnail url={pdf.storageUrl} compact={true} />
          </div>
          {onToggleStar && (
            <button
              onClick={(e) => onToggleStar(pdf.publicId, e)}
              className={`absolute top-2 right-2 p-1 rounded-full bg-card/80 backdrop-blur-sm border border-border/40 shadow-sm transition-all ${
                isStarred
                  ? "text-amber-500 opacity-100"
                  : "text-muted-foreground hover:text-amber-500 opacity-0 group-hover:opacity-100"
              }`}
            >
              <Star className={`h-3.5 w-3.5 ${isStarred ? "fill-amber-400" : ""}`} />
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="px-3 py-1.5 flex items-center justify-between text-[11px] text-muted-foreground border-t border-border/30 bg-background/30">
          <span>{formatBytes(pdf.fileSize)}</span>
          <span className="flex items-center gap-1">
            <Eye className="h-2.5 w-2.5 opacity-60" />
            {pdf.views}
          </span>
        </div>
      </div>
    );
  }

  /* Google Drive Grid Card */
  return (
    <div
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      className={`group relative flex flex-col overflow-hidden rounded-2xl border transition-all cursor-pointer select-none ${
        isSelected
          ? "border-primary bg-primary/5 ring-2 ring-primary/40 shadow-md"
          : "border-border/60 bg-secondary/20 hover:bg-secondary/60 hover:border-border hover:shadow-md"
      }`}
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between px-3.5 py-3 border-b border-border/40 gap-2 bg-background/40">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-red-500/10 text-red-500 shrink-0">
            <FileText className="h-4 w-4" />
          </div>
          <p className="truncate text-[13px] font-medium text-foreground leading-tight" title={pdf.title}>
            {pdf.title}
          </p>
        </div>

        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
          {onToggleStar && (
            <button
              onClick={(e) => onToggleStar(pdf.publicId, e)}
              className={`h-7 w-7 rounded-full flex items-center justify-center transition-all ${
                isStarred
                  ? "text-amber-500 opacity-100"
                  : "text-muted-foreground hover:text-amber-500 opacity-0 group-hover:opacity-100 hover:bg-secondary"
              }`}
              title={isStarred ? "Remove from Starred" : "Add to Starred"}
            >
              <Star className={`h-4 w-4 ${isStarred ? "fill-amber-400" : ""}`} />
            </button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="h-7 w-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                <MoreVertical className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            {renderDropdownContent()}
          </DropdownMenu>
        </div>
      </div>

      {/* Thumbnail Window (Google Drive style doc preview) */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-background/70 flex items-center justify-center p-3">
        <div className="h-full w-full max-w-[90%] rounded-md shadow-sm overflow-hidden border border-border/40 bg-card transition-transform group-hover:scale-[1.02]">
          <PDFThumbnail url={pdf.storageUrl} compact={false} />
        </div>

        {/* Quick Preview Hover Pill */}
        {onQuickPreview && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onQuickPreview(pdf);
            }}
            className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-card/90 backdrop-blur-md border border-border/60 text-xs font-medium text-foreground shadow-md opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 hover:bg-card"
          >
            <Eye className="h-3.5 w-3.5 text-primary" /> Preview
          </button>
        )}
      </div>

      {/* Footer Info */}
      <div className="px-3.5 py-2.5 flex items-center justify-between text-xs text-muted-foreground border-t border-border/40 bg-background/20">
        <div className="flex items-center gap-1.5 truncate">
          {folderName ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (pdf.folderId && onFolderClick) onFolderClick(pdf.folderId);
              }}
              className="inline-flex items-center gap-1 hover:text-foreground transition-colors font-medium truncate max-w-[120px]"
            >
              <FolderIcon className="h-3 w-3 text-primary shrink-0" />
              <span className="truncate">{folderName}</span>
            </button>
          ) : (
            <span className="text-[11px] font-medium">{format(new Date(pdf.createdAt), "MMM d, yyyy")}</span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0 text-[11px]">
          <span>{formatBytes(pdf.fileSize)}</span>
          <span className="opacity-40">•</span>
          <span className="flex items-center gap-1" title={`${pdf.views} views`}>
            <Eye className="h-3 w-3 opacity-60" />
            {pdf.views}
          </span>
        </div>
      </div>
    </div>
  );
}
