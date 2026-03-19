import { NextResponse } from 'next/server';
import { khanate } from '@/lib/khanate';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ worldId: string; envId: string; projectId: string }> }
) {
  const { worldId, envId, projectId } = await params;
  const body = await request.json();
  const { name, description, metadata } = body;
  
  // Convert metadata to JSON string for CLI
  const metadataStr = JSON.stringify(metadata || {}).replace(/"/g, '\\"');
  
  const result = await khanate(`project update ${worldId} ${envId} ${projectId} --name="${name}" --description="${description}" --metadata="${metadataStr}"`);
  return NextResponse.json(result);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ worldId: string; envId: string; projectId: string }> }
) {
  const { worldId, envId, projectId } = await params;
  
  const result = await khanate(`project delete ${worldId} ${envId} ${projectId}`);
  return NextResponse.json(result);
}
