import { describe, expect, it } from 'vitest'

import { Direction } from '@/game/domain/Direction'
import type { Intersection } from '@/game/domain/Intersection'
import { getIntersectionExits } from './getIntersectionExits'

function createIntersection(): Intersection {
  return {
    id: 'intersection-test',
    position: { x: 480, y: 150 },
    size: 64,
    direction: Direction.South,

    connections: new Map([
      [Direction.West, 'node-west'],
      [Direction.East, 'node-east'],
      [Direction.South, 'node-south'],
    ]),

    movements: new Map<Direction, ReadonlySet<Direction>>([
      [Direction.West, new Set([Direction.East, Direction.South])],
      [Direction.East, new Set([Direction.West])],
      [Direction.South, new Set([Direction.East])],
    ]),
  }
}

describe('getIntersectionExits', () => {
  it('returns allowed exits and their next nodes', () => {
    const intersection = createIntersection()

    expect(getIntersectionExits(intersection, Direction.West)).toEqual([
      { direction: Direction.East, nextNodeId: 'node-east' },
      { direction: Direction.South, nextNodeId: 'node-south' },
    ])
  })

  it('respects restrictions for each entry side', () => {
    const intersection = createIntersection()

    expect(getIntersectionExits(intersection, Direction.East)).toEqual([
      { direction: Direction.West, nextNodeId: 'node-west' },
    ])
  })

  it('returns no exits for a disconnected entry side', () => {
    const intersection = createIntersection()

    expect(getIntersectionExits(intersection, Direction.North)).toEqual([])
  })

  it('allows a U-turn when explicitly configured', () => {
    const intersection: Intersection = {
      ...createIntersection(),
      movements: new Map([[Direction.South, new Set([Direction.South])]]),
    }

    expect(getIntersectionExits(intersection, Direction.South)).toEqual([
      { direction: Direction.South, nextNodeId: 'node-south' },
    ])
  })

  it('returns no exits when entry has no movement rules', () => {
    const intersection: Intersection = {
      ...createIntersection(),
      movements: new Map(),
    }

    expect(getIntersectionExits(intersection, Direction.West)).toEqual([])
  })

  it('rejects an exit through a disconnected side', () => {
    const intersection: Intersection = {
      ...createIntersection(),
      movements: new Map([[Direction.West, new Set([Direction.North])]]),
    }

    expect(() => getIntersectionExits(intersection, Direction.West)).toThrow('disconnected side')
  })
})
