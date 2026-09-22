"use client";

import React from "react";
import { Folder as FolderIcon, MoreVertical, Edit2, Trash2, FileText } from "lucide-react";
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

const COLOR_MAP: Record<string, { bg: string; text: string; border: string }> = {
  blue: { bg: "bg-blue-500/10 dark:bg-blue-500/20", text: "text-blue-600 dark:text-blue-400", border: "hover:border-blue-500/40" },
  emerald: { bg: "bg-emerald-500/10 dark:bg-emerald-500/20", text: "text-emerald-600 dark:text-emerald-400", border: "hover:border-emerald-500/40" },
  amber: { bg: "bg-amber-500/10 dark:bg-amber-500/20", text: "text-amber-600 dark:text-amber-400", border: "hover:border-amber-500/40" },
  purple: { bg: "bg-purple-500/10 dark:bg-purple-500/20", text: "text-purple-600 dark:text-purple-400", border: "hover:border-purple-500/40" },
  rose: { bg: "bg-rose-500/10 dark:bg-rose-500/20", text: "text-rose-600 dark:text-rose-400", border: "hover:border-rose-500/40" },
  slate: { bg: "bg-zinc-500/10 dark:bg-zinc-500/20", text: "text-zinc-600 dark:text-zinc-400", border: "hover:border-zinc-500/40" },
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
      whileHover={{ y: -3, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      onClick={() => onSelect(folder)}
      className={`group relative flex cursor-pointer items-center justify-between rounded-2xl border p-3.5 transition-all shadow-xs ${
        isSelected
          ? "border-primary bg-primary/5 ring-2 ring-primary/20"
          : `border-border bg-card hover:bg-accent/40 ${colorStyle.border}`
      }`}
    >
      <div className="flex items-center space-x-3 min-w-0 pr-2">
        {/* Folder Icon with Custom Color */}
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${colorStyle.bg} ${colorStyle.text} shrink-0 transition-transform duration-300 group-hover:scale-105`}>
          <FolderIcon className="h-5 w-5 fill-current/30" />
        </div>

        <div className="min-w-0 flex-1">
          <h4 className="truncate text-sm font-semibold text-foreground" title={folder.name}>
            {folder.name}
          </h4>
          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
            <span>{folder.count} {folder.count === 1 ? "file" : "files"}</span>
            {folder.totalSize > 0 && (
              <>
                <span>•</span>
                <span>{formatBytes(folder.totalSize)}</span>
              </>
            )}
          </p>
        </div>
      </div>

      {/* Action Menu */}
      <div onClick={(e) => e.stopPropagation()}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onClick={() => onSelect(folder)}>
              <FileText className="mr-2 h-4 w-4" />
              Open Folder
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onRename(folder)}>
              <Edit2 className="mr-2 h-4 w-4" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDelete(folder)}
              className="text-red-600 focus:bg-red-500/10 focus:text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.div>
  );
}
