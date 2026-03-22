import { NextResponse } from 'next/server';
import { khanateAgentSpawn } from '@/lib/khanate';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ worldId: string; envId: string; projectId: string }> }
) {
  const { worldId, envId, projectId } = await params;
  const body = await request.json();
  const { template, task, agentName } = body;
  
  if (!template) {
    return NextResponse.json({ success: false, error: 'template required' }, { status: 400 });
  }
  
  // Use custom agent name if provided, otherwise fall back to template name
  const agentId = agentName?.trim() || template;
  const result = await khanateAgentSpawn(worldId, envId, projectId, agentId, task, template);
  return NextResponse.json(result);
}
