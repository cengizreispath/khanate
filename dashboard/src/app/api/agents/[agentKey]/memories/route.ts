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
    const memoryPath = path.join(DATA_DIR, 'worlds', worldId, 'environments', envId, 
                                  'projects', projectId, 'agents', agentId, 'memory');
    
    // Ensure directory exists
    await fs.mkdir(memoryPath, { recursive: true });
    
    const files = await fs.readdir(memoryPath);
    const memories = files
      .filter(f => f.endsWith('.md'))
      .map(f => ({
        filename: f,
        path: path.join(memoryPath, f)
      }));
    
    return NextResponse.json({ success: true, data: { memories } });
  } catch {
    return NextResponse.json({ success: true, data: { memories: [] } });
  }
}

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
    const { filename, content } = body;
    
    if (!filename) {
      return NextResponse.json({ success: false, error: 'filename required' }, { status: 400 });
    }
    
    const memoryPath = path.join(DATA_DIR, 'worlds', worldId, 'environments', envId, 
                                  'projects', projectId, 'agents', agentId, 'memory');
    
    await fs.mkdir(memoryPath, { recursive: true });
    await fs.writeFile(path.join(memoryPath, filename), content || '', 'utf-8');
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to create memory' 
    }, { status: 500 });
  }
}
