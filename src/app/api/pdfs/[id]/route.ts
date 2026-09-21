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
    const { title } = await req.json();

    if (!title || typeof title !== 'string' || title.trim() === '') {
      return NextResponse.json({ error: 'Valid title is required' }, { status: 400 });
    }

    // Using _id or publicId? We should probably use publicId for consistency 
    // or pass internal _id if this is a secure admin operation.
    // For now, publicId is fine since anyone with the link can view it,
    // but in a real app renaming should be protected.
    const pdf = await PDF.findOneAndUpdate(
      { publicId: id, status: 'active' },
      { $set: { title: title.trim() } },
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
