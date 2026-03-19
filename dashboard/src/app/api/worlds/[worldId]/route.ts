import { NextResponse } from 'next/server';
import { khanateWorldGet, khanateEnvList } from '@/lib/khanate';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ worldId: string }> }
) {
  const { worldId } = await params;
  
  try {
    // Get world details
    const worldResult = await khanateWorldGet(worldId);
    
    // Get environments
    const envResult = await khanateEnvList(worldId);
    
    const environments = envResult.success && envResult.data?.environments 
      ? envResult.data.environments.map((id: string) => ({ id, name: id }))
      : [];
    
    return NextResponse.json({
      success: true,
      data: {
        id: worldId,
        name: worldResult.data?.name || worldId,
        environments
      }
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch world' }, { status: 500 });
  }
}
