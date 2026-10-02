"use client";

import React, { useState } from "react";
import { format } from "date-fns";
import {
  FileText,
  Star,
  Eye,
  MoreVertical,
  ExternalLink,
  Link2,
  Edit2,
  Trash2,
  Download,
  Folder as FolderIcon,
  Check,
} from "lucide-react";
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

interface PDFListViewProps {
  pdfs: IPDF[];
  folders?: { publicId: string; name: string }[];
  starredIds: string[];
  selectedPdfId?: string | null;
  onSelectPdf?: (pdf: IPDF) => void;
  onToggleStar: (id: string, e: React.MouseEvent) => void;
  onQuickPreview: (pdf: IPDF) => void;
  onMoveToFolder?: (pdf: IPDF) => void;
  onFolderClick?: (folderId: string) => void;
  onRename: (pdf: IPDF) => void;
  onDelete: (pdf: IPDF) => void;
  onCopyLink: (pdf: IPDF, e: React.MouseEvent) => void;
}

export function PDFListView({
  pdfs,
  folders = [],
  starredIds,
  selectedPdfId,
  onSelectPdf,
  onToggleStar,
  onQuickPreview,
  onMoveToFolder,
  onFolderClick,
  onRename,
  onDelete,
  onCopyLink,
}: PDFListViewProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (pdf: IPDF, e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/view/${pdf.publicId}`;
    navigator.clipboard.writeText(url);
    setCopiedId(pdf.publicId);
    toast("Link copied to clipboard!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="border-b border-border/50 text-[12px] font-medium text-muted-foreground">
              <th className="py-3 px-4 w-10 text-center"></th>
              <th className="py-3 px-4 font-medium">Name</th>
              <th className="py-3 px-4 hidden md:table-cell font-medium">Location</th>
              <th className="py-3 px-4 hidden sm:table-cell font-medium">Last modified</th>
              <th className="py-3 px-4 hidden lg:table-cell font-medium">File size</th>
              <th className="py-3 px-4 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {pdfs.map((pdf) => {
              const isStarred = starredIds.includes(pdf.publicId);
              const isSelected = selectedPdfId === pdf.publicId;
              const folder = folders.find((f) => f.publicId === pdf.folderId);

              return (
                <tr
                  key={pdf.publicId}
                  onClick={() => onSelectPdf && onSelectPdf(pdf)}
                  onDoubleClick={() => router.push(`/view/${pdf.publicId}`)}
                  className={`group transition-colors cursor-pointer select-none ${
                    isSelected
                      ? "bg-[#c2e7ff]/40 dark:bg-[#004a77]/30 text-foreground"
                      : "hover:bg-secondary/40 text-foreground"
                  }`}
                >
                  {/* Star */}
                  <td className="py-2.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={(e) => onToggleStar(pdf.publicId, e)}
                      className={`h-7 w-7 rounded-full flex items-center justify-center transition-all ${
                        isStarred
                          ? "text-amber-500"
                          : "text-muted-foreground/40 hover:text-amber-500 opacity-0 group-hover:opacity-100"
                      }`}
                    >
                      <Star className={`h-4 w-4 ${isStarred ? "fill-amber-400" : ""}`} />
                    </button>
                  </td>

                  {/* Document Name */}
                  <td className="py-2.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-7 w-7 items-center justify-center rounded bg-red-500/10 text-red-500 shrink-0">
                        <FileText className="h-4 w-4" />
                      </div>
                      <span className="font-medium text-foreground truncate max-w-xs sm:max-w-md" title={pdf.title}>
                        {pdf.title}
                      </span>
                    </div>
                  </td>

                  {/* Location / Folder */}
                  <td className="py-2.5 px-4 hidden md:table-cell text-xs text-muted-foreground">
                    {folder ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onFolderClick) onFolderClick(folder.publicId);
                        }}
                        className="inline-flex items-center gap-1.5 hover:text-primary transition-colors py-0.5 px-2 rounded-md hover:bg-secondary"
                      >
                        <FolderIcon className="h-3.5 w-3.5 text-primary" />
                        <span className="truncate max-w-[120px]">{folder.name}</span>
                      </button>
                    ) : (
                      <span className="opacity-60 text-xs">My Drive</span>
                    )}
                  </td>

                  {/* Last modified */}
                  <td className="py-2.5 px-4 hidden sm:table-cell text-xs text-muted-foreground whitespace-nowrap">
                    {format(new Date(pdf.createdAt), "MMM d, yyyy")}
                  </td>

                  {/* File size */}
                  <td className="py-2.5 px-4 hidden lg:table-cell text-xs text-muted-foreground whitespace-nowrap">
                    {formatBytes(pdf.fileSize)}
                  </td>

                  {/* Hover Quick Actions */}
                  <td className="py-2.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      {/* Action buttons visible on hover */}
                      <button
                        onClick={() => onQuickPreview(pdf)}
                        className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Quick preview"
                      >
                        <Eye className="h-4 w-4" />
                      </button>

                      <button
                        onClick={(e) => handleCopy(pdf, e)}
                        className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Copy link"
                      >
                        {copiedId === pdf.publicId ? (
                          <Check className="h-4 w-4 text-emerald-500" />
                        ) : (
                          <Link2 className="h-4 w-4" />
                        )}
                      </button>

                      <a
                        href={pdf.storageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        download
                        className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Download"
                      >
                        <Download className="h-4 w-4" />
                      </a>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52 rounded-2xl border-border bg-card shadow-2xl p-1.5">
                          <DropdownMenuItem asChild className="rounded-xl cursor-pointer">
                            <Link href={`/view/${pdf.publicId}`} prefetch={true} className="flex items-center">
                              <ExternalLink className="mr-2.5 h-4 w-4 text-muted-foreground" />
                              Open in Viewer
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onQuickPreview(pdf)} className="rounded-xl cursor-pointer">
                            <Eye className="mr-2.5 h-4 w-4 text-muted-foreground" />
                            Preview
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => handleCopy(pdf, e)} className="rounded-xl cursor-pointer">
                            <Link2 className="mr-2.5 h-4 w-4 text-muted-foreground" />
                            Copy Link
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
                      </DropdownMenu>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
