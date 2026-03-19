import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const KHANATE_TOKEN = process.env.KHANATE_TOKEN || 'khanate-secret-2026';

export async function POST(request: Request) {
  try {
    const { token } = await request.json();

    if (token === KHANATE_TOKEN) {
      const cookieStore = await cookies();
      cookieStore.set('khanate-auth', KHANATE_TOKEN, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 });
  }
}
