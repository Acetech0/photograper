import { NextResponse } from 'next/server';
import { updateImageProperties } from '@/lib/googleDrive';

export async function PATCH(request) {
  try {
    const { folderId, orderedPublicIds } = await request.json();

    if (!Array.isArray(orderedPublicIds)) {
      return NextResponse.json({ error: 'orderedPublicIds must be an array' }, { status: 400 });
    }

    // Update order appProperty for each image (publicId = Drive file ID)
    await Promise.all(
      orderedPublicIds.map((fileId, index) =>
        updateImageProperties(fileId, { order: String(index) })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PATCH /api/images/reorder error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
