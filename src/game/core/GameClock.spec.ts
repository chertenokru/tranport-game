import { describe, expect, it } from 'vitest'

import { GameClock } from './GameClock'

describe('GameClock', () => {
  it('accumulates elapsed time', () => {
    const clock = new GameClock()

    clock.advance(0.016)
    clock.advance(0.034)

    expect(clock.elapsedTime).toBeCloseTo(0.05)
  })

  it('resets elapsed time', () => {
    const clock = new GameClock()

    clock.advance(2)
    clock.reset()

    expect(clock.elapsedTime).toBe(0)
  })

  it('rejects invalid delta time', () => {
    const clock = new GameClock()

    expect(() => clock.advance(-1)).toThrow(RangeError)
    expect(() => clock.advance(Number.NaN)).toThrow(RangeError)
    expect(() => clock.advance(Number.POSITIVE_INFINITY)).toThrow(RangeError)
  })
})
