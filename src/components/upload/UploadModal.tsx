"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud, FileText, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatBytes } from "@/lib/utils";
import { upload } from '@vercel/blob/client';
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/components/ui/toast";
import { IFolderWithStats } from "@/components/folder/FolderCard";

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  folders?: IFolderWithStats[];
  defaultFolderId?: string | null;
}

export function UploadModal({
  isOpen,
  onClose,
  onSuccess,
  folders = [],
  defaultFolderId = null,
}: UploadModalProps) {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(defaultFolderId);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync default folder when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setSelectedFolderId(defaultFolderId);
    }
  }, [isOpen, defaultFolderId]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const selected = acceptedFiles[0];
    if (selected) {
      setFile(selected);
      // Auto-suggest name from filename without extension
      setTitle(selected.name.replace(/\.[^/.]+$/, ""));
      setError(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
    },
    maxFiles: 1,
    maxSize: 50 * 1024 * 1024, // 50MB
  });

  const handleUpload = async () => {
    if (!file || !title.trim()) {
      setError("Please provide a valid file and title.");
      return;
    }

    try {
      setIsUploading(true);
      setError(null);

      // 1. Upload directly via Vercel Blob
      const blob = await upload(file.name, file, {
        access: 'public',
        handleUploadUrl: '/api/upload',
      });

      // 2. Save metadata to DB
      const dbRes = await fetch("/api/pdfs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          originalFileName: file.name,
          storageKey: blob.url,
          storageUrl: blob.url,
          fileSize: file.size,
          mimeType: file.type,
          folderId: selectedFolderId || null,
        }),
      });

      if (!dbRes.ok) throw new Error("Failed to save PDF details");

      toast("Document uploaded successfully!");
      onSuccess();
      handleClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred during upload.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setTitle("");
    setError(null);
    setIsUploading(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md border-border/50 bg-background/80 backdrop-blur-2xl shadow-2xl rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl tracking-tight text-foreground">Upload Document</DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {!file ? (
            <motion.div
              key="dropzone"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="mt-4"
            >
              <div
                {...getRootProps()}
                className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 text-center transition-all duration-300 cursor-pointer ${
                  isDragActive
                    ? "border-primary bg-primary/5 scale-[1.02]"
                    : "border-border hover:border-primary/50 hover:bg-neutral-50/50 dark:hover:bg-neutral-900/50"
                }`}
              >
                <input {...getInputProps()} />
                <motion.div 
                  animate={{ y: isDragActive ? -5 : 0 }}
                  className={`mb-4 flex h-16 w-16 items-center justify-center rounded-full transition-colors ${
                    isDragActive ? "bg-primary/20 text-primary" : "bg-neutral-100 dark:bg-neutral-800 text-neutral-400"
                  }`}
                >
                  <UploadCloud className="h-8 w-8" />
                </motion.div>
                <p className="text-base font-semibold text-foreground">
                  Click to browse or drag and drop
                </p>
                <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                  Supports PDF up to 50MB
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="form"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="mt-4 space-y-5"
            >
              <div className="flex items-center rounded-xl border border-border/50 bg-neutral-50/50 dark:bg-neutral-900/50 p-4 shadow-sm">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30">
                  <FileText className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <div className="ml-4 flex-1 truncate">
                  <p className="truncate text-sm font-semibold text-foreground">{file.name}</p>
                  <p className="text-xs text-neutral-500 font-medium">
                    {formatBytes(file.size)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFile(null)}
                  disabled={isUploading}
                  className="ml-2 h-8 px-2 text-xs hover:bg-neutral-200 dark:hover:bg-neutral-800"
                >
                  Change
                </Button>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="title"
                  className="text-sm font-semibold tracking-tight text-foreground"
                >
                  Document Title
                </label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="E.g. Q3 Financial Report"
                  disabled={isUploading}
                  autoFocus
                  className="h-11 rounded-xl bg-background border-border/50 focus-visible:ring-primary"
                />
              </div>

              {folders.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-semibold tracking-tight text-foreground">
                    Destination Folder (Optional)
                  </label>
                  <select
                    value={selectedFolderId || ""}
                    onChange={(e) => setSelectedFolderId(e.target.value ? e.target.value : null)}
                    disabled={isUploading}
                    className="w-full h-11 rounded-xl border border-border/60 bg-background px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                  >
                    <option value="">Root (No Folder)</option>
                    {folders.map((f) => (
                      <option key={f.publicId} value={f.publicId}>
                        📁 {f.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {error && (
                <motion.p 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="text-sm text-red-500 font-medium bg-red-50 dark:bg-red-900/10 p-3 rounded-lg"
                >
                  {error}
                </motion.p>
              )}

              <div className="flex justify-end space-x-3 pt-4 border-t border-border/50">
                <Button
                  variant="ghost"
                  onClick={handleClose}
                  disabled={isUploading}
                  className="rounded-lg"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleUpload} 
                  disabled={isUploading || !title}
                  className="rounded-lg px-6 shadow-md transition-all hover:shadow-lg relative overflow-hidden"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                      <div className="absolute inset-0 bg-white/20 animate-pulse" />
                    </>
                  ) : (
                    "Upload Document"
                  )}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
