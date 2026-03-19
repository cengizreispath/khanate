import { NextResponse } from 'next/server';
import { khanateAgentList } from '@/lib/khanate';

export async function GET() {
  try {
    const result = await khanateAgentList();
    
    if (result.success && result.data) {
      return NextResponse.json({
        success: true,
        data: result.data
      });
    }
    
    return NextResponse.json({
      success: true,
      data: []
    });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch agents' 
    }, { status: 500 });
  }
}
