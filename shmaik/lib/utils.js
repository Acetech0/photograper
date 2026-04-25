// Utility: Slugify a string for use as folderId
export function slugify(str) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

// Parse Cloudinary context string into an object
// Cloudinary context: "key1=value1|key2=value2"
export function parseContext(contextObj) {
  if (!contextObj || !contextObj.custom) return {};
  return contextObj.custom;
}
