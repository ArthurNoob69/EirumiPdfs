import { notFound } from "next/navigation";
import { PDFViewerWrapper } from "@/components/pdf/PDFViewerWrapper";
import connectToDatabase from "@/lib/mongodb";
import PDF from "@/models/PDF";
import { FileQuestion, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const revalidate = 60; // Revalidate at most every 60 seconds

async function getPdfByPublicId(id: string) {
  try {
    await connectToDatabase();
    const pdf = await PDF.findOne({ publicId: id, status: "active" }).lean();
    if (!pdf) return null;
    
    // Convert ObjectId and Date to string for client component
    return {
      ...pdf,
      _id: pdf._id.toString(),
      createdAt: pdf.createdAt.toISOString(),
      updatedAt: pdf.updatedAt.toISOString(),
    };
  } catch (err) {
    console.error(err);
    return null;
  }
}

export default async function ViewPDFPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const pdf = await getPdfByPublicId(id);

  if (!pdf) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 px-4 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-sm mb-6">
          <FileQuestion className="h-10 w-10 text-neutral-400" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
          PDF Not Found
        </h1>
        <p className="mt-2 max-w-md text-neutral-500">
          This document may have been deleted, or the link is incorrect. Please verify the URL.
        </p>
        <Link href="/" className="mt-8">
          <Button variant="outline" className="gap-2">
            <ChevronLeft className="h-4 w-4" />
            Return to EirumiPdfs
          </Button>
        </Link>
      </div>
    );
  }

  // Pass JSON serializable data to client
  return <PDFViewerWrapper pdf={pdf as any} />;
}
