import { NextResponse } from 'next/server';
import { khanateProjectGet, khanate, khanateTemplateList } from '@/lib/khanate';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ worldId: string; envId: string; projectId: string }> }
) {
  const { worldId, envId, projectId } = await params;
  
  try {
    // Get project details
    const projectResult = await khanateProjectGet(worldId, envId, projectId);
    
    // Get running agents for this project
    const agentsResult = await khanate(`agent list ${worldId} ${envId} ${projectId}`);
    
    // Get available templates
    const templatesResult = await khanateTemplateList();
    
    const agents = agentsResult.success && agentsResult.data?.agents
      ? agentsResult.data.agents
      : [];
    
    const templates = templatesResult.success && templatesResult.data?.templates
      ? templatesResult.data.templates
      : [];
    
    return NextResponse.json({
      success: true,
      data: {
        id: projectId,
        name: projectResult.data?.name || projectId,
        description: projectResult.data?.description,
        agents,
        availableTemplates: templates
      }
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch project' }, { status: 500 });
  }
}
