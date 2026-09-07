import { describe, expect, it } from 'vitest'

import { GameWorld } from '@/game/core/GameWorld.ts'
import { Direction } from '@/game/domain/Direction.ts'
import { buildRouteLegs } from './buildRouteLegs.ts'
import { connectNodes } from '../../world/connectNodes.ts'
import { createIShapedWorld } from '../../world/createIShapedWorld.ts'

const STOPS = ['stop-upper-house', 'stop-shop', 'stop-lower-office', 'stop-shop']

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

    world.stops.set(id, {
      id,
      name: id,
      direction: Direction.South,
      vehiclePosition: position,
      waitingPosition: position,
    })

    world.roadNodes.set(id, {
      id,
      position,
      stopId: id,
    })
  }

  for (let index = 0; index < points.length; index += 1) {
    connectNodes(world, String(index), String((index + 1) % points.length), { roadId: 'ring' })
  }

  return world
}

describe('buildRouteLegs', () => {
  it('builds a continuous cycle including both terminal turnarounds', () => {
    const world = createIShapedWorld()
    const legs = buildRouteLegs(world, STOPS)!

    expect(legs).not.toBeNull()

    expect(legs.map((leg) => [leg.fromStopId, leg.toStopId])).toEqual([
      ['stop-upper-house', 'stop-shop'],
      ['stop-shop', 'stop-lower-office'],
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
      ['0', '1'],
      ['1', '2'],
      ['2', '3'],
      ['3', '0'],
    ])

    expect(legs.reduce((sum, leg) => sum + leg.distance, 0)).toBe(400)
  })

  it('rejects an open chain even when all forward legs exist', () => {
    const world = createRing()

    for (const [id, edge] of world.roadEdges) {
      if (edge.from === '3' && edge.to === '0') {
        world.roadEdges.delete(id)
      }
    }

    expect(buildRouteLegs(world, ['0', '1', '2', '3'])).toBeNull()
  })

  it('rejects missing stops and consecutive repeated stops', () => {
    const world = createIShapedWorld()

    expect(buildRouteLegs(world, ['stop-upper-house', 'missing'])).toBeNull()

    expect(buildRouteLegs(world, ['stop-shop', 'stop-shop'])).toBeNull()
  })
})
