import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export async function GET(request: NextRequest) {
  const requestUrl = request.nextUrl.clone()
  const code = requestUrl.searchParams.get('code')

  if (code) {
    // Create a new client instance for server-side usage
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      requestUrl.pathname = '/auth/login'
      requestUrl.searchParams.set('error', 'auth_failed')
      return NextResponse.redirect(requestUrl)
    }
  }

  // Redirect to dashboard after successful auth
  requestUrl.pathname = '/dashboard'
  requestUrl.searchParams.delete('code')
  return NextResponse.redirect(requestUrl)
}

