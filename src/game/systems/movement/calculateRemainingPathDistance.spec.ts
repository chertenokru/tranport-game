import { describe, expect, it } from 'vitest'

import { calculateRemainingPathDistance } from './calculateRemainingPathDistance'

describe('calculateRemainingPathDistance', () => {
  it('includes the unfinished segment and subsequent path segments', () => {
    const distance = calculateRemainingPathDistance({
      position: {
        x: 1.5,
        y: 2,
      },
      path: [
        {
          x: 0,
          y: 0,
        },
        {
          x: 3,
          y: 4,
        },
        {
          x: 6,
          y: 8,
        },
      ],
      pathIndex: 1,
    })

    expect(distance).toBeCloseTo(7.5)
  })

  it('returns zero for a completed path', () => {
    const distance = calculateRemainingPathDistance({
      position: {
        x: 6,
        y: 8,
      },
      path: [
        {
          x: 0,
          y: 0,
        },
        {
          x: 6,
          y: 8,
        },
      ],
      pathIndex: 2,
    })

    expect(distance).toBe(0)
  })

  it('rejects an invalid path index', () => {
    expect(() =>
      calculateRemainingPathDistance({
        position: {
          x: 0,
          y: 0,
        },
        path: [],
        pathIndex: -1,
      }),
    ).toThrow(RangeError)
  })
})
