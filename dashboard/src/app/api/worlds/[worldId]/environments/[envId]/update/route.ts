import { NextResponse } from 'next/server';
import { khanate } from '@/lib/khanate';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ worldId: string; envId: string }> }
) {
  const { worldId, envId } = await params;
  const body = await request.json();
  const { name, description, metadata } = body;
  const metadataStr = JSON.stringify(metadata || {}).replace(/"/g, '\\"');
  const result = await khanate(`env update ${worldId} ${envId} --name="${name}" --description="${description}" --metadata="${metadataStr}"`);
  return NextResponse.json(result);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ worldId: string; envId: string }> }
) {
  const { worldId, envId } = await params;
  const result = await khanate(`env delete ${worldId} ${envId}`);
  return NextResponse.json(result);
}
