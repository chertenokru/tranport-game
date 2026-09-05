import type { Vector2 } from '@/game/domain/geometry.ts'
import type { RoadId } from '@/game/domain/ids.ts'

export interface Road {
  readonly id: RoadId
  readonly start: Vector2
  readonly end: Vector2
  readonly width: number
}
