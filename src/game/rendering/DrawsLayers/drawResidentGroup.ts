import type { Resident } from '@/game/domain/Resident'

export function drawResidentGroup(
  context: CanvasRenderingContext2D,
  resident: Readonly<Resident>,
  count: number,
): void {
  context.save()

  try {
    const { position, radius } = resident

    context.fillStyle = '#16a34a'
    context.beginPath()
    context.arc(position.x, position.y, radius, 0, Math.PI * 2)
    context.fill()

    if (count > 1) {
      context.font = 'bold 10px sans-serif'
      context.textAlign = 'left'
      context.textBaseline = 'middle'
      context.fillStyle = '#0f172a'

      context.fillText(`×${count}`, position.x + radius + 3, position.y)
    }
  } finally {
    context.restore()
  }
}
