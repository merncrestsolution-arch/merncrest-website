import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const locales = ['en', 'ta', 'si'];
const defaultLocale = 'en';

export function middleware(request: NextRequest) {
  try {
    const locales = ['en', 'ta', 'si'];
    const defaultLocale = 'en';
    const pathname = request.nextUrl.pathname;
    
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
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};
