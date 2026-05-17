import { NextResponse } from 'next/server';
import {
  fetchFolderImages,
  deleteAllImagesInFolder,
  fetchFolderOrderArray,
  uploadFolderOrderJson,
} from '@/lib/googleDrive';

export async function DELETE(request, { params }) {
  try {
    const { folderId } = await params;

    // Delete all images and the Drive subfolder
    const deletedCount = await deleteAllImagesInFolder(folderId);

    // Remove from folder_order.json
    const currentOrder = (await fetchFolderOrderArray()) || [];
    const newOrder = currentOrder.filter((id) => id !== folderId);
    await uploadFolderOrderJson(newOrder);

    return NextResponse.json({ success: true, deletedCount });
  } catch (error) {
    console.error('DELETE /api/folders/[folderId] error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
