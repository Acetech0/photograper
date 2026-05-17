import { NextResponse } from 'next/server';
import { uploadProjectOrderJson } from '@/lib/googleDrive';

export async function PATCH(request) {
  try {
    const { orderedIds } = await request.json();
    if (!Array.isArray(orderedIds)) {
      return NextResponse.json({ error: 'orderedIds must be an array' }, { status: 400 });
    }
    await uploadProjectOrderJson(orderedIds);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PATCH /api/projects/reorder error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
