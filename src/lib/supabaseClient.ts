import { createClient } from '@supabase/supabase-js'
import { Session } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Only create client if we have the required environment variables
// This prevents errors during static generation
export const supabase = supabaseUrl && supabaseAnonKey
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
  
  // Fetch new token
  const session = await getSession()
  cachedToken = session?.access_token || null
  tokenExpiry = Date.now() + TOKEN_CACHE_DURATION
  return cachedToken
}

export async function getUser() {
  const { data: { user } } = await supabase.auth.getUser()
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

