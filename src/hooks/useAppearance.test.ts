import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { resolveAppearanceMode, useAppearance } from './useAppearance'

function mockMatchMedia(matches: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(() => ({
      matches,
      media: '(prefers-color-scheme: dark)',
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
}

describe('useAppearance', () => {
  beforeEach(() => {
    document.documentElement.classList.remove('dark')
    delete document.documentElement.dataset.appearance
    document.documentElement.style.removeProperty('color-scheme')
  })

  it('resolves explicit light and dark preferences directly', () => {
    expect(resolveAppearanceMode('light')).toBe('light')
    expect(resolveAppearanceMode('dark')).toBe('dark')
  })

  it('falls back to system appearance when there is no saved preference', () => {
    mockMatchMedia(true)
    expect(resolveAppearanceMode(null)).toBe('dark')
  })

  it('applies the dark class and color scheme to the document root', () => {
    const { result } = renderHook(() => useAppearance('dark'))

    expect(result.current).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(document.documentElement.dataset.appearance).toBe('dark')
    expect(document.documentElement.style.colorScheme).toBe('dark')
  })
})
