import { NextResponse } from 'next/server';
import { khanateAgentStop } from '@/lib/khanate';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ worldId: string; envId: string; projectId: string; agentId: string }> }
) {
  const { worldId, envId, projectId, agentId } = await params;
  
  const result = await khanateAgentStop(worldId, envId, projectId, agentId);
  return NextResponse.json(result);
}
