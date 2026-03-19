import { NextResponse } from 'next/server';
import { khanate } from '@/lib/khanate';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ worldId: string }> }
) {
  const { worldId } = await params;
  const result = await khanate(`content get world ${worldId}`);
  return NextResponse.json(result);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ worldId: string }> }
) {
  const { worldId } = await params;
  const body = await request.json();
  const { content } = body;
  const escapedContent = Buffer.from(content).toString('base64');
  const result = await khanate(`content set world ${worldId} --base64="${escapedContent}"`);
  return NextResponse.json(result);
}
