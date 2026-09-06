import { describe, expect, it } from 'vitest'

import { type Building, BuildingType } from '@/game/domain/Building'
import { Direction } from '@/game/domain/Direction'
import { getBuildingEntrance } from './getBuildingEntrance'

describe('getBuildingEntrance', () => {
  it.each([
    [Direction.South, { x: 140, y: 280 }],
    [Direction.North, { x: 140, y: 180 }],
    [Direction.East, { x: 190, y: 230 }],
    [Direction.West, { x: 90, y: 230 }],
  ])('places the entrance for direction %s', (direction, expected) => {
    const building: Building = {
      id: 'test-building',
      name: 'Здание',
      type: BuildingType.Residential,
      position: { x: 140, y: 230 },
      size: { x: 120, y: 100 },
      direction,
    }

    expect(getBuildingEntrance(building)).toEqual(expected)
  })
})
