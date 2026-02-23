import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAutoSave } from './useAutoSave'

const mockInvokeFn = vi.fn(() => Promise.resolve(null))

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}))

vi.mock('../mock-tauri', () => ({
  isTauri: () => false,
  mockInvoke: (cmd: string, args?: Record<string, unknown>) => mockInvokeFn(cmd, args),
  updateMockContent: vi.fn(),
}))

describe('useAutoSave', () => {
  let updateContent: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.useFakeTimers()
    updateContent = vi.fn()
    mockInvokeFn.mockClear()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('debounces save calls by 500ms', async () => {
    const { result } = renderHook(() => useAutoSave(updateContent))

    act(() => {
      result.current.debouncedSave('/test/note.md', 'content v1')
    })

    // Not saved yet
    expect(mockInvokeFn).not.toHaveBeenCalled()
    expect(updateContent).not.toHaveBeenCalled()

    // Advance 300ms — still not saved
    act(() => { vi.advanceTimersByTime(300) })
    expect(mockInvokeFn).not.toHaveBeenCalled()

    // Advance to 500ms — now saved
    await act(async () => { vi.advanceTimersByTime(200) })

    expect(mockInvokeFn).toHaveBeenCalledWith('save_note_content', {
      path: '/test/note.md',
      content: 'content v1',
    })
    expect(updateContent).toHaveBeenCalledWith('/test/note.md', 'content v1')
  })

  it('only saves the latest content when debounce resets', async () => {
    const { result } = renderHook(() => useAutoSave(updateContent))

    act(() => {
      result.current.debouncedSave('/test/note.md', 'version 1')
    })
    act(() => { vi.advanceTimersByTime(200) })

    // Second call resets the timer
    act(() => {
      result.current.debouncedSave('/test/note.md', 'version 2')
    })

    // Advance past original deadline
    act(() => { vi.advanceTimersByTime(300) })
    expect(mockInvokeFn).not.toHaveBeenCalled()

    // Advance to new deadline (200 + 500 = 700ms from second call)
    await act(async () => { vi.advanceTimersByTime(200) })

    expect(mockInvokeFn).toHaveBeenCalledTimes(1)
    expect(mockInvokeFn).toHaveBeenCalledWith('save_note_content', {
      path: '/test/note.md',
      content: 'version 2',
    })
  })

  it('flush() immediately saves pending content', async () => {
    const { result } = renderHook(() => useAutoSave(updateContent))

    act(() => {
      result.current.debouncedSave('/test/note.md', 'flush me')
    })

    expect(mockInvokeFn).not.toHaveBeenCalled()

    // Flush before debounce fires
    await act(async () => {
      result.current.flush()
    })

    expect(mockInvokeFn).toHaveBeenCalledWith('save_note_content', {
      path: '/test/note.md',
      content: 'flush me',
    })
  })

  it('saves multiple paths when switching notes rapidly', async () => {
    const { result } = renderHook(() => useAutoSave(updateContent))

    act(() => {
      result.current.debouncedSave('/test/note-a.md', 'content A')
      result.current.debouncedSave('/test/note-b.md', 'content B')
    })

    await act(async () => { vi.advanceTimersByTime(500) })

    expect(mockInvokeFn).toHaveBeenCalledTimes(2)
    expect(mockInvokeFn).toHaveBeenCalledWith('save_note_content', {
      path: '/test/note-a.md',
      content: 'content A',
    })
    expect(mockInvokeFn).toHaveBeenCalledWith('save_note_content', {
      path: '/test/note-b.md',
      content: 'content B',
    })
  })

  it('handles save errors gracefully without crashing', async () => {
    mockInvokeFn.mockRejectedValueOnce(new Error('File is read-only'))
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const { result } = renderHook(() => useAutoSave(updateContent))

    act(() => {
      result.current.debouncedSave('/test/readonly.md', 'content')
    })

    await act(async () => { vi.advanceTimersByTime(500) })

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Auto-save failed'),
      expect.any(Error),
    )
    consoleSpy.mockRestore()
  })

  it('does nothing when flush is called with no pending saves', async () => {
    const { result } = renderHook(() => useAutoSave(updateContent))

    await act(async () => {
      result.current.flush()
    })

    expect(mockInvokeFn).not.toHaveBeenCalled()
    expect(updateContent).not.toHaveBeenCalled()
  })
})
