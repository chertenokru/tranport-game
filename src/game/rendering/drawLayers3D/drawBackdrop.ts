import type { Context } from './shared3D'
import { COLORS } from './shared3D'

export function drawBackdrop(context: Context, width: number, height: number): void {
  const gradient = context.createLinearGradient(0, 0, 0, height)
  gradient.addColorStop(0, COLORS.skyTop)
  gradient.addColorStop(1, COLORS.skyBottom)
  context.fillStyle = gradient
  context.fillRect(0, 0, width, height)

  context.save()
  context.globalAlpha = 0.16
  context.strokeStyle = '#6f8581'
  context.lineWidth = 1
  for (let x = -height; x < width + height; x += 34) {
    context.beginPath()
    context.moveTo(x, 0)
    context.lineTo(x + height, height)
    context.stroke()
  }
  context.restore()
}
