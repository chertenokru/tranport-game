import type { Bus } from '@/game/domain/Bus'

export function drawBus(context: CanvasRenderingContext2D, bus: Readonly<Bus>): void {
  context.save()

  try {
    const halfWidth = bus.size.x / 2
    const halfHeight = bus.size.y / 2
    const reversed = bus.direction === -1

    if (reversed) {
      context.translate(bus.position.x, bus.position.y - halfWidth)
      context.scale(-1, 1)
    } else {
      context.translate(bus.position.x, bus.position.y + halfWidth / 3)
    }

    context.fillStyle = '#ef4444'
    context.fillRect(-halfWidth, -halfHeight, bus.size.x, bus.size.y)

    context.fillStyle = '#bfdbfe'
    context.fillRect(halfWidth - 10, -halfHeight + 3, 7, bus.size.y / 3)

    context.fillStyle = '#0f172a'

    context.beginPath()
    context.arc(-halfWidth + 10, halfHeight, 4, 0, Math.PI * 2)
    context.fill()

    context.beginPath()
    context.arc(halfWidth - 10, halfHeight, 4, 0, Math.PI * 2)
    context.fill()

    context.font = 'bold 11px sans-serif'
    context.textAlign = 'center'
    context.textBaseline = 'middle'
    context.fillStyle = '#2b35bc'

    if (reversed) {
      context.scale(-1, 1)
    }

    context.fillText(`×${bus.passengerIds.length}`, 0, 4)
  } finally {
    context.restore()
  }
}
