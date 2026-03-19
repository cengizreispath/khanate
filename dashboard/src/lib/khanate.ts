import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface KhanateResponse {
  success: boolean;
  message?: string;
  error?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any;
}

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

// Convenience functions
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

export const khanateAgentList = () => khanate('agent list');
export const khanateAgentStatus = () => khanate('agent status');
export const khanateAgentSpawn = (worldId: string, envId: string, projectId: string, agentId: string, task?: string) =>
  khanate(`agent spawn ${worldId} ${envId} ${projectId} ${agentId}${task ? ` "${task}"` : ''}`);
export const khanateAgentStop = (worldId: string, envId: string, projectId: string, agentId: string) =>
  khanate(`agent stop ${worldId} ${envId} ${projectId} ${agentId}`);
