import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  detectLocaleFromAcceptLanguage,
  isLocale,
} from "@/i18n/config";

const PROTECTED = ["/dashboard", "/pets", "/settings"];
const AUTH_PAGES = ["/login", "/signup"];
const ONE_YEAR = 60 * 60 * 24 * 365;

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  // Locale detection: cookie wins, else Accept-Language, else default.
  const cookieLocale = request.cookies.get(LOCALE_COOKIE)?.value;
  const needsLocaleCookie = !isLocale(cookieLocale);
  const resolvedLocale = isLocale(cookieLocale)
    ? cookieLocale
    : detectLocaleFromAcceptLanguage(request.headers.get("accept-language")) ?? DEFAULT_LOCALE;

  if (needsLocaleCookie) {
    request.cookies.set(LOCALE_COOKIE, resolvedLocale);
    response = NextResponse.next({ request });
    response.cookies.set(LOCALE_COOKIE, resolvedLocale, {
      path: "/",
      maxAge: ONE_YEAR,
      sameSite: "lax",
    });
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          if (needsLocaleCookie) {
            response.cookies.set(LOCALE_COOKIE, resolvedLocale, {
              path: "/",
              maxAge: ONE_YEAR,
              sameSite: "lax",
            });
          }
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;

  if (!user && PROTECTED.some((p) => path.startsWith(p))) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (user && AUTH_PAGES.includes(path)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/whatsapp).*)"],
};
