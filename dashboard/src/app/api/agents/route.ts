import { NextResponse } from 'next/server';
import { khanateAgentStatus } from '@/lib/khanate';

export async function GET() {
  const result = await khanateAgentStatus();
  return NextResponse.json(result);
}
