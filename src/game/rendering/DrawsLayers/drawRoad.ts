import type { Road } from '@/game/domain/Road'

export function drawRoad(context: CanvasRenderingContext2D, road: Readonly<Road>): void {
  context.save()

  try {
    context.lineCap = 'butt'
    context.setLineDash([])
    context.beginPath()
    context.moveTo(road.start.x, road.start.y)
    context.lineTo(road.end.x, road.end.y)
    context.strokeStyle = '#475569'
    context.lineWidth = road.width
    context.stroke()

    context.setLineDash([16, 12])
    context.strokeStyle = '#f8fafc'
    context.lineWidth = 2
    context.stroke()
  } finally {
    context.restore()
  }
}
