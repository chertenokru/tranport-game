import type { Bus } from '@/game/domain/Bus'
import { getDirectionAngle, localToWorld } from '@/game/tools/geometry'

// Пока смещение относительно оси дороги только визуальное.
// Позже положение на полосе будет задавать сама траектория.
const LANE_OFFSET = 16

export function drawBus(context: CanvasRenderingContext2D, bus: Readonly<Bus>): void {
  const halfLength = bus.size.x / 2
  const halfWidth = bus.size.y / 2

  const center = localToWorld({ x: -LANE_OFFSET, y: 0 }, bus.position, bus.direction)

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
  } finally {
    context.restore()
  }
}
