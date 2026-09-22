import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Folder from '@/models/Folder';
import PDF from '@/models/PDF';
import { nanoid } from 'nanoid';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectToDatabase();

    // Fetch all folders
    const folders = await Folder.find({}).sort({ createdAt: -1 }).lean();

    // Aggregate counts and sizes by folderId
    const counts = await PDF.aggregate([
      { $match: { status: 'active' } },
      {
        $group: {
          _id: { $ifNull: ['$folderId', null] },
          count: { $sum: 1 },
          totalSize: { $sum: '$fileSize' },
        },
      },
    ]);

    const countMap = new Map<string, { count: number; totalSize: number }>();
    let rootCount = 0;
    let rootSize = 0;

    for (const item of counts) {
      if (!item._id) {
        rootCount = item.count;
        rootSize = item.totalSize;
      } else {
        countMap.set(item._id.toString(), {
          count: item.count,
          totalSize: item.totalSize,
        });
      }
    }

    const foldersWithStats = folders.map((f: any) => {
      const stat = countMap.get(f.publicId) || { count: 0, totalSize: 0 };
      return {
        ...f,
        count: stat.count,
        totalSize: stat.totalSize,
      };
    });

    return NextResponse.json({
      folders: foldersWithStats,
      rootStats: {
        count: rootCount,
        totalSize: rootSize,
      },
    });
  } catch (error) {
    console.error('Error fetching folders:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectToDatabase();

    const body = await req.json();
    const { name, color } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Folder name is required' }, { status: 400 });
    }

    const publicId = nanoid(8);

    const folder = new Folder({
      publicId,
      name: name.trim(),
      color: color || 'blue',
    });

    await folder.save();

    return NextResponse.json(folder, { status: 201 });
  } catch (error) {
    console.error('Error creating folder:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
