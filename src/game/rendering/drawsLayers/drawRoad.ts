import type { Road } from '@/game/domain/Road'
import { getDirectionAngle } from '@/game/tools/geometry'

export function drawRoad(context: CanvasRenderingContext2D, road: Readonly<Road>): void {
  context.save()

  try {
    context.translate(road.position.x, road.position.y)
    context.rotate(getDirectionAngle(road.direction))

    const halfLength = road.length / 2
    const halfWidth = road.width / 2

    context.fillStyle = '#475569'
    context.fillRect(-halfWidth, -halfLength, road.width, road.length)

    context.beginPath()
    context.moveTo(0, -halfLength)
    context.lineTo(0, halfLength)
    context.strokeStyle = '#f8fafc'
    context.lineWidth = 2
    context.lineCap = 'butt'
    context.setLineDash([16, 12])
    context.stroke()
  } finally {
    context.restore()
  }
}
