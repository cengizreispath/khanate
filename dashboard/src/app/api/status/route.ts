import { NextResponse } from 'next/server';
import { khanateStatus } from '@/lib/khanate';

export async function GET() {
  const result = await khanateStatus();
  return NextResponse.json(result);
}
