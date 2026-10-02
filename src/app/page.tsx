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
  ChevronDown,
  Info,
  SlidersHorizontal,
  X,
  Upload,
  Clock,
  Sparkles,
  ArrowUpDown,
  MoreVertical,
  Check,
} from "lucide-react";
import { PDFCard } from "@/components/pdf/PDFCard";
import { PDFListView } from "@/components/pdf/PDFListView";
import { PDFQuickPreviewModal } from "@/components/pdf/PDFQuickPreviewModal";
import { FolderCard, IFolderWithStats } from "@/components/folder/FolderCard";
import { MoveToFolderModal } from "@/components/folder/MoveToFolderModal";
import { UploadModal } from "@/components/upload/UploadModal";
import { DriveHeader } from "@/components/drive/DriveHeader";
import { DriveSidebar } from "@/components/drive/DriveSidebar";
import { DriveDetailsPanel } from "@/components/drive/DriveDetailsPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
type TabType = "all" | "unorganized" | "starred" | "recent";

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

  // Navigation and view states
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [isSidebarMobileOpen, setIsSidebarMobileOpen] = useState(false);
  const [isDetailsPanelOpen, setIsDetailsPanelOpen] = useState(false);

  // Search & Pagination
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [sort, setSort] = useState("recent");
  const [page, setPage] = useState(1);

  // Selection states (like Google Drive)
  const [selectedPdf, setSelectedPdf] = useState<IPDF | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<IFolderWithStats | null>(null);

  // Modals
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [previewPdf, setPreviewPdf] = useState<IPDF | null>(null);
  const [pdfToMove, setPdfToMove] = useState<IPDF | null>(null);

  // Folder Dialogs
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderColor, setNewFolderColor] = useState("blue");
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);

  const [folderToRename, setFolderToRename] = useState<IFolderWithStats | null>(null);
  const [renameFolderName, setRenameFolderName] = useState("");
  const [isRenamingFolder, setIsRenamingFolder] = useState(false);

  const [folderToDelete, setFolderToDelete] = useState<IFolderWithStats | null>(null);
  const [isDeletingFolder, setIsDeletingFolder] = useState(false);

  // PDF Dialogs
  const [pdfToRename, setPdfToRename] = useState<IPDF | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);

  const [pdfToDelete, setPdfToDelete] = useState<IPDF | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Starred persistence
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
      toast(isStarred ? "Removed from starred" : "Added to starred!");
      return next;
    });
  };

  // Fetch Folders
  const { data: folderData, mutate: mutateFolders } = useSWR("/api/folders", fetcher);
  const folders: IFolderWithStats[] = folderData?.folders || [];

  const activeFolder = useMemo(() => {
    if (!activeFolderId) return null;
    return folders.find((f) => f.publicId === activeFolderId) || null;
  }, [activeFolderId, folders]);

  const refreshAll = useCallback(() => {
    globalMutate(
      (key) =>
        typeof key === "string" &&
        (key.startsWith("/api/pdfs") || key.startsWith("/api/folders"))
    );
  }, [globalMutate]);

  // Query Params
  const queryParams = new URLSearchParams({
    search: debouncedSearch,
    sort,
    page: page.toString(),
    limit: "30",
    ...(activeFolderId
      ? { folderId: activeFolderId }
      : activeTab === "unorganized"
      ? { folderId: "root" }
      : {}),
  });

  const { data, error, mutate, isLoading } = useSWR(`/api/pdfs?${queryParams.toString()}`, fetcher);

  // Total Bytes and Stats
  const totalBytes = useMemo(() => {
    if (folderData?.rootStats?.totalSize !== undefined && folders.length > 0) {
      return folderData.rootStats.totalSize + folders.reduce((acc: number, f: IFolderWithStats) => acc + (f.totalSize || 0), 0);
    }
    return data?.pdfs?.reduce((acc: number, p: IPDF) => acc + (p.fileSize || 0), 0) || 0;
  }, [data, folderData, folders]);

  // Filtered PDFs
  const displayedPdfs = useMemo(() => {
    if (!data?.pdfs) return [];
    if (activeTab === "starred") {
      return data.pdfs.filter((pdf: IPDF) => starredIds.includes(pdf.publicId));
    }
    return data.pdfs;
  }, [data?.pdfs, activeTab, starredIds]);

  // Google Drive Suggested files (top 4 recent files)
  const suggestedPdfs = useMemo(() => {
    if (!data?.pdfs || activeFolderId || activeTab !== "all" || search) return [];
    return data.pdfs.slice(0, 4);
  }, [data?.pdfs, activeFolderId, activeTab, search]);

  const handleCopyLink = (pdf: IPDF, e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/view/${pdf.publicId}`;
    navigator.clipboard.writeText(url);
    toast("Public link copied to clipboard!");
  };

  // Selection handler
  const handleSelectPdf = (pdf: IPDF) => {
    setSelectedPdf(pdf);
    setSelectedFolder(null);
    setIsDetailsPanelOpen(true);
  };

  const handleSelectFolderCard = (folder: IFolderWithStats) => {
    setSelectedFolder(folder);
    setSelectedPdf(null);
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
        if (selectedPdf?.publicId === pdfToDelete.publicId) {
          setSelectedPdf(null);
        }
        setPdfToDelete(null);
        toast("Document moved to trash");
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
    <div className="flex flex-col h-screen w-full overflow-hidden bg-background text-foreground font-sans">
      {/* ═══════════════ GOOGLE DRIVE TOP BAR ═══════════════ */}
      <DriveHeader
        search={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        onToggleSidebar={() => setIsSidebarMobileOpen(!isSidebarMobileOpen)}
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenCreateFolder={() => setIsCreateFolderOpen(true)}
      />

      {/* ═══════════════ BODY AREA (Sidebar + Drive Canvas) ═══════════════ */}
      <div className="flex flex-1 min-h-0 overflow-hidden relative">
        {/* Left Navigation Sidebar */}
        <DriveSidebar
          currentTab={activeTab}
          onTabChange={(tab) => {
            setActiveTab(tab);
            setActiveFolderId(null);
            setPage(1);
          }}
          activeFolderId={activeFolderId}
          onSelectFolder={(folderId) => {
            setActiveFolderId(folderId);
            setPage(1);
          }}
          folders={folders}
          totalBytes={totalBytes}
          starredCount={starredIds.length}
          onOpenUpload={() => setIsUploadOpen(true)}
          onOpenCreateFolder={() => setIsCreateFolderOpen(true)}
          isMobileOpen={isSidebarMobileOpen}
          onCloseMobile={() => setIsSidebarMobileOpen(false)}
        />

        {/* ═══════════════ MAIN DRIVE WORKSPACE CONTAINER ═══════════════ */}
        <div className="flex-1 flex flex-col min-w-0 bg-card rounded-tl-3xl border-t border-l border-border/60 overflow-hidden shadow-sm m-0 sm:mr-3 sm:mb-3">
          {/* Workspace Action & Breadcrumbs Bar */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-border/40 gap-3 shrink-0">
            {/* Breadcrumb / Title Dropdown */}
            <div className="flex items-center gap-2 min-w-0">
              {activeFolder ? (
                <div className="flex items-center gap-1.5 text-base sm:text-lg font-normal text-foreground">
                  <button
                    onClick={() => setActiveFolderId(null)}
                    className="hover:text-primary transition-colors text-muted-foreground"
                  >
                    My Drive
                  </button>
                  <ChevronRight className="h-4 w-4 text-muted-foreground/60" />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="flex items-center gap-1 font-semibold text-foreground hover:bg-secondary px-2 py-1 rounded-xl transition-colors">
                        <FolderIcon className="h-5 w-5 text-primary fill-primary/20" />
                        <span className="truncate max-w-[180px] sm:max-w-xs">{activeFolder.name}</span>
                        <ChevronDown className="h-4 w-4 text-muted-foreground ml-1" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-56 rounded-2xl border-border bg-card shadow-2xl p-1.5">
                      <DropdownMenuItem
                        onClick={() => setIsUploadOpen(true)}
                        className="rounded-xl py-2 cursor-pointer text-xs font-medium"
                      >
                        <Upload className="mr-2.5 h-4 w-4 text-primary" />
                        Upload files to here
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setFolderToRename(activeFolder);
                          setRenameFolderName(activeFolder.name);
                        }}
                        className="rounded-xl py-2 cursor-pointer text-xs font-medium"
                      >
                        <FolderPlus className="mr-2.5 h-4 w-4 text-muted-foreground" />
                        Rename folder
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="my-1 bg-border/60" />
                      <DropdownMenuItem
                        onClick={() => setFolderToDelete(activeFolder)}
                        className="rounded-xl py-2 cursor-pointer text-xs font-medium text-red-600 focus:bg-red-500/10 focus:text-red-600"
                      >
                        Delete folder
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ) : (
                <h2 className="text-base sm:text-lg font-semibold text-foreground flex items-center gap-2">
                  {activeTab === "starred"
                    ? "Starred"
                    : activeTab === "recent"
                    ? "Recent"
                    : activeTab === "unorganized"
                    ? "Unorganized Files"
                    : search
                    ? `Search results for "${search}"`
                    : "My Drive"}
                </h2>
              )}
            </div>

            {/* Right Tools: View switch, Sort, Info Toggle */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {/* Filter / Sort Pill */}
              <div className="relative">
                <select
                  className="h-8 rounded-full border border-border/60 bg-secondary/40 pl-3 pr-7 py-1 text-xs font-medium text-foreground outline-none hover:bg-secondary cursor-pointer appearance-none transition-colors"
                  value={sort}
                  onChange={(e) => {
                    setSort(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="recent">Last modified</option>
                  <option value="name-asc">Name A-Z</option>
                  <option value="name-desc">Name Z-A</option>
                  <option value="views">Most viewed</option>
                  <option value="oldest">Oldest</option>
                </select>
                <ArrowUpDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
              </div>

              {/* View Switcher (Google Drive style Grid / List) */}
              <div className="flex items-center bg-secondary/50 p-0.5 rounded-full border border-border/50">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-1.5 rounded-full transition-all ${
                    viewMode === "grid"
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  title="Grid layout"
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode("compact")}
                  className={`p-1.5 rounded-full transition-all ${
                    viewMode === "compact"
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  title="Compact layout"
                >
                  <Grid3X3 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-1.5 rounded-full transition-all ${
                    viewMode === "list"
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  title="List layout"
                >
                  <List className="h-4 w-4" />
                </button>
              </div>

              {/* Info (ℹ️) Details Panel Toggle */}
              <button
                onClick={() => setIsDetailsPanelOpen(!isDetailsPanelOpen)}
                className={`p-1.5 rounded-full transition-all ${
                  isDetailsPanelOpen
                    ? "bg-[#c2e7ff] text-[#001d35] dark:bg-[#004a77] dark:text-[#c2e7ff]"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
                title="View details"
              >
                <Info className="h-4.5 w-4.5" />
              </button>
            </div>
          </div>

          {/* ═══════════════ MAIN SCROLLABLE CONTENT ═══════════════ */}
          <div className="flex flex-1 min-h-0 overflow-hidden">
            <main
              className="flex-1 overflow-y-auto p-4 sm:p-6"
              onClick={() => {
                // Clicking background clears selection
                setSelectedPdf(null);
                setSelectedFolder(null);
              }}
            >
              {/* ——— Suggested Row (Google Drive Suggested Files Shelf) ——— */}
              {suggestedPdfs.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-primary" /> Suggested
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {suggestedPdfs.map((pdf: IPDF) => (
                      <div key={pdf.publicId} onClick={(e) => e.stopPropagation()}>
                        <PDFCard
                          pdf={pdf}
                          compact={true}
                          isSelected={selectedPdf?.publicId === pdf.publicId}
                          isStarred={starredIds.includes(pdf.publicId)}
                          folderName={folders.find((f) => f.publicId === pdf.folderId)?.name}
                          onSelect={handleSelectPdf}
                          onToggleStar={toggleStar}
                          onQuickPreview={(p) => setPreviewPdf(p)}
                          onMoveToFolder={(p) => setPdfToMove(p)}
                          onFolderClick={(fId) => {
                            setActiveFolderId(fId);
                            setPage(1);
                          }}
                          onRename={(p) => {
                            setPdfToRename(p);
                            setNewTitle(p.title);
                          }}
                          onDelete={(p) => setPdfToDelete(p)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ——— Folders Section (Only shown when not inside a folder) ——— */}
              {!activeFolderId && activeTab === "all" && !search && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <FolderIcon className="h-3.5 w-3.5 text-primary" /> Folders
                      <span className="text-[10px] font-bold bg-secondary px-1.5 py-0.5 rounded-full">
                        {folders.length}
                      </span>
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsCreateFolderOpen(true);
                      }}
                      className="h-7 text-xs font-medium rounded-full text-primary hover:bg-primary/10 gap-1"
                    >
                      <FolderPlus className="h-3.5 w-3.5" />
                      <span>New Folder</span>
                    </Button>
                  </div>

                  {folders.length === 0 ? (
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsCreateFolderOpen(true);
                      }}
                      className="rounded-2xl border border-dashed border-border/70 p-6 text-center hover:bg-secondary/30 transition-colors cursor-pointer"
                    >
                      <FolderPlus className="h-8 w-8 text-muted-foreground/60 mx-auto mb-2" />
                      <p className="text-xs font-medium text-foreground">No folders in My Drive</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">Click here to create a folder and organize your documents</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {folders.map((f) => (
                        <div key={f.publicId} onClick={(e) => e.stopPropagation()}>
                          <FolderCard
                            folder={f}
                            isSelected={selectedFolder?.publicId === f.publicId}
                            onSelect={(folder) => {
                              handleSelectFolderCard(folder);
                              setActiveFolderId(folder.publicId);
                              setPage(1);
                            }}
                            onRename={(folder) => {
                              setFolderToRename(folder);
                              setRenameFolderName(folder.name);
                            }}
                            onDelete={(folder) => setFolderToDelete(folder)}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ——— Files Section ——— */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-primary" /> Files
                    <span className="text-[10px] font-bold bg-secondary px-1.5 py-0.5 rounded-full">
                      {displayedPdfs.length}
                    </span>
                  </h3>
                </div>

                {isLoading ? (
                  <div className="flex h-56 items-center justify-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-9 w-9 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
                      <p className="text-xs text-muted-foreground font-medium">Loading Drive files...</p>
                    </div>
                  </div>
                ) : error || !data || data.error ? (
                  <div className="flex h-56 flex-col items-center justify-center text-red-500 bg-red-500/5 border border-red-500/20 rounded-2xl p-6">
                    <p className="font-semibold text-sm mb-1">Failed to load files</p>
                    <p className="text-xs opacity-80 mb-3">{error?.message || "Please check your database connection."}</p>
                    <Button variant="outline" size="sm" onClick={() => mutate()} className="rounded-xl">
                      Retry
                    </Button>
                  </div>
                ) : displayedPdfs.length === 0 ? (
                  <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-border/70 bg-secondary/10 p-6 text-center">
                    <div className="h-14 w-14 rounded-full bg-secondary flex items-center justify-center mb-3 text-muted-foreground">
                      {activeFolder ? (
                        <FolderIcon className="h-7 w-7 text-primary" />
                      ) : activeTab === "starred" ? (
                        <Star className="h-7 w-7 text-amber-500" />
                      ) : (
                        <FileText className="h-7 w-7 text-muted-foreground" />
                      )}
                    </div>
                    <p className="text-sm font-semibold text-foreground">
                      {activeFolder
                        ? `"${activeFolder.name}" is empty`
                        : activeTab === "starred"
                        ? "No starred files"
                        : activeTab === "unorganized"
                        ? "All files are organized into folders!"
                        : search
                        ? "No files match your search"
                        : "Drop files here or use the + New button"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                      {activeFolder
                        ? "Upload a PDF here or drag documents from My Drive."
                        : activeTab === "starred"
                        ? "Star documents by clicking the star icon to access them quickly here."
                        : "Upload PDFs to start previewing, sharing, and organizing."}
                    </p>
                    <Button
                      onClick={() => setIsUploadOpen(true)}
                      className="mt-4 gap-2 rounded-full px-5 text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-md"
                    >
                      <Upload className="h-4 w-4" />
                      Upload PDF
                    </Button>
                  </div>
                ) : viewMode === "list" ? (
                  <div onClick={(e) => e.stopPropagation()}>
                    <PDFListView
                      pdfs={displayedPdfs}
                      folders={folders}
                      starredIds={starredIds}
                      selectedPdfId={selectedPdf?.publicId}
                      onSelectPdf={handleSelectPdf}
                      onToggleStar={toggleStar}
                      onQuickPreview={(p) => setPreviewPdf(p)}
                      onMoveToFolder={(p) => setPdfToMove(p)}
                      onFolderClick={(folderId) => {
                        setActiveFolderId(folderId);
                        setPage(1);
                      }}
                      onRename={(p) => {
                        setPdfToRename(p);
                        setNewTitle(p.title);
                      }}
                      onDelete={(p) => setPdfToDelete(p)}
                      onCopyLink={handleCopyLink}
                    />
                  </div>
                ) : (
                  <div
                    className={`grid ${
                      viewMode === "compact"
                        ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3"
                        : "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
                    }`}
                  >
                    {displayedPdfs.map((pdf: IPDF) => (
                      <div key={pdf.publicId} onClick={(e) => e.stopPropagation()}>
                        <PDFCard
                          pdf={pdf}
                          compact={viewMode === "compact"}
                          isSelected={selectedPdf?.publicId === pdf.publicId}
                          isStarred={starredIds.includes(pdf.publicId)}
                          folderName={folders.find((f) => f.publicId === pdf.folderId)?.name}
                          onSelect={handleSelectPdf}
                          onToggleStar={toggleStar}
                          onQuickPreview={(p) => setPreviewPdf(p)}
                          onMoveToFolder={(p) => setPdfToMove(p)}
                          onFolderClick={(folderId) => {
                            setActiveFolderId(folderId);
                            setPage(1);
                          }}
                          onRename={(p) => {
                            setPdfToRename(p);
                            setNewTitle(p.title);
                          }}
                          onDelete={(p) => setPdfToDelete(p)}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Pagination */}
              {data?.pagination?.totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-2 pb-6">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="rounded-full text-xs h-8 px-4"
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
                          className={`h-8 w-8 rounded-full text-xs font-semibold transition-all ${
                            page === pageNum
                              ? "bg-primary text-primary-foreground"
                              : "text-muted-foreground hover:bg-secondary"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === data.pagination.totalPages}
                    onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
                    className="rounded-full text-xs h-8 px-4"
                  >
                    Next
                  </Button>
                </div>
              )}
            </main>

            {/* Google Drive Right Details Panel */}
            <DriveDetailsPanel
              isOpen={isDetailsPanelOpen}
              selectedPdf={selectedPdf}
              selectedFolder={selectedFolder}
              folderName={folders.find((f) => f.publicId === selectedPdf?.folderId)?.name}
              onClose={() => setIsDetailsPanelOpen(false)}
              onMovePdf={(p) => setPdfToMove(p)}
              onDeletePdf={(p) => setPdfToDelete(p)}
            />
          </div>
        </div>
      </div>

      {/* ═══════════════ MOBILE FLOATING ACTION BUTTON (FAB) ═══════════════ */}
      <div className="lg:hidden fixed bottom-6 right-6 z-40">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="h-14 w-14 rounded-2xl bg-card border border-border shadow-2xl flex items-center justify-center text-primary active:scale-95 transition-transform">
              <Plus className="h-7 w-7 text-primary" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52 rounded-2xl border-border bg-card shadow-2xl p-1.5 mb-2">
            <DropdownMenuItem onClick={() => setIsCreateFolderOpen(true)} className="rounded-xl py-2.5 cursor-pointer text-xs font-medium">
              <FolderPlus className="mr-2.5 h-4 w-4 text-primary" />
              New Folder
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setIsUploadOpen(true)} className="rounded-xl py-2.5 cursor-pointer text-xs font-medium">
              <Upload className="mr-2.5 h-4 w-4 text-primary" />
              Upload PDF
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

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
              : "Document moved to root My Drive!"
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
        <DialogContent className="sm:max-w-md bg-card text-card-foreground border-border shadow-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <FolderPlus className="h-5 w-5 text-primary" />
              New folder
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Folder Name</label>
              <Input
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Untitled folder"
                autoFocus
                className="h-11 rounded-xl bg-secondary/40 border-border"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Color Tag</label>
              <div className="flex items-center gap-2 pt-1">
                {FOLDER_COLORS.map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => setNewFolderColor(c.name)}
                    className={`h-7 w-7 rounded-full ${c.bg} transition-all ${
                      newFolderColor === c.name
                        ? "ring-2 ring-primary ring-offset-2 ring-offset-background scale-110 shadow-md"
                        : "opacity-60 hover:opacity-100 hover:scale-105"
                    }`}
                    title={c.label}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsCreateFolderOpen(false)} disabled={isCreatingFolder} className="rounded-full text-xs">
              Cancel
            </Button>
            <Button onClick={handleCreateFolder} disabled={isCreatingFolder || !newFolderName.trim()} className="rounded-full text-xs px-5 bg-primary text-primary-foreground font-semibold">
              {isCreatingFolder && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Folder Dialog */}
      <Dialog open={!!folderToRename} onOpenChange={(open) => !open && setFolderToRename(null)}>
        <DialogContent className="sm:max-w-md bg-card text-card-foreground border-border shadow-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-foreground">Rename folder</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <Input
              value={renameFolderName}
              onChange={(e) => setRenameFolderName(e.target.value)}
              placeholder="Enter folder name"
              autoFocus
              className="h-11 rounded-xl bg-secondary/40 border-border"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setFolderToRename(null)} disabled={isRenamingFolder} className="rounded-full text-xs">
              Cancel
            </Button>
            <Button onClick={handleRenameFolder} disabled={isRenamingFolder || !renameFolderName.trim()} className="rounded-full text-xs px-5 bg-primary text-primary-foreground font-semibold">
              {isRenamingFolder && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Folder Dialog */}
      <Dialog open={!!folderToDelete} onOpenChange={(open) => !open && setFolderToDelete(null)}>
        <DialogContent className="sm:max-w-md bg-card text-card-foreground border-border shadow-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-red-600 dark:text-red-400">Move folder to trash?</DialogTitle>
          </DialogHeader>
          <div className="py-3">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to remove <strong className="text-foreground font-semibold">{folderToDelete?.name}</strong>?
            </p>
            <p className="text-xs text-muted-foreground mt-3 bg-secondary/60 p-3 rounded-xl border border-border/50">
              💡 Files inside this folder will not be deleted; they will be kept in your general library.
            </p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setFolderToDelete(null)} disabled={isDeletingFolder} className="rounded-full text-xs">
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteFolder} disabled={isDeletingFolder} className="rounded-full text-xs px-5 font-semibold">
              {isDeletingFolder && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Move to trash
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Document Dialog */}
      <Dialog open={!!pdfToRename} onOpenChange={(open) => !open && setPdfToRename(null)}>
        <DialogContent className="bg-card text-card-foreground border-border shadow-2xl rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">Rename</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Enter new title"
              autoFocus
              className="h-11 rounded-xl bg-secondary/40 border-border"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setPdfToRename(null)} disabled={isRenaming} className="rounded-full text-xs">
              Cancel
            </Button>
            <Button onClick={handleRenameSubmit} disabled={isRenaming || !newTitle.trim()} className="rounded-full text-xs px-5 bg-primary text-primary-foreground font-semibold">
              {isRenaming && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Document Dialog */}
      <Dialog open={!!pdfToDelete} onOpenChange={(open) => !open && setPdfToDelete(null)}>
        <DialogContent className="sm:max-w-md bg-card text-card-foreground border-border shadow-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-red-600 dark:text-red-400">Move to trash?</DialogTitle>
          </DialogHeader>
          <div className="py-3">
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground font-semibold">{pdfToDelete?.title}</strong> will be permanently deleted.
            </p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setPdfToDelete(null)} disabled={isDeleting} className="rounded-full text-xs">
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteSubmit} disabled={isDeleting} className="rounded-full text-xs px-5 font-semibold">
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Move to trash
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
