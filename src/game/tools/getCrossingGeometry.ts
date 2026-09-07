import type { PedestrianCrossing } from '@/game/domain/PedestrianCrossing'
import { Direction } from '@/game/domain/Direction'
import { CROSSINGS_CONFIG } from '@/game/config/crossings.config'
import { localToWorld } from './geometry'

export function getCrossingGeometry(crossing: PedestrianCrossing) {
  const verticalRoad = crossing.direction === Direction.North || crossing.direction === Direction.South
  const offset = crossing.roadWidth / 2 + CROSSINGS_CONFIG.sidewalkOffset
  return {
    halfSize: {
      x: (verticalRoad ? crossing.roadWidth : crossing.width) / 2,
      y: (verticalRoad ? crossing.width : crossing.roadWidth) / 2,
    },
    entrances: [
      localToWorld({ x: -offset, y: 0 }, crossing.position, crossing.direction),
      localToWorld({ x: offset, y: 0 }, crossing.position, crossing.direction),
    ] as const,
  }
}
