import { describe, it, expect } from 'vitest'
import { cn } from '../utils'

describe('utils/cn', () => {
  it('merges class names correctly', () => {
    expect(cn('first', 'second')).toBe('first second')
  })

  it('handles conditional class names', () => {
    expect(cn('first', true && 'second', false && 'third')).toBe('first second')
  })

  it('merges tailwind classes properly', () => {
    expect(cn('p-4 p-2')).toBe('p-2') // p-2 overrides p-4
  })
})
