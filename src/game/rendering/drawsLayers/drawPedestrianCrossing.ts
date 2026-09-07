import type { PedestrianCrossing } from '@/game/domain/PedestrianCrossing.ts'
import { getDirectionAngle } from '@/game/tools/geometry.ts'

export function drawPedestrianCrossing(
  context: CanvasRenderingContext2D,
  pedestrianCrossing: Readonly<PedestrianCrossing>,
): void {
  const { position, width, direction } = pedestrianCrossing
  const halfSize = width / 2

  context.save()

  try {
    context.translate(position.x, position.y)
    context.rotate(getDirectionAngle(direction))

    context.strokeStyle = '#f8fafc'
    context.lineWidth = 2
    context.lineCap = 'butt'
    context.setLineDash([])
    context.beginPath()
    for (let i = -width - 4; i <= width + 4; i += 4) {
      context.moveTo(i, -halfSize)
      context.lineTo(i, halfSize)
    }
    context.stroke()
  } finally {
    context.restore()
  }
}
