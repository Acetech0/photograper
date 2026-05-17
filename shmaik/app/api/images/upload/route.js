/**
 * POST /api/images/upload
 * Accepts multipart/form-data with fields:
 *   - file        : the image file
 *   - folderId    : gallery slug/id
 *   - folderName  : human-readable folder name
 *   - orderIndex  : integer position in the gallery
 *   - isCover     : 'true' | 'false'
 *
 * Returns: { fileId, url, publicId }
 * (publicId === fileId for Drop-in compatibility with set-cover / delete APIs)
 */
import { NextResponse } from 'next/server';
import { uploadImageToDrive, validateFile } from '@/lib/googleDrive';

export const runtime = 'nodejs'; // ensure Node.js runtime for stream support

export async function POST(request) {
  let fileName = 'unknown';
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const folderId = formData.get('folderId') || 'uncategorised';
    const folderName = formData.get('folderName') || folderId;
    const orderIndex = parseInt(formData.get('orderIndex') || '0', 10);
    const isCover = formData.get('isCover') === 'true';

    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    fileName = file.name || 'upload';
    const mimeType = file.type || 'image/jpeg';
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Validate type & size (throws on failure)
    validateFile(mimeType, buffer.length, fileName);

    const { fileId, url } = await uploadImageToDrive({
      buffer,
      mimeType,
      fileName,
      folderId,
      folderName,
      orderIndex,
      isCover,
    });

    return NextResponse.json({
      fileId,
      url,
      publicId: fileId, // keep 'publicId' key so frontend code is compatible
    });
  } catch (error) {
    console.error(`[Upload] Failed for file="${fileName}": ${error.message}`);
    return NextResponse.json(
      { error: `Upload failed for "${fileName}": ${error.message}` },
      { status: 500 }
    );
  }
}
