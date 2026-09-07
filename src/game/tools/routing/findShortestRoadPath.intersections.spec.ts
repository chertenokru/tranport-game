import { describe, expect, it } from 'vitest'

import { GameWorld } from '@/game/core/GameWorld.ts'
import { Direction } from '@/game/domain/Direction.ts'
import type { Intersection } from '@/game/domain/Intersection.ts'
import { findShortestRoadPath } from '@/game/tools/routing/findShortestRoadPath.ts'

function addEdge(world: GameWorld, from: string, to: string, cost = 10) {
  const id = `${from}-${to}`

  world.roadEdges.set(id, {
    id,
    from,
    to,
    roadId: 'test-road',
    traversalCost: cost,
  })
}

function createWorld() {
  const world = new GameWorld()

  world.roadNodes.set('start', {
    id: 'start',
    position: { x: 0, y: 0 },
  })

  world.roadNodes.set('junction', {
    id: 'junction',
    position: { x: 10, y: 0 },
    intersectionId: 'junction',
  })

  world.roadNodes.set('turnaround', {
    id: 'turnaround',
    position: { x: 20, y: 0 },
    intersectionId: 'turnaround',
  })

  world.roadNodes.set('destination', {
    id: 'destination',
    position: { x: 10, y: -10 },
  })

  const junction: Intersection = {
    id: 'junction',
    position: { x: 10, y: 0 },
    size: 4,
    direction: Direction.South,

    connections: new Map([
      [Direction.West, 'start'],
      [Direction.East, 'turnaround'],
      [Direction.North, 'destination'],
    ]),

    movements: new Map<Direction, ReadonlySet<Direction>>([
      [Direction.West, new Set([Direction.East])],
      [Direction.East, new Set([Direction.North])],
    ]),
  }

  world.intersections.set(junction.id, junction)

  world.intersections.set('turnaround', {
    id: 'turnaround',
    position: { x: 20, y: 0 },
    size: 4,
    direction: Direction.South,

    connections: new Map([[Direction.West, 'junction']]),

    movements: new Map([[Direction.West, new Set([Direction.West])]]),
  })

  addEdge(world, 'start', 'junction')
  addEdge(world, 'junction', 'turnaround')
  addEdge(world, 'turnaround', 'junction')
  addEdge(world, 'junction', 'destination')

  return world
}

describe('findShortestRoadPath with intersections', () => {
  it('revisits an intersection from another side after an allowed U-turn', () => {
    const world = createWorld()

    expect(findShortestRoadPath(world, 'start', 'destination')).toEqual([
      'start',
      'junction',
      'turnaround',
      'junction',
      'destination',
    ])
  })

  it('cannot bypass a turn restriction by reversing at an ordinary node', () => {
    const world = createWorld()

    world.roadNodes.set('turnaround', {
      id: 'turnaround',
      position: { x: 20, y: 0 },
    })
    world.intersections.delete('turnaround')

    expect(findShortestRoadPath(world, 'start', 'destination')).toBeNull()
  })

  it('finds a more expensive arrival from a side that permits the exit', () => {
    const world = createWorld()
    const junction = world.intersections.get('junction')!
    const turnaround = world.intersections.get('turnaround')!

    world.intersections.set('turnaround', {
      ...turnaround,
      movements: new Map(),
    })

    world.roadNodes.set('south', {
      id: 'south',
      position: { x: 10, y: 10 },
    })

    world.intersections.set('junction', {
      ...junction,
      connections: new Map([...junction.connections, [Direction.South, 'south']]),
      movements: new Map([...junction.movements, [Direction.South, new Set([Direction.North])]]),
    })

    addEdge(world, 'start', 'south', 30)
    addEdge(world, 'south', 'junction')

    expect(findShortestRoadPath(world, 'start', 'destination')).toEqual([
      'start',
      'south',
      'junction',
      'destination',
    ])
  })

  it('requires an incoming node when starting at an intersection', () => {
    const world = createWorld()

    expect(findShortestRoadPath(world, 'junction', 'destination')).toBeNull()

    expect(
      findShortestRoadPath(world, 'junction', 'destination', {
        fromNodeId: 'turnaround',
      }),
    ).toEqual(['junction', 'destination'])
  })

  it('does not invent reverse edges', () => {
    const world = createWorld()

    expect(findShortestRoadPath(world, 'destination', 'start')).toBeNull()
  })

  it('continues from the actual incoming node', () => {
    const world = createWorld()

    const path = findShortestRoadPath(world, 'junction', 'destination', { fromNodeId: 'start' })

    expect(path).toEqual(['junction', 'turnaround', 'junction', 'destination'])
  })

  it('reaches the destination through the required incoming node', () => {
    const world = createWorld()

    const path = findShortestRoadPath(world, 'start', 'junction', {
      destinationFromNodeId: 'turnaround',
    })

    expect(path).toEqual(['start', 'junction', 'turnaround', 'junction'])
  })

  it('can return to the same node from another side', () => {
    const world = createWorld()

    const path = findShortestRoadPath(world, 'junction', 'junction', {
      fromNodeId: 'start',
      destinationFromNodeId: 'turnaround',
    })

    expect(path).toEqual(['junction', 'turnaround', 'junction'])
  })

  it('rejects an arrival that requires a forbidden turnaround', () => {
    const world = createWorld()
    const turnaround = world.intersections.get('turnaround')!

    world.intersections.set(turnaround.id, {
      ...turnaround,
      movements: new Map(),
    })

    const path = findShortestRoadPath(world, 'start', 'junction', {
      destinationFromNodeId: 'turnaround',
    })

    expect(path).toBeNull()
  })

  it('rejects a starting arrival without an incoming edge', () => {
    const world = createWorld()

    // Есть junction → destination, но нет обратного ребра.
    const path = findShortestRoadPath(world, 'junction', 'destination', {
      fromNodeId: 'destination',
    })

    expect(path).toBeNull()
  })
})
