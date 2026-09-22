"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Folder as FolderIcon, Home, Check, Loader2 } from "lucide-react";
import { IPDF } from "@/models/PDF";
import { IFolderWithStats } from "./FolderCard";

interface MoveToFolderModalProps {
  pdf: IPDF | null;
  folders: IFolderWithStats[];
  isOpen: boolean;
  onClose: () => void;
  onMoveSuccess: (targetFolderId: string | null) => void;
}

export function MoveToFolderModal({
  pdf,
  folders,
  isOpen,
  onClose,
  onMoveSuccess,
}: MoveToFolderModalProps) {
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(
    pdf?.folderId || null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync selectedFolderId whenever pdf changes
  React.useEffect(() => {
    if (pdf) {
      setSelectedFolderId(pdf.folderId || null);
    }
  }, [pdf]);

  if (!pdf) return null;

  const handleMove = async (targetId?: string | null) => {
    const destination = targetId !== undefined ? targetId : selectedFolderId;
    try {
      setIsSubmitting(true);
      const res = await fetch(`/api/pdfs/${pdf.publicId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folderId: destination }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to move document");
      }

      onMoveSuccess(destination);
      onClose();
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Error moving document to folder");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-card text-card-foreground border-border shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-foreground">Move Document</DialogTitle>
          <p className="text-xs text-muted-foreground line-clamp-1">
            Choose a folder for <strong className="text-foreground font-semibold">{pdf.title}</strong>
          </p>
        </DialogHeader>

        <div className="py-3 space-y-2 max-h-[50vh] overflow-y-auto pr-1">
          {/* Root / Unorganized Option */}
          <div
            onClick={() => setSelectedFolderId(null)}
            className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
              selectedFolderId === null
                ? "border-primary bg-primary/10 text-primary font-medium ring-1 ring-primary/30"
                : "border-border/60 hover:bg-accent/50 text-foreground"
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-foreground shrink-0">
                <Home className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold">Root (No Folder)</p>
                <p className="text-[11px] text-muted-foreground">General unorganized library</p>
              </div>
            </div>
            {selectedFolderId === null && <Check className="h-4 w-4 text-primary shrink-0" />}
          </div>

          {/* Folder List */}
          {folders.length === 0 ? (
            <div className="p-4 text-center text-xs text-muted-foreground border border-dashed border-border rounded-xl">
              No folders created yet.
            </div>
          ) : (
            folders.map((f) => {
              const isSelected = selectedFolderId === f.publicId;
              return (
                <div
                  key={f.publicId}
                  onClick={() => setSelectedFolderId(f.publicId)}
                  className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? "border-primary bg-primary/10 text-primary font-medium ring-1 ring-primary/30"
                      : "border-border/60 hover:bg-accent/50 text-foreground"
                  }`}
                >
                  <div className="flex items-center space-x-3 min-w-0 pr-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
                      <FolderIcon className="h-4 w-4 fill-current/30" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{f.name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {f.count} {f.count === 1 ? "file" : "files"}
                      </p>
                    </div>
                  </div>
                  {isSelected && <Check className="h-4 w-4 text-primary shrink-0" />}
                </div>
              );
            })
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={() => handleMove()} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Move Document
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
