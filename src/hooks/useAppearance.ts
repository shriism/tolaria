import { useEffect, useState } from 'react'
import type { AppearanceMode } from '../types'

function resolveSystemAppearance(): AppearanceMode {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return 'light'
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function resolveAppearanceMode(preference: AppearanceMode | null | undefined): AppearanceMode {
  return preference ?? resolveSystemAppearance()
}

function applyAppearanceMode(mode: AppearanceMode): void {
  const root = document.documentElement
  root.classList.toggle('dark', mode === 'dark')
  root.dataset.appearance = mode
  root.style.colorScheme = mode
}

export function useAppearance(preference: AppearanceMode | null | undefined): AppearanceMode {
  const [appearanceMode, setAppearanceMode] = useState<AppearanceMode>(() => resolveAppearanceMode(preference))

  useEffect(() => {
    setAppearanceMode(resolveAppearanceMode(preference))
  }, [preference])

  useEffect(() => {
    applyAppearanceMode(appearanceMode)
  }, [appearanceMode])

  return appearanceMode
}
