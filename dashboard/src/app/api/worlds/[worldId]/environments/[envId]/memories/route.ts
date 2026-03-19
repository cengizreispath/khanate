import { NextResponse } from 'next/server';
import { khanate } from '@/lib/khanate';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ worldId: string; envId: string }> }
) {
  const { worldId, envId } = await params;
  const result = await khanate(`memory list environment ${worldId} ${envId}`);
  return NextResponse.json(result);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ worldId: string; envId: string }> }
) {
  const { worldId, envId } = await params;
  const body = await request.json();
  const { content } = body;
  const escapedContent = content.replace(/"/g, '\\"').replace(/\n/g, '\\n');
  const result = await khanate(`memory add environment ${worldId} ${envId} "${escapedContent}"`);
  return NextResponse.json(result);
}
