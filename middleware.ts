import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const locales = ['en', 'ta', 'si'];
const defaultLocale = 'en';

export function middleware(request: NextRequest) {
  try {
    const pathname = request.nextUrl.pathname;

    // Filter out API, internal paths, and static files directly in code
    // to bypass Vercel Edge Runtime regex matcher crashes
    if (
      pathname.startsWith('/_next') ||
      pathname.startsWith('/api') ||
      pathname.startsWith('/_vercel') ||
      pathname.includes('.')
    ) {
      return NextResponse.next();
    }
    
    const locales = ['en', 'ta', 'si'];
    const defaultLocale = 'en';
    
    const pathnameHasLocale = locales.some(
      (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
    );

    if (pathnameHasLocale) {
      return NextResponse.next();
    }

    const locale = defaultLocale;
    request.nextUrl.pathname = `/${locale}${pathname}`;
    return NextResponse.redirect(request.nextUrl);
  } catch (error: any) {
    return new NextResponse(`Middleware Error: ${error.message}\n${error.stack}`, { status: 500 });
  }
}

export const config = {
  matcher: [
    // Match all pathnames except for
    // - … if they start with `/api`, `/_next` or `/_vercel`
    // - … the ones containing a dot (e.g. `favicon.ico`)
    '/((?!api|_next|_vercel|.*\\..*).*)',
  ]
};
