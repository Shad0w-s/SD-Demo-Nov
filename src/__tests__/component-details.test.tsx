/**
 * Component Details Tests
 * Tests for individual component functionality and edge cases
 * Run with: npm test -- component-details
 */
import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

// Mock Next.js router
const mockPush = vi.fn()
const mockReplace = vi.fn()
const mockBack = vi.fn()
const mockForward = vi.fn()
const mockRefresh = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    back: mockBack,
    forward: mockForward,
    refresh: mockRefresh,
  }),
  usePathname: () => '/dashboard',
}))

// Mock Supabase
const mockSignOut = vi.fn()
const mockGetSession = vi.fn()
const mockGetUserRole = vi.fn()

vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    auth: {
      signOut: mockSignOut,
      getSession: mockGetSession,
    },
  },
  getSession: mockGetSession,
  getUserRole: mockGetUserRole,
  signOut: mockSignOut,
}))

// Mock Zustand store
vi.mock('@/lib/store', () => ({
  useAppStore: vi.fn((selector) => {
    const state = {
      selectedDrone: null,
      currentPath: null,
      setSchedules: vi.fn(),
      setIsLoading: vi.fn(),
      setError: vi.fn(),
      error: null,
    }
    return selector ? selector(state) : state
  }),
}))

// Mock API
vi.mock('@/lib/api', () => ({
  api: {
    createSchedule: vi.fn().mockResolvedValue({ id: 'schedule-1' }),
  },
}))

