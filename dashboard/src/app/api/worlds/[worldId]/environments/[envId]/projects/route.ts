import { NextResponse } from 'next/server';
import { khanate } from '@/lib/khanate';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ worldId: string; envId: string }> }
) {
  const { worldId, envId } = await params;
  const body = await request.json();
  const { id, name } = body;
  
  if (!id || !name) {
    return NextResponse.json({ success: false, error: 'id and name required' }, { status: 400 });
  }
  
  const result = await khanate(`project create ${worldId} ${envId} ${id} "${name}"`);
  return NextResponse.json(result);
}
