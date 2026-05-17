/**
 * lib/googleDrive.js
 * Google Drive API v3 — service account integration.
 *
 * Environment variables required (server-side only):
 *   GOOGLE_SERVICE_ACCOUNT_KEY  — full JSON string of the service account key file
 *   GOOGLE_DRIVE_FOLDER_ID      — Drive folder ID that the service account can write to
 */

import { google } from 'googleapis';
import { Readable } from 'stream';

// ─── Auth ──────────────────────────────────────────────────────────────────

function getAuth() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!raw) throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY env var is not set');

  const credentials = JSON.parse(raw);
  return new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/drive'],
  });
}

function getDrive() {
  return google.drive({ version: 'v3', auth: getAuth() });
}

const ROOT_FOLDER_ID = () => {
  const id = process.env.GOOGLE_DRIVE_FOLDER_ID;
  if (!id) throw new Error('GOOGLE_DRIVE_FOLDER_ID env var is not set');
  return id;
};

// ─── Public URL helper ─────────────────────────────────────────────────────

export function driveUrl(fileId) {
  return `https://drive.google.com/uc?export=view&id=${fileId}`;
}

// ─── Allowed file types ────────────────────────────────────────────────────

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
]);
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export function validateFile(mimeType, sizeBytes, fileName) {
  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    throw new Error(`File "${fileName}": type "${mimeType}" is not allowed. Accepted: jpg, jpeg, png, webp, gif`);
  }
  if (sizeBytes > MAX_FILE_SIZE_BYTES) {
    throw new Error(`File "${fileName}": size ${(sizeBytes / 1024 / 1024).toFixed(1)} MB exceeds 10 MB limit`);
  }
}

// ─── Folder helpers ────────────────────────────────────────────────────────

/**
 * Get or create a Drive subfolder inside the root gallery folder.
 * @param {string} folderId  Logical folder slug/id used as the folder name in Drive.
 * @returns {string} Drive folder ID
 */
export async function getOrCreateDriveFolder(folderId) {
  const drive = getDrive();
  const rootId = ROOT_FOLDER_ID();

  // Search for existing subfolder
  const res = await drive.files.list({
    q: `name='${folderId}' and mimeType='application/vnd.google-apps.folder' and '${rootId}' in parents and trashed=false`,
    fields: 'files(id)',
    spaces: 'drive',
  });

  if (res.data.files?.length > 0) {
    return res.data.files[0].id;
  }

  // Create new subfolder
  const created = await drive.files.create({
    requestBody: {
      name: folderId,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [rootId],
    },
    fields: 'id',
  });

  return created.data.id;
}

// ─── Image Upload ──────────────────────────────────────────────────────────

/**
 * Upload an image buffer/blob to Google Drive.
 * @param {Object} opts
 * @param {Buffer}  opts.buffer       - Image data
 * @param {string}  opts.mimeType     - MIME type (e.g. "image/webp")
 * @param {string}  opts.fileName     - Original file name
 * @param {string}  opts.folderId     - Logical gallery folder slug
 * @param {string}  opts.folderName   - Human-readable gallery name
 * @param {number}  opts.orderIndex   - Position in folder
 * @param {boolean} [opts.isCover]    - Whether this is the cover image
 * @returns {{ fileId: string, url: string }}
 */
export async function uploadImageToDrive({
  buffer,
  mimeType,
  fileName,
  folderId,
  folderName,
  orderIndex,
  isCover = false,
}) {
  validateFile(mimeType, buffer.length, fileName);

  const drive = getDrive();
  const driveFolderId = await getOrCreateDriveFolder(folderId);

  const stream = Readable.from(buffer);

  const response = await drive.files.create({
    requestBody: {
      name: fileName,
      parents: [driveFolderId],
      // Store metadata in appProperties — Drive's native key-value store per file
      appProperties: {
        folder_id: folderId,
        folder_name: folderName || folderId,
        is_cover: String(isCover),
        order: String(orderIndex),
        original_name: fileName,
      },
    },
    media: {
      mimeType,
      body: stream,
    },
    fields: 'id, name',
  });

  const fileId = response.data.id;

  // Make the file publicly readable
  await drive.permissions.create({
    fileId,
    requestBody: { role: 'reader', type: 'anyone' },
  });

  console.log(`[Drive] Uploaded "${fileName}" → fileId=${fileId}`);
  return { fileId, url: driveUrl(fileId) };
}

