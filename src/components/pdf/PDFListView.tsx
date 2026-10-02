"use client";

import React from "react";
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
  Calendar,
  Folder as FolderIcon,
} from "lucide-react";
import Link from "next/link";
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

interface PDFListViewProps {
  pdfs: IPDF[];
  folders?: { publicId: string; name: string }[];
  starredIds: string[];
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
  onToggleStar,
  onQuickPreview,
  onMoveToFolder,
  onFolderClick,
  onRename,
  onDelete,
  onCopyLink,
}: PDFListViewProps) {
  return (
    <div className="w-full overflow-hidden rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border/50 bg-secondary/30 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              <th className="py-3 px-4 w-12 text-center">★</th>
              <th className="py-3 px-4">Document</th>
              <th className="py-3 px-4 hidden md:table-cell">Size</th>
              <th className="py-3 px-4 hidden sm:table-cell">Views</th>
              <th className="py-3 px-4 hidden lg:table-cell">Uploaded</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {pdfs.map((pdf) => {
              const isStarred = starredIds.includes(pdf.publicId);
              return (
                <tr
                  key={pdf.publicId}
                  className="group transition-colors hover:bg-accent/20"
                >
                  {/* Star */}
                  <td className="py-3.5 px-4 text-center">
                    <button
                      onClick={(e) => onToggleStar(pdf.publicId, e)}
                      className="p-1 rounded-lg text-muted-foreground hover:text-amber-500 transition-colors"
                    >
                      <Star
                        className={`h-4 w-4 ${
                          isStarred
                            ? "fill-amber-400 text-amber-500"
                            : "opacity-30 group-hover:opacity-100"
                        }`}
                      />
                    </button>
                  </td>

                  {/* Document Name */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-red-500/10 to-rose-500/10 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                        <FileText className="h-4.5 w-4.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link
                            href={`/view/${pdf.publicId}`}
                            prefetch={true}
                            className="font-semibold text-foreground hover:text-primary transition-colors line-clamp-1"
                          >
                            {pdf.title}
                          </Link>
                          {(() => {
                            const folder = folders.find((f) => f.publicId === pdf.folderId);
                            if (!folder) return null;
                            return (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  if (pdf.folderId && onFolderClick) onFolderClick(pdf.folderId);
                                }}
                                className="inline-flex items-center gap-1 rounded-md bg-secondary/60 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground hover:text-foreground border border-border/40 transition-colors shrink-0"
                              >
                                <FolderIcon className="h-2.5 w-2.5 text-primary shrink-0" />
                                <span className="truncate max-w-[80px]">{folder.name}</span>
                              </button>
                            );
                          })()}
                        </div>
                        <span className="text-[11px] text-muted-foreground line-clamp-1 block md:hidden mt-0.5 font-medium">
                          {formatBytes(pdf.fileSize)} • {pdf.views} views
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Size */}
                  <td className="py-3.5 px-4 text-xs text-muted-foreground font-medium hidden md:table-cell">
                    {formatBytes(pdf.fileSize)}
                  </td>

                  {/* Views */}
                  <td className="py-3.5 px-4 text-xs hidden sm:table-cell">
                    <span className="inline-flex items-center gap-1 bg-secondary/50 px-2 py-0.5 rounded-lg text-foreground/70 font-semibold">
                      <Eye className="h-3 w-3 opacity-50" />
                      {pdf.views}
                    </span>
                  </td>

                  {/* Date */}
                  <td className="py-3.5 px-4 text-xs text-muted-foreground font-medium hidden lg:table-cell">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3 w-3 opacity-50" />
                      {format(new Date(pdf.createdAt), "MMM d, yyyy")}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-0.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onQuickPreview(pdf)}
                        className="h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100 transition-all hidden sm:inline-flex"
                        title="Quick Preview"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => onCopyLink(pdf, e)}
                        className="h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100 transition-all hidden sm:inline-flex"
                        title="Copy Public Link"
                      >
                        <Link2 className="h-4 w-4" />
                      </Button>

                      <a href={pdf.storageUrl} target="_blank" rel="noopener noreferrer" download>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100 transition-all hidden sm:inline-flex"
                          title="Download"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </a>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 rounded-xl border-border/60 bg-card/95 backdrop-blur-xl shadow-xl">
                          <DropdownMenuItem asChild className="rounded-lg">
                            <Link href={`/view/${pdf.publicId}`} prefetch={true} className="flex items-center">
                              <ExternalLink className="mr-2 h-4 w-4 text-muted-foreground" />
                              Open Viewer
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onQuickPreview(pdf)} className="rounded-lg">
                            <Eye className="mr-2 h-4 w-4 text-muted-foreground" />
                            Quick Preview
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => onCopyLink(pdf, e)} className="rounded-lg">
                            <Link2 className="mr-2 h-4 w-4 text-muted-foreground" />
                            Copy Link
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
