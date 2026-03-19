import { NextResponse } from 'next/server';
import { khanateAgentStop } from '@/lib/khanate';

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
    const result = await khanateAgentStop(worldId, envId, projectId, agentId);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to stop agent' 
    }, { status: 500 });
  }
}
