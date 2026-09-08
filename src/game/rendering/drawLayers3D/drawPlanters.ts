import { Direction } from '@/game/domain/Direction'
import type { Vector2 } from '@/game/domain/geometry'
import { IsometricCamera } from '../isometric/IsometricCamera'
import type { Context } from './shared3D'
import { COLORS } from './shared3D'
import { drawFlatRect } from './drawFlatRect'

export function drawPlanters(
  context: Context,
  camera: IsometricCamera,
  center: Vector2,
  size: Vector2,
): void {
  const positions = [
    { x: center.x - size.x * 0.38, y: center.y - size.y * 0.38 },
    { x: center.x + size.x * 0.38, y: center.y + size.y * 0.38 },
  ]
  for (const position of positions) {
    drawFlatRect(context, camera, position, { x: 25, y: 12 }, Direction.South, COLORS.lawnDark, 2)
    const crown = camera.project(position, 13)
    const trunk = camera.project(position, 2)
    context.strokeStyle = '#5f5845'
    context.lineWidth = Math.max(1, 2 * camera.scale)
    context.beginPath()
    context.moveTo(trunk.x, trunk.y)
    context.lineTo(crown.x, crown.y)
    context.stroke()
    context.fillStyle = COLORS.lawn
    context.beginPath()
    context.ellipse(crown.x, crown.y, 7 * camera.scale, 5 * camera.scale, 0, 0, Math.PI * 2)
    context.fill()
    for (let i = 0; i < 9; i++) {
      const angle = i * 2.4
      const leaf = camera.project(
        { x: position.x + Math.cos(angle) * 6, y: position.y + Math.sin(angle) * 6 },
        12 + (i % 3) * 3,
      )
      context.fillStyle = ['#758d58', '#8d9f6e', '#536f49'][i % 3]!
      context.beginPath()
      context.ellipse(leaf.x, leaf.y, 3.5 * camera.scale, 4 * camera.scale, 0, 0, Math.PI * 2)
      context.fill()
    }
  }
}
