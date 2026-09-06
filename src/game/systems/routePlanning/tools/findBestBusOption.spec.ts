import { describe, expect, it } from 'vitest'

import { createVerticalSliceWorld } from '@/game/world/MapFactory.ts'

import { findBestBusOption } from './findBestBusOption.ts'

describe('findBestBusOption', () => {
  it('selects the bus with the best predicted journey time', () => {
    const world = createVerticalSliceWorld()
    const buses = [...world.buses.values()].map((bus) => ({
      ...bus,
      stopWaitSeconds: 1,
    }))

    const option = findBestBusOption({
      buses,
      routeId: 'route-main',
      boardingStopIndex: 0,
      destinationStopIndex: 1,
      passengerArrivalTime: 3,
      legDistances: [440],
    })

    expect(option).toEqual({
      busId: 'bus-main1',
      waitingTime: 3.5,
      boardingStopTime: 1,
      movementTime: 5.5,
      intermediateStopTime: 0,
      busTravelTime: 6.5,
      totalTimeAfterReachingStop: 10,
    })
  })

  it('returns null when the route has no active buses', () => {
    const option = findBestBusOption({
      buses: [],
      routeId: 'route-main',
      boardingStopIndex: 0,
      destinationStopIndex: 1,
      passengerArrivalTime: 3,
      legDistances: [440],
    })

    expect(option).toBeNull()
  })
})
