"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import useSWR, { useSWRConfig } from "swr";
import {
  Search,
  Loader2,
  Plus,
  LayoutGrid,
  List,
  Grid3X3,
  Star,
  FileText,
  Eye,
  HardDrive,
  Folder as FolderIcon,
  FolderPlus,
  ChevronRight,
  Home as HomeIcon,
  SlidersHorizontal,
  X,
  Upload,
  BookOpen,
  TrendingUp,
} from "lucide-react";
import { PDFCard } from "@/components/pdf/PDFCard";
import { PDFListView } from "@/components/pdf/PDFListView";
import { PDFQuickPreviewModal } from "@/components/pdf/PDFQuickPreviewModal";
import { FolderCard, IFolderWithStats } from "@/components/folder/FolderCard";
import { MoveToFolderModal } from "@/components/folder/MoveToFolderModal";
import { UploadModal } from "@/components/upload/UploadModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/theme-toggle";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { IPDF } from "@/models/PDF";
import { useDebounce } from "@/lib/hooks";
import { useToast } from "@/components/ui/toast";
import { formatBytes } from "@/lib/utils";

const fetcher = async (url: string) => {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "An error occurred while fetching the data.");
  }
  return res.json();
};

type ViewMode = "grid" | "compact" | "list";
type FilterTab = "all" | "unorganized" | "starred";

const FOLDER_COLORS = [
  { name: "blue", label: "Blue", bg: "bg-blue-500" },
  { name: "emerald", label: "Emerald", bg: "bg-emerald-500" },
  { name: "amber", label: "Amber", bg: "bg-amber-500" },
  { name: "purple", label: "Purple", bg: "bg-purple-500" },
  { name: "rose", label: "Rose", bg: "bg-rose-500" },
  { name: "slate", label: "Slate", bg: "bg-zinc-500" },
];

