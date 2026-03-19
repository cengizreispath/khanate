import { NextResponse } from 'next/server';

const KHANATE_API_URL = process.env.KHANATE_API_URL || 'http://host.docker.internal:19100';

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
    
    if (!task) {
      return NextResponse.json({ success: false, error: 'task required' }, { status: 400 });
    }
    
    // Use spawn endpoint - it handles existing sessions and writes logs
    const res = await fetch(`${KHANATE_API_URL}/agent/spawn`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        worldId, 
        envId, 
        projectId, 
        agentId,
        task 
      }),
    });
    
    const result = await res.json();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to send task' 
    }, { status: 500 });
  }
}
