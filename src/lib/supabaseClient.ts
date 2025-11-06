import { createClient } from '@supabase/supabase-js'
import { Session } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Check if Supabase is properly configured
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey && 
  !supabaseUrl.includes('placeholder') && 
  supabaseUrl.startsWith('http'))

// Only create client if we have the required environment variables
// This prevents errors during static generation
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    })
  : createClient('https://placeholder.supabase.co', 'placeholder-key', {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false
      }
    })

// Token caching to reduce Supabase API calls
let cachedToken: string | null = null
let tokenExpiry: number = 0
const TOKEN_CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

// Function to clear token cache (useful for testing)
export function clearTokenCache() {
  cachedToken = null
  tokenExpiry = 0
}

// Session management helpers
export async function getSession(): Promise<Session | null> {
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

export async function getAccessToken(): Promise<string | null> {
  // Return cached token if valid
  if (cachedToken && Date.now() < tokenExpiry) {
    return cachedToken
  }
  
  // Fetch new token from Supabase
  const session = await getSession()
  
  // If no Supabase session and we're in development (no real Supabase config),
  // use a demo token for local testing
  if (!session && (!supabaseUrl || supabaseUrl === '' || supabaseUrl.includes('placeholder'))) {
    console.log('[Auth] No Supabase session - using demo token for local development')
    // Create a simple JWT-like structure that the backend's dev mode will accept
    // The backend only checks for 'sub' field in dev mode
    const demoPayload = {
      sub: 'demo-user-1', // Matches the user_id in our seed data
      email: 'demo@example.com',
      user_metadata: { role: 'user' },
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600
    }
    // Base64 encode the payload (simplified JWT for demo)
    cachedToken = `demo.${btoa(JSON.stringify(demoPayload))}.demo`
    tokenExpiry = Date.now() + TOKEN_CACHE_DURATION
    console.log('[Auth] Demo token created:', cachedToken.substring(0, 50) + '...')
    console.log('[Auth] Demo payload:', demoPayload)
    return cachedToken
  }
  
  cachedToken = session?.access_token || null
  tokenExpiry = Date.now() + TOKEN_CACHE_DURATION
  return cachedToken
}

export async function getUser() {
  const { data: { user } } = await supabase.auth.getUser()
  
  // If no user and we're in development, return demo user
  if (!user && (!supabaseUrl || supabaseUrl === '' || supabaseUrl.includes('placeholder'))) {
    return {
      id: 'demo-user-1',
      email: 'demo@example.com',
      user_metadata: { role: 'user' }
    } as any
  }
  
  return user
}

export async function getUserRole(): Promise<'admin' | 'user'> {
  const user = await getUser()
  const role = user?.user_metadata?.role || 'user'
  return role as 'admin' | 'user'
}

export async function signOut() {
  await supabase.auth.signOut()
}

