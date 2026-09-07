import type { Vector2 } from '@/game/domain/geometry'
import type { GameWorld } from '@/game/core/GameWorld'
import { getCrossingGeometry } from '@/game/tools/getCrossingGeometry'

export interface TrafficZone {
  readonly id: string
  readonly position: Vector2
  readonly halfSize: Vector2
  /** An external occupant, e.g. a pedestrian on a future crossing, prevents entry. */
  readonly blocked: boolean
}

export function getTrafficZones(world: GameWorld): TrafficZone[] {
  const intersections = [...world.intersections.values()].map((intersection) => ({
    id: intersection.id,
    position: intersection.position,
    halfSize: { x: intersection.size / 2, y: intersection.size / 2 },
    blocked: false,
  }))
  const crossings = [...world.crossings.values()].map((crossing) => ({
    id: crossing.id,
    position: crossing.position,
    halfSize: getCrossingGeometry(crossing).halfSize,
    blocked: (world.crossingOccupants.get(crossing.id)?.size ?? 0) > 0,
  }))
  return [...intersections, ...crossings]
}
