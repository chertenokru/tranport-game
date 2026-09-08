import { Direction } from '@/game/domain/Direction'
import type { Vector2 } from '@/game/domain/geometry'
import { IsometricCamera } from '../isometric/IsometricCamera'
import type { Context } from './shared3D'
import { drawFlatRect } from './drawFlatRect'

export function drawDistrictTree(
  context: Context,
  camera: IsometricCamera,
  position: Vector2,
): void {
  drawFlatRect(context, camera, position, { x: 16, y: 16 }, Direction.South, '#899774', 1)
  const bottom = camera.project(position, 2)
  const top = camera.project(position, 26)
  context.strokeStyle = '#74634e'
  context.lineWidth = 2 * camera.scale
  context.beginPath()
  context.moveTo(bottom.x, bottom.y)
  context.lineTo(top.x, top.y)
  context.stroke()
  for (let i = 0; i < 18; i++) {
    const angle = i * 2.4
    const radius = i < 12 ? 8 : 4
    const leaf = camera.project(
      { x: position.x + Math.cos(angle) * radius, y: position.y + Math.sin(angle) * radius },
      22 + i * 0.75,
    )
    context.fillStyle = ['#526d46', '#718958', '#8d9e6d', '#607d50'][i % 4]!
    context.beginPath()
    context.ellipse(leaf.x, leaf.y, 5 * camera.scale, 6 * camera.scale, 0, 0, Math.PI * 2)
    context.fill()
  }
}
