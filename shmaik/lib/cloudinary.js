import crypto from 'node:crypto';

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const API_KEY = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;

function getAuthHeader() {
  const credentials = Buffer.from(`${API_KEY}:${API_SECRET}`).toString('base64');
  return `Basic ${credentials}`;
}

export async function cloudinaryGet(path) {
  const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}${path}`;
  const res = await fetch(url, {
    headers: { Authorization: getAuthHeader() },
    cache: 'no-store',
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Cloudinary GET ${path} failed: ${res.status} ${text}`);
  }
  return res.json();
}

export async function cloudinaryDelete(publicIds, invalidate = true) {
  // Cloudinary Admin API: DELETE /resources/image/upload with public_ids[] query params
  const qs = publicIds.map((id) => `public_ids[]=${encodeURIComponent(id)}`).join('&');
  const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/resources/image/upload?${qs}&invalidate=${invalidate}`;
  const res = await fetch(url, {
    method: 'DELETE',
    headers: { Authorization: getAuthHeader() },
    cache: 'no-store',
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Cloudinary DELETE resources failed: ${res.status} ${text}`);
  }
  return res.json();
}

export async function cloudinaryPost(path, body) {
  const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}${path}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: getAuthHeader(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    cache: 'no-store',
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Cloudinary POST ${path} failed: ${res.status} ${text}`);
  }
  return res.json();
}

// Fetch all images in a folder via Admin API
export async function fetchFolderImages(folderId) {
  const encodedPrefix = encodeURIComponent(`galleries/${folderId}`);
  const path = `/resources/image/upload?prefix=galleries/${folderId}&max_results=500&context=true`;
  try {
    const data = await cloudinaryGet(path);
    return data.resources || [];
  } catch {
    return [];
  }
}

// Upload a JSON array as a raw file to Cloudinary (with signature auth)
export async function uploadFolderOrderJson(orderedIds) {
  const json = JSON.stringify(orderedIds);
  const timestamp = Math.floor(Date.now() / 1000).toString();

  const paramsToSign = {
    invalidate: 'true',
    overwrite: 'true',
    public_id: 'galleries/meta/folder_order',
    timestamp,
  };

  // Build signature string (sorted alphabetically)
  const signatureString =
    Object.entries(paramsToSign)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join('&') + API_SECRET;

  const signature = crypto.createHash('sha256').update(signatureString).digest('hex');

  const formData = new FormData();
  formData.append('file', new Blob([json], { type: 'application/json' }));
  formData.append('api_key', API_KEY);
  formData.append('timestamp', timestamp);
  formData.append('public_id', 'galleries/meta/folder_order');
  formData.append('overwrite', 'true');
  formData.append('invalidate', 'true');
  formData.append('signature', signature);

  const uploadRes = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/raw/upload`,
    { method: 'POST', body: formData }
  );

  if (!uploadRes.ok) {
    const text = await uploadRes.text();
    throw new Error(`Failed to upload folder_order.json: ${uploadRes.status} ${text}`);
  }

  return uploadRes.json();
}

// Fetch the folder order array from Cloudinary
export async function fetchFolderOrderArray() {
  try {
    // First get the resource metadata to get the secure_url
    const resourcePath = `/resources/raw/upload/galleries/meta/folder_order`;
    const resource = await cloudinaryGet(resourcePath);

    if (!resource.secure_url) return null;

    // Add cache-buster to avoid CDN caching
    const fileUrl = `${resource.secure_url}?_t=${Date.now()}`;
    const fileRes = await fetch(fileUrl, { cache: 'no-store' });
    if (!fileRes.ok) return null;

    const content = await fileRes.json();
    return Array.isArray(content) ? content : null;
  } catch {
    return null;
  }
}
