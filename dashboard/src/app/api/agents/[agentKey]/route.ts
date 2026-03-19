import { NextResponse } from 'next/server';
import { khanate } from '@/lib/khanate';
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
    // Get agent status from registry
    const statusResult = await khanate(`agent status ${worldId} ${envId} ${projectId} ${agentId}`);
    
    // Get agent config from file
    const agentPath = path.join(DATA_DIR, 'worlds', worldId, 'environments', envId, 
                                'projects', projectId, 'agents', agentId);
    const agentFile = path.join(agentPath, 'AGENT.md');
    
    let config = null;
    let content = '';
    
    try {
      content = await fs.readFile(agentFile, 'utf-8');
      
      // Parse frontmatter
      if (content.startsWith('---')) {
        const parts = content.split('---');
        if (parts.length >= 3) {
          const yaml = await import('yaml');
          config = {
            metadata: yaml.parse(parts[1]),
            body: parts.slice(2).join('---').trim()
          };
        }
      }
    } catch {
      // File doesn't exist
    }
    
    return NextResponse.json({
      success: true,
      data: {
        instance: statusResult.success ? statusResult.data?.agent || statusResult.data : null,
        config,
        content
      }
    });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch agent' 
    }, { status: 500 });
  }
}
