import { describe, expect, it } from 'vitest'

import { createIShapedWorld } from '@/game/world/createIShapedWorld'
import { createShuttleRoute } from './createShuttleRoute'

const definition = {
  id: 'route-test',
  name: 'Test route',
  stopIds: ['stop-upper-house', 'stop-shop', 'stop-lower-office'],
}

describe('createShuttleRoute', () => {
  it('prepares both directions including terminal turnarounds', () => {
    const route = createShuttleRoute(createIShapedWorld(), definition)

    expect(route.legs.map((leg) => [leg.fromStopId, leg.toStopId])).toEqual([
      ['stop-upper-house', 'stop-shop'],
      ['stop-shop', 'stop-lower-office'],
      ['stop-lower-office', 'stop-shop'],
      ['stop-shop', 'stop-upper-house'],
    ])
    expect(route.legs.reduce((sum, leg) => sum + leg.distance, 0)).toBe(2592)
  })

  it('rejects a route without a legal return journey', () => {
    const world = createIShapedWorld()
    const terminal = world.intersections.get('intersection-lower-right-turnaround')!

    world.intersections.set(terminal.id, {
      ...terminal,
      movements: new Map(),
    })

    expect(() => createShuttleRoute(world, definition)).toThrow(
      'Cannot build a complete cycle for route "route-test"',
    )
  })
})
