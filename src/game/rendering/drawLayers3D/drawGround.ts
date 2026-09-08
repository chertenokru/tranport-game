import { IsometricCamera } from '../isometric/IsometricCamera'
import type { Context } from './shared3D'
import { COLORS } from './shared3D'
import { fillPolygon } from './fillPolygon'
import { strokePolygon } from './strokePolygon'

export function drawGround(context: Context, camera: IsometricCamera): void {
  const footprint = [
    { x: -34, y: -26 },
    { x: 994, y: -26 },
    { x: 994, y: 726 },
    { x: -34, y: 726 },
  ]
  const projected = footprint.map((point) => camera.project(point))
  const shadow = projected.map((point) => ({ x: point.x + 10, y: point.y + 18 }))

  context.save()
  context.filter = 'blur(12px)'
  context.globalAlpha = 0.24
  fillPolygon(context, shadow, '#243d3b')
  context.restore()

  fillPolygon(context, projected, COLORS.ground)
  strokePolygon(context, projected, COLORS.groundEdge, 2)
}
