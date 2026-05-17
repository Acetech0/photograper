import { NextResponse } from 'next/server';
import {
  deleteAllImagesInFolder,
  fetchProjectOrderArray,
  uploadProjectOrderJson,
} from '@/lib/googleDrive';

export async function DELETE(request, { params }) {
  try {
    const { folderId } = await params;

    // Delete all images and the Drive subfolder
    const deletedCount = await deleteAllImagesInFolder(folderId);

    // Remove from projects_order.json
    const currentOrder = (await fetchProjectOrderArray()) || [];
    const newOrder = currentOrder.filter((id) => id !== folderId);
    await uploadProjectOrderJson(newOrder);

    return NextResponse.json({ success: true, deletedCount });
  } catch (error) {
    console.error('DELETE /api/projects/[folderId] error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
