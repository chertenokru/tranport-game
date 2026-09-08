import { Direction } from '@/game/domain/Direction'
import type { Vector2 } from '@/game/domain/geometry'
import { IsometricCamera } from '../isometric/IsometricCamera'
import type { Context } from './shared3D'
import { rectCorners } from './rectCorners'
import { fillPolygon } from './fillPolygon'

export function drawFlatRect(
  context: Context,
  camera: IsometricCamera,
  center: Vector2,
  size: Vector2,
  direction: Direction,
  color: string,
  elevation: number,
): void {
  fillPolygon(
    context,
    rectCorners(center, size, direction).map((point) => camera.project(point, elevation)),
    color,
  )
}
