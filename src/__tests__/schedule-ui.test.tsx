import React from 'react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import Sidebar from '@/components/Sidebar'
import { useAppStore } from '@/lib/store'
import { mockSchedules } from '@/lib/mockData'

vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
}))

describe('Schedule delete button UI affordances', () => {
  beforeEach(() => {
    useAppStore.setState({
      drones: [],
      bases: [],
      schedules: [],
      selectedDrone: null,
      selectedBase: null,
      currentPath: null,
      simulation: null,
      isLoading: false,
      error: null,
    })
  })

  afterEach(() => {
    useAppStore.setState({
      schedules: [],
      error: null,
    })
  })

  it('renders delete control with accessible labels and hover styling', () => {
    useAppStore.setState({
      schedules: [
        {
          ...mockSchedules[0],
          start_time: new Date().toISOString(),
        },
      ],
    })

    render(<Sidebar />)

    const deleteButton = screen.getByLabelText('Delete schedule')
    expect(deleteButton).toBeInTheDocument()
    expect(deleteButton).toHaveAttribute('title', 'Delete schedule')

    const customClass = Array.from(deleteButton.classList).find((cls) => cls.startsWith('css-'))
    expect(customClass).toBeDefined()

    const styleElement = Array.from(document.querySelectorAll('style')).find((style) =>
      style.textContent?.includes(`.${customClass}:hover`)
    )

    expect(styleElement?.textContent).toMatch(/color:\s*(var\(--mui-palette-error-main\)|#d32f2f|rgb\(\s*211,\s*47,\s*47\s*\))/)
  })
})


