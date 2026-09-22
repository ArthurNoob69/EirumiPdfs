import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import PDF from '@/models/PDF';
import { deleteStorageObject } from '@/lib/storage';

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
    const { title, folderId } = await req.json();

    const updateFields: any = {};
    if (title && typeof title === 'string' && title.trim()) {
      updateFields.title = title.trim();
    }
    if (folderId !== undefined) {
      updateFields.folderId = folderId ? folderId : null;
    }

    if (Object.keys(updateFields).length === 0) {
      return NextResponse.json({ error: 'No valid fields provided' }, { status: 400 });
    }

    const pdf = await PDF.findOneAndUpdate(
      { publicId: id, status: 'active' },
      { $set: updateFields },
      { new: true }
    );

    if (!pdf) {
      return NextResponse.json({ error: 'PDF not found' }, { status: 404 });
    }

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

    // Mark as deleted in DB first (soft delete or hard delete? Request says: delete record and S3 object)
    // We will hard delete it or mark status as deleted and then delete from S3.
    // Let's hard delete to save space, but wait, it's safer to delete from S3 first, then DB, or vice versa.
    // Let's delete from S3 first:
    try {
      await deleteStorageObject(pdf.storageKey);
    } catch (storageError) {
      console.error('Failed to delete object from storage:', storageError);
      // We might still want to delete the DB record if the object doesn't exist, 
      // but let's continue to delete from DB anyway to not leave orphaned DB records 
      // if S3 delete fails due to 404.
    }

    await PDF.deleteOne({ _id: pdf._id });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting PDF:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
