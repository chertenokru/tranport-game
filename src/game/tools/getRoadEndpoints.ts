import type { Road } from '@/game/domain/Road'
import type { Vector2 } from '@/game/domain/geometry'
import { localToWorld } from './geometry'

export interface RoadEndpoints {
  readonly start: Vector2
  readonly end: Vector2
}

export function getRoadEndpoints(road: Road): RoadEndpoints {
  const halfLength = road.length / 2

  return {
    start: localToWorld({ x: 0, y: -halfLength }, road.position, road.direction),
    end: localToWorld({ x: 0, y: halfLength }, road.position, road.direction),
  }
}
