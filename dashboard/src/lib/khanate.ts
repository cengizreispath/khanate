import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Host API URL (khanate-api.py runs on host:19100)
// In Docker: use host.docker.internal or the host's IP
const KHANATE_API_URL = process.env.KHANATE_API_URL || 'http://host.docker.internal:19100';

export interface KhanateResponse {
  success: boolean;
  message?: string;
  error?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any;
}

// CLI-based commands (for local operations that don't need clawdbot)
export async function khanate(command: string): Promise<KhanateResponse> {
  try {
    const { stdout, stderr } = await execAsync(`/usr/local/bin/khanate ${command}`);
    
    if (stderr) {
      console.error('Khanate stderr:', stderr);
    }
    
    const result = JSON.parse(stdout);
    return result;
  } catch (error) {
    console.error('Khanate error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// HTTP API-based commands (for operations that need clawdbot on host)
async function khanateHttp(path: string, method: 'GET' | 'POST' = 'GET', body?: Record<string, unknown>): Promise<KhanateResponse> {
  try {
    const options: RequestInit = {
      method,
      headers: { 'Content-Type': 'application/json' },
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const res = await fetch(`${KHANATE_API_URL}${path}`, options);
    const data = await res.json();
    return data;
  } catch (error) {
    console.error('Khanate HTTP error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Template operations - HTTP based (CLI not available in container)
export const khanateTemplateList = () => khanateHttp('/templates');

// Convenience functions - CLI based (local operations)
export const khanateStatus = () => khanate('status');
export const khanateWorldList = () => khanate('world list');
export const khanateWorldGet = (id: string) => khanate(`world get ${id}`);
export const khanateWorldCreate = (id: string, name: string) => khanate(`world create ${id} "${name}"`);

export const khanateEnvList = (worldId: string) => khanate(`env list ${worldId}`);
export const khanateEnvGet = (worldId: string, envId: string) => khanate(`env get ${worldId} ${envId}`);

export const khanateProjectList = (worldId: string, envId: string) => 
  khanate(`project list ${worldId} ${envId}`);
export const khanateProjectGet = (worldId: string, envId: string, projectId: string) => 
  khanate(`project get ${worldId} ${envId} ${projectId}`);

// Agent operations - HTTP based (need clawdbot on host)
export const khanateAgentList = () => khanateHttp('/agents');
export const khanateAgentStatus = () => khanateHttp('/agents');

export const khanateAgentSpawn = (
  worldId: string, 
  envId: string, 
  projectId: string, 
  agentId: string, 
  task?: string, 
  template?: string
) => khanateHttp('/agent/spawn', 'POST', {
  worldId,
  envId,
  projectId,
  agentId,
  task: task || '',
  template: template || undefined
});

export const khanateAgentStop = (
  worldId: string, 
  envId: string, 
  projectId: string, 
  agentId: string
) => khanateHttp('/agent/stop', 'POST', {
  worldId,
  envId,
  projectId,
  agentId
});

export const khanateAgentDelete = (
  worldId: string, 
  envId: string, 
  projectId: string, 
  agentId: string
) => khanateHttp('/agent/delete', 'POST', {
  worldId,
  envId,
  projectId,
  agentId
});
