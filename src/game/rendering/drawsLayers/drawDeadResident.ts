import type { Resident } from '@/game/domain/Resident'

export function drawDeadResident(
  context: CanvasRenderingContext2D,
  resident: Readonly<Resident>,
): void {
  const { x, y } = resident.position
  const radius = resident.radius + 2
  context.save()
  try {
    context.strokeStyle = '#fca5a5'
    context.lineWidth = 3
    context.beginPath()
    context.moveTo(x - radius, y - radius)
    context.lineTo(x + radius, y + radius)
    context.moveTo(x + radius, y - radius)
    context.lineTo(x - radius, y + radius)
    context.stroke()
  } finally {
    context.restore()
  }
}
