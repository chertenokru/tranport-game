import type { ScreenPoint } from '../isometric/IsometricCamera'
import type { Context } from './shared3D'
import { COLORS } from './shared3D'

export function drawLabel(
  context: Context,
  position: ScreenPoint,
  title: string,
  subtitle: string,
  accent: string,
): void {
  context.save()
  context.font = '700 11px Inter, system-ui, sans-serif'
  const width = Math.max(context.measureText(title).width + 24, 82)
  const height = 37
  const x = position.x - width / 2
  const y = position.y - height
  context.shadowColor = 'rgb(20 39 44 / 0.2)'
  context.shadowBlur = 10
  context.fillStyle = 'rgb(247 250 247 / 0.93)'
  context.beginPath()
  context.roundRect(x, y, width, height, 8)
  context.fill()
  context.shadowBlur = 0
  context.fillStyle = accent
  context.fillRect(x, y, 4, height)
  context.fillStyle = COLORS.ink
  context.textAlign = 'left'
  context.textBaseline = 'middle'
  context.fillText(title, x + 13, y + 13)
  context.font = '600 8px Inter, system-ui, sans-serif'
  context.fillStyle = '#65777a'
  context.fillText(subtitle, x + 13, y + 27)
  context.restore()
}
