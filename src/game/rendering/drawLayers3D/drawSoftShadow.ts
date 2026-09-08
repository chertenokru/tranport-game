import { Direction } from '@/game/domain/Direction'
import type { Vector2 } from '@/game/domain/geometry'
import { IsometricCamera } from '../isometric/IsometricCamera'
import type { Context } from './shared3D'
import { rectCorners } from './rectCorners'
import { fillPolygon } from './fillPolygon'

export function drawSoftShadow(
  context: Context,
  camera: IsometricCamera,
  center: Vector2,
  size: Vector2,
  direction: Direction,
  height: number,
): void {
  const offsetCenter = { x: center.x + height * 0.18, y: center.y + height * 0.13 }
  const shadow = rectCorners(offsetCenter, size, direction).map((point) => camera.project(point, 0))
  context.save()
  context.filter = `blur(${Math.max(3, height * 0.07 * camera.scale)}px)`
  context.globalAlpha = 0.2
  fillPolygon(context, shadow, '#17322f')
  context.restore()
}
