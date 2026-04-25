import { NextResponse } from 'next/server';
import { cloudinaryDelete } from '@/lib/cloudinary';

export async function DELETE(request, { params }) {
  try {
    const { publicId } = await params;
    const decodedPublicId = decodeURIComponent(publicId);

    await cloudinaryDelete([decodedPublicId], true);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/images/[publicId] error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
