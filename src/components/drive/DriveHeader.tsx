"use client";

import React, { useState } from "react";
import {
  Menu,
  Search,
  X,
  SlidersHorizontal,
  HelpCircle,
  Grid,
  Upload,
  FolderPlus,
  Star,
  Check,
  CheckCircle2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { EirumiViewLogo } from "@/components/brand/EirumiViewLogo";

interface DriveHeaderProps {
  search: string;
  onSearchChange: (val: string) => void;
  onToggleSidebar: () => void;
  onOpenUpload: () => void;
  onOpenCreateFolder: () => void;
}

export function DriveHeader({
  search,
  onSearchChange,
  onToggleSidebar,
  onOpenUpload,
  onOpenCreateFolder,
}: DriveHeaderProps) {
  const [showFilterPopover, setShowFilterPopover] = useState(false);
  const [showHelpDialog, setShowHelpDialog] = useState(false);

  return (
    <>
      <header className="h-16 px-3 sm:px-4 flex items-center justify-between border-b border-border/50 bg-background z-30 shrink-0 select-none">
        {/* Left: Hamburger + EirumiView Logo */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-[200px]">
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            title="Main menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="cursor-pointer">
            <EirumiViewLogo size="md" />
          </div>
        </div>

        {/* Center: Google Drive Signature Search Pill */}
        <div className="flex-1 max-w-2xl px-2 sm:px-6">
          <div className="relative group w-full">
            <div className="flex items-center h-11 w-full rounded-full bg-secondary/70 hover:bg-secondary focus-within:bg-card focus-within:shadow-md border border-transparent focus-within:border-border/60 transition-all px-4 gap-3">
              <Search className="h-4.5 w-4.5 text-muted-foreground shrink-0 group-focus-within:text-primary transition-colors" />
              <input
                type="text"
                placeholder="Search in EirumiView"
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full bg-transparent border-0 outline-none text-[13px] text-foreground placeholder:text-muted-foreground/80 font-normal"
              />
              {search && (
                <button
                  onClick={() => onSearchChange("")}
                  className="p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
                  title="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right: Quick actions, Theme, Apps Grid, Profile Avatar */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <button
            onClick={() => setShowHelpDialog(true)}
            className="hidden sm:flex h-9 w-9 rounded-full items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            title="Help & Shortcuts"
          >
            <HelpCircle className="h-5 w-5" />
          </button>

          <ThemeToggle />

          {/* Quick Menu 9-dots Grid */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="h-9 w-9 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                title="Quick Tools"
              >
                <Grid className="h-5 w-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-2xl border-border bg-card shadow-2xl p-2">
              <div className="p-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                EirumiView Tools
              </div>
              <DropdownMenuItem onClick={onOpenUpload} className="rounded-xl py-2 cursor-pointer text-xs font-medium">
                <Upload className="mr-2.5 h-4 w-4 text-primary" />
                Upload PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onOpenCreateFolder} className="rounded-xl py-2 cursor-pointer text-xs font-medium">
                <FolderPlus className="mr-2.5 h-4 w-4 text-primary" />
                New Folder
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Profile Avatar */}
          <div className="ml-1 flex items-center justify-center">
            <div
              className="h-8 w-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 text-white font-semibold text-xs flex items-center justify-center shadow-sm cursor-pointer hover:ring-2 hover:ring-primary/40 transition-all"
              title="ArthurNoob69 (Current User)"
            >
              E
            </div>
          </div>
        </div>
      </header>

      {/* Help Dialog */}
      <Dialog open={showHelpDialog} onOpenChange={setShowHelpDialog}>
        <DialogContent className="sm:max-w-md bg-card text-card-foreground border-border rounded-2xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-primary" />
              EirumiView Shortcuts & Help
            </DialogTitle>
          </DialogHeader>
          <div className="py-3 space-y-3 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-secondary/50">
              <span className="font-medium text-foreground">Double Click Card / Row</span>
              <span className="text-muted-foreground">Opens PDF in Full Viewer</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-secondary/50">
              <span className="font-medium text-foreground">Single Click</span>
              <span className="text-muted-foreground">Selects item & opens Details Pane</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-secondary/50">
              <span className="font-medium text-foreground">Click Info (ℹ️) button</span>
              <span className="text-muted-foreground">Toggles file details inspector</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-secondary/50">
              <span className="font-medium text-foreground">Right click or 3 dots ⋮</span>
              <span className="text-muted-foreground">Move, Download, Share, Rename</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
