"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import {
  Image as ImageIcon,
  UploadCloud,
  Trash2,
  Loader2,
  Check,
  AlertCircle,
  Sparkles,
  FileText,
  RotateCcw,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { IPDF } from "@/models/PDF";
import { upload } from "@vercel/blob/client";
import { formatBytes } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import { motion, AnimatePresence } from "framer-motion";

interface EditCoverModalProps {
  pdf: IPDF | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedPdf?: IPDF) => void;
}

export function EditCoverModal({
  pdf,
  isOpen,
  onClose,
  onSuccess,
}: EditCoverModalProps) {
  const { toast } = useToast();
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync state when PDF changes or modal opens
  useEffect(() => {
    if (isOpen && pdf) {
      setSelectedImage(null);
      setPreviewUrl(pdf.coverUrl || null);
      setError(null);
    }
  }, [isOpen, pdf]);

  // Clean up object URL when component unmounts or selected image changes
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setError("Please choose a valid image file (PNG, JPG, WebP).");
        return;
      }
      setSelectedImage(file);
      setError(null);
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/webp": [".webp"],
      "image/gif": [".gif"],
    },
    maxFiles: 1,
    maxSize: 15 * 1024 * 1024, // 15MB
  });

  const handleSaveCover = async () => {
    if (!pdf || !selectedImage) return;

    try {
      setIsSaving(true);
      setError(null);

      // 1. Upload cover image to storage
      const blob = await upload(
        `cover-${pdf.publicId}-${Date.now()}-${selectedImage.name}`,
        selectedImage,
        {
          access: "public",
          handleUploadUrl: "/api/upload",
        }
      );

      // 2. Patch PDF record
      const res = await fetch(`/api/pdfs/${pdf.publicId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          coverUrl: blob.url,
          coverStorageKey: blob.url,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to update cover image");
      }

      const updated = await res.json();
      toast("Cover image updated successfully!");
      onSuccess(updated);
      handleClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to save cover image");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveCover = async () => {
    if (!pdf || !pdf.coverUrl) return;

    try {
      setIsRemoving(true);
      setError(null);

      const res = await fetch(`/api/pdfs/${pdf.publicId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          coverUrl: null,
          coverStorageKey: null,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to remove cover image");
      }

      const updated = await res.json();
      toast("Cover removed. Restored auto-generated PDF preview.");
      onSuccess(updated);
      handleClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to remove cover image");
    } finally {
      setIsRemoving(false);
    }
  };

  const handleClose = () => {
    if (previewUrl && previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedImage(null);
    setPreviewUrl(null);
    setError(null);
    onClose();
  };

  if (!pdf) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-lg bg-card text-foreground border-border shadow-2xl rounded-2xl overflow-hidden p-0">
        <DialogHeader className="p-6 pb-4 border-b border-border/50">
          <DialogTitle className="text-lg font-semibold flex items-center gap-2 text-foreground">
            <ImageIcon className="h-5 w-5 text-primary" />
            Edit Document Cover
          </DialogTitle>
          <p className="text-xs text-muted-foreground mt-0.5 truncate" title={pdf.title}>
            Choose or upload a custom cover image for &quot;{pdf.title}&quot;
          </p>
        </DialogHeader>

        <div className="p-6 space-y-5">
          {/* Main Preview & Dropzone Split */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            {/* Cover Preview Card */}
            <div className="flex flex-col items-center">
              <span className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5 self-start">
                <Sparkles className="h-3.5 w-3.5 text-primary" /> Current Preview
              </span>
              <div className="relative aspect-[3/4] w-full max-w-[200px] rounded-xl overflow-hidden border border-border/60 bg-secondary/30 shadow-md flex items-center justify-center">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Document Cover Preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center p-4 text-center text-muted-foreground/50 gap-2">
                    <FileText className="h-10 w-10 opacity-40" />
                    <span className="text-[11px] font-medium">Default PDF Preview</span>
                  </div>
                )}

                {selectedImage && (
                  <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold shadow">
                    New
                  </span>
                )}
              </div>

              {selectedImage && (
                <p className="mt-2 text-[11px] text-muted-foreground text-center truncate max-w-[200px]">
                  {selectedImage.name} ({formatBytes(selectedImage.size)})
                </p>
              )}
            </div>

            {/* Dropzone Area */}
            <div className="flex flex-col h-full justify-center">
              <div
                {...getRootProps()}
                className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition-all cursor-pointer min-h-[190px] ${
                  isDragActive
                    ? "border-primary bg-primary/5 scale-[1.02]"
                    : "border-border hover:border-primary/50 hover:bg-secondary/40"
                }`}
              >
                <input {...getInputProps()} />
                <div
                  className={`h-12 w-12 rounded-full flex items-center justify-center mb-3 transition-colors ${
                    isDragActive
                      ? "bg-primary/20 text-primary"
                      : "bg-secondary text-muted-foreground"
                  }`}
                >
                  <UploadCloud className="h-6 w-6" />
                </div>
                <p className="text-xs font-semibold text-foreground">
                  {selectedImage ? "Choose a different image" : "Upload new cover"}
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Drop image here or click to browse
                </p>
                <span className="mt-2 text-[10px] text-muted-foreground/70 bg-secondary/60 px-2 py-0.5 rounded-full">
                  JPG, PNG, WebP up to 15MB
                </span>
              </div>

              {selectedImage && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedImage(null);
                    setPreviewUrl(pdf.coverUrl || null);
                  }}
                  className="mt-2.5 text-xs text-muted-foreground hover:text-foreground flex items-center justify-center gap-1.5 transition-colors"
                >
                  <RotateCcw className="h-3 w-3" /> Discard selected image
                </button>
              )}
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <DialogFooter className="p-4 px-6 bg-secondary/30 border-t border-border/50 flex flex-row items-center justify-between sm:justify-between">
          <div>
            {pdf.coverUrl && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRemoveCover}
                disabled={isSaving || isRemoving}
                className="h-9 text-xs text-red-600 hover:text-red-700 hover:bg-red-500/10 border-red-200 dark:border-red-900/30 rounded-xl gap-1.5"
              >
                {isRemoving ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
                Remove Cover
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClose}
              disabled={isSaving || isRemoving}
              className="h-9 text-xs rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSaveCover}
              disabled={!selectedImage || isSaving || isRemoving}
              className="h-9 text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 px-4 shadow-sm gap-1.5"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Check className="h-3.5 w-3.5" />
                  Save Cover
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
