import { NextResponse } from 'next/server';
import { khanateAgentStop, khanateAgentDelete } from '@/lib/khanate';

// PATCH - Stop agent (keep files)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ worldId: string; envId: string; projectId: string; agentId: string }> }
) {
  const { worldId, envId, projectId, agentId } = await params;
  
  const result = await khanateAgentStop(worldId, envId, projectId, agentId);
  return NextResponse.json(result);
}

// DELETE - Delete agent (remove files)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ worldId: string; envId: string; projectId: string; agentId: string }> }
) {
  const { worldId, envId, projectId, agentId } = await params;
  
  const result = await khanateAgentDelete(worldId, envId, projectId, agentId);
  return NextResponse.json(result);
}
