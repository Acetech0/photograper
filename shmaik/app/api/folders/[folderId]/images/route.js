import { NextResponse } from 'next/server';
import { fetchFolderImages } from '@/lib/googleDrive';

export async function GET(request, { params }) {
  try {
    const { folderId } = await params;
    const files = await fetchFolderImages(folderId);

    const sorted = files
      .map((file) => {
        const props = file.appProperties || {};
        return {
          publicId: file.id, // Drive file ID used as publicId throughout the CMS
          url: `https://drive.google.com/uc?export=view&id=${file.id}`,
          order: parseInt(props.order || '0', 10),
          is_cover: props.is_cover === 'true',
          original_name: props.original_name || file.name || '',
          folder_name: props.folder_name || folderId,
        };
      })
      .sort((a, b) => a.order - b.order);

    return NextResponse.json(sorted);
  } catch (error) {
    console.error('GET /api/folders/[folderId]/images error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
