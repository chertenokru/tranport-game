import type { Direction } from './Direction'
import type { Vector2 } from './geometry'
import type { RoadId } from './ids'

export interface Road {
  readonly id: RoadId

  // Центр участка.
  readonly position: Vector2

  readonly length: number
  readonly width: number

  // Направление от начала участка к концу.
  readonly direction: Direction
}
