import { NextResponse } from 'next/server';
import { fetchFolderImages, cloudinaryPost } from '@/lib/cloudinary';
import { parseContext } from '@/lib/utils';

export async function PATCH(request, { params }) {
  try {
    const { publicId } = await params;
    const { folderId } = await request.json();
    const decodedPublicId = decodeURIComponent(publicId);

    // Get all images in the folder
    const images = await fetchFolderImages(folderId);

    // Set is_cover=false for all images
    await cloudinaryPost('/resources/image/context', {
      context: 'is_cover=false',
      public_ids: images.map((img) => img.public_id),
    });

    // Set is_cover=true for the target image
    await cloudinaryPost('/resources/image/context', {
      context: 'is_cover=true',
      public_ids: [decodedPublicId],
    });

    // Find the new cover URL
    const coverImage = images.find((img) => img.public_id === decodedPublicId);
    const newCoverUrl = coverImage?.secure_url || null;

    return NextResponse.json({ success: true, newCoverUrl });
  } catch (error) {
    console.error('PATCH /api/images/[publicId]/set-cover error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
