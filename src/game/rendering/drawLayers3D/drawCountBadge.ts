import type { ScreenPoint } from '../isometric/IsometricCamera'
import type { Context } from './shared3D'
import { COLORS } from './shared3D'

export function drawCountBadge(
  context: Context,
  position: ScreenPoint,
  passengers: number,
  collisions: number,
): void {
  const label = collisions > 0 ? `! ${collisions}   ◉ ${passengers}` : `◉ ${passengers}`
  context.save()
  context.font = '700 9px Inter, system-ui, sans-serif'
  const width = context.measureText(label).width + 12
  context.fillStyle = collisions > 0 ? '#b9343f' : COLORS.ink
  context.beginPath()
  context.roundRect(position.x - width / 2, position.y - 9, width, 17, 8)
  context.fill()
  context.fillStyle = COLORS.white
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.fillText(label, position.x, position.y)
  context.restore()
}
