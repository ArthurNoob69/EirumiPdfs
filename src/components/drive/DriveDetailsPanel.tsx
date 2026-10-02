"use client";

import React, { useState } from "react";
import { format } from "date-fns";
import {
  X,
  FileText,
  Folder as FolderIcon,
  Download,
  ExternalLink,
  Link2,
  Trash2,
  FolderInput,
  Check,
  Eye,
  Calendar,
  HardDrive,
  Users,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { IPDF } from "@/models/PDF";
import { IFolderWithStats } from "@/components/folder/FolderCard";
import { formatBytes } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import dynamic from "next/dynamic";

const PDFThumbnail = dynamic(
  () => import("@/components/pdf/PDFThumbnail").then((mod) => mod.PDFThumbnail),
  { ssr: false }
);

interface DriveDetailsPanelProps {
  selectedPdf: IPDF | null;
  selectedFolder: IFolderWithStats | null;
  folderName?: string;
  isOpen: boolean;
  onClose: () => void;
  onMovePdf?: (pdf: IPDF) => void;
  onDeletePdf?: (pdf: IPDF) => void;
}

export function DriveDetailsPanel({
  selectedPdf,
  selectedFolder,
  folderName,
  isOpen,
  onClose,
  onMovePdf,
  onDeletePdf,
}: DriveDetailsPanelProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"details" | "activity">("details");
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = (pdf: IPDF) => {
    const url = `${window.location.origin}/view/${pdf.publicId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast("Share link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <aside className="w-80 shrink-0 border-l border-border/60 bg-card flex flex-col h-full overflow-hidden transition-all duration-300 z-20">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-border/50">
        <div className="flex items-center gap-2 min-w-0">
          {selectedPdf ? (
            <div className="flex h-6 w-6 items-center justify-center rounded bg-red-500/10 text-red-500 shrink-0">
              <FileText className="h-4 w-4" />
            </div>
          ) : selectedFolder ? (
            <div className="flex h-6 w-6 items-center justify-center rounded bg-blue-500/10 text-blue-500 shrink-0">
              <FolderIcon className="h-4 w-4" />
            </div>
          ) : (
            <div className="flex h-6 w-6 items-center justify-center rounded bg-secondary text-muted-foreground shrink-0">
              <HardDrive className="h-4 w-4" />
            </div>
          )}
          <h3 className="font-semibold text-sm text-foreground truncate" title={selectedPdf?.title || selectedFolder?.name || "My Drive"}>
            {selectedPdf?.title || selectedFolder?.name || "My Drive"}
          </h3>
        </div>
        <button
          onClick={onClose}
          className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          title="Close details"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border/50 px-4">
        <button
          onClick={() => setActiveTab("details")}
          className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition-all ${
            activeTab === "details"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Details
        </button>
        <button
          onClick={() => setActiveTab("activity")}
          className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition-all ${
            activeTab === "activity"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Activity
        </button>
      </div>

      {/* Content Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {selectedPdf ? (
          activeTab === "details" ? (
            <>
              {/* Document Preview Snapshot */}
              <div className="rounded-xl border border-border/50 bg-secondary/30 p-2 flex items-center justify-center overflow-hidden">
                <div className="relative aspect-[3/4] w-36 rounded shadow-sm overflow-hidden border border-border/40 bg-card">
                  <PDFThumbnail url={selectedPdf.storageUrl} compact={false} />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <Button
                  asChild
                  className="flex-1 rounded-xl h-9 text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5"
                >
                  <Link href={`/view/${selectedPdf.publicId}`} target="_blank">
                    <ExternalLink className="h-3.5 w-3.5" /> Open
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="rounded-xl h-9 px-3 text-xs font-medium border-border"
                >
                  <a href={selectedPdf.storageUrl} target="_blank" rel="noopener noreferrer" download>
                    <Download className="h-3.5 w-3.5" />
                  </a>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleCopy(selectedPdf)}
                  className="rounded-xl h-9 px-3 text-xs font-medium border-border"
                  title="Copy link"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Link2 className="h-3.5 w-3.5" />}
                </Button>
              </div>

              {/* Who has access */}
              <div className="space-y-2 pt-2 border-t border-border/50">
                <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-muted-foreground" /> Who has access
                </p>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-secondary/40 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-[10px]">
                      🌍
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Anyone with link</p>
                      <p className="text-[11px] text-muted-foreground">Can view</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleCopy(selectedPdf)}
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    Copy link
                  </button>
                </div>
              </div>

              {/* File details */}
              <div className="space-y-3 pt-2 border-t border-border/50">
                <p className="text-xs font-semibold text-foreground">File details</p>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-border/30">
                    <span className="text-muted-foreground">Type</span>
                    <span className="font-medium text-foreground">PDF Document</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border/30">
                    <span className="text-muted-foreground">Size</span>
                    <span className="font-medium text-foreground">{formatBytes(selectedPdf.fileSize)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border/30">
                    <span className="text-muted-foreground">Storage used</span>
                    <span className="font-medium text-foreground">{formatBytes(selectedPdf.fileSize)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border/30">
                    <span className="text-muted-foreground">Location</span>
                    <span className="font-medium text-foreground">{folderName || "My Drive"}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border/30">
                    <span className="text-muted-foreground">Owner</span>
                    <span className="font-medium text-foreground">Me</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border/30">
                    <span className="text-muted-foreground">Modified</span>
                    <span className="font-medium text-foreground">{format(new Date(selectedPdf.createdAt), "MMM d, yyyy")}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border/30">
                    <span className="text-muted-foreground">Opened</span>
                    <span className="font-medium text-foreground">{selectedPdf.views} times</span>
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-2 border-t border-border/50 flex flex-col gap-1.5">
                {onMovePdf && (
                  <Button
                    variant="ghost"
                    onClick={() => onMovePdf(selectedPdf)}
                    className="justify-start h-8 text-xs font-medium text-foreground rounded-xl"
                  >
                    <FolderInput className="mr-2 h-4 w-4 text-muted-foreground" /> Move to folder
                  </Button>
                )}
                {onDeletePdf && (
                  <Button
                    variant="ghost"
                    onClick={() => onDeletePdf(selectedPdf)}
                    className="justify-start h-8 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-500/10 rounded-xl"
                  >
                    <Trash2 className="mr-2 h-4 w-4" /> Move to trash
                  </Button>
                )}
              </div>
            </>
          ) : (
            /* Activity Tab */
            <div className="space-y-4">
              <div className="flex gap-3 text-xs">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary shrink-0 mt-0.5">
                  <Eye className="h-3.5 w-3.5" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Viewed {selectedPdf.views} times</p>
                  <p className="text-[11px] text-muted-foreground">Through public links and gallery</p>
                </div>
              </div>
              <div className="flex gap-3 text-xs">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 shrink-0 mt-0.5">
                  <Calendar className="h-3.5 w-3.5" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Uploaded item</p>
                  <p className="text-[11px] text-muted-foreground">{format(new Date(selectedPdf.createdAt), "MMMM d, yyyy 'at' h:mm a")}</p>
                </div>
              </div>
            </div>
          )
        ) : selectedFolder ? (
          /* Folder details */
          <div className="space-y-4">
            <div className="rounded-xl border border-border/50 bg-secondary/30 p-6 flex flex-col items-center justify-center text-center">
              <FolderIcon className="h-12 w-12 text-blue-500 fill-blue-500/20 mb-2" />
              <p className="font-semibold text-sm text-foreground">{selectedFolder.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {selectedFolder.count} {selectedFolder.count === 1 ? "file" : "files"} • {formatBytes(selectedFolder.totalSize)}
              </p>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-border/30">
                <span className="text-muted-foreground">Type</span>
                <span className="font-medium text-foreground">Google Drive Folder</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/30">
                <span className="text-muted-foreground">Items</span>
                <span className="font-medium text-foreground">{selectedFolder.count} files</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/30">
                <span className="text-muted-foreground">Total Size</span>
                <span className="font-medium text-foreground">{formatBytes(selectedFolder.totalSize)}</span>
              </div>
            </div>
          </div>
        ) : (
          /* Nothing selected */
          <div className="h-64 flex flex-col items-center justify-center text-center p-4">
            <div className="h-14 w-14 rounded-full bg-secondary flex items-center justify-center mb-3">
              <HardDrive className="h-7 w-7 text-muted-foreground/60" />
            </div>
            <p className="text-sm font-semibold text-foreground">Select an item</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
              Select a file or folder to view its details, sharing settings, and activity.
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}
