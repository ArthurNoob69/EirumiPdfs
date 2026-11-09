import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import PDF from '@/models/PDF';
import { deleteStorageObject } from '@/lib/storage';

export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await connectToDatabase();
    
    // params.id is the publicId
    const pdf = await PDF.findOne({ publicId: id, status: 'active' }).lean();

    if (!pdf) {
      return NextResponse.json({ error: 'PDF not found' }, { status: 404 });
    }

    return NextResponse.json(pdf);
  } catch (error) {
    console.error('Error fetching PDF:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await connectToDatabase();
    const { title, folderId, coverUrl, coverStorageKey } = await req.json();

    const existingPdf = await PDF.findOne({ publicId: id, status: 'active' });
    if (!existingPdf) {
      return NextResponse.json({ error: 'PDF not found' }, { status: 404 });
    }

    const updateFields: any = {};
    if (title && typeof title === 'string' && title.trim()) {
      updateFields.title = title.trim();
    }
    if (folderId !== undefined) {
      updateFields.folderId = folderId ? folderId : null;
    }
    if (coverUrl !== undefined) {
      updateFields.coverUrl = coverUrl ? coverUrl : null;
    }
    if (coverStorageKey !== undefined) {
      updateFields.coverStorageKey = coverStorageKey ? coverStorageKey : null;

      // Clean up old cover from storage if replaced or removed
      if (existingPdf.coverStorageKey && existingPdf.coverStorageKey !== coverStorageKey) {
        try {
          await deleteStorageObject(existingPdf.coverStorageKey);
        } catch (e) {
          console.error('Failed to delete old cover from storage:', e);
        }
      }
    }

    if (Object.keys(updateFields).length === 0) {
      return NextResponse.json({ error: 'No valid fields provided' }, { status: 400 });
    }

    const pdf = await PDF.findOneAndUpdate(
      { publicId: id, status: 'active' },
      { $set: updateFields },
      { returnDocument: 'after' }
    );

    return NextResponse.json(pdf);
  } catch (error) {
    console.error('Error updating PDF:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await connectToDatabase();

    const pdf = await PDF.findOne({ publicId: id, status: 'active' });

    if (!pdf) {
      return NextResponse.json({ error: 'PDF not found' }, { status: 404 });
    }

    // Delete PDF file from storage
    try {
      await deleteStorageObject(pdf.storageKey);
    } catch (storageError) {
      console.error('Failed to delete object from storage:', storageError);
    }

    // Delete custom cover if exists
    if (pdf.coverStorageKey) {
      try {
        await deleteStorageObject(pdf.coverStorageKey);
      } catch (coverErr) {
        console.error('Failed to delete cover from storage:', coverErr);
      }
    }

    await PDF.deleteOne({ _id: pdf._id });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting PDF:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
