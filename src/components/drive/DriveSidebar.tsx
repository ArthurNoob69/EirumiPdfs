"use client";

import React, { useState } from "react";
import {
  Home,
  HardDrive,
  Folder as FolderIcon,
  Star,
  Clock,
  Trash2,
  Plus,
  Cloud,
  ChevronDown,
  ChevronRight,
  FolderPlus,
  Upload,
  Layers,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { IFolderWithStats } from "@/components/folder/FolderCard";
import { formatBytes } from "@/lib/utils";

interface DriveSidebarProps {
  currentTab: "all" | "unorganized" | "starred" | "recent";
  onTabChange: (tab: "all" | "unorganized" | "starred" | "recent") => void;
  activeFolderId: string | null;
  onSelectFolder: (folderId: string | null) => void;
  folders: IFolderWithStats[];
  totalBytes: number;
  starredCount: number;
  onOpenUpload: () => void;
  onOpenCreateFolder: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export function DriveSidebar({
  currentTab,
  onTabChange,
  activeFolderId,
  onSelectFolder,
  folders,
  totalBytes,
  starredCount,
  onOpenUpload,
  onOpenCreateFolder,
  isMobileOpen = false,
  onCloseMobile,
}: DriveSidebarProps) {
  const [isMyDriveExpanded, setIsMyDriveExpanded] = useState(true);

  // Google Drive standard 15GB display
  const maxStorageBytes = 15 * 1024 * 1024 * 1024;
  const storagePercent = Math.min(100, Math.max(1, Math.round((totalBytes / maxStorageBytes) * 100)));

  const handleNavClick = (callback: () => void) => {
    callback();
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 w-64 shrink-0 flex flex-col bg-background transition-transform duration-300 lg:translate-x-0 ${
          isMobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        }`}
      >
        {/* Top + New Button (Google Drive signature Floating Pill) */}
        <div className="p-4 pt-5">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-3.5 px-5 py-3.5 rounded-2xl bg-card border border-border/80 shadow-md hover:shadow-lg transition-all active:scale-[0.98] group text-foreground font-medium text-sm">
                {/* Google-colored Plus Icon */}
                <div className="relative h-6 w-6 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="h-6 w-6">
                    <path fill="#EA4335" d="M12 2v10h10V2z" opacity="0.9" />
                    <path fill="#4285F4" d="M2 12h10V2H2z" />
                    <path fill="#FBBC05" d="M2 22h10V12H2z" />
                    <path fill="#34A853" d="M12 22h10V12H12z" />
                  </svg>
                </div>
                <span className="text-[14px] font-semibold tracking-tight text-foreground">New</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56 rounded-2xl border-border bg-card shadow-2xl p-1.5">
              <DropdownMenuItem
                onClick={onOpenCreateFolder}
                className="rounded-xl py-2.5 px-3 cursor-pointer text-xs font-medium"
              >
                <FolderPlus className="mr-3 h-4 w-4 text-muted-foreground" />
                New folder
              </DropdownMenuItem>
              <DropdownMenuSeparator className="my-1 bg-border/60" />
              <DropdownMenuItem
                onClick={onOpenUpload}
                className="rounded-xl py-2.5 px-3 cursor-pointer text-xs font-medium"
              >
                <Upload className="mr-3 h-4 w-4 text-muted-foreground" />
                File upload (PDF)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          {/* Home */}
          <button
            onClick={() => handleNavClick(() => { onSelectFolder(null); onTabChange("all"); })}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-full text-[13px] font-medium transition-all ${
              activeFolderId === null && currentTab === "all"
                ? "bg-[#c2e7ff] text-[#001d35] font-semibold dark:bg-[#004a77] dark:text-[#c2e7ff]"
                : "text-foreground hover:bg-secondary/70"
            }`}
          >
            <Home className="h-4.5 w-4.5 shrink-0" />
            <span>Home</span>
          </button>

          {/* My Drive (With Expandable Folders) */}
          <div>
            <div
              className={`w-full flex items-center justify-between px-4 py-2.5 rounded-full text-[13px] font-medium transition-all cursor-pointer ${
                activeFolderId === null && currentTab === "all"
                  ? ""
                  : ""
              }`}
            >
              <button
                onClick={() => handleNavClick(() => { onSelectFolder(null); onTabChange("all"); })}
                className="flex items-center gap-3 flex-1 text-left"
              >
                <HardDrive className="h-4.5 w-4.5 shrink-0 text-foreground" />
                <span className="text-foreground">My Drive</span>
              </button>
              {folders.length > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMyDriveExpanded(!isMyDriveExpanded);
                  }}
                  className="p-1 rounded-full hover:bg-secondary text-muted-foreground"
                >
                  {isMyDriveExpanded ? (
                    <ChevronDown className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5" />
                  )}
                </button>
              )}
            </div>

            {/* Folder Sub-list in My Drive */}
            {isMyDriveExpanded && folders.length > 0 && (
              <div className="pl-6 pr-1 py-1 space-y-0.5">
                {folders.map((folder) => {
                  const isSelected = activeFolderId === folder.publicId;
                  return (
                    <button
                      key={folder.publicId}
                      onClick={() => handleNavClick(() => onSelectFolder(folder.publicId))}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-full text-xs font-medium transition-all ${
                        isSelected
                          ? "bg-[#c2e7ff] text-[#001d35] font-semibold dark:bg-[#004a77] dark:text-[#c2e7ff]"
                          : "text-foreground/80 hover:bg-secondary/70"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <FolderIcon className={`h-4 w-4 shrink-0 ${isSelected ? "fill-current/30" : "text-primary fill-primary/10"}`} />
                        <span className="truncate">{folder.name}</span>
                      </div>
                      <span className="text-[10px] opacity-70 ml-1">{folder.count}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Starred */}
          <button
            onClick={() => handleNavClick(() => { onSelectFolder(null); onTabChange("starred"); })}
            className={`w-full flex items-center justify-between px-4 py-2.5 rounded-full text-[13px] font-medium transition-all ${
              currentTab === "starred" && activeFolderId === null
                ? "bg-[#c2e7ff] text-[#001d35] font-semibold dark:bg-[#004a77] dark:text-[#c2e7ff]"
                : "text-foreground hover:bg-secondary/70"
            }`}
          >
            <div className="flex items-center gap-3">
              <Star className="h-4.5 w-4.5 shrink-0 fill-amber-400 text-amber-500" />
              <span>Starred</span>
            </div>
            {starredCount > 0 && (
              <span className="text-xs opacity-75 font-semibold">{starredCount}</span>
            )}
          </button>

          {/* Recent */}
          <button
            onClick={() => handleNavClick(() => { onSelectFolder(null); onTabChange("recent"); })}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-full text-[13px] font-medium transition-all ${
              currentTab === "recent" && activeFolderId === null
                ? "bg-[#c2e7ff] text-[#001d35] font-semibold dark:bg-[#004a77] dark:text-[#c2e7ff]"
                : "text-foreground hover:bg-secondary/70"
            }`}
          >
            <Clock className="h-4.5 w-4.5 shrink-0" />
            <span>Recent</span>
          </button>

          {/* Unorganized (Root docs) */}
          <button
            onClick={() => handleNavClick(() => { onSelectFolder(null); onTabChange("unorganized"); })}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-full text-[13px] font-medium transition-all ${
              currentTab === "unorganized" && activeFolderId === null
                ? "bg-[#c2e7ff] text-[#001d35] font-semibold dark:bg-[#004a77] dark:text-[#c2e7ff]"
                : "text-foreground hover:bg-secondary/70"
            }`}
          >
            <Layers className="h-4.5 w-4.5 shrink-0" />
            <span>Unorganized</span>
          </button>
        </nav>

        {/* Bottom Storage Meter (Google Drive 15GB Cloud display) */}
        <div className="p-4 border-t border-border/40 space-y-3">
          <div className="flex items-center gap-2 text-xs font-medium text-foreground">
            <Cloud className="h-4 w-4 text-muted-foreground" />
            <span>Storage</span>
          </div>

          {/* Progress bar */}
          <div className="h-1 w-full bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${storagePercent}%` }}
            />
          </div>

          <p className="text-[11px] text-muted-foreground">
            {formatBytes(totalBytes)} of 15 GB used
          </p>

          <Button
            variant="outline"
            size="sm"
            onClick={onOpenUpload}
            className="w-full h-8 rounded-xl text-xs font-medium text-primary border-primary/30 hover:bg-primary/5"
          >
            Upload More Files
          </Button>
        </div>
      </aside>
    </>
  );
}
