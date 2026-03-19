import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const DATA_DIR = process.env.KHANATE_DATA_DIR || '/data';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ agentKey: string; filename: string }> }
) {
  const { agentKey, filename } = await params;
  const [worldId, envId, projectId, agentId] = decodeURIComponent(agentKey).split('/');
  
  if (!worldId || !envId || !projectId || !agentId) {
    return NextResponse.json({ success: false, error: 'Invalid agent key' }, { status: 400 });
  }
  
  try {
    const filePath = path.join(DATA_DIR, 'worlds', worldId, 'environments', envId, 
                               'projects', projectId, 'agents', agentId, 'memory', filename);
    
    const content = await fs.readFile(filePath, 'utf-8');
    return NextResponse.json({ success: true, data: { content } });
  } catch {
    return NextResponse.json({ success: false, error: 'File not found' }, { status: 404 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ agentKey: string; filename: string }> }
) {
  const { agentKey, filename } = await params;
  const [worldId, envId, projectId, agentId] = decodeURIComponent(agentKey).split('/');
  
  if (!worldId || !envId || !projectId || !agentId) {
    return NextResponse.json({ success: false, error: 'Invalid agent key' }, { status: 400 });
  }
  
  try {
    const body = await request.json();
    const { content } = body;
    
    const memoryPath = path.join(DATA_DIR, 'worlds', worldId, 'environments', envId, 
                                  'projects', projectId, 'agents', agentId, 'memory');
    
    await fs.mkdir(memoryPath, { recursive: true });
    await fs.writeFile(path.join(memoryPath, filename), content, 'utf-8');
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to save memory' 
    }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ agentKey: string; filename: string }> }
) {
  const { agentKey, filename } = await params;
  const [worldId, envId, projectId, agentId] = decodeURIComponent(agentKey).split('/');
  
  if (!worldId || !envId || !projectId || !agentId) {
    return NextResponse.json({ success: false, error: 'Invalid agent key' }, { status: 400 });
  }
  
  try {
    const filePath = path.join(DATA_DIR, 'worlds', worldId, 'environments', envId, 
                               'projects', projectId, 'agents', agentId, 'memory', filename);
    
    await fs.unlink(filePath);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to delete' }, { status: 500 });
  }
}
