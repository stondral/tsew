import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const hostname = req.headers.get('host') || ''
  const mainDomain = process.env.NEXT_PUBLIC_MAIN_DOMAIN || 'localhost:3000'
  const isLocalhost = hostname.includes('localhost')
  const path = req.nextUrl.pathname

  // 1. Skip static files
  if (
    path.startsWith('/_next') || 
    path.includes('.') ||
    path === '/favicon.ico'
  ) {
    return NextResponse.next()
  }

  // 2. Strict Admin & Support Security Block (MUST be before general API skip)
  if (path.startsWith('/administrator') || path.startsWith('/api/support')) {
    // Edge middleware: keep checks shallow. Deeper auth/role enforcement happens server-side.
    const token = req.cookies.get('payload-token')?.value

    if (!token) {
      const url = req.nextUrl.clone()
      url.pathname = '/auth'
      url.searchParams.set('redirect', path)
      console.warn(`❌ No auth token found for ${path}`)
      return NextResponse.redirect(url)
    }

    return NextResponse.next()
  }

  // 3. Skip remaining public API routes
  if (path.startsWith('/api')) {
    return NextResponse.next()
  }

  // 4. Is it platform domain?
  const isPlatform = 
    hostname === mainDomain || 
    hostname === `www.${mainDomain}` || 
    (isLocalhost && !hostname.includes('.')) ||
    hostname === 'localhost:3000'

  if (isPlatform) {
    return NextResponse.next()
  }

  // 5. Resolve Seller Identity
  let query = ''
  
  if (hostname.endsWith(`.${mainDomain}`)) {
    const subdomain = hostname.replace(`.${mainDomain}`, '')
    query = `where[username][equals]=${subdomain}`
  } else if (isLocalhost && hostname.split('.').length > 1) {
    // Handle seller1.localhost:3000
    const subdomain = hostname.split('.')[0]
    query = `where[username][equals]=${subdomain}`
  } else {
    // Custom domain
    query = `where[customDomain.domain][equals]=${hostname}&where[customDomain.enabled][equals]=true`
  }

  if (query) {
    try {
      const payloadUrl = process.env.NEXT_PUBLIC_PAYLOAD_URL || 'http://localhost:3000'
      const apiUrl = `${payloadUrl}/api/users?where[role][equals]=seller&${query}`
      
      const response = await fetch(apiUrl, { next: { revalidate: 3600 } })
      
      if (!response.ok) {
        console.error(`Middleware API fetch failed: ${response.status} ${response.statusText}`)
        return NextResponse.next()
      }

      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        console.error('Middleware API returned non-JSON response')
        return NextResponse.next()
      }

      const data = await response.json()

      if (data.docs && data.docs.length > 0) {
        const seller = data.docs[0]
        
        // Clone headers and set seller context
        const requestHeaders = new Headers(req.headers)
        requestHeaders.set('x-seller-id', seller.id)
        requestHeaders.set('x-seller-plan', seller.plan)
        requestHeaders.set('x-seller-username', seller.username)

        return NextResponse.next({
          request: {
            headers: requestHeaders,
          },
        })
      }
    } catch (error) {
      console.error('Middleware seller resolution failed:', error)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
