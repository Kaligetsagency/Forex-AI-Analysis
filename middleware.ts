import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  
  if (url.pathname.startsWith('/dashboard') || url.pathname.startsWith('/api/analyze')) {
    
    // Retrieve the user's session token (e.g., from NextAuth or Supabase cookies)
    const token = req.cookies.get('user_session')?.value;
    
    // Mock validation: check your database if user.isSubscribed === true
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
  // const user = await db.getUser(token);
  // return user?.isSubscribed;
  return true; // placeholder
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/analyze'],
};
