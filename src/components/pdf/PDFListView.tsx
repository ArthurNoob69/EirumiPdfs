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
  starredIds: string[];
  onToggleStar: (id: string, e: React.MouseEvent) => void;
  onQuickPreview: (pdf: IPDF) => void;
  onRename: (pdf: IPDF) => void;
  onDelete: (pdf: IPDF) => void;
  onCopyLink: (pdf: IPDF, e: React.MouseEvent) => void;
}

export function PDFListView({
  pdfs,
  starredIds,
  onToggleStar,
  onQuickPreview,
  onRename,
  onDelete,
  onCopyLink,
}: PDFListViewProps) {
  return (
    <div className="w-full overflow-hidden rounded-2xl border border-border bg-card shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <th className="py-3 px-4 w-12 text-center">★</th>
              <th className="py-3 px-4">Name</th>
              <th className="py-3 px-4 hidden md:table-cell">Size</th>
              <th className="py-3 px-4 hidden sm:table-cell">Views</th>
              <th className="py-3 px-4 hidden lg:table-cell">Uploaded</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {pdfs.map((pdf) => {
              const isStarred = starredIds.includes(pdf.publicId);
              return (
                <tr
                  key={pdf.publicId}
                  className="group transition-colors hover:bg-accent/40"
                >
                  {/* Star Column */}
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={(e) => onToggleStar(pdf.publicId, e)}
                      className="p-1 rounded-md text-muted-foreground hover:text-amber-500 transition-colors"
                      title={isStarred ? "Unstar document" : "Star document"}
                    >
                      <Star
                        className={`h-4 w-4 ${
                          isStarred
                            ? "fill-amber-400 text-amber-500"
                            : "opacity-40 group-hover:opacity-100"
                        }`}
                      />
                    </button>
                  </td>

                  {/* Document Name */}
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/view/${pdf.publicId}`}
                          prefetch={true}
                          className="font-medium text-foreground hover:text-primary hover:underline line-clamp-1 block"
                        >
                          {pdf.title}
                        </Link>
                        <span className="text-xs text-muted-foreground line-clamp-1 block md:hidden">
                          {formatBytes(pdf.fileSize)} • {pdf.views} views
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* File Size */}
                  <td className="py-3 px-4 text-xs text-muted-foreground hidden md:table-cell">
                    {formatBytes(pdf.fileSize)}
                  </td>

                  {/* Views */}
                  <td className="py-3 px-4 text-xs text-muted-foreground hidden sm:table-cell">
                    <span className="inline-flex items-center gap-1 bg-secondary/80 px-2 py-0.5 rounded-full text-foreground font-medium">
                      <Eye className="h-3 w-3 opacity-60" />
                      {pdf.views}
                    </span>
                  </td>

                  {/* Upload Date */}
                  <td className="py-3 px-4 text-xs text-muted-foreground hidden lg:table-cell">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3 w-3 opacity-60" />
                      {format(new Date(pdf.createdAt), "MMM d, yyyy")}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end space-x-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onQuickPreview(pdf)}
                        className="h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hidden sm:inline-flex"
                        title="Quick Preview"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => onCopyLink(pdf, e)}
                        className="h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hidden sm:inline-flex"
                        title="Copy Public Link"
                      >
                        <Link2 className="h-4 w-4" />
                      </Button>

                      <a href={pdf.storageUrl} target="_blank" rel="noopener noreferrer" download>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hidden sm:inline-flex"
                          title="Download PDF"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </a>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg"
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
                          <DropdownMenuItem onClick={() => onQuickPreview(pdf)}>
                            <Eye className="mr-2 h-4 w-4" />
                            Quick Preview
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => onCopyLink(pdf, e)}>
                            <Link2 className="mr-2 h-4 w-4" />
                            Copy Link
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
