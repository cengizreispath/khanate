import { NextResponse } from 'next/server';
import { khanateEnvGet, khanateProjectList } from '@/lib/khanate';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ worldId: string; envId: string }> }
) {
  const { worldId, envId } = await params;
  
  try {
    // Get environment details
    const envResult = await khanateEnvGet(worldId, envId);
    
    // Get projects
    const projectResult = await khanateProjectList(worldId, envId);
    
    const projects = projectResult.success && projectResult.data?.projects
      ? projectResult.data.projects.map((id: string) => ({ id, name: id }))
      : [];
    
    return NextResponse.json({
      success: true,
      data: {
        id: envId,
        name: envResult.data?.name || envId,
        projects
      }
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch environment' }, { status: 500 });
  }
}
