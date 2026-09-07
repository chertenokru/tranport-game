import type { Intersection } from '@/game/domain/Intersection'

export function drawIntersection(
  context: CanvasRenderingContext2D,
  intersection: Readonly<Intersection>,
): void {
  const { position, size } = intersection
  const halfSize = size / 2

  context.save()

  try {
    context.fillStyle = '#475569'
    context.fillRect(position.x - halfSize, position.y - halfSize, size, size)
  } finally {
    context.restore()
  }
}
