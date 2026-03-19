import { NextResponse } from 'next/server';
import { khanateWorldList, khanateWorldCreate } from '@/lib/khanate';

export async function GET() {
  const result = await khanateWorldList();
  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { id, name } = body;
  
  if (!id || !name) {
    return NextResponse.json({ success: false, error: 'id and name required' }, { status: 400 });
  }
  
  const result = await khanateWorldCreate(id, name);
  return NextResponse.json(result);
}