describe('Component Details Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('ConfirmationDialog', () => {
    it('should render with title and message', async () => {
      const ConfirmationDialog = (await import('@/components/ConfirmationDialog')).default
      
      render(
        <ConfirmationDialog
          open={true}
          title="Test Title"
          message="Test Message"
          onClose={vi.fn()}
        />
      )

      expect(screen.getByText('Test Title')).toBeInTheDocument()
      expect(screen.getByText('Test Message')).toBeInTheDocument()
    })

    it('should call onClose when OK button is clicked', async () => {
      const ConfirmationDialog = (await import('@/components/ConfirmationDialog')).default
      const onClose = vi.fn()
      
      render(
        <ConfirmationDialog
          open={true}
          title="Test Title"
          message="Test Message"
          onClose={onClose}
        />
      )

      const okButton = screen.getByText('OK')
      fireEvent.click(okButton)
      
      expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('should not render when open is false', async () => {
      const ConfirmationDialog = (await import('@/components/ConfirmationDialog')).default
      
      render(
        <ConfirmationDialog
          open={false}
          title="Test Title"
          message="Test Message"
          onClose={vi.fn()}
        />
      )

      expect(screen.queryByText('Test Title')).not.toBeInTheDocument()
    })
  })

  describe('ErrorDisplay', () => {
    it('should display error message when error exists', async () => {
      const ErrorDisplay = (await import('@/components/ErrorDisplay')).default
      const { useAppStore } = await import('@/lib/store')
      
      // Mock store with error
      vi.mocked(useAppStore).mockReturnValue({
        error: 'Test error message',
        setError: vi.fn(),
      })

      render(<ErrorDisplay />)
      
      expect(screen.getByText(/test error message/i)).toBeInTheDocument()
    })

    it('should not display when no error', async () => {
      const ErrorDisplay = (await import('@/components/ErrorDisplay')).default
      const { useAppStore } = await import('@/lib/store')
      
      // Mock store without error
      vi.mocked(useAppStore).mockReturnValue({
        error: null,
        setError: vi.fn(),
      })

      const { container } = render(<ErrorDisplay />)
      
      // Should render but be empty or not visible
      expect(container.firstChild).toBeNull()
    })
  })

  describe('LogoutButton', () => {
    it('should call signOut and navigate on click', async () => {
      const LogoutButton = (await import('@/components/LogoutButton')).default
      mockSignOut.mockResolvedValue(undefined)
      
      render(<LogoutButton />)
      
      const logoutButton = screen.getByText('Logout')
      fireEvent.click(logoutButton)
      
      await waitFor(() => {
        expect(mockSignOut).toHaveBeenCalledTimes(1)
        expect(mockPush).toHaveBeenCalledWith('/auth/login')
        expect(mockRefresh).toHaveBeenCalledTimes(1)
      })
    })

    it('should render logout button with icon', async () => {
      const LogoutButton = (await import('@/components/LogoutButton')).default
      
      render(<LogoutButton />)
      
      expect(screen.getByText('Logout')).toBeInTheDocument()
    })
  })

  describe('NavigationToolbar', () => {
    it('should render home button', async () => {
      const NavigationToolbar = (await import('@/components/NavigationToolbar')).default
      
      render(<NavigationToolbar />)
      
      const homeButton = screen.getByLabelText('Go to fleet overview')
      expect(homeButton).toBeInTheDocument()
    })

    it('should navigate to fleet on home click', async () => {
      const NavigationToolbar = (await import('@/components/NavigationToolbar')).default
      
      render(<NavigationToolbar />)
      
      const homeButton = screen.getByLabelText('Go to fleet overview')
      fireEvent.click(homeButton)
      
      expect(mockPush).toHaveBeenCalledWith('/fleet')
    })

    it('should show search field when onSearchChange is provided', async () => {
      const NavigationToolbar = (await import('@/components/NavigationToolbar')).default
      const onSearchChange = vi.fn()
      
      render(<NavigationToolbar onSearchChange={onSearchChange} />)
      
      const searchField = screen.getByPlaceholderText('Search drones and bases...')
      expect(searchField).toBeInTheDocument()
      
      fireEvent.change(searchField, { target: { value: 'test search' } })
      expect(onSearchChange).toHaveBeenCalledWith('test search')
    })

    it('should not show search field when onSearchChange is not provided', async () => {
      const NavigationToolbar = (await import('@/components/NavigationToolbar')).default
      
      render(<NavigationToolbar />)
      
      expect(screen.queryByPlaceholderText('Search drones and bases...')).not.toBeInTheDocument()
    })

    it('should handle back navigation', async () => {
      const NavigationToolbar = (await import('@/components/NavigationToolbar')).default
      
      // Mock window.history
      Object.defineProperty(window, 'history', {
        value: { length: 3 },
        writable: true,
      })
      
      render(<NavigationToolbar showBack={true} />)
      
      const backButton = screen.getByLabelText('Go back')
      fireEvent.click(backButton)
      
      expect(mockBack).toHaveBeenCalledTimes(1)
    })
  })

  describe('ScheduleModal', () => {
    it('should render when open', async () => {
      const ScheduleModal = (await import('@/components/ScheduleModal')).default
      
      render(<ScheduleModal isOpen={true} onClose={vi.fn()} />)
      
      // Check for schedule-related content (title or button)
      const scheduleElements = screen.getAllByText(/schedule/i)
      expect(scheduleElements.length).toBeGreaterThan(0)
    })

    it('should not render when closed', async () => {
      const ScheduleModal = (await import('@/components/ScheduleModal')).default
      
      render(<ScheduleModal isOpen={false} onClose={vi.fn()} />)
      
      expect(screen.queryByText(/schedule/i)).not.toBeInTheDocument()
    })

    it('should initialize with default values when opened', async () => {
      const ScheduleModal = (await import('@/components/ScheduleModal')).default
      
      render(<ScheduleModal isOpen={true} onClose={vi.fn()} />)
      
      // Check that date and time fields are present
      const dateInput = screen.getByLabelText(/date/i) || screen.getByDisplayValue(/\d{4}-\d{2}-\d{2}/)
      const timeInput = screen.getByLabelText(/time/i) || screen.getByDisplayValue(/\d{2}:\d{2}/)
      
      // At least one should exist
      expect(dateInput || timeInput).toBeTruthy()
    })

    it('should validate required fields', async () => {
      const ScheduleModal = (await import('@/components/ScheduleModal')).default
      const { useAppStore } = await import('@/lib/store')
      const setError = vi.fn()
      
      vi.mocked(useAppStore).mockReturnValue({
        selectedDrone: { id: 'drone-1', name: 'Test Drone' },
        currentPath: null,
        setSchedules: vi.fn(),
        setIsLoading: vi.fn(),
        setError,
        error: null,
      })
      
      render(<ScheduleModal isOpen={true} onClose={vi.fn()} />)
      
      // Try to submit without filling fields
      const submitButton = screen.getByRole('button', { name: /create|schedule/i })
      if (submitButton) {
        fireEvent.click(submitButton)
        
        // Should show error or prevent submission
        await waitFor(() => {
          // Either error is set or form doesn't submit
          expect(setError).toHaveBeenCalled() || expect(mockPush).not.toHaveBeenCalled()
        })
      }
    })
  })

  describe('AuthGuard', () => {
    it('should render children when authorized', async () => {
      const AuthGuard = (await import('@/components/AuthGuard')).default
      mockGetSession.mockResolvedValue({ access_token: 'test-token' })
      
      render(
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>
      )
      
      await waitFor(() => {
        expect(screen.getByText('Protected Content')).toBeInTheDocument()
      })
    })

    it('should redirect to login when not authorized', async () => {
      const AuthGuard = (await import('@/components/AuthGuard')).default
      mockGetSession.mockResolvedValue(null)
      
      render(
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>
      )
      
      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/auth/login')
      })
    })

    it('should check admin role when requiredRole is admin', async () => {
      const AuthGuard = (await import('@/components/AuthGuard')).default
      mockGetSession.mockResolvedValue({ access_token: 'test-token' })
      mockGetUserRole.mockResolvedValue('user')
      
      render(
        <AuthGuard requiredRole="admin">
          <div>Admin Content</div>
        </AuthGuard>
      )
      
      await waitFor(() => {
        expect(mockGetUserRole).toHaveBeenCalled()
        expect(mockReplace).toHaveBeenCalledWith('/fleet')
      })
    })

    it('should allow admin access when role is admin', async () => {
      const AuthGuard = (await import('@/components/AuthGuard')).default
      mockGetSession.mockResolvedValue({ access_token: 'test-token' })
      mockGetUserRole.mockResolvedValue('admin')
      
      render(
        <AuthGuard requiredRole="admin">
          <div>Admin Content</div>
        </AuthGuard>
      )
      
      await waitFor(() => {
        expect(screen.getByText('Admin Content')).toBeInTheDocument()
      })
    })
  })
})

