import type { CanvasFrame, CanvasLayer } from './CanvasLayer'

export class CanvasLayerRenderer {
  private readonly context: CanvasRenderingContext2D
  private readonly layers = new Map<symbol, CanvasLayer>()

  constructor(private readonly canvas: HTMLCanvasElement) {
    const context = canvas.getContext('2d')

    if (!context) {
      throw new Error('Canvas 2D context is not available')
    }

    this.context = context
  }

  addLayer(layer: CanvasLayer): () => void {
    const registration = Symbol()

    this.layers.set(registration, layer)

    return () => {
      this.layers.delete(registration)
    }
  }

  render(timeMs: number): void {
    const { context, canvas } = this

    const frame: CanvasFrame = {
      context,
      width: canvas.width,
      height: canvas.height,
      timeMs,
    }

    context.clearRect(0, 0, frame.width, frame.height)

    const layers = [...this.layers.values()]

    for (const layer of layers) {
      context.save()

      try {
        context.beginPath()
        layer(frame)
      } finally {
        context.restore()
      }
    }
  }

  dispose(): void {
    this.layers.clear()
  }
}
