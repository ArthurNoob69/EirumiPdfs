"use client";

import { useState, useEffect, useMemo } from "react";
import useSWR from "swr";
import {
  Library,
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
  Sparkles,
} from "lucide-react";
import { PDFCard } from "@/components/pdf/PDFCard";
import { PDFListView } from "@/components/pdf/PDFListView";
import { PDFQuickPreviewModal } from "@/components/pdf/PDFQuickPreviewModal";
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
  const res = await fetch(url);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "An error occurred while fetching the data.");
  }
  return res.json();
};

type ViewMode = "grid" | "compact" | "list";
type FilterTab = "all" | "starred" | "recent" | "views";

export default function Home() {
  const { toast } = useToast();
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);
  const [sort, setSort] = useState("recent");
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");

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

  // Dialog states
  const [pdfToRename, setPdfToRename] = useState<IPDF | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);

  const [pdfToDelete, setPdfToDelete] = useState<IPDF | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const query = new URLSearchParams({
    search: debouncedSearch,
    sort,
    page: page.toString(),
    limit: "24",
  }).toString();

  const { data, error, mutate, isLoading } = useSWR(`/api/pdfs?${query}`, fetcher);

  // Calculate quick stats from loaded PDFs
  const stats = useMemo(() => {
    if (!data?.pdfs || !Array.isArray(data.pdfs)) {
      return { totalDocs: 0, totalViews: 0, totalBytes: 0 };
    }
    const totalDocs = data.pagination?.totalItems || data.pdfs.length;
    const totalViews = data.pdfs.reduce((acc: number, p: IPDF) => acc + (p.views || 0), 0);
    const totalBytes = data.pdfs.reduce((acc: number, p: IPDF) => acc + (p.fileSize || 0), 0);
    return { totalDocs, totalViews, totalBytes };
  }, [data]);

  // Filter PDFs based on active filter tab
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
        mutate();
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
        mutate();
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
    <div className="min-h-screen bg-background text-foreground bg-grid-pattern relative flex flex-col">
      {/* Background Ambient Glows */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-blue-500/10 blur-[130px] dark:bg-blue-600/10" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[50%] h-[50%] rounded-full bg-purple-500/10 blur-[130px] dark:bg-purple-600/10" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-card/85 backdrop-blur-xl shadow-xs">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-neutral-900 to-black dark:from-white dark:to-neutral-300 shadow-md">
              <Library className="h-5 w-5 text-white dark:text-black" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                EirumiPdfs
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  <Sparkles className="h-3 w-3" /> Cloud
                </span>
              </h1>
            </div>
          </div>

          <div className="flex flex-1 items-center justify-end space-x-2 sm:space-x-3 ml-4">
            {/* Search Input */}
            <div className="relative w-full max-w-xs sm:w-64 group">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
              <Input
                placeholder="Search documents..."
                className="pl-9 h-10 w-full rounded-full bg-background border-border text-foreground placeholder:text-muted-foreground transition-all"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            <ThemeToggle />

            <Button
              onClick={() => setIsUploadOpen(true)}
              className="h-10 px-4 rounded-xl shadow-sm hidden sm:flex gap-2"
            >
              <Plus className="h-4 w-4" /> Upload
            </Button>
            <Button
              onClick={() => setIsUploadOpen(true)}
              size="icon"
              className="h-10 w-10 shrink-0 sm:hidden rounded-xl"
            >
              <Plus className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 flex-1 w-full">
        {/* Quick Stats Banner */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="flex items-center space-x-3 rounded-2xl border border-border bg-card/80 backdrop-blur-md p-4 shadow-xs">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Total Documents</p>
              <p className="text-lg font-bold text-foreground">{stats.totalDocs}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 rounded-2xl border border-border bg-card/80 backdrop-blur-md p-4 shadow-xs">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Eye className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Total Views</p>
              <p className="text-lg font-bold text-foreground">{stats.totalViews}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 rounded-2xl border border-border bg-card/80 backdrop-blur-md p-4 shadow-xs">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <HardDrive className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Library Size</p>
              <p className="text-lg font-bold text-foreground">{formatBytes(stats.totalBytes)}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 rounded-2xl border border-border bg-card/80 backdrop-blur-md p-4 shadow-xs">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
              <Star className="h-5 w-5 fill-amber-400" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Starred</p>
              <p className="text-lg font-bold text-foreground">{starredIds.length}</p>
            </div>
          </div>
        </div>

        {/* Controls & Filter Bar */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Filter Tabs */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              onClick={() => setActiveFilter("all")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                activeFilter === "all"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-secondary text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              All Documents
            </button>
            <button
              onClick={() => setActiveFilter("starred")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                activeFilter === "starred"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-secondary text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />
              Starred ({starredIds.length})
            </button>
          </div>

          {/* Right: Sort & View Mode Switcher */}
          <div className="flex items-center justify-between sm:justify-end space-x-2">
            {/* Sort Selector */}
            <select
              className="h-9 rounded-xl border border-border bg-card px-3 py-1 text-xs font-medium text-foreground outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer shadow-xs"
              value={sort}
              onChange={(e) => {
                setSort(e.target.value);
                setPage(1);
              }}
            >
              <option value="recent">Recently added</option>
              <option value="name-asc">Name A-Z</option>
              <option value="name-desc">Name Z-A</option>
              <option value="views">Most viewed</option>
              <option value="oldest">Oldest</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-secondary/80 p-1 rounded-xl border border-border/50">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === "grid"
                    ? "bg-card text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title="Grid View"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("compact")}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === "compact"
                    ? "bg-card text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title="Compact Grid"
              >
                <Grid3X3 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === "list"
                    ? "bg-card text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title="List View"
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Gallery Content */}
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error || !data || data.error ? (
          <div className="flex h-64 flex-col items-center justify-center text-red-500 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-2xl p-6">
            <p className="font-semibold text-lg mb-2">Failed to load PDFs</p>
            <p className="text-sm opacity-80 mb-4">{error?.message || "Please check your database connection."}</p>
            <Button variant="outline" onClick={() => mutate()}>Retry</Button>
          </div>
        ) : displayedPdfs.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex h-72 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card p-6 shadow-xs text-center"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary mb-3 text-muted-foreground">
              {activeFilter === "starred" ? (
                <Star className="h-7 w-7 text-amber-500" />
              ) : (
                <Library className="h-7 w-7" />
              )}
            </div>
            <p className="text-base font-semibold text-foreground">
              {activeFilter === "starred"
                ? "No starred documents yet"
                : search
                ? "No documents match your search"
                : "Your PDF library is empty"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground max-w-sm">
              {activeFilter === "starred"
                ? "Click the star icon on any document card to pin it here for quick access."
                : search
                ? "Try adjusting your search keywords or clear the filter."
                : "Upload documents to share them publicly and access them anytime."}
            </p>
            {!search && activeFilter === "all" && (
              <Button className="mt-4 gap-2 rounded-xl" onClick={() => setIsUploadOpen(true)}>
                <Plus className="h-4 w-4" /> Upload Document
              </Button>
            )}
          </motion.div>
        ) : viewMode === "list" ? (
          /* List View */
          <PDFListView
            pdfs={displayedPdfs}
            starredIds={starredIds}
            onToggleStar={toggleStar}
            onQuickPreview={(p) => setPreviewPdf(p)}
            onRename={(p) => {
              setPdfToRename(p);
              setNewTitle(p.title);
            }}
            onDelete={(p) => setPdfToDelete(p)}
            onCopyLink={handleCopyLink}
          />
        ) : (
          /* Grid & Compact Grid Views */
          <motion.div
            className={`grid gap-4 sm:gap-6 ${
              viewMode === "compact"
                ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
                : "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
            }`}
            initial="hidden"
            animate="show"
            variants={{
              hidden: { opacity: 0 },
              show: {
                opacity: 1,
                transition: { staggerChildren: 0.04 },
              },
            }}
          >
            <AnimatePresence mode="popLayout">
              {displayedPdfs.map((pdf: IPDF) => (
                <motion.div
                  key={pdf.publicId}
                  layout
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.25 }}
                >
                  <PDFCard
                    pdf={pdf}
                    compact={viewMode === "compact"}
                    isStarred={starredIds.includes(pdf.publicId)}
                    onToggleStar={toggleStar}
                    onQuickPreview={(p) => setPreviewPdf(p)}
                    onRename={(p) => {
                      setPdfToRename(p);
                      setNewTitle(p.title);
                    }}
                    onDelete={(p) => setPdfToDelete(p)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Pagination */}
        {data?.pagination?.totalPages > 1 && (
          <div className="mt-10 flex items-center justify-center space-x-2">
            <Button
              variant="outline"
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-xl text-xs h-8"
            >
              Previous
            </Button>
            <span className="text-xs text-muted-foreground px-3">
              Page {page} of {data.pagination.totalPages}
            </span>
            <Button
              variant="outline"
              disabled={page === data.pagination.totalPages}
              onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
              className="rounded-xl text-xs h-8"
            >
              Next
            </Button>
          </div>
        )}
      </main>

      {/* Upload Modal */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSuccess={() => mutate()}
      />

      {/* Quick Preview Modal */}
      <PDFQuickPreviewModal
        pdf={previewPdf}
        isOpen={!!previewPdf}
        onClose={() => setPreviewPdf(null)}
      />

      {/* Rename Dialog */}
      <Dialog open={!!pdfToRename} onOpenChange={(open) => !open && setPdfToRename(null)}>
        <DialogContent className="bg-card text-card-foreground border-border shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-foreground">Rename Document</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <label className="text-xs font-semibold text-muted-foreground">Document Title</label>
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Enter new title"
              autoFocus
              className="h-10 rounded-xl"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPdfToRename(null)} disabled={isRenaming}>
              Cancel
            </Button>
            <Button onClick={handleRenameSubmit} disabled={isRenaming || !newTitle.trim()}>
              {isRenaming && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!pdfToDelete} onOpenChange={(open) => !open && setPdfToDelete(null)}>
        <DialogContent className="sm:max-w-md bg-card text-card-foreground border-border shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-red-600 dark:text-red-400">Delete Document?</DialogTitle>
          </DialogHeader>
          <div className="py-3">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to permanently delete{" "}
              <strong className="text-foreground font-semibold">{pdfToDelete?.title}</strong>? This action cannot be undone and the public URL will immediately cease functioning.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPdfToDelete(null)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteSubmit} disabled={isDeleting}>
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Yes, Delete PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
