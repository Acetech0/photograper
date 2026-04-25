import { NextResponse } from 'next/server';
import { fetchFolderImages, fetchFolderOrderArray, uploadFolderOrderJson, cloudinaryPost } from '@/lib/cloudinary';

export async function DELETE(request, { params }) {
  try {
    const { folderId } = await params;

    // Get all images to delete
    const images = await fetchFolderImages(folderId);
    
    if (images.length > 0) {
      const publicIds = images.map((img) => img.public_id);
      
      // Bulk delete all images (in batches of 100)
      const batchSize = 100;
      for (let i = 0; i < publicIds.length; i += batchSize) {
        const batch = publicIds.slice(i, i + batchSize);
        await cloudinaryPost('/resources/image/delete_by_ids', {
          public_ids: batch,
          invalidate: true,
        });
      }
    }

    // Remove from folder_order.json
    const currentOrder = (await fetchFolderOrderArray()) || [];
    const newOrder = currentOrder.filter((id) => id !== folderId);
    await uploadFolderOrderJson(newOrder);

    return NextResponse.json({ success: true, deletedCount: images.length });
  } catch (error) {
    console.error('DELETE /api/folders/[folderId] error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
