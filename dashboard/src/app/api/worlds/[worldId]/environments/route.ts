import { NextResponse } from 'next/server';
import { khanate } from '@/lib/khanate';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ worldId: string }> }
) {
  const { worldId } = await params;
  const body = await request.json();
  const { id, name } = body;
  
  if (!id || !name) {
    return NextResponse.json({ success: false, error: 'id and name required' }, { status: 400 });
  }
  
  const result = await khanate(`env create ${worldId} ${id} "${name}"`);
  return NextResponse.json(result);
}