export default function Home() {
  const { toast } = useToast();
  const { mutate: globalMutate } = useSWRConfig();

  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);
  const [sort, setSort] = useState("recent");
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  // Active folder public ID for filtering (null = all documents / root)
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);

  // Folder creation & management states
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderColor, setNewFolderColor] = useState("blue");
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);

  const [folderToRename, setFolderToRename] = useState<IFolderWithStats | null>(null);
  const [renameFolderName, setRenameFolderName] = useState("");
  const [isRenamingFolder, setIsRenamingFolder] = useState(false);

  const [folderToDelete, setFolderToDelete] = useState<IFolderWithStats | null>(null);
  const [isDeletingFolder, setIsDeletingFolder] = useState(false);

  // Move document state
  const [pdfToMove, setPdfToMove] = useState<IPDF | null>(null);

  // Starred PDFs persistence in localStorage
  const [starredIds, setStarredIds] = useState<string[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("eirumipdfs_starred");
      if (stored) {
        setStarredIds(JSON.parse(stored));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const toggleStar = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setStarredIds((prev) => {
      const isStarred = prev.includes(id);
      const next = isStarred ? prev.filter((item) => item !== id) : [...prev, id];
      try {
        localStorage.setItem("eirumipdfs_starred", JSON.stringify(next));
      } catch (err) {
        console.error(err);
      }
      toast(isStarred ? "Removed from favorites" : "Added to favorites!");
      return next;
    });
  };

  // Quick Preview modal
  const [previewPdf, setPreviewPdf] = useState<IPDF | null>(null);

  // Document Rename & Delete Dialog states
  const [pdfToRename, setPdfToRename] = useState<IPDF | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);

  const [pdfToDelete, setPdfToDelete] = useState<IPDF | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch Folders
  const { data: folderData, mutate: mutateFolders } = useSWR("/api/folders", fetcher);
  const folders: IFolderWithStats[] = folderData?.folders || [];

  // Active folder derived dynamically from fresh folders data
  const activeFolder = useMemo(() => {
    if (!activeFolderId) return null;
    return folders.find((f) => f.publicId === activeFolderId) || null;
  }, [activeFolderId, folders]);

  // Global cache purger to keep all views completely in sync
  const refreshAll = useCallback(() => {
    globalMutate(
      (key) =>
        typeof key === "string" &&
        (key.startsWith("/api/pdfs") || key.startsWith("/api/folders"))
    );
  }, [globalMutate]);

  // Fetch PDFs based on search, sort, page, activeFolderId, and activeFilter
  const queryParams = new URLSearchParams({
    search: debouncedSearch,
    sort,
    page: page.toString(),
    limit: "24",
    ...(activeFolderId
      ? { folderId: activeFolderId }
      : activeFilter === "unorganized"
      ? { folderId: "root" }
      : {}),
  });

  const { data, error, mutate, isLoading } = useSWR(`/api/pdfs?${queryParams.toString()}`, fetcher);

  // Calculate quick stats across entire library
  const stats = useMemo(() => {
    const totalDocs =
      folderData?.rootStats?.count !== undefined && folders.length > 0
        ? folderData.rootStats.count + folders.reduce((acc: number, f: IFolderWithStats) => acc + (f.count || 0), 0)
        : data?.pagination?.total || data?.pdfs?.length || 0;
    const totalViews = data?.pdfs?.reduce((acc: number, p: IPDF) => acc + (p.views || 0), 0) || 0;
    const totalBytes =
      folderData?.rootStats?.totalSize !== undefined && folders.length > 0
        ? folderData.rootStats.totalSize + folders.reduce((acc: number, f: IFolderWithStats) => acc + (f.totalSize || 0), 0)
        : data?.pdfs?.reduce((acc: number, p: IPDF) => acc + (p.fileSize || 0), 0) || 0;
    return { totalDocs, totalViews, totalBytes };
  }, [data, folderData, folders]);

  // Filter PDFs based on active filter tab (starred)
  const displayedPdfs = useMemo(() => {
    if (!data?.pdfs) return [];
    if (activeFilter === "starred") {
      return data.pdfs.filter((pdf: IPDF) => starredIds.includes(pdf.publicId));
    }
    return data.pdfs;
  }, [data?.pdfs, activeFilter, starredIds]);

  const handleCopyLink = (pdf: IPDF, e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/view/${pdf.publicId}`;
    navigator.clipboard.writeText(url);
    toast("Public link copied to clipboard!");
  };

  // Folder Actions
  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    try {
      setIsCreatingFolder(true);
      const res = await fetch("/api/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newFolderName.trim(),
          color: newFolderColor,
        }),
      });

      if (!res.ok) throw new Error("Failed to create folder");

      refreshAll();
      setNewFolderName("");
      setIsCreateFolderOpen(false);
      toast("Folder created successfully!");
    } catch (err) {
      toast("Failed to create folder", "error");
    } finally {
      setIsCreatingFolder(false);
    }
  };

  const handleRenameFolder = async () => {
    if (!folderToRename || !renameFolderName.trim()) return;
    try {
      setIsRenamingFolder(true);
      const res = await fetch(`/api/folders/${folderToRename.publicId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: renameFolderName.trim() }),
      });

      if (!res.ok) throw new Error("Failed to rename folder");

      refreshAll();
      setFolderToRename(null);
      toast("Folder renamed successfully!");
    } catch (err) {
      toast("Failed to rename folder", "error");
    } finally {
      setIsRenamingFolder(false);
    }
  };

  const handleDeleteFolder = async () => {
    if (!folderToDelete) return;
    try {
      setIsDeletingFolder(true);
      const res = await fetch(`/api/folders/${folderToDelete.publicId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete folder");

      refreshAll();
      if (activeFolderId === folderToDelete.publicId) {
        setActiveFolderId(null);
      }
      setFolderToDelete(null);
      toast("Folder deleted (files kept in library)");
    } catch (err) {
      toast("Failed to delete folder", "error");
    } finally {
      setIsDeletingFolder(false);
    }
  };

  // Document Rename & Delete
  const handleRenameSubmit = async () => {
    if (!pdfToRename || !newTitle.trim()) return;
    try {
      setIsRenaming(true);
      const res = await fetch(`/api/pdfs/${pdfToRename.publicId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle }),
      });
      if (res.ok) {
        refreshAll();
        setPdfToRename(null);
        toast("Document renamed successfully!");
      } else {
        toast("Failed to rename PDF", "error");
      }
    } catch (err) {
      toast("Error renaming PDF", "error");
    } finally {
      setIsRenaming(false);
    }
  };

  const handleDeleteSubmit = async () => {
    if (!pdfToDelete) return;
    try {
      setIsDeleting(true);
      const res = await fetch(`/api/pdfs/${pdfToDelete.publicId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        refreshAll();
        setPdfToDelete(null);
        toast("Document deleted successfully");
      } else {
        toast("Failed to delete PDF", "error");
      }
    } catch (err) {
      toast("Error deleting PDF", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground noise-overlay relative flex flex-col">
      {/* Ambient Gradient Orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div className="absolute -top-[30%] -left-[15%] w-[60%] h-[60%] rounded-full bg-gradient-to-br from-indigo-500/8 to-purple-500/5 blur-[120px]" />
        <div className="absolute -bottom-[30%] -right-[15%] w-[60%] h-[60%] rounded-full bg-gradient-to-tl from-blue-500/8 to-cyan-500/5 blur-[120px]" />
        <div className="absolute top-[40%] left-[50%] -translate-x-1/2 w-[40%] h-[30%] rounded-full bg-gradient-to-r from-violet-500/5 to-fuchsia-500/3 blur-[100px]" />
      </div>

      {/* ═══════════════ HEADER ═══════════════ */}
      <header className="sticky top-0 z-40 glass border-b border-border/60">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          {/* Logo */}
          <button
            onClick={() => { setActiveFolderId(null); setActiveFilter("all"); }}
            className="flex items-center gap-3 group"
          >
            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/25 transition-transform group-hover:scale-105">
              <BookOpen className="h-4.5 w-4.5 text-white" />
            </div>
            <div className="hidden xs:block">
              <h1 className="text-lg font-bold tracking-tight text-foreground leading-none">
                EirumiPdfs
              </h1>
              <p className="text-[10px] font-medium text-muted-foreground -mt-0.5">Document Library</p>
            </div>
          </button>

          {/* Desktop Search */}
          <div className="hidden sm:flex relative flex-1 max-w-md mx-6">
            <div className="relative w-full group">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
              <Input
                placeholder="Search documents..."
                className="pl-10 h-10 w-full rounded-xl bg-secondary/50 border-border/60 text-foreground placeholder:text-muted-foreground transition-all focus:bg-background focus:border-primary/40 focus:shadow-lg focus:shadow-primary/5"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Header Actions */}
          <div className="flex items-center gap-2">
            {/* Mobile search toggle */}
            <button
              onClick={() => setShowMobileSearch(!showMobileSearch)}
              className="sm:hidden p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors"
            >
              <Search className="h-5 w-5" />
            </button>

            <ThemeToggle />

            <Button
              onClick={() => setIsUploadOpen(true)}
              className="h-9 px-4 rounded-xl shadow-md shadow-primary/20 hidden sm:flex gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 border-0 text-white"
            >
              <Upload className="h-4 w-4" /> Upload
            </Button>
            <Button
              onClick={() => setIsUploadOpen(true)}
              size="icon"
              className="h-9 w-9 shrink-0 sm:hidden rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 border-0 text-white shadow-md shadow-primary/20"
            >
              <Plus className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Mobile search bar */}
        <AnimatePresence>
          {showMobileSearch && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="sm:hidden overflow-hidden border-t border-border/40"
            >
              <div className="px-4 py-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search documents..."
                    className="pl-9 h-10 w-full rounded-xl bg-secondary/50 border-border/60"
                    value={search}
                    autoFocus
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1);
                    }}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ═══════════════ MAIN CONTENT ═══════════════ */}
      <main className="relative z-10 mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8 flex-1 w-full">

        {/* ——— Stats Cards ——— */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            {
              label: "Documents",
              value: stats.totalDocs,
              icon: FileText,
              gradient: "from-blue-500 to-indigo-500",
              bg: "bg-blue-500/8 dark:bg-blue-500/15",
              text: "text-blue-600 dark:text-blue-400",
            },
            {
              label: "Total Views",
              value: stats.totalViews,
              icon: TrendingUp,
              gradient: "from-violet-500 to-purple-500",
              bg: "bg-violet-500/8 dark:bg-violet-500/15",
              text: "text-violet-600 dark:text-violet-400",
            },
            {
              label: "Library Size",
              value: formatBytes(stats.totalBytes),
              icon: HardDrive,
              gradient: "from-emerald-500 to-teal-500",
              bg: "bg-emerald-500/8 dark:bg-emerald-500/15",
              text: "text-emerald-600 dark:text-emerald-400",
            },
            {
              label: "Starred",
              value: starredIds.length,
              icon: Star,
              gradient: "from-amber-500 to-orange-500",
              bg: "bg-amber-500/8 dark:bg-amber-500/15",
              text: "text-amber-600 dark:text-amber-400",
              iconFill: true,
            },
          ].map((stat) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative overflow-hidden rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm p-4 group hover:border-border transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{stat.label}</p>
                  <p className="text-xl font-bold text-foreground tracking-tight">{stat.value}</p>
                </div>
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.bg} ${stat.text} transition-transform group-hover:scale-110`}>
                  <stat.icon className={`h-5 w-5 ${stat.iconFill ? "fill-current" : ""}`} />
                </div>
              </div>
              {/* Decorative gradient line at bottom */}
              <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r ${stat.gradient} opacity-0 group-hover:opacity-100 transition-opacity`} />
            </motion.div>
          ))}
        </div>

        {/* ——— Folders Section ——— */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <FolderIcon className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">Folders</h2>
              <span className="text-xs text-muted-foreground font-medium bg-secondary px-1.5 py-0.5 rounded-md">{folders.length}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCreateFolderOpen(true)}
              className="h-8 gap-1.5 text-xs rounded-xl border-border/60 hover:border-primary/40 hover:text-primary"
            >
              <FolderPlus className="h-3.5 w-3.5" />
              <span className="hidden xs:inline">New Folder</span>
            </Button>
          </div>

          {folders.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/60 bg-card/40 p-8 text-center">
              <div className="mx-auto h-12 w-12 rounded-2xl bg-secondary/80 flex items-center justify-center mb-3">
                <FolderIcon className="h-6 w-6 text-muted-foreground/60" />
              </div>
              <p className="text-sm font-semibold text-foreground">No folders yet</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
                Organize your PDFs into folders for easy access
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCreateFolderOpen(true)}
                className="mt-4 text-xs h-8 gap-1.5 rounded-xl"
              >
                <FolderPlus className="h-3.5 w-3.5" /> Create Folder
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {folders.map((f) => (
                <FolderCard
                  key={f.publicId}
                  folder={f}
                  isSelected={activeFolderId === f.publicId}
                  onSelect={(folder) => {
                    setActiveFolderId(activeFolderId === folder.publicId ? null : folder.publicId);
                    setPage(1);
                  }}
                  onRename={(folder) => {
                    setFolderToRename(folder);
                    setRenameFolderName(folder.name);
                  }}
                  onDelete={(folder) => setFolderToDelete(folder)}
                />
              ))}
            </div>
          )}
        </div>

        {/* ——— Filter Tabs & Controls ——— */}
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Breadcrumb or Filter Tabs */}
          <div className="flex items-center min-w-0">
            {activeFolder ? (
              <div className="flex items-center gap-1.5 bg-secondary/60 px-3 py-1.5 rounded-xl border border-border/50 text-xs font-medium">
                <button
                  onClick={() => setActiveFolderId(null)}
                  className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <HomeIcon className="h-3.5 w-3.5" /> Library
                </button>
                <ChevronRight className="h-3 w-3 text-muted-foreground/60" />
                <span className="font-semibold text-primary flex items-center gap-1">
                  <FolderIcon className="h-3.5 w-3.5" /> {activeFolder.name}
                </span>
                <button
                  onClick={() => setActiveFolderId(null)}
                  className="ml-1.5 p-0.5 rounded-md hover:bg-background/80 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none -mx-1 px-1">
                {[
                  { key: "all" as FilterTab, label: "All Documents", icon: null },
                  { key: "unorganized" as FilterTab, label: `Unorganized${folderData?.rootStats?.count !== undefined ? ` (${folderData.rootStats.count})` : ""}`, icon: null },
                  { key: "starred" as FilterTab, label: `Starred (${starredIds.length})`, icon: Star },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => { setActiveFilter(tab.key); setPage(1); }}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                      activeFilter === tab.key
                        ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/80"
                    }`}
                  >
                    {tab.icon && <tab.icon className={`h-3.5 w-3.5 ${activeFilter === tab.key ? "" : "fill-amber-400 text-amber-500"}`} />}
                    {tab.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Sort & View Mode */}
          <div className="flex items-center justify-between sm:justify-end gap-2">
            <div className="relative">
              <SlidersHorizontal className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <select
                className="h-9 rounded-xl border border-border/60 bg-card/80 backdrop-blur-sm pl-8 pr-3 py-1 text-xs font-medium text-foreground outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all cursor-pointer appearance-none"
                value={sort}
                onChange={(e) => { setSort(e.target.value); setPage(1); }}
              >
                <option value="recent">Recently added</option>
                <option value="name-asc">Name A-Z</option>
                <option value="name-desc">Name Z-A</option>
                <option value="views">Most viewed</option>
                <option value="oldest">Oldest</option>
              </select>
            </div>

            <div className="flex items-center bg-secondary/60 p-0.5 rounded-xl border border-border/50">
              {[
                { mode: "grid" as ViewMode, icon: LayoutGrid, label: "Grid" },
                { mode: "compact" as ViewMode, icon: Grid3X3, label: "Compact" },
                { mode: "list" as ViewMode, icon: List, label: "List" },
              ].map(({ mode, icon: Icon, label }) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`p-2 rounded-[10px] transition-all ${
                    viewMode === mode
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  title={`${label} View`}
                >
                  <Icon className="h-4 w-4" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ——— Gallery Content ——— */}
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                <div className="h-12 w-12 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
              </div>
              <p className="text-sm text-muted-foreground font-medium">Loading documents...</p>
            </div>
          </div>
        ) : error || !data || data.error ? (
          <div className="flex h-64 flex-col items-center justify-center text-red-500 bg-red-500/5 border border-red-500/20 rounded-2xl p-6">
            <p className="font-semibold text-lg mb-2">Failed to load PDFs</p>
            <p className="text-sm opacity-80 mb-4">{error?.message || "Please check your database connection."}</p>
            <Button variant="outline" onClick={() => mutate()} className="rounded-xl">Retry</Button>
          </div>
        ) : displayedPdfs.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex h-72 flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-card/40 p-6 text-center"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary/80 mb-4">
              {activeFolder ? (
                <FolderIcon className="h-8 w-8 text-primary" />
              ) : activeFilter === "starred" ? (
                <Star className="h-8 w-8 text-amber-500" />
              ) : (
                <FileText className="h-8 w-8 text-muted-foreground" />
              )}
            </div>
            <p className="text-base font-semibold text-foreground">
              {activeFolder
                ? `No documents in "${activeFolder.name}"`
                : activeFilter === "starred"
                ? "No starred documents yet"
                : activeFilter === "unorganized"
                ? "All documents are organized!"
                : search
                ? "No documents match your search"
                : "Your PDF library is empty"}
            </p>
            <p className="mt-1.5 text-xs text-muted-foreground max-w-sm">
              {activeFolder
                ? `Upload a PDF into "${activeFolder.name}" or move existing files.`
                : activeFilter === "starred"
                ? "Click the star icon on any document to pin it here."
                : activeFilter === "unorganized"
                ? "Unassigned files appear here."
                : search
                ? "Try adjusting your search terms."
                : "Upload documents to share and organize them."}
            </p>
            <Button
              className="mt-5 gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 border-0 text-white shadow-md shadow-primary/20"
              onClick={() => setIsUploadOpen(true)}
            >
              <Upload className="h-4 w-4" />
              {activeFolder ? `Upload to ${activeFolder.name}` : "Upload Document"}
            </Button>
          </motion.div>
        ) : viewMode === "list" ? (
          <PDFListView
            pdfs={displayedPdfs}
            folders={folders}
            starredIds={starredIds}
            onToggleStar={toggleStar}
            onQuickPreview={(p) => setPreviewPdf(p)}
            onMoveToFolder={(p) => setPdfToMove(p)}
            onFolderClick={(folderId) => { setActiveFolderId(folderId); setPage(1); }}
            onRename={(p) => { setPdfToRename(p); setNewTitle(p.title); }}
            onDelete={(p) => setPdfToDelete(p)}
            onCopyLink={handleCopyLink}
          />
        ) : (
          <motion.div
            className={`grid ${
              viewMode === "compact"
                ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3"
                : "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5"
            }`}
            initial="hidden"
            animate="show"
            variants={{
              hidden: { opacity: 0 },
              show: {
                opacity: 1,
                transition: { staggerChildren: 0.03 },
              },
            }}
          >
            <AnimatePresence mode="popLayout">
              {displayedPdfs.map((pdf: IPDF) => (
                <motion.div
                  key={pdf.publicId}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <PDFCard
                    pdf={pdf}
                    compact={viewMode === "compact"}
                    isStarred={starredIds.includes(pdf.publicId)}
                    folderName={folders.find((f) => f.publicId === pdf.folderId)?.name}
                    onToggleStar={toggleStar}
                    onQuickPreview={(p) => setPreviewPdf(p)}
                    onMoveToFolder={(p) => setPdfToMove(p)}
                    onFolderClick={(folderId) => { setActiveFolderId(folderId); setPage(1); }}
                    onRename={(p) => { setPdfToRename(p); setNewTitle(p.title); }}
                    onDelete={(p) => setPdfToDelete(p)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Pagination */}
        {data?.pagination?.totalPages > 1 && (
          <div className="mt-10 flex items-center justify-center gap-2">
            <Button
              variant="outline"
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-xl text-xs h-9 px-4 border-border/60"
            >
              Previous
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(data.pagination.totalPages, 5) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`h-9 w-9 rounded-xl text-xs font-semibold transition-all ${
                      page === pageNum
                        ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              {data.pagination.totalPages > 5 && (
                <span className="text-xs text-muted-foreground px-1">...</span>
              )}
            </div>
            <Button
              variant="outline"
              disabled={page === data.pagination.totalPages}
              onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
              className="rounded-xl text-xs h-9 px-4 border-border/60"
            >
              Next
            </Button>
          </div>
        )}
      </main>

      {/* ═══════════════ MODALS ═══════════════ */}

      {/* Upload Modal */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSuccess={() => { refreshAll(); }}
        folders={folders}
        defaultFolderId={activeFolderId}
      />

      {/* Move Document Modal */}
      <MoveToFolderModal
        pdf={pdfToMove}
        folders={folders}
        isOpen={!!pdfToMove}
        onClose={() => setPdfToMove(null)}
        onMoveSuccess={(targetFolderId) => {
          refreshAll();
          const folderObj = folders.find((f) => f.publicId === targetFolderId);
          toast(
            folderObj
              ? `Document moved to "${folderObj.name}"!`
              : "Document moved to root!"
          );
        }}
      />

      {/* Quick Preview Modal */}
      <PDFQuickPreviewModal
        pdf={previewPdf}
        isOpen={!!previewPdf}
        onClose={() => setPreviewPdf(null)}
      />

      {/* Create Folder Dialog */}
      <Dialog open={isCreateFolderOpen} onOpenChange={(open) => !open && setIsCreateFolderOpen(false)}>
        <DialogContent className="sm:max-w-md bg-card text-card-foreground border-border/60 shadow-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <FolderPlus className="h-5 w-5 text-primary" />
              Create New Folder
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Folder Name</label>
              <Input
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="E.g. Invoices, Research, Contracts"
                autoFocus
                className="h-11 rounded-xl bg-secondary/30 border-border/60 focus:border-primary/40"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Color</label>
              <div className="flex items-center gap-2.5 pt-1">
                {FOLDER_COLORS.map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => setNewFolderColor(c.name)}
                    className={`h-8 w-8 rounded-full ${c.bg} transition-all ${
                      newFolderColor === c.name
                        ? "ring-2 ring-primary ring-offset-2 ring-offset-background scale-110 shadow-lg"
                        : "opacity-60 hover:opacity-100 hover:scale-105"
                    }`}
                    title={c.label}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateFolderOpen(false)} disabled={isCreatingFolder} className="rounded-xl">
              Cancel
            </Button>
            <Button onClick={handleCreateFolder} disabled={isCreatingFolder || !newFolderName.trim()} className="rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 border-0 text-white">
              {isCreatingFolder && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Folder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Folder Dialog */}
      <Dialog open={!!folderToRename} onOpenChange={(open) => !open && setFolderToRename(null)}>
        <DialogContent className="sm:max-w-md bg-card text-card-foreground border-border/60 shadow-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-foreground">Rename Folder</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Folder Name</label>
            <Input
              value={renameFolderName}
              onChange={(e) => setRenameFolderName(e.target.value)}
              placeholder="Enter folder name"
              autoFocus
              className="h-11 rounded-xl bg-secondary/30 border-border/60"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFolderToRename(null)} disabled={isRenamingFolder} className="rounded-xl">
              Cancel
            </Button>
            <Button onClick={handleRenameFolder} disabled={isRenamingFolder || !renameFolderName.trim()} className="rounded-xl">
              {isRenamingFolder && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Folder Dialog */}
      <Dialog open={!!folderToDelete} onOpenChange={(open) => !open && setFolderToDelete(null)}>
        <DialogContent className="sm:max-w-md bg-card text-card-foreground border-border/60 shadow-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-red-600 dark:text-red-400">Delete Folder?</DialogTitle>
          </DialogHeader>
          <div className="py-3">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete <strong className="text-foreground font-semibold">{folderToDelete?.name}</strong>?
            </p>
            <p className="text-xs text-muted-foreground mt-3 bg-secondary/60 p-3 rounded-xl border border-border/50">
              💡 <strong>Don&apos;t worry:</strong> Documents inside this folder will NOT be deleted. They will remain safely in your library.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFolderToDelete(null)} disabled={isDeletingFolder} className="rounded-xl">
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteFolder} disabled={isDeletingFolder} className="rounded-xl">
              {isDeletingFolder && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete Folder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Document Dialog */}
      <Dialog open={!!pdfToRename} onOpenChange={(open) => !open && setPdfToRename(null)}>
        <DialogContent className="bg-card text-card-foreground border-border/60 shadow-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-foreground">Rename Document</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Document Title</label>
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Enter new title"
              autoFocus
              className="h-11 rounded-xl bg-secondary/30 border-border/60"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPdfToRename(null)} disabled={isRenaming} className="rounded-xl">
              Cancel
            </Button>
            <Button onClick={handleRenameSubmit} disabled={isRenaming || !newTitle.trim()} className="rounded-xl">
              {isRenaming && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Document Dialog */}
      <Dialog open={!!pdfToDelete} onOpenChange={(open) => !open && setPdfToDelete(null)}>
        <DialogContent className="sm:max-w-md bg-card text-card-foreground border-border/60 shadow-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-red-600 dark:text-red-400">Delete Document?</DialogTitle>
          </DialogHeader>
          <div className="py-3">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to permanently delete{" "}
              <strong className="text-foreground font-semibold">{pdfToDelete?.title}</strong>? This action cannot be undone.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPdfToDelete(null)} disabled={isDeleting} className="rounded-xl">
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteSubmit} disabled={isDeleting} className="rounded-xl">
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Yes, Delete PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