// ─── Fetch folder images ───────────────────────────────────────────────────

/**
 * List all images in a logical gallery folder.
 * Returns array sorted by appProperties.order ascending.
 */
export async function fetchFolderImages(folderId) {
  const drive = getDrive();

  // First, find the Drive subfolder
  const folderRes = await drive.files.list({
    q: `name='${folderId}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: 'files(id)',
    spaces: 'drive',
  });

  if (!folderRes.data.files?.length) return [];
  const driveFolderId = folderRes.data.files[0].id;

  // List all image files in it
  const filesRes = await drive.files.list({
    q: `'${driveFolderId}' in parents and mimeType contains 'image/' and trashed=false`,
    fields: 'files(id, name, appProperties)',
    spaces: 'drive',
    pageSize: 500,
  });

  return filesRes.data.files || [];
}

// ─── Delete image ──────────────────────────────────────────────────────────

/**
 * Permanently delete a file from Drive by its fileId.
 */
export async function deleteImageFromDrive(fileId) {
  try {
    const drive = getDrive();
    await drive.files.delete({ fileId });
    console.log(`[Drive] Deleted fileId=${fileId}`);
  } catch (err) {
    console.error(`[Drive] Failed to delete fileId=${fileId}: ${err.message}`);
    throw new Error(`Drive delete failed for ${fileId}: ${err.message}`);
  }
}

/**
 * Delete all images in a logical gallery folder.
 * @returns {number} count of deleted files
 */
export async function deleteAllImagesInFolder(folderId) {
  const files = await fetchFolderImages(folderId);
  await Promise.all(files.map((f) => deleteImageFromDrive(f.id)));

  // Also delete the Drive subfolder itself
  try {
    const drive = getDrive();
    const folderRes = await drive.files.list({
      q: `name='${folderId}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id)',
    });
    if (folderRes.data.files?.length) {
      await drive.files.delete({ fileId: folderRes.data.files[0].id });
    }
  } catch {
    // Non-fatal — folder may already be gone
  }

  return files.length;
}

// ─── Update image appProperties (metadata) ────────────────────────────────

/**
 * Patch appProperties on a Drive file.
 * @param {string} fileId
 * @param {Object} props   key-value pairs to merge in
 */
export async function updateImageProperties(fileId, props) {
  const drive = getDrive();
  await drive.files.update({
    fileId,
    requestBody: { appProperties: props },
  });
}

// ─── Folder order JSON ────────────────────────────────────────────────────

const ORDER_FILE_NAME = 'folder_order.json';

async function findOrderFile(drive) {
  const rootId = ROOT_FOLDER_ID();
  const res = await drive.files.list({
    q: `name='${ORDER_FILE_NAME}' and '${rootId}' in parents and trashed=false`,
    fields: 'files(id)',
  });
  return res.data.files?.[0]?.id || null;
}

/**
 * Read the folder order array from Drive.
 * Returns null if not found.
 */
export async function fetchFolderOrderArray() {
  try {
    const drive = getDrive();
    const fileId = await findOrderFile(drive);
    if (!fileId) return null;

    const res = await drive.files.get(
      { fileId, alt: 'media' },
      { responseType: 'text' }
    );
    const content = typeof res.data === 'string' ? res.data : JSON.stringify(res.data);
    const parsed = JSON.parse(content);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * Write/overwrite the folder order array to Drive.
 */
export async function uploadFolderOrderJson(orderedIds) {
  const drive = getDrive();
  const rootId = ROOT_FOLDER_ID();
  const json = JSON.stringify(orderedIds);
  const stream = Readable.from([json]);

  const existingId = await findOrderFile(drive);

  if (existingId) {
    // Update existing file
    await drive.files.update({
      fileId: existingId,
      media: { mimeType: 'application/json', body: stream },
    });
    console.log('[Drive] Updated folder_order.json');
  } else {
    // Create new file
    await drive.files.create({
      requestBody: {
        name: ORDER_FILE_NAME,
        parents: [rootId],
        mimeType: 'application/json',
      },
      media: { mimeType: 'application/json', body: stream },
    });
    console.log('[Drive] Created folder_order.json');
  }
}
