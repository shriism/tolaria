import { useCallback, useRef } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { isTauri, mockInvoke, updateMockContent } from '../mock-tauri'

const DEBOUNCE_MS = 500

async function persistContent(path: string, content: string): Promise<void> {
  if (isTauri()) {
    await invoke('save_note_content', { path, content })
  } else {
    await mockInvoke('save_note_content', { path, content })
  }
}

/**
 * Hook that provides a debounced auto-save function for note content.
 * Calls the Tauri backend (or mock) to persist the full markdown (frontmatter + body)
 * after 500ms of inactivity.
 *
 * @param updateContent - callback to also update in-memory allContent state
 */
export function useAutoSave(updateContent: (path: string, content: string) => void) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Track the latest pending content per path so a flush always saves the most recent version
  const pendingRef = useRef<Map<string, string>>(new Map())

  const save = useCallback(async (path: string, content: string) => {
    try {
      await persistContent(path, content)
      if (!isTauri()) {
        updateMockContent(path, content)
      }
      updateContent(path, content)
    } catch (err) {
      console.error(`Auto-save failed for ${path}:`, err)
    }
  }, [updateContent])

  const debouncedSave = useCallback((path: string, content: string) => {
    pendingRef.current.set(path, content)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      timerRef.current = null
      // Save all pending paths (handles rapid note switching)
      const pending = new Map(pendingRef.current)
      pendingRef.current.clear()
      for (const [p, c] of pending) {
        save(p, c)
      }
    }, DEBOUNCE_MS)
  }, [save])

  /** Immediately flush any pending saves (call before closing a tab or switching notes) */
  const flush = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    const pending = new Map(pendingRef.current)
    pendingRef.current.clear()
    for (const [p, c] of pending) {
      save(p, c)
    }
  }, [save])

  return { debouncedSave, flush }
}
