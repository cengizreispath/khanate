import { NextResponse } from 'next/server';
import { khanate } from '@/lib/khanate';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ worldId: string; envId: string; projectId: string }> }
) {
  const { worldId, envId, projectId } = await params;
  
  const result = await khanate(`content get project ${worldId} ${envId} ${projectId}`);
  return NextResponse.json(result);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ worldId: string; envId: string; projectId: string }> }
) {
  const { worldId, envId, projectId } = await params;
  const body = await request.json();
  const { content } = body;
  
  // Escape content for CLI
  const escapedContent = Buffer.from(content).toString('base64');
  const result = await khanate(`content set project ${worldId} ${envId} ${projectId} --base64="${escapedContent}"`);
  return NextResponse.json(result);
}
