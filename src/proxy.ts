import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

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
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Get user session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const url = request.nextUrl.clone();

  // Guard dashboard routes
  if (url.pathname.startsWith('/dashboard')) {
    if (!user) {
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }

    // Fetch user profile to check role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const role = profile?.role;

    // Enforce role-based access to specific sub-dashboards
    if (url.pathname.startsWith('/dashboard/student') && role !== 'student') {
      url.pathname = role === 'lecturer' ? '/dashboard/lecturer' : role === 'admin' ? '/dashboard/admin' : '/login';
      return NextResponse.redirect(url);
    }

    if (url.pathname.startsWith('/dashboard/lecturer') && role !== 'lecturer') {
      url.pathname = role === 'student' ? '/dashboard/student' : role === 'admin' ? '/dashboard/admin' : '/login';
      return NextResponse.redirect(url);
    }

    if (url.pathname.startsWith('/dashboard/admin') && role !== 'admin') {
      url.pathname = role === 'student' ? '/dashboard/student' : role === 'lecturer' ? '/dashboard/lecturer' : '/login';
      return NextResponse.redirect(url);
    }

    // Route /dashboard root to specific role dashboard
    if (url.pathname === '/dashboard') {
      if (role === 'student') {
        url.pathname = '/dashboard/student';
      } else if (role === 'lecturer') {
        url.pathname = '/dashboard/lecturer';
      } else if (role === 'admin') {
        url.pathname = '/dashboard/admin';
      } else {
        url.pathname = '/login';
      }
      return NextResponse.redirect(url);
    }
  }

  // Prevent logged-in users from accessing auth pages
  if (user && (url.pathname === '/login' || url.pathname === '/register' || url.pathname === '/')) {
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - API routes that don't need protection (optional)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
