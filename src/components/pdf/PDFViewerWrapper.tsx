"use client";

import dynamic from "next/dynamic";
import { IPDF } from "@/models/PDF";

const PDFViewer = dynamic(() => import("./PDFViewer").then((mod) => mod.PDFViewer), {
  ssr: false,
  loading: () => <div className="flex h-screen items-center justify-center bg-neutral-100">Loading PDF Viewer...</div>
});

export function PDFViewerWrapper({ pdf }: { pdf: IPDF }) {
  return <PDFViewer pdf={pdf} />;
}
