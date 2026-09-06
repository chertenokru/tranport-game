import type { BusStop } from '@/game/domain/BusStop'

export function drawBusStop(context: CanvasRenderingContext2D, stop: Readonly<BusStop>): void {
  context.save()

  try {
    const { x, y } = stop.waitingPosition

    context.strokeStyle = '#334155'
    context.fillStyle = '#2563eb'
    context.lineWidth = 4
    context.setLineDash([])

    context.beginPath()
    context.moveTo(x, y)
    context.lineTo(x, y - 16)
    context.stroke()

    context.beginPath()
    context.arc(x, y - 22, 10, 0, Math.PI * 2)
    context.fill()

    context.fillStyle = '#0f172a'
    context.font = '10px sans-serif'
    context.textAlign = 'center'
    context.textBaseline = 'alphabetic'
    context.fillText(stop.name, x, y - 40)
  } finally {
    context.restore()
  }
}
