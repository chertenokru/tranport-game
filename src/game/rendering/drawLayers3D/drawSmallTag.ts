import type { ScreenPoint } from '../isometric/IsometricCamera'
import type { Context } from './shared3D'
import { COLORS } from './shared3D'

export function drawSmallTag(context: Context, position: ScreenPoint, text: string): void {
  context.save()
  context.font = '600 8px Inter, system-ui, sans-serif'
  const width = context.measureText(text).width + 12
  context.fillStyle = 'rgb(247 250 247 / 0.9)'
  context.beginPath()
  context.roundRect(position.x - width / 2, position.y - 10, width, 16, 5)
  context.fill()
  context.fillStyle = COLORS.ink
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.fillText(text, position.x, position.y - 2)
  context.restore()
}
