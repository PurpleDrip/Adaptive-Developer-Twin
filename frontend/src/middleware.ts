import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Public paths
  if (pathname === '/login' || pathname === '/' || pathname === '/register' || pathname === '/tech' || pathname.startsWith('/tech/')) {
    return NextResponse.next();
  }

  // Get user from cookie
  const adtUserCookie = request.cookies.get('adt_user');

  if (!adtUserCookie) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    const user = JSON.parse(decodeURIComponent(adtUserCookie.value));
    const role = user.role;

    // RBAC Redirections
    if (pathname.startsWith('/tech') && role !== 'tech') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    if (pathname.startsWith('/project-manager') && (role !== 'manager' && role !== 'PM')) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  } catch (e) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/project-manager/:path*',
    '/tech/:path*',
    '/tech',
    '/project-manager'
  ],
};
