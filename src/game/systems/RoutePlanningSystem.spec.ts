import { describe, expect, it } from 'vitest'

import { createVerticalSliceWorld } from '@/game/world/MapFactory'

import { RoutePlanningSystem } from './RoutePlanningSystem'

describe('RoutePlanningSystem', () => {
  it('chooses the bus when a suitable bus arrives soon enough', () => {
    const world = createVerticalSliceWorld()
    const system = new RoutePlanningSystem()
    const pedestrian = world.pedestrians.get('pedestrian-main')
    const boardingStop = world.stops.get('stop-house')
    const approachingBus = world.buses.get('bus-main1')

    if (!pedestrian || !boardingStop || !approachingBus) {
      throw new Error('Initial entities are missing')
    }

    world.buses.set(approachingBus.id, {
      ...approachingBus,
      stopWaitSeconds: 0.25,
      waitingSecondsRemaining: 0,
    })

    pedestrian.state = 'choosingTransport'
    pedestrian.path = []
    pedestrian.pathIndex = 0

    system.update(world, 0)

    expect(pedestrian.state).toBe('walkingToStop')
    expect(pedestrian.path.at(-1)).toEqual(boardingStop.waitingPosition)
    expect(pedestrian.pathIndex).toBe(1)
  })

  it('chooses walking when the passenger misses the nearby bus', () => {
    const world = createVerticalSliceWorld()
    const system = new RoutePlanningSystem()
    const pedestrian = world.pedestrians.get('pedestrian-main')
    const destination = world.buildings.get('building-office')

    if (!pedestrian || !destination) {
      throw new Error('Initial entities are missing')
    }

    world.buses.delete('bus-main1')

    pedestrian.state = 'choosingTransport'
    pedestrian.path = []
    pedestrian.pathIndex = 0

    system.update(world, 0)

    expect(pedestrian.state).toBe('walking')
    expect(pedestrian.path.at(-1)).toEqual(destination.entrance)
    expect(pedestrian.pathIndex).toBe(1)
  })
})
