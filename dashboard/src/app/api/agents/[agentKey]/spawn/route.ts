import { NextResponse } from 'next/server';
import { khanateAgentSpawn } from '@/lib/khanate';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ agentKey: string }> }
) {
  const { agentKey } = await params;
  const [worldId, envId, projectId, agentId] = decodeURIComponent(agentKey).split('/');
  
  if (!worldId || !envId || !projectId || !agentId) {
    return NextResponse.json({ success: false, error: 'Invalid agent key' }, { status: 400 });
  }
  
  try {
    const body = await request.json();
    const { task } = body;
    
    const result = await khanateAgentSpawn(worldId, envId, projectId, agentId, task);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to spawn agent' 
    }, { status: 500 });
  }
}
