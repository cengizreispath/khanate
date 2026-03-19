import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const DATA_DIR = process.env.KHANATE_DATA_DIR || '/data';

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
    const agentFile = path.join(DATA_DIR, 'worlds', worldId, 'environments', envId, 
                                'projects', projectId, 'agents', agentId, 'AGENT.md');
    
    const content = await fs.readFile(agentFile, 'utf-8');
    return NextResponse.json({ success: true, data: { content } });
  } catch {
    return NextResponse.json({ success: true, data: { content: '' } });
  }
}

export async function PUT(
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
    const { content } = body;
    
    const agentPath = path.join(DATA_DIR, 'worlds', worldId, 'environments', envId, 
                                'projects', projectId, 'agents', agentId);
    const agentFile = path.join(agentPath, 'AGENT.md');
    
    // Ensure directory exists
    await fs.mkdir(agentPath, { recursive: true });
    
    // Write content
    await fs.writeFile(agentFile, content, 'utf-8');
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to save content' 
    }, { status: 500 });
  }
}
