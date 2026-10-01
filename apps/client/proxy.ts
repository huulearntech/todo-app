// proxy.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// 1. Hàm xử lý proxy chính
export function proxy(request: NextRequest) {
  const token = request.cookies.get('access_token')

  // Ví dụ: Chặn người dùng chưa đăng nhập khi vào trang dashboard
  if (!token && request.nextUrl.pathname.startsWith('/profile')) {
    return NextResponse.redirect(new URL('/auth', request.url))
  }

  // Nếu hợp lệ, cho phép request tiếp tục đi tiếp
  return NextResponse.next()
}

// 2. Bộ lọc (Matcher) giúp Proxy chỉ chạy trên các đường dẫn được chỉ định
export const config = {
  matcher: ['/:path*', '/api-custom/:path*'],
}