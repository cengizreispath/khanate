import { NextResponse } from 'next/server';

const KHANATE_API = process.env.KHANATE_API_URL || 'http://host.docker.internal:19100';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ agentKey: string }> }
) {
  const { agentKey } = await params;
  const [worldId, envId, projectId, agentId] = decodeURIComponent(agentKey).split('/');
  
  if (!worldId || !envId || !projectId || !agentId) {
    return NextResponse.json({ success: false, error: 'Invalid agent key' }, { status: 400 });
  }
  
  try {
    // Fetch logs from Khanate API
    const url = `${KHANATE_API}/agent/logs?worldId=${worldId}&envId=${envId}&projectId=${projectId}&agentId=${agentId}&limit=100`;
    const res = await fetch(url);
    const result = await res.json();
    
    if (!result.success) {
      return NextResponse.json({ 
        success: false, 
        error: result.error || 'Failed to fetch logs' 
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true, 
      data: { 
        logs: result.data?.logs || [],
        count: result.data?.count || 0
      } 
    });
  } catch (error) {
    console.error('Failed to fetch logs:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch logs' 
    }, { status: 500 });
  }
}
