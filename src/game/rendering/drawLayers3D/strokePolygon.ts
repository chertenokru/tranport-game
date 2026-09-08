import type { ScreenPoint } from '../isometric/IsometricCamera'
import type { Context } from './shared3D'

export function strokePolygon(
  context: Context,
  points: readonly ScreenPoint[],
  color: string,
  width: number,
): void {
  const first = points[0]
  if (!first) return
  context.strokeStyle = color
  context.lineWidth = width
  context.beginPath()
  context.moveTo(first.x, first.y)
  for (const point of points.slice(1)) context.lineTo(point.x, point.y)
  context.closePath()
  context.stroke()
}
