import { Direction } from '@/game/domain/Direction'
import type { Vector2 } from '@/game/domain/geometry'
import { localToWorld } from '@/game/tools/geometry'

export function rectCorners(center: Vector2, size: Vector2, direction: Direction): Vector2[] {
  return [
    { x: -size.x / 2, y: -size.y / 2 },
    { x: size.x / 2, y: -size.y / 2 },
    { x: size.x / 2, y: size.y / 2 },
    { x: -size.x / 2, y: size.y / 2 },
  ].map((point) => localToWorld(point, center, direction))
}
