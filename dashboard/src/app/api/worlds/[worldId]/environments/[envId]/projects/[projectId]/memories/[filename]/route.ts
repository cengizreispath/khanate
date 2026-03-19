import { NextResponse } from 'next/server';
import { khanate } from '@/lib/khanate';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ worldId: string; envId: string; projectId: string; filename: string }> }
) {
  const { worldId, envId, projectId, filename } = await params;
  
  const result = await khanate(`memory get project ${worldId} ${envId} ${projectId} ${filename}`);
  return NextResponse.json(result);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ worldId: string; envId: string; projectId: string; filename: string }> }
) {
  const { worldId, envId, projectId, filename } = await params;
  const body = await request.json();
  const { content } = body;
  
  const escapedContent = Buffer.from(content).toString('base64');
  const result = await khanate(`memory set project ${worldId} ${envId} ${projectId} ${filename} --base64="${escapedContent}"`);
  return NextResponse.json(result);
}
