import { describe, expect, it } from 'vitest'

import { createVerticalSliceWorld } from '@/game/world/MapFactory'

import { PedestrianMovementSystem } from './PedestrianMovementSystem'

describe('PedestrianMovementSystem', () => {
  it('moves a pedestrian toward the bus stop', () => {
    const world = createVerticalSliceWorld()
    const system = new PedestrianMovementSystem()
    const pedestrian = world.pedestrians.get('pedestrian-main')

    expect(pedestrian).toBeDefined()

    if (!pedestrian) {
      throw new Error('Initial pedestrian is missing')
    }
    const busStop = world.stops.get(pedestrian.boardingStopId)

    if (!busStop) {
      throw new Error('Boarding stop is missing')
    }
    pedestrian.state = 'walkingToStop'
    pedestrian.path = [pedestrian.position, busStop.waitingPosition]
    pedestrian.pathIndex = 1
    const startingPosition = {
      ...pedestrian.position,
    }

    const initialDistanceToStop = Math.hypot(
      busStop.waitingPosition.x - startingPosition.x,
      busStop.waitingPosition.y - startingPosition.y,
    )

    system.update(world, 1)

    const travelledDistance = Math.hypot(
      pedestrian.position.x - startingPosition.x,
      pedestrian.position.y - startingPosition.y,
    )

    const remainingDistanceToStop = Math.hypot(
      busStop.waitingPosition.x - pedestrian.position.x,
      busStop.waitingPosition.y - pedestrian.position.y,
    )

    expect(travelledDistance).toBeCloseTo(pedestrian.walkingSpeed, 5)
    expect(remainingDistanceToStop).toBeLessThan(initialDistanceToStop)
    expect(pedestrian.state).toBe('walkingToStop')
  })

  it('starts waiting after reaching the stop', () => {
    const world = createVerticalSliceWorld()
    const system = new PedestrianMovementSystem()
    const pedestrian = world.pedestrians.get('pedestrian-main')

    if (!pedestrian) {
      throw new Error('Initial pedestrian is missing')
    }

    const busStop = world.stops.get(pedestrian.boardingStopId)

    if (!busStop) {
      throw new Error('Boarding stop is missing')
    }
    pedestrian.state = 'walkingToStop'
    pedestrian.path = [pedestrian.position, busStop.waitingPosition]
    pedestrian.pathIndex = 1
    system.update(world, 10)

    expect(pedestrian.position).toEqual(busStop.waitingPosition)
    expect(pedestrian.state).toBe('waitingBus')
    expect(pedestrian.path).toEqual([])
    expect(pedestrian.pathIndex).toBe(0)
  })
})
