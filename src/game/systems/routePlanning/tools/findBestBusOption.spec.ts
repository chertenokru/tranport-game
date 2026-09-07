import { describe, expect, it } from 'vitest'

import { createVerticalSliceWorld } from '@/game/world/MapFactory.ts'

import { findBestBusOption } from './findBestBusOption.ts'
import { createIShapedWorld } from '@/game/world/createIShapedWorld'

describe('findBestBusOption', () => {
  it('includes the last leg when a journey crosses the cycle boundary', () => {
    const world = createIShapedWorld()
    const route = world.routes.get('route-upper-lower')!
    const bus = world.buses.get('bus-route-upper-lower')!
    bus.legIndex = 3
    bus.position = { ...route.legs[3]!.path[0]! }

    const option = findBestBusOption({
      buses: [bus],
      route,
      boardingStopIndex: 3,
      alightingStopIndex: 0,
      passengerArrivalTime: 0,
    })!

    expect(option.movementTime).toBeCloseTo(7.3)
    expect(option.intermediateStopTime).toBe(0)
    expect(option.busTravelTime).toBeCloseTo(8.3)
  })

  it('selects the bus with the best predicted journey time', () => {
    const world = createVerticalSliceWorld()
    const buses = [...world.buses.values()].map((bus) => ({
      ...bus,
      stopWaitSeconds: 1,
    }))

    const option = findBestBusOption({
      buses,
      route: world.routes.get('route-main')!,
      boardingStopIndex: 0,
      alightingStopIndex: 1,
      passengerArrivalTime: 3,
    })

    expect(option).toEqual({
      busId: 'bus-main1',
      waitingTime: 5,
      boardingStopTime: 1,
      movementTime: 7,
      intermediateStopTime: 0,
      busTravelTime: 8,
      totalTimeAfterReachingStop: 13,
    })
  })

  it('returns null when the route has no active buses', () => {
    const world = createVerticalSliceWorld()
    const option = findBestBusOption({
      buses: [],
      route: world.routes.get('route-main')!,
      boardingStopIndex: 0,
      alightingStopIndex: 1,
      passengerArrivalTime: 3,
    })

    expect(option).toBeNull()
  })
})
