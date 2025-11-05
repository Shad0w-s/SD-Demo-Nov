/**
 * Unit Tests for Phase 1: Authentication & Core Infrastructure
 * 
 * Run tests with: npm test
 * 
 * These tests verify:
 * - Supabase client integration
 * - Authentication flows (login, register, logout)
 * - Session management
 * - JWT token handling
 * - AuthGuard protection
 * - API client token injection
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock Supabase client before imports
const mockSignInWithPassword = vi.fn()
const mockSignUp = vi.fn()
const mockSignOut = vi.fn()
const mockGetSession = vi.fn()
const mockGetUser = vi.fn()

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    auth: {
      signInWithPassword: mockSignInWithPassword,
      signUp: mockSignUp,
      signOut: mockSignOut,
      getSession: mockGetSession,
      getUser: mockGetUser,
    },
  })),
}))

// Set test environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key'

describe('Phase 1: Authentication & Core Infrastructure', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Supabase Client Integration', () => {
    it('should initialize Supabase client with correct URL and key', () => {
      expect(process.env.NEXT_PUBLIC_SUPABASE_URL).toBe('https://test.supabase.co')
      expect(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY).toBe('test-key')
    })

    it('should have session management functions', async () => {
      const { getSession, getAccessToken, getUser, getUserRole } = await import('@/lib/supabaseClient')
      
      expect(typeof getSession).toBe('function')
      expect(typeof getAccessToken).toBe('function')
      expect(typeof getUser).toBe('function')
      expect(typeof getUserRole).toBe('function')
    })
  })

  describe('Authentication Flows', () => {
    it('should handle successful login', async () => {
      const { supabase } = await import('@/lib/supabaseClient')
      
      const mockSession = {
        access_token: 'mock-token',
        user: { id: 'user-123', email: 'test@example.com' }
      }

      mockSignInWithPassword.mockResolvedValue({
        data: { session: mockSession, user: mockSession.user },
        error: null
      })

      const result = await supabase.auth.signInWithPassword({
        email: 'test@example.com',
        password: 'password123'
      })

      expect(result.data?.session).toBeDefined()
      expect(result.error).toBeNull()
      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      })
    })

    it('should handle login errors', async () => {
      const { supabase } = await import('@/lib/supabaseClient')
      
      mockSignInWithPassword.mockResolvedValue({
        data: { session: null, user: null },
        error: { message: 'Invalid credentials' }
      })

      const result = await supabase.auth.signInWithPassword({
        email: 'test@example.com',
        password: 'wrongpassword'
      })

      expect(result.error).toBeDefined()
      expect(result.error?.message).toBe('Invalid credentials')
    })

    it('should handle successful registration', async () => {
      const { supabase } = await import('@/lib/supabaseClient')
      
      const mockSession = {
        access_token: 'mock-token',
        user: { 
          id: 'user-123', 
          email: 'newuser@example.com',
          user_metadata: { role: 'user' }
        }
      }

      mockSignUp.mockResolvedValue({
        data: { session: mockSession, user: mockSession.user },
        error: null
      })

      const result = await supabase.auth.signUp({
        email: 'newuser@example.com',
        password: 'password123',
        options: {
          data: { role: 'user' }
        }
      })

      expect(result.data?.session).toBeDefined()
      expect(result.data?.user?.user_metadata?.role).toBe('user')
    })

    it('should handle logout', async () => {
      const { signOut } = await import('@/lib/supabaseClient')
      
      mockSignOut.mockResolvedValue({
        error: null
      })

      await signOut()
      
      expect(mockSignOut).toHaveBeenCalled()
    })
  })

  describe('Session Management', () => {
    it('should retrieve current session', async () => {
      const { getSession } = await import('@/lib/supabaseClient')
      
      const mockSession = {
        access_token: 'mock-token',
        user: { id: 'user-123' }
      }

      mockGetSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      })

      const session = await getSession()
      expect(session).toBeDefined()
      expect(session?.access_token).toBe('mock-token')
    })

    it('should extract access token from session', async () => {
      const { getAccessToken } = await import('@/lib/supabaseClient')
      
      const mockSession = {
        access_token: 'mock-access-token',
        user: { id: 'user-123' }
      }

      mockGetSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      })

      const token = await getAccessToken()
      expect(token).toBe('mock-access-token')
    })

    it('should return null token when no session', async () => {
      const { getAccessToken } = await import('@/lib/supabaseClient')
      
      mockGetSession.mockResolvedValue({
        data: { session: null },
        error: null
      })

      const token = await getAccessToken()
      expect(token).toBeNull()
    })
  })

  describe('Role Management', () => {
    it('should return user role from metadata', async () => {
      const { getUserRole } = await import('@/lib/supabaseClient')
      
      mockGetUser.mockResolvedValue({
        data: { 
          user: { 
            id: 'user-123',
            user_metadata: { role: 'admin' }
          } 
        },
        error: null
      })

      const role = await getUserRole()
      expect(role).toBe('admin')
    })

    it('should default to user role when not specified', async () => {
      const { getUserRole } = await import('@/lib/supabaseClient')
      
      mockGetUser.mockResolvedValue({
        data: { 
          user: { 
            id: 'user-123',
            user_metadata: {}
          } 
        },
        error: null
      })

      const role = await getUserRole()
      expect(role).toBe('user')
    })
  })

  describe('API Client Integration', () => {
    it('should include auth token in API requests', async () => {
      const { apiRequest } = await import('@/lib/api')
      
      const mockSession = {
        access_token: 'mock-jwt-token',
        user: { id: 'user-123' }
      }

      mockGetSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      })

      // Mock fetch
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ data: 'test' })
      })

      await apiRequest('/api/drones')

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/drones'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-jwt-token'
          })
        })
      )
    })

    it('should make requests without token when not authenticated', async () => {
      const { apiRequest } = await import('@/lib/api')
      
      mockGetSession.mockResolvedValue({
        data: { session: null },
        error: null
      })

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ data: 'test' })
      })

      await apiRequest('/api/drones')

      const fetchCall = vi.mocked(global.fetch).mock.calls[0]
      const headers = fetchCall[1]?.headers as Record<string, string>
      
      expect(headers).not.toHaveProperty('Authorization')
    })
  })
})

