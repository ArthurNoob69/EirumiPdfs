import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Folder from '@/models/Folder';
import PDF from '@/models/PDF';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectToDatabase();

    const body = await req.json();
    const { name, color } = body;

    const updateFields: any = {};
    if (name && typeof name === 'string' && name.trim()) {
      updateFields.name = name.trim();
    }
    if (color && typeof color === 'string') {
      updateFields.color = color;
    }

    if (Object.keys(updateFields).length === 0) {
      return NextResponse.json({ error: 'No valid fields provided' }, { status: 400 });
    }

    const folder = await Folder.findOneAndUpdate(
      { publicId: id },
      { $set: updateFields },
      { new: true }
    );

    if (!folder) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
    }

    return NextResponse.json(folder);
  } catch (error) {
    console.error('Error updating folder:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectToDatabase();

    const folder = await Folder.findOne({ publicId: id });
    if (!folder) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
    }

    // Safely unassign all PDFs inside this folder so no PDFs are lost
    await PDF.updateMany({ folderId: id }, { $set: { folderId: null } });

    // Delete the folder
    await Folder.deleteOne({ _id: folder._id });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting folder:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
