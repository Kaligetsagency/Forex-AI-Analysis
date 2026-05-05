import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  
  if (url.pathname.startsWith('/dashboard') || url.pathname.startsWith('/api/analyze')) {
    
    const token = req.cookies.get('user_session')?.value;
    const isSubscribed = await checkUserSubscriptionStatus(token); 

    if (!isSubscribed) {
      url.pathname = '/pricing';
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

async function checkUserSubscriptionStatus(token: string | undefined) {
  if (!token) return false;
  return true; // placeholder until database integration
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/analyze'],
};
