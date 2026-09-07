import { describe, expect, it } from 'vitest'
import { GameWorld } from '@/game/core/GameWorld'
import { Direction } from '@/game/domain/Direction'
import { buildPedestrianPath, pedestrianPathDistance } from './buildPedestrianPath'
import { createIShapedWorld } from '@/game/world/createIShapedWorld'
import { getBuildingEntrance } from '@/game/tools/getBuildingEntrance'

function createWorld(...crossingXs: number[]): GameWorld {
  const world = new GameWorld()
  world.roads.set('road', {
    id: 'road',
    position: { x: 0, y: 0 },
    length: 200,
    width: 40,
    direction: Direction.East,
  })
  for (const x of crossingXs) {
    world.crossings.set(`crossing-${x}`, {
      id: `crossing-${x}`,
      roadId: 'road',
      position: { x, y: 0 },
      direction: Direction.East,
      roadWidth: 40,
      width: 24,
    })
  }
  return world
}

describe('buildPedestrianPath', () => {
  const from = { x: -50, y: -60 }
  const to = { x: 50, y: 60 }

  it('replaces a road crossing with a route through the nearest pedestrian crossing', () => {
    const path = buildPedestrianPath(createWorld(-20, 20), from, to, 30)

    expect(path).toEqual([
      from,
      { x: -20, y: -32 },
      { x: -20, y: 32, crossingId: 'crossing--20' },
      to,
    ])
    expect(pedestrianPathDistance(path)).toBeGreaterThan(Math.hypot(100, 120))
  })

  it('walks directly when no crossing is inside the configured search radius', () => {
    expect(buildPedestrianPath(createWorld(40), from, to, 39)).toEqual([from, to])
  })

  it('does not add a crossing when both endpoints are on the same side of the road', () => {
    expect(buildPedestrianPath(createWorld(0), from, { x: 50, y: -40 })).toEqual([
      from,
      { x: 50, y: -40 },
    ])
  })

  it('uses the crossing in the opposite direction', () => {
    expect(buildPedestrianPath(createWorld(0), to, from)).toEqual([
      to,
      { x: 0, y: 32 },
      { x: 0, y: -32, crossingId: 'crossing-0' },
      from,
    ])
  })

  it('validates the search radius', () => {
    expect(() => buildPedestrianPath(createWorld(0), from, to, -1)).toThrow(RangeError)
  })

  it('routes a diagonal journey across all encountered roads on the I-shaped map', () => {
    const world = createIShapedWorld()
    const path = buildPedestrianPath(
      world,
      getBuildingEntrance(world.buildings.get('building-upper-house')!),
      getBuildingEntrance(world.buildings.get('building-lower-office')!),
    )

    expect(path.flatMap((point) => point.crossingId ?? [])).toEqual([
      'crossing-upper-left',
      'crossing-middle',
      'crossing-lower-right',
    ])
  })
})
