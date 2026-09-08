import type { ScreenPoint } from '../isometric/IsometricCamera'
import type { Context } from './shared3D'

export function fillPolygon(context: Context, points: readonly ScreenPoint[], color: string): void {
  const first = points[0]
  if (!first) return
  context.fillStyle = color
  context.beginPath()
  context.moveTo(first.x, first.y)
  for (const point of points.slice(1)) context.lineTo(point.x, point.y)
  context.closePath()
  context.fill()
}
