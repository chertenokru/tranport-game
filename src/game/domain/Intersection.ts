import type { Direction } from './Direction'
import type { Vector2 } from './geometry'
import type { IntersectionId } from './ids'
import type { MapNodeId } from '@/game/world/MapNode'

export interface Intersection {
  readonly id: IntersectionId
  readonly position: Vector2

  // Размер квадратной области перекрёстка.
  readonly size: number

  // Ориентация исходного рисунка.
  readonly direction: Direction

  // Подключённая сторона → следующая точка дорожного графа.
  readonly connections: ReadonlyMap<Direction, MapNodeId>

  // Сторона въезда → разрешённые стороны выхода.
  readonly movements: ReadonlyMap<Direction, ReadonlySet<Direction>>
}
