import { NextResponse } from 'next/server';
import { fetchProjectOrderArray, uploadProjectOrderJson } from '@/lib/googleDrive';
import { slugify } from '@/lib/utils';

export async function POST(req) {
  try {
    const { name } = await req.json();
    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Folder name is required' }, { status: 400 });
    }

    const folderId = `${slugify(name)}-${Date.now()}`;
    const currentOrder = (await fetchProjectOrderArray()) || [];
    const newOrder = [...currentOrder, folderId];

    await uploadProjectOrderJson(newOrder);

    return NextResponse.json({ folderId, name: name.trim() });
  } catch (error) {
    console.error('POST /api/projects/create error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
