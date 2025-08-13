
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/constants'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const publicPaths = ['/', '/verify-otp']
  // Verifica se o caminho começa com /portal/ para torná-lo público
  const isPublicPath = publicPaths.includes(request.nextUrl.pathname) || request.nextUrl.pathname.startsWith('/portal/')

  if (!user && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Se o usuário está logado e tentando acessar uma rota pública que não seja o portal, redireciona para o dashboard
  if (user && (request.nextUrl.pathname === '/' || request.nextUrl.pathname === '/verify-otp')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: ['/', '/dashboard/:path*', '/verify-otp', '/portal/:path*'],
}
