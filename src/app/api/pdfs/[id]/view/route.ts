import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import PDF from '@/models/PDF';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await connectToDatabase();
    
    // We increment the view count atomically.
    // In a real application, you might want to use cookies or IP tracking
    // to prevent duplicate views from the same user in a single session.
    const pdf = await PDF.findOneAndUpdate(
      { publicId: id, status: 'active' },
      { $inc: { views: 1 } },
      { new: true }
    );

    if (!pdf) {
      return NextResponse.json({ error: 'PDF not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, views: pdf.views });
  } catch (error) {
    console.error('Error incrementing view count:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
