import { NextResponse } from 'next/server';
import { khanateAgentSpawn } from '@/lib/khanate';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ worldId: string; envId: string; projectId: string }> }
) {
  const { worldId, envId, projectId } = await params;
  const body = await request.json();
  const { template, task } = body;
  
  if (!template) {
    return NextResponse.json({ success: false, error: 'template required' }, { status: 400 });
  }
  
  const result = await khanateAgentSpawn(worldId, envId, projectId, template, task);
  return NextResponse.json(result);
}
