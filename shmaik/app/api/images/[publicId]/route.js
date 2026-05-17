import { NextResponse } from 'next/server';
import { deleteImageFromDrive } from '@/lib/googleDrive';

export async function DELETE(request, { params }) {
  try {
    const { publicId } = await params;
    // publicId = Drive file ID (encoded in the URL)
    const fileId = decodeURIComponent(publicId);

    await deleteImageFromDrive(fileId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`DELETE /api/images/[publicId] error for "${params?.publicId}": ${error.message}`);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
