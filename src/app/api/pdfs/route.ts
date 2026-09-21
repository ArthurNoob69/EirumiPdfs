import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import PDF from '@/models/PDF';
import { nanoid } from 'nanoid';

export async function GET(req: Request) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const sort = searchParams.get('sort') || 'recent';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '12', 10);
    const skip = (page - 1) * limit;

    const query: any = { status: 'active' };

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { originalFileName: { $regex: search, $options: 'i' } },
      ];
    }

    let sortOptions: any = { createdAt: -1 };
    switch (sort) {
      case 'recent':
        sortOptions = { createdAt: -1 };
        break;
      case 'oldest':
        sortOptions = { createdAt: 1 };
        break;
      case 'name-asc':
        sortOptions = { title: 1 };
        break;
      case 'name-desc':
        sortOptions = { title: -1 };
        break;
      case 'views':
        sortOptions = { views: -1, createdAt: -1 };
        break;
    }

    const [pdfs, total] = await Promise.all([
      PDF.find(query).sort(sortOptions).skip(skip).limit(limit).lean(),
      PDF.countDocuments(query),
    ]);

    return NextResponse.json({
      pdfs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching PDFs:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    
    const body = await req.json();
    const { title, originalFileName, storageKey, storageUrl, fileSize, mimeType, pageCount } = body;

    if (!title || !originalFileName || !storageKey || !storageUrl || !fileSize) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Generate a secure 8-character ID for the public URL
    const publicId = nanoid(8);

    const pdf = new PDF({
      publicId,
      title,
      originalFileName,
      storageKey,
      storageUrl,
      fileSize,
      mimeType: mimeType || 'application/pdf',
      pageCount,
    });

    await pdf.save();

    return NextResponse.json(pdf, { status: 201 });
  } catch (error) {
    console.error('Error saving PDF metadata:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
