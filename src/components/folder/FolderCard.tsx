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

const DRIVE_FOLDER_COLORS: Record<string, { iconColor: string; bgTint: string }> = {
  blue: { iconColor: "text-blue-500 fill-blue-500/20", bgTint: "hover:bg-blue-500/5" },
  emerald: { iconColor: "text-emerald-500 fill-emerald-500/20", bgTint: "hover:bg-emerald-500/5" },
  amber: { iconColor: "text-amber-500 fill-amber-500/20", bgTint: "hover:bg-amber-500/5" },
  purple: { iconColor: "text-purple-500 fill-purple-500/20", bgTint: "hover:bg-purple-500/5" },
  rose: { iconColor: "text-rose-500 fill-rose-500/20", bgTint: "hover:bg-rose-500/5" },
  slate: { iconColor: "text-zinc-500 fill-zinc-500/20", bgTint: "hover:bg-zinc-500/5" },
};

export function FolderCard({
  folder,
  isSelected = false,
  onSelect,
  onRename,
  onDelete,
}: FolderCardProps) {
  const colorConf = DRIVE_FOLDER_COLORS[folder.color || "blue"] || DRIVE_FOLDER_COLORS.blue;

  return (
    <div
      onClick={() => onSelect(folder)}
      className={`group relative flex items-center justify-between rounded-xl px-3.5 py-3 cursor-pointer select-none transition-all border ${
        isSelected
          ? "bg-[#c2e7ff] text-[#001d35] border-transparent font-medium shadow-sm dark:bg-[#004a77] dark:text-[#c2e7ff]"
          : "bg-secondary/40 hover:bg-secondary/80 border-border/40 text-foreground"
      }`}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <FolderIcon
          className={`h-5 w-5 shrink-0 transition-transform group-hover:scale-105 ${
            isSelected ? "text-current fill-current/30" : colorConf.iconColor
          }`}
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-medium leading-none" title={folder.name}>
            {folder.name}
          </p>
          <p className={`text-[11px] mt-1 ${isSelected ? "opacity-80" : "text-muted-foreground"}`}>
            {folder.count} {folder.count === 1 ? "file" : "files"}
            {folder.totalSize > 0 && ` • ${formatBytes(folder.totalSize)}`}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={`h-7 w-7 rounded-full transition-opacity ${
                isSelected
                  ? "hover:bg-black/10 dark:hover:bg-white/10 opacity-80"
                  : "text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 hover:bg-secondary"
              }`}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44 rounded-2xl border-border bg-card shadow-xl p-1.5">
            <DropdownMenuItem onClick={() => onSelect(folder)} className="rounded-xl cursor-pointer">
              <FileText className="mr-2.5 h-4 w-4 text-muted-foreground" />
              Open Folder
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onRename(folder)} className="rounded-xl cursor-pointer">
              <Edit2 className="mr-2.5 h-4 w-4 text-muted-foreground" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuSeparator className="my-1 bg-border/60" />
            <DropdownMenuItem
              onClick={() => onDelete(folder)}
              className="text-red-600 focus:bg-red-500/10 focus:text-red-600 rounded-xl cursor-pointer"
            >
              <Trash2 className="mr-2.5 h-4 w-4" />
              Delete Folder
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
