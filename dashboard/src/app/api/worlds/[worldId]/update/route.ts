import { NextResponse } from 'next/server';
import { khanate } from '@/lib/khanate';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ worldId: string }> }
) {
  const { worldId } = await params;
  const body = await request.json();
  const { name, description, metadata } = body;
  const metadataStr = JSON.stringify(metadata || {}).replace(/"/g, '\\"');
  const result = await khanate(`world update ${worldId} --name="${name}" --description="${description}" --metadata="${metadataStr}"`);
  return NextResponse.json(result);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ worldId: string }> }
) {
  const { worldId } = await params;
  const result = await khanate(`world delete ${worldId}`);
  return NextResponse.json(result);
}
