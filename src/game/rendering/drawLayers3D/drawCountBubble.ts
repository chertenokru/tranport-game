import type { ScreenPoint } from '../isometric/IsometricCamera'
import type { Context } from './shared3D'
import { COLORS } from './shared3D'

export function drawCountBubble(context: Context, position: ScreenPoint, count: number): void {
  context.fillStyle = COLORS.cyan
  context.beginPath()
  context.arc(position.x, position.y, 7, 0, Math.PI * 2)
  context.fill()
  context.fillStyle = COLORS.white
  context.font = '700 8px Inter, system-ui, sans-serif'
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.fillText(String(count), position.x, position.y + 0.5)
}
