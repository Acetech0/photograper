import { NextResponse } from 'next/server';
import { cloudinaryPost } from '@/lib/cloudinary';

export async function PATCH(request) {
  try {
    const { folderId, orderedPublicIds } = await request.json();

    if (!Array.isArray(orderedPublicIds)) {
      return NextResponse.json({ error: 'orderedPublicIds must be an array' }, { status: 400 });
    }

    // Update order context for each image in parallel
    await Promise.all(
      orderedPublicIds.map((publicId, index) =>
        cloudinaryPost('/resources/image/context', {
          context: `order=${index}`,
          public_ids: [publicId],
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PATCH /api/images/reorder error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
