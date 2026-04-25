import { NextResponse } from 'next/server';
import { fetchFolderOrderArray, fetchFolderImages } from '@/lib/cloudinary';
import { parseContext } from '@/lib/utils';

export async function GET() {
  try {
    const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const folderIds = await fetchFolderOrderArray();

    if (!folderIds || folderIds.length === 0) {
      return NextResponse.json([]);
    }

    const folders = await Promise.all(
      folderIds.map(async (folderId, index) => {
        try {
          const images = await fetchFolderImages(folderId);
          const coverImage = images.find(
            (img) => parseContext(img.context)?.is_cover === 'true'
          );
          const coverUrl = coverImage
            ? coverImage.secure_url
            : images[0]?.secure_url || null;

          const folderName = images[0]
            ? parseContext(images[0].context)?.folder_name || folderId
            : folderId;

          return {
            id: folderId,
            name: folderName,
            coverImageUrl: coverUrl,
            imageCount: images.length,
            order: index,
          };
        } catch {
          return {
            id: folderId,
            name: folderId,
            coverImageUrl: null,
            imageCount: 0,
            order: index,
          };
        }
      })
    );

    return NextResponse.json(folders);
  } catch (error) {
    console.error('GET /api/folders error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
