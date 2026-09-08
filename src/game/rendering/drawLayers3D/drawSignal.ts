import type { Vector2 } from '@/game/domain/geometry'
import { IsometricCamera } from '../isometric/IsometricCamera'
import type { Context } from './shared3D'

export function drawSignal(
  context: Context,
  camera: IsometricCamera,
  position: Vector2,
  color: string,
): void {
  const base = camera.project(position, 2)
  const top = camera.project(position, 25)
  context.strokeStyle = '#3f5054'
  context.lineWidth = Math.max(1.5, camera.scale * 2.2)
  context.beginPath()
  context.moveTo(base.x, base.y)
  context.lineTo(top.x, top.y)
  context.stroke()
  context.shadowColor = color
  context.shadowBlur = 8
  context.fillStyle = color
  context.beginPath()
  context.arc(top.x, top.y, 3.3 * camera.scale, 0, Math.PI * 2)
  context.fill()
  context.shadowBlur = 0
}
