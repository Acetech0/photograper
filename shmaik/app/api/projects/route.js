import { NextResponse } from 'next/server';
import { fetchProjectOrderArray, fetchFolderImages } from '@/lib/googleDrive';

export async function GET() {
  try {
    const folderIds = await fetchProjectOrderArray();

    if (!folderIds || folderIds.length === 0) {
      return NextResponse.json([]);
    }

    const folders = await Promise.all(
      folderIds.map(async (folderId, index) => {
        try {
          const images = await fetchFolderImages(folderId);

          const coverFile = images.find(
            (img) => img.appProperties?.is_cover === 'true'
          );
          const coverImage = coverFile || images[0] || null;

          const coverUrl = coverImage
            ? `https://drive.google.com/uc?export=view&id=${coverImage.id}`
            : null;

          const folderName =
            images[0]?.appProperties?.folder_name || folderId;

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
    console.error('GET /api/projects error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
