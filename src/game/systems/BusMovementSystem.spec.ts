import { describe, expect, it } from 'vitest'

import { createVerticalSliceWorld } from '@/game/world/MapFactory'

import { BusMovementSystem } from './BusMovementSystem'

describe('BusMovementSystem', () => {
  it('waits, travels to the next stop and turns back', () => {
    const world = createVerticalSliceWorld()
    const system = new BusMovementSystem()
    const bus = world.buses.get('bus-main')

    expect(bus).toBeDefined()

    if (!bus) {
      throw new Error('Initial bus is missing')
    }

    system.update(world, 0.5)

    expect(bus.state).toBe('waitingAtStop')
    expect(bus.waitingSecondsRemaining).toBe(0.5)

    system.update(world, 0.5)

    expect(bus.state).toBe('moving')
    expect(bus.pathIndex).toBe(1)

    system.update(world, 1)

    expect(bus.position).toEqual({
      x: 340,
      y: 340,
    })

    system.update(world, 4.5)

    expect(bus.position).toEqual({
      x: 700,
      y: 340,
    })
    expect(bus.currentStopIndex).toBe(1)
    expect(bus.state).toBe('waitingAtStop')

    system.update(world, 1)

    expect(bus.state).toBe('moving')
    expect(bus.direction).toBe(-1)
  })
})
