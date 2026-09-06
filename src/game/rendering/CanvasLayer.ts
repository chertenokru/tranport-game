export interface CanvasFrame {
  readonly context: CanvasRenderingContext2D
  readonly width: number
  readonly height: number
  readonly timeMs: number
}

export type CanvasLayer = (frame: CanvasFrame) => void
