import { describe, it, expect } from 'vitest'
import { cn, isEqual } from '../utils'

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

describe('utils/isEqual', () => {
  it('returns true for same values', () => {
    expect(isEqual(1, 1)).toBe(true)
    expect(isEqual('s', 's')).toBe(true)
    expect(isEqual(null, null)).toBe(true)
  })

  it('returns true for identical objects', () => {
    const a = { x: 1, y: { z: 2 } }
    const b = { x: 1, y: { z: 2 } }
    expect(isEqual(a, b)).toBe(true)
  })

  it('returns false for different objects', () => {
    const a = { x: 1, y: { z: 2 } }
    const b = { x: 1, y: { z: 3 } }
    expect(isEqual(a, b)).toBe(false)
  })

  it('returns false when object keys are different', () => {
    const a = { x: 1 }
    const b = { x: 1, y: 2 }
    expect(isEqual(a, b)).toBe(false)
  })

  it('handles arrays', () => {
    expect(isEqual([1, { a: 1 }], [1, { a: 1 }])).toBe(true)
    expect(isEqual([1, 2], [1, 2, 3])).toBe(false)
  })
})
