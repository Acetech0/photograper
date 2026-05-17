import { NextResponse } from 'next/server';
import { fetchFolderImages, updateImageProperties } from '@/lib/googleDrive';

export async function PATCH(request, { params }) {
  try {
    const { folderId } = await params;
    const { newName } = await request.json();

    if (!newName || !newName.trim()) {
      return NextResponse.json({ error: 'New name is required' }, { status: 400 });
    }

    const images = await fetchFolderImages(folderId);
    if (images.length === 0) {
      return NextResponse.json({ success: true, updated: 0 });
    }

    // Update folder_name appProperty on all images in the folder
    await Promise.all(
      images.map((img) =>
        updateImageProperties(img.id, { folder_name: newName.trim() })
      )
    );

    return NextResponse.json({ success: true, updated: images.length });
  } catch (error) {
    console.error('PATCH /api/folders/[folderId]/rename error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
