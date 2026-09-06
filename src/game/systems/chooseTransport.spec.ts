import { describe, expect, it } from 'vitest'

import { PEDESTRIANS_CONFIG } from '@/game/config/pedestrians.config'

import { chooseTransport, type TransportChoiceInput } from './chooseTransport'

const baseInput: TransportChoiceInput = {
  walkingDistance: 680,
  walkingSpeed: 40,
  walkingToStopDistance: 121,
  expectedWaitingTime: 2,
  busTravelTime: 5.5,
  walkingFromStopDistance: 121,
  busTimeAdvantageFactor: PEDESTRIANS_CONFIG.default.busTimeAdvantageFactor,
}

describe('chooseTransport', () => {
  it('chooses the bus when it provides a meaningful time advantage', () => {
    const result = chooseTransport(baseInput)

    expect(result.walkingTime).toBeCloseTo(17)
    expect(result.busTime).toBeCloseTo(13.55)
    expect(result.mode).toBe('bus')
  })

  it('chooses walking when the bus advantage is too small', () => {
    const result = chooseTransport({
      ...baseInput,
      expectedWaitingTime: 4.45,
    })

    expect(result.busTime).toBeCloseTo(16)
    expect(result.busTime).toBeLessThan(result.walkingTime)
    expect(result.mode).toBe('walking')
  })

  it('chooses walking when waiting makes the bus slower', () => {
    const result = chooseTransport({
      ...baseInput,
      expectedWaitingTime: 10,
    })

    expect(result.busTime).toBeGreaterThan(result.walkingTime)
    expect(result.mode).toBe('walking')
  })

  it('rejects invalid movement speeds', () => {
    expect(() =>
      chooseTransport({
        ...baseInput,
        walkingSpeed: 0,
      }),
    ).toThrow(RangeError)
  })
})
