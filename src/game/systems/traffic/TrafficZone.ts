import type { Vector2 } from '@/game/domain/geometry'
import type { GameWorld } from '@/game/core/GameWorld'

export interface TrafficZone {
  readonly id: string
  readonly position: Vector2
  readonly halfSize: Vector2
  /** An external occupant, e.g. a pedestrian on a future crossing, prevents entry. */
  readonly blocked: boolean
}

export function getTrafficZones(world: GameWorld): TrafficZone[] {
  return [...world.intersections.values()].map((intersection) => ({
    id: intersection.id,
    position: intersection.position,
    halfSize: { x: intersection.size / 2, y: intersection.size / 2 },
    blocked: false,
  }))
}
