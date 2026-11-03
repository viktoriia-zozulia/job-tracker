import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { isApplicationId } from "@/lib/validation";

const AUTH_PAGES = ["/login", "/signup"];
const PROTECTED_PREFIXES = ["/dashboard", "/applications"];
const EDIT_PAGE = /^\/applications\/([^/]+)\/edit\/?$/;

function matchesPrefix(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
          Object.entries(headers).forEach(([key, value]) =>
            response.headers.set(key, value),
          );
        },
      },
    },
  );

  // Also refreshes an expired session, so this must run before any response is built.
  const { data } = await supabase.auth.getClaims();
  const isLoggedIn = Boolean(data?.claims);

  const { pathname } = request.nextUrl;
  let redirectTo: string | null = null;

  if (pathname === "/") {
    redirectTo = isLoggedIn ? "/dashboard" : "/login";
  } else if (isLoggedIn && AUTH_PAGES.includes(pathname)) {
    redirectTo = "/dashboard";
  } else if (
    !isLoggedIn &&
    PROTECTED_PREFIXES.some((prefix) => matchesPrefix(pathname, prefix))
  ) {
    redirectTo = "/login";
  }

  if (!redirectTo) {
    const editId = pathname.match(EDIT_PAGE)?.[1];

    // The page can't send a real 404 once it starts streaming, so check here first.
    // RLS limits this lookup to the user's own rows. The page still checks too.
    if (isLoggedIn && editId !== undefined) {
      const exists = isApplicationId(editId)
        ? await supabase
            .from("applications")
            .select("id")
            .eq("id", editId)
            .maybeSingle()
        : { data: null, error: null };

      if (!exists.error && !exists.data) {
        const notFound = NextResponse.rewrite(
          new URL("/application-not-found", request.url),
        );
        response.cookies
          .getAll()
          .forEach((cookie) => notFound.cookies.set(cookie));
        return notFound;
      }
    }

    return response;
  }

  // Keep any refreshed session cookies on the redirect.
  const redirect = NextResponse.redirect(new URL(redirectTo, request.url));
  response.cookies
    .getAll()
    .forEach((cookie) => redirect.cookies.set(cookie));
  return redirect;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
