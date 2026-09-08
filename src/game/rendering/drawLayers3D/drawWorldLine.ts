import type { Vector2 } from '@/game/domain/geometry'
import { IsometricCamera } from '../isometric/IsometricCamera'
import type { Context } from './shared3D'

export function drawWorldLine(
  context: Context,
  camera: IsometricCamera,
  start: Vector2,
  end: Vector2,
  color: string,
  width: number,
  elevation: number,
): void {
  const screenStart = camera.project(start, elevation)
  const screenEnd = camera.project(end, elevation)
  context.strokeStyle = color
  context.lineWidth = width * camera.scale
  context.lineCap = 'butt'
  context.beginPath()
  context.moveTo(screenStart.x, screenStart.y)
  context.lineTo(screenEnd.x, screenEnd.y)
  context.stroke()
}
