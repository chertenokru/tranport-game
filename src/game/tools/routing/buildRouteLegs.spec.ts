import { describe, expect, it, vi } from 'vitest'

import { GameWorld } from '@/game/core/GameWorld.ts'
import { Direction } from '@/game/domain/Direction.ts'
import { buildRouteLegs } from './buildRouteLegs.ts'
import { connectNodes } from '../../world/connectNodes.ts'
import { createIShapedWorld } from '../../world/createIShapedWorld.ts'

const STOPS = ['stop-upper-house', 'stop-shop-south', 'stop-lower-office', 'stop-shop']

function createRing(): GameWorld {
  const world = new GameWorld()

  const points = [
    { x: 0, y: 0 },
    { x: 100, y: 0 },
    { x: 100, y: 100 },
    { x: 0, y: 100 },
  ]

  for (const [index, position] of points.entries()) {
    const id = String(index)
    const next = points[(index + 1) % points.length]!
    const stopPosition = { x: (position.x + next.x) / 2, y: (position.y + next.y) / 2 }

    world.stops.set(id, {
      id,
      name: id,
      direction: Direction.South,
      roadNodeId: id,
      travelDirection: [Direction.East, Direction.South, Direction.West, Direction.North][index]!,
      vehiclePosition: stopPosition,
      waitingPosition: stopPosition,
    })

    world.roadNodes.set(id, {
      id,
      position: stopPosition,
    })
    world.roadNodes.set(`corner-${index}`, { id: `corner-${index}`, position })
  }

  for (let index = 0; index < points.length; index += 1) {
    const next = (index + 1) % points.length
    connectNodes(world, String(index), `corner-${next}`, { roadId: 'ring' })
    connectNodes(world, `corner-${next}`, String(next), { roadId: 'ring' })
  }

  return world
}

describe('buildRouteLegs', () => {
  it('builds a continuous cycle including both terminal turnarounds', () => {
    const world = createIShapedWorld()
    const legs = buildRouteLegs(world, STOPS)!

    expect(legs).not.toBeNull()

    expect(legs.map((leg) => [leg.fromStopId, leg.toStopId])).toEqual([
      ['stop-upper-house', 'stop-shop-south'],
      ['stop-shop-south', 'stop-lower-office'],
      ['stop-lower-office', 'stop-shop'],
      ['stop-shop', 'stop-upper-house'],
    ])

    const nodes = legs.flatMap((leg) => leg.nodeIds)

    expect(nodes).toContain('node-intersection-upper-left-turnaround')
    expect(nodes).toContain('node-intersection-lower-right-turnaround')

    expect(legs.reduce((sum, leg) => sum + leg.distance, 0)).toBe(2592)

    // Включая переход от последнего участка к первому.
    for (const [index, leg] of legs.entries()) {
      const next = legs[(index + 1) % legs.length]!

      expect(leg.nodeIds.at(-1)).toBe(next.nodeIds[0])

      // На остановке не возвращаемся сразу в узел,
      // из которого только что приехали.
      expect(leg.nodeIds.at(-2)).not.toBe(next.nodeIds[1])
    }
  })

  it.each(['intersection-upper-left-turnaround', 'intersection-lower-right-turnaround'])(
    'rejects the cycle when %s is closed',
    (id) => {
      const world = createIShapedWorld()
      const terminal = world.intersections.get(id)!

      world.intersections.set(id, {
        ...terminal,
        movements: new Map(),
      })

      expect(buildRouteLegs(world, STOPS)).toBeNull()
    },
  )

  it('supports a one-way ring without turnaround intersections', () => {
    const legs = buildRouteLegs(createRing(), ['0', '1', '2', '3'])!

    expect(legs).not.toBeNull()

    expect(legs.map((leg) => leg.nodeIds)).toEqual([
      ['0', 'corner-1', '1'],
      ['1', 'corner-2', '2'],
      ['2', 'corner-3', '3'],
      ['3', 'corner-0', '0'],
    ])

    expect(legs.reduce((sum, leg) => sum + leg.distance, 0)).toBe(400)
  })

  it('rejects an open chain even when all forward legs exist', () => {
    const world = createRing()

    for (const [id, edge] of world.roadEdges) {
      if (edge.from === '3') {
        world.roadEdges.delete(id)
      }
    }

    expect(buildRouteLegs(world, ['0', '1', '2', '3'])).toBeNull()
  })

  it('rejects missing stops and consecutive repeated stops', () => {
    const world = createIShapedWorld()

    expect(buildRouteLegs(world, ['stop-upper-house', 'missing'])).toBeNull()

    expect(buildRouteLegs(world, ['stop-shop', 'stop-shop'])).toBeNull()
    expect(buildRouteLegs(world, ['stop-shop', 'stop-upper-house', 'stop-shop'])).toBeNull()
  })

  it('rejects an arrival from the wrong direction on a one-way road', () => {
    const world = createRing()
    const stop = world.stops.get('0')!
    world.stops.set(stop.id, { ...stop, travelDirection: Direction.West })
    expect(buildRouteLegs(world, ['0', '1', '2', '3'])).toBeNull()
  })

  it('allows separate opposite stops at one road node, with a turnaround between them', () => {
    const world = createIShapedWorld()
    const legs = buildRouteLegs(world, ['stop-shop', 'stop-shop-south'])!
    expect(legs).not.toBeNull()
    expect(legs.every((leg) => leg.distance > 0)).toBe(true)
    expect(legs[0]!.nodeIds[0]).toBe(legs[0]!.nodeIds.at(-1))
    expect(legs.flatMap((leg) => leg.nodeIds)).toContain('node-intersection-upper-left-turnaround')
  })

  it('prepares the edges once for all searches in a route build', () => {
    const world = createIShapedWorld()
    const values = vi.spyOn(world.roadEdges, 'values')
    try {
      expect(buildRouteLegs(world, STOPS)).not.toBeNull()
      expect(values).toHaveBeenCalledTimes(1)
    } finally {
      values.mockRestore()
    }
  })
})
