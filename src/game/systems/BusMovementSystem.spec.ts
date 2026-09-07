import { describe, expect, it } from 'vitest'
import { createVerticalSliceWorld } from '@/game/world/MapFactory'
import { BusState } from '@/game/domain/Bus'
import { Direction } from '@/game/domain/Direction'
import { BusMovementSystem } from './BusMovementSystem'

describe('BusMovementSystem', () => {
  it('waits and follows the prepared cycle through both turnarounds', () => {
    const world = createVerticalSliceWorld()
    const system = new BusMovementSystem()
    const bus = world.buses.get('bus-main')!

    expect(bus.direction).toBe(Direction.West)
    system.update(world, 0.5)
    expect(bus.state).toBe(BusState.WaitingAtStop)
    expect(bus.waitingSecondsRemaining).toBe(0.5)

    system.update(world, 0.5)
    expect(bus.state).toBe(BusState.Moving)
    expect(bus.pathIndex).toBe(1)
    expect(bus.legIndex).toBe(0)

    system.update(world, 0.5)
    expect(bus.position).toEqual({ x: 220, y: 340 })
    expect(bus.direction).toBe(Direction.West)
    system.update(world, 0.5)
    expect(bus.position).toEqual({ x: 220, y: 340 })
    expect(bus.direction).toBe(Direction.East)

    system.update(world, 6)
    expect(bus.position).toEqual({ x: 700, y: 340 })
    expect(bus.legIndex).toBe(1)
    expect(bus.state).toBe(BusState.WaitingAtStop)

    system.update(world, 1)
    expect(bus.state).toBe(BusState.Moving)
    system.update(world, 0.5)
    expect(bus.position).toEqual({ x: 740, y: 340 })
    expect(bus.direction).toBe(Direction.East)
    system.update(world, 0.5)
    expect(bus.position).toEqual({ x: 740, y: 340 })
    expect(bus.direction).toBe(Direction.West)

    system.update(world, 6)
    expect(bus.position).toEqual({ x: 260, y: 340 })
    expect(bus.legIndex).toBe(0)
    expect(bus.state).toBe(BusState.WaitingAtStop)
  })
})
