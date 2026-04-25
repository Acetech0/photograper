import { NextResponse } from 'next/server';
import { fetchFolderImages, cloudinaryGet } from '@/lib/cloudinary';
import { parseContext } from '@/lib/utils';

export async function GET(request, { params }) {
  try {
    const { folderId } = await params;
    const images = await fetchFolderImages(folderId);

    const sorted = images
      .map((img) => {
        const ctx = parseContext(img.context);
        return {
          publicId: img.public_id,
          url: img.secure_url,
          order: parseInt(ctx?.order || '0', 10),
          is_cover: ctx?.is_cover === 'true',
          original_name: ctx?.original_name || '',
          folder_name: ctx?.folder_name || folderId,
        };
      })
      .sort((a, b) => a.order - b.order);

    return NextResponse.json(sorted);
  } catch (error) {
    console.error('GET /api/folders/[folderId]/images error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
