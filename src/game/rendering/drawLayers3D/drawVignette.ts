import type { Context } from './shared3D'

export function drawVignette(context: Context, width: number, height: number): void {
  const gradient = context.createRadialGradient(
    width / 2,
    height / 2,
    height * 0.25,
    width / 2,
    height / 2,
    Math.max(width, height) * 0.72,
  )
  gradient.addColorStop(0, 'rgb(20 39 44 / 0)')
  gradient.addColorStop(1, 'rgb(20 39 44 / 0.13)')
  context.fillStyle = gradient
  context.fillRect(0, 0, width, height)
}
