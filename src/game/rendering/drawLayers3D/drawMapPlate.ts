import type { Context } from './shared3D'
import { COLORS } from './shared3D'

export function drawMapPlate(context: Context, money: number): void {
  context.save()
  context.textAlign = 'left'
  context.textBaseline = 'alphabetic'
  context.fillStyle = 'rgb(247 250 247 / 0.9)'
  context.beginPath()
  context.roundRect(18, 18, 174, 42, 10)
  context.fill()
  context.fillStyle = COLORS.cyan
  context.fillRect(18, 18, 4, 42)
  context.fillStyle = COLORS.ink
  context.font = '700 10px Inter, system-ui, sans-serif'
  context.fillText('CIVIC TRANSIT GRID', 34, 35)
  context.font = '600 9px Inter, system-ui, sans-serif'
  context.fillStyle = '#65777a'
  context.fillText(`БЮДЖЕТ  ${money}`, 34, 50)
  context.restore()
}
