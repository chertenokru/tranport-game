import type { Bus } from '@/game/domain/Bus'
import { getDirectionAngle } from '@/game/tools/geometry'
import { getVehicleBounds } from '@/game/tools/getVehicleBounds'

export function drawBus(context: CanvasRenderingContext2D, bus: Readonly<Bus>): void {
  const halfLength = bus.size.x / 2
  const halfWidth = bus.size.y / 2

  const bounds = getVehicleBounds(bus)
  const center = bounds.position

  context.save()

  try {
    context.translate(center.x, center.y)
    context.rotate(getDirectionAngle(bus.direction))

    // Кузов: передняя часть направлена вниз.
    context.fillStyle = '#ef4444'
    context.fillRect(-halfWidth, -halfLength, bus.size.y, bus.size.x)

    // Окно в передней части.
    context.fillStyle = '#bfdbfe'
    context.fillRect(-halfWidth + 3, halfLength - 10, bus.size.y - 6, 7)

    context.fillStyle = '#0f172a'

    for (const x of [-halfWidth, halfWidth]) {
      for (const y of [-halfLength + 10, halfLength - 10]) {
        context.beginPath()
        context.arc(x, y, 3, 0, Math.PI * 2)
        context.fill()
      }
    }
  } finally {
    context.restore()
  }

  // Счётчик рисуем без поворота.
  context.save()

  try {
    context.font = 'bold 11px sans-serif'
    context.textAlign = 'center'
    context.textBaseline = 'middle'
    context.fillStyle = '#2b35bc'
    context.fillText(`×${bus.passengerIds.length}`, center.x, center.y)
    if (bus.collisionCount > 0) {
      const top = center.y - bounds.halfSize.y - 12
      context.fillStyle = '#7f1d1d'
      context.fillRect(center.x - 20, top - 8, 40, 16)
      context.fillStyle = '#fef08a'
      context.fillText(`! ${bus.collisionCount}`, center.x, top)
    }
  } finally {
    context.restore()
  }
}
