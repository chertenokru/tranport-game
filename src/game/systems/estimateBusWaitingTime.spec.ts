import { describe, expect, it } from 'vitest'

import { createVerticalSliceWorld } from '@/game/world/MapFactory'

import { estimateBusBoarding } from './estimateBusBoarding.ts'

describe('estimateBusBoarding', () => {
  it('returns the remaining stop time when the passenger catches a waiting bus', () => {
    const world = createVerticalSliceWorld()
    const bus = world.buses.get('bus-main')

    if (!bus) {
      throw new Error('Initial bus is missing')
    }

    const estimate = estimateBusBoarding({
      bus,
      routeStopCount: 2,
      boardingStopIndex: 0,
      destinationStopIndex: 1,
      passengerArrivalTime: 0.5,
      legDistances: [440],
    })

    expect(estimate).toEqual({
      waitingTime: 0,
      remainingStopTime: 0.5,
    })
  })

  it('skips a bus that leaves before the passenger arrives', () => {
    const world = createVerticalSliceWorld()
    const bus = world.buses.get('bus-main')

    if (!bus) {
      throw new Error('Initial bus is missing')
    }

    const estimate = estimateBusBoarding({
      bus,
      routeStopCount: 2,
      boardingStopIndex: 0,
      destinationStopIndex: 1,
      passengerArrivalTime: 3,
      legDistances: [440],
    })

    expect(estimate).toEqual({
      waitingTime: 10,
      remainingStopTime: 1,
    })
  })

  it('uses the individual state of another bus', () => {
    const world = createVerticalSliceWorld()
    const initialBus = world.buses.get('bus-main1')

    if (!initialBus) {
      throw new Error('Second bus is missing')
    }

    const estimate = estimateBusBoarding({
      bus: {
        ...initialBus,
        stopWaitSeconds: 8,
      },
      routeStopCount: 2,
      boardingStopIndex: 0,
      destinationStopIndex: 1,
      passengerArrivalTime: 3,
      legDistances: [440],
    })

    expect(estimate).toEqual({
      waitingTime: 3.5,
      remainingStopTime: 8,
    })
  })
})
