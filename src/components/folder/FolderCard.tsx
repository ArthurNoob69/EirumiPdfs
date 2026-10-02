"use client";

import React from "react";
import { Folder as FolderIcon, MoreVertical, Edit2, Trash2, FileText, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatBytes } from "@/lib/utils";

export interface IFolderWithStats {
  publicId: string;
  name: string;
  color?: string;
  count: number;
  totalSize: number;
  createdAt: string;
}

interface FolderCardProps {
  folder: IFolderWithStats;
  isSelected?: boolean;
  onSelect: (folder: IFolderWithStats) => void;
  onRename: (folder: IFolderWithStats) => void;
  onDelete: (folder: IFolderWithStats) => void;
}

const COLOR_MAP: Record<string, { bg: string; icon: string; border: string; activeBg: string }> = {
  blue: { bg: "bg-blue-500/8 dark:bg-blue-500/15", icon: "text-blue-600 dark:text-blue-400", border: "hover:border-blue-400/40", activeBg: "bg-blue-500/10" },
  emerald: { bg: "bg-emerald-500/8 dark:bg-emerald-500/15", icon: "text-emerald-600 dark:text-emerald-400", border: "hover:border-emerald-400/40", activeBg: "bg-emerald-500/10" },
  amber: { bg: "bg-amber-500/8 dark:bg-amber-500/15", icon: "text-amber-600 dark:text-amber-400", border: "hover:border-amber-400/40", activeBg: "bg-amber-500/10" },
  purple: { bg: "bg-purple-500/8 dark:bg-purple-500/15", icon: "text-purple-600 dark:text-purple-400", border: "hover:border-purple-400/40", activeBg: "bg-purple-500/10" },
  rose: { bg: "bg-rose-500/8 dark:bg-rose-500/15", icon: "text-rose-600 dark:text-rose-400", border: "hover:border-rose-400/40", activeBg: "bg-rose-500/10" },
  slate: { bg: "bg-zinc-500/8 dark:bg-zinc-500/15", icon: "text-zinc-600 dark:text-zinc-400", border: "hover:border-zinc-400/40", activeBg: "bg-zinc-500/10" },
};

export function FolderCard({
  folder,
  isSelected = false,
  onSelect,
  onRename,
  onDelete,
}: FolderCardProps) {
  const colorStyle = COLOR_MAP[folder.color || "blue"] || COLOR_MAP.blue;

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      onClick={() => onSelect(folder)}
      className={`group relative flex cursor-pointer items-center justify-between rounded-xl border p-3 transition-all ${
        isSelected
          ? `border-primary/50 ${colorStyle.activeBg} ring-1 ring-primary/20 shadow-md shadow-primary/5`
          : `border-border/50 bg-card/80 backdrop-blur-sm hover:bg-accent/30 ${colorStyle.border} hover:shadow-md`
      }`}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${colorStyle.bg} ${colorStyle.icon} shrink-0 transition-transform duration-300 group-hover:scale-105`}>
          <FolderIcon className="h-5 w-5 fill-current/20" />
        </div>

        <div className="min-w-0 flex-1">
          <h4 className="truncate text-sm font-semibold text-foreground leading-tight" title={folder.name}>
            {folder.name}
          </h4>
          <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1.5">
            <span>{folder.count} {folder.count === 1 ? "file" : "files"}</span>
            {folder.totalSize > 0 && (
              <>
                <span className="opacity-40">•</span>
                <span>{formatBytes(folder.totalSize)}</span>
              </>
            )}
          </p>
        </div>
      </div>

      {/* Actions & Chevron */}
      <div className="flex items-center gap-1 shrink-0">
        <div onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-all"
              >
                <MoreVertical className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44 rounded-xl border-border/60 bg-card/95 backdrop-blur-xl shadow-xl">
              <DropdownMenuItem onClick={() => onSelect(folder)} className="rounded-lg">
                <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
                Open Folder
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onRename(folder)} className="rounded-lg">
                <Edit2 className="mr-2 h-4 w-4 text-muted-foreground" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-border/50" />
              <DropdownMenuItem
                onClick={() => onDelete(folder)}
                className="text-red-600 focus:bg-red-500/10 focus:text-red-600 rounded-lg"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <ChevronRight className={`h-4 w-4 transition-all ${
          isSelected ? "text-primary" : "text-muted-foreground/40 group-hover:text-muted-foreground"
        }`} />
      </div>
    </motion.div>
  );
}
