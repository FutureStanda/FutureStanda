import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  // Allow all routes through — auth is optional
  return NextResponse.next({ request })
}
