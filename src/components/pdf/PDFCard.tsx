"use client";

import { useState } from "react";
import { format } from "date-fns";
import { MoreVertical, ExternalLink, Link2, Edit2, Trash2, Eye, Calendar, FileText } from "lucide-react";
import dynamic from "next/dynamic";
import { IPDF } from "@/models/PDF";
import { formatBytes } from "@/lib/utils";
import { motion } from "framer-motion";

const PDFThumbnail = dynamic(() => import("./PDFThumbnail").then((mod) => mod.PDFThumbnail), { ssr: false });
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface PDFCardProps {
  pdf: IPDF;
  onRename: (pdf: IPDF) => void;
  onDelete: (pdf: IPDF) => void;
  onOpen: (pdf: IPDF) => void;
}

export function PDFCard({ pdf, onRename, onDelete, onOpen }: PDFCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/view/${pdf.publicId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className="group flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm transition-all hover:border-border hover:shadow-xl dark:shadow-none dark:hover:shadow-primary/5"
      onClick={() => onOpen(pdf)}
    >
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-neutral-100 dark:bg-neutral-900 border-b border-border/50">
        <div className="absolute inset-0 flex items-center justify-center transition-transform duration-700 group-hover:scale-[1.02]">
          <PDFThumbnail url={pdf.storageUrl} />
        </div>
        
        {/* Glassmorphic overlay gradient on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        <div className="absolute right-2 top-2 z-10 opacity-0 transition-all duration-300 transform translate-y-[-10px] group-hover:opacity-100 group-hover:translate-y-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="secondary" size="icon" className="h-8 w-8 rounded-full bg-background/80 backdrop-blur-md shadow-sm hover:bg-background border border-border/50 text-foreground">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-xl bg-background/95 backdrop-blur-xl border border-border/50">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onOpen(pdf); }}>
                <ExternalLink className="mr-2 h-4 w-4" />
                Open
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleCopyLink}>
                <Link2 className="mr-2 h-4 w-4" />
                {copied ? "Copied!" : "Copy link"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onRename(pdf); }}>
                <Edit2 className="mr-2 h-4 w-4" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={(e) => { e.stopPropagation(); onDelete(pdf); }}
                className="text-red-600 focus:bg-red-50 focus:text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      <div className="flex flex-col p-4 bg-card z-10 relative">
        <h3 className="line-clamp-1 text-sm font-semibold text-foreground" title={pdf.title}>
          {pdf.title}
        </h3>
        
        <div className="mt-3 flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 font-medium">
          <span className="flex items-center">
            <FileText className="mr-1.5 h-3.5 w-3.5 opacity-70" />
            {formatBytes(pdf.fileSize)}
          </span>
          <span className="flex items-center bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded-full">
            <Eye className="mr-1 h-3 w-3 opacity-70" />
            {pdf.views}
          </span>
        </div>
        
        <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between text-[11px] text-neutral-400 uppercase tracking-wider">
          <span className="flex items-center">
            <Calendar className="mr-1 h-3 w-3" />
            {format(new Date(pdf.createdAt), "MMM d, yyyy")}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
