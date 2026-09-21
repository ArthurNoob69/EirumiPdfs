"use client";

import { useState } from "react";
import useSWR from "swr";
import { Library, Search, Loader2, Plus } from "lucide-react";
import { PDFCard } from "@/components/pdf/PDFCard";
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

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function Home() {
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [sort, setSort] = useState("recent");
  const [page, setPage] = useState(1);

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
    limit: "12",
  }).toString();

  const { data, error, mutate, isLoading } = useSWR(`/api/pdfs?${query}`, fetcher);

  const handleOpenPdf = (pdf: IPDF) => {
    window.open(`/view/${pdf.publicId}`, "_blank");
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
      } else {
        alert("Failed to rename PDF");
      }
    } catch (err) {
      alert("Error renaming PDF");
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
      } else {
        alert("Failed to delete PDF");
      }
    } catch (err) {
      alert("Error deleting PDF");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background bg-grid-pattern relative">
      {/* Subtle ambient gradients */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-blue-500/10 blur-[120px] dark:bg-blue-600/10" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[50%] h-[50%] rounded-full bg-purple-500/10 blur-[120px] dark:bg-purple-600/10" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/70 backdrop-blur-xl supports-[backdrop-filter]:bg-background/40">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-neutral-800 to-black dark:from-white dark:to-neutral-300 shadow-lg">
              <Library className="h-5 w-5 text-white dark:text-black" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-foreground hidden sm:block">EirumiPdfs</h1>
          </div>
          
          <div className="flex flex-1 items-center justify-end space-x-2 sm:space-x-4 ml-4">
            <div className="relative w-full max-w-xs sm:w-64 group">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400 transition-colors group-focus-within:text-primary" />
              <Input
                placeholder="Search PDFs..."
                className="pl-9 h-10 w-full bg-neutral-100/50 dark:bg-neutral-900/50 border-border focus-visible:bg-background transition-all"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <ThemeToggle />
            <Button onClick={() => setIsUploadOpen(true)} className="h-10 px-4 shadow-sm hidden sm:flex">
              <Plus className="h-4 w-4 mr-2" /> Upload
            </Button>
            <Button onClick={() => setIsUploadOpen(true)} size="icon" className="h-10 w-10 shrink-0 sm:hidden">
              <Plus className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        
        {/* Controls */}
        <div className="mb-8 flex flex-row items-center justify-between">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground hidden sm:block">
            Your Documents
          </h2>
          <div className="flex flex-1 sm:flex-none items-center justify-between sm:justify-start">
            <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400 sm:hidden">Documents</span>
            <select
              className="h-9 rounded-lg border border-border bg-background px-3 py-1 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
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
          </div>
        </div>

        {/* PDF Grid */}
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
          </div>
        ) : error ? (
          <div className="flex h-64 flex-col items-center justify-center text-red-500">
            <p>Failed to load PDFs.</p>
            <Button variant="outline" className="mt-4" onClick={() => mutate()}>Retry</Button>
          </div>
        ) : data?.pdfs?.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card shadow-sm"
          >
            <Library className="mb-4 h-12 w-12 text-neutral-300 dark:text-neutral-600" />
            <p className="text-lg font-medium text-foreground">No documents found</p>
            <p className="mt-1 text-sm text-neutral-500">
              {search ? "Try adjusting your search terms" : "Upload your first PDF to get started"}
            </p>
            {!search && (
              <Button className="mt-4 shadow-sm" onClick={() => setIsUploadOpen(true)}>
                Upload PDF
              </Button>
            )}
          </motion.div>
        ) : (
          <motion.div 
            className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            initial="hidden"
            animate="show"
            variants={{
              hidden: { opacity: 0 },
              show: {
                opacity: 1,
                transition: { staggerChildren: 0.05 }
              }
            }}
          >
            <AnimatePresence mode="popLayout">
              {data?.pdfs.map((pdf: IPDF) => (
                <motion.div
                  key={pdf.publicId}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                >
                  <PDFCard
                    pdf={pdf}
                    onOpen={handleOpenPdf}
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
          <div className="mt-12 flex items-center justify-center space-x-2">
            <Button
              variant="outline"
              disabled={page === 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <span className="text-sm text-neutral-500 px-4">
              Page {page} of {data.pagination.totalPages}
            </span>
            <Button
              variant="outline"
              disabled={page === data.pagination.totalPages}
              onClick={() => setPage(p => Math.min(data.pagination.totalPages, p + 1))}
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

      {/* Rename Dialog */}
      <Dialog open={!!pdfToRename} onOpenChange={(open) => !open && setPdfToRename(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename PDF</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Enter new name"
              autoFocus
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600 dark:text-red-400">Delete Document?</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Are you sure you want to delete <strong className="text-foreground">{pdfToDelete?.title}</strong>? This action cannot be undone and the public link will stop working immediately.
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
