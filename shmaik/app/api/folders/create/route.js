import { NextResponse } from 'next/server';
import { fetchFolderOrderArray, uploadFolderOrderJson } from '@/lib/googleDrive';
import { slugify } from '@/lib/utils';

export async function POST(request) {
  try {
    const { name } = await request.json();
    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Folder name is required' }, { status: 400 });
    }

    const folderId = `${slugify(name)}-${Date.now()}`;
    const currentOrder = (await fetchFolderOrderArray()) || [];
    const newOrder = [...currentOrder, folderId];

    await uploadFolderOrderJson(newOrder);

    return NextResponse.json({ folderId, name: name.trim() });
  } catch (error) {
    console.error('POST /api/folders/create error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
