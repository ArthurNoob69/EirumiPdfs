"use client";

import dynamic from "next/dynamic";
import { IPDF } from "@/models/PDF";
import { Loader2 } from "lucide-react";

const PDFViewer = dynamic(() => import("./PDFViewer").then((mod) => mod.PDFViewer), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-background text-foreground gap-3">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-xs font-semibold text-muted-foreground animate-pulse">
        Initializing Document Viewer...
      </p>
    </div>
  ),
});

export function PDFViewerWrapper({ pdf }: { pdf: IPDF }) {
  return <PDFViewer pdf={pdf} />;
}
