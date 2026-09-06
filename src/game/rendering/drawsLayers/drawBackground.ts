import type { CanvasFrame } from '../CanvasLayer'

export function drawBackground({ context, width, height }: CanvasFrame): void {
  context.save()

  try {
    context.fillStyle = '#dbeafe'
    context.fillRect(0, 0, width, height)
  } finally {
    context.restore()
  }
}
