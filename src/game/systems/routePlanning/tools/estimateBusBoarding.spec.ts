import { describe, expect, it } from 'vitest'

import { createVerticalSliceWorld } from '@/game/world/MapFactory.ts'

import { estimateBusBoarding } from './estimateBusBoarding.ts'
import { BusMovementSystem } from '@/game/systems/BusMovementSystem'
import { createIShapedWorld } from '@/game/world/createIShapedWorld'

describe('estimateBusBoarding', () => {
  it('uses the remaining prepared path while the bus is moving', () => {
    const world = createVerticalSliceWorld()
    const route = world.routes.get('route-main')!
    const bus = world.buses.get('bus-main')!
    const movement = new BusMovementSystem()
    movement.update(world, 1)
    movement.update(world, 0.5)

    expect(
      estimateBusBoarding({
        bus,
        route,
        boardingStopIndex: 1,
        passengerArrivalTime: 0,
      }),
    ).toEqual({ waitingTime: 6.5, remainingStopTime: 1 })

    // Проезд мимо начальной остановки после разворота не является посадкой.
    expect(
      estimateBusBoarding({
        bus,
        route,
        boardingStopIndex: 0,
        passengerArrivalTime: 0,
      }),
    ).toEqual({ waitingTime: 14.5, remainingStopTime: 1 })
  })

  it('distinguishes the two shop visits and includes the terminal detour', () => {
    const world = createIShapedWorld()
    const route = world.routes.get('route-upper-lower')!
    const bus = world.buses.get('bus-route-upper-lower')!
    bus.legIndex = 1
    bus.position = { ...route.legs[1]!.path[0]! }
    bus.waitingSecondsRemaining = 1

    expect(
      estimateBusBoarding({
        bus,
        route,
        boardingStopIndex: 1,
        passengerArrivalTime: 0,
      }),
    ).toEqual({ waitingTime: 0, remainingStopTime: 1 })
    const returnVisit = estimateBusBoarding({
      bus,
      route,
      boardingStopIndex: 3,
      passengerArrivalTime: 0,
    })!
    expect(returnVisit.waitingTime).toBeCloseTo(18.2)
    expect(returnVisit.remainingStopTime).toBe(1)
  })

  it('advances by whole cycles when a passenger arrives much later', () => {
    const world = createVerticalSliceWorld()
    expect(
      estimateBusBoarding({
        bus: world.buses.get('bus-main')!,
        route: world.routes.get('route-main')!,
        boardingStopIndex: 0,
        passengerArrivalTime: 10000,
      }),
    ).toEqual({ waitingTime: 0, remainingStopTime: 1 })
  })

  it('returns the remaining stop time when the passenger catches a waiting bus', () => {
    const world = createVerticalSliceWorld()
    const bus = world.buses.get('bus-main')

    if (!bus) {
      throw new Error('Initial bus is missing')
    }

    const estimate = estimateBusBoarding({
      bus,
      route: world.routes.get('route-main')!,
      boardingStopIndex: 0,
      passengerArrivalTime: 0.5,
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
      route: world.routes.get('route-main')!,
      boardingStopIndex: 0,
      passengerArrivalTime: 3,
    })

    expect(estimate).toEqual({
      waitingTime: 13,
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
      route: world.routes.get('route-main')!,
      boardingStopIndex: 0,
      passengerArrivalTime: 3,
    })

    expect(estimate).toEqual({
      waitingTime: 5,
      remainingStopTime: 8,
    })
  })
})
