import type { BusStop } from '@/game/domain/BusStop'
import { getDirectionAngle, localToWorld } from '@/game/tools/geometry'

export function drawBusStop(context: CanvasRenderingContext2D, stop: Readonly<BusStop>): void {
  context.save()

  try {
    context.translate(stop.waitingPosition.x, stop.waitingPosition.y)
    context.rotate(getDirectionAngle(stop.direction))

    context.strokeStyle = '#334155'
    context.fillStyle = '#2563eb'
    context.lineWidth = 4
    context.setLineDash([])

    context.beginPath()
    context.moveTo(0, 0)
    context.lineTo(0, -16)
    context.stroke()

    context.beginPath()
    context.arc(0, -22, 10, 0, Math.PI * 2)
    context.fill()
  } finally {
    context.restore()
  }

  const labelPosition = localToWorld({ x: 0, y: -40 }, stop.waitingPosition, stop.direction)

  context.save()

  try {
    context.fillStyle = '#0f172a'
    context.font = '10px sans-serif'
    context.textAlign = 'center'
    context.textBaseline = 'middle'
    context.fillText(stop.name, labelPosition.x, labelPosition.y)
  } finally {
    context.restore()
  }
}
