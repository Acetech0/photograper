import { NextResponse } from 'next/server';
import { updateImageProperties, fetchFolderImages } from '@/lib/googleDrive';

export async function PATCH(request, { params }) {
  try {
    const { publicId } = await params;
    const { folderId } = await request.json();
    const fileId = decodeURIComponent(publicId);

    // Get all images in the folder
    const images = await fetchFolderImages(folderId);

    // Clear is_cover on all images in the folder
    await Promise.all(
      images.map((img) => updateImageProperties(img.id, { is_cover: 'false' }))
    );

    // Set is_cover=true on the target image
    await updateImageProperties(fileId, { is_cover: 'true' });

    const newCoverUrl = `https://drive.google.com/uc?export=view&id=${fileId}`;
    return NextResponse.json({ success: true, newCoverUrl });
  } catch (error) {
    console.error('PATCH /api/images/[publicId]/set-cover error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
