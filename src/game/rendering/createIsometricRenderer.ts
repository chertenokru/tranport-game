import type { GameWorld } from '@/game/core/GameWorld'
import type { CanvasFrame, CanvasLayer } from './CanvasLayer'
import type { CanvasGameRenderer } from './createCanvasRenderer'
import { drawScene3D } from './drawLayers3D/drawScene3D'
import { DecisionIndicators } from './tools/DecisionIndicators'

export interface IsometricGameRenderer extends CanvasGameRenderer {
  rotateBy(radians: number): void
  zoomBy(factor: number): void
  resetView(): void
}

export function createIsometricRenderer(canvas: HTMLCanvasElement): IsometricGameRenderer {
  const context = getCanvasContext(canvas)
  const indicators = new DecisionIndicators()
  const layers = new Map<symbol, CanvasLayer>()
  const view = { rotation: 0, zoom: 1 }
  let lastWorld: GameWorld | null = null
  let lastTimeMs = 0
  let pointerId: number | null = null
  let previousPointerX = 0

  const redraw = () => {
    if (lastWorld) renderFrame(lastWorld, lastTimeMs)
  }
  const rotateBy = (radians: number) => {
    view.rotation = normalizeAngle(view.rotation + radians)
    redraw()
  }
  const zoomBy = (factor: number) => {
    view.zoom = Math.min(1.75, Math.max(0.62, view.zoom * factor))
    redraw()
  }
  const resetView = () => {
    view.rotation = 0
    view.zoom = 1
    redraw()
  }
  const onWheel = (event: WheelEvent) => {
    event.preventDefault()
    zoomBy(Math.exp(-event.deltaY * 0.0012))
  }
  const onPointerDown = (event: PointerEvent) => {
    pointerId = event.pointerId
    previousPointerX = event.clientX
    canvas.setPointerCapture(event.pointerId)
    canvas.classList.add('game-canvas--dragging')
  }
  const onPointerMove = (event: PointerEvent) => {
    if (pointerId !== event.pointerId) return
    const deltaX = event.clientX - previousPointerX
    previousPointerX = event.clientX
    rotateBy(deltaX * 0.008)
  }
  const onPointerUp = (event: PointerEvent) => {
    if (pointerId !== event.pointerId) return
    pointerId = null
    canvas.classList.remove('game-canvas--dragging')
    if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId)
  }
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'ArrowLeft') rotateBy(-Math.PI / 12)
    else if (event.key === 'ArrowRight') rotateBy(Math.PI / 12)
    else if (event.key === '+' || event.key === '=') zoomBy(1.12)
    else if (event.key === '-' || event.key === '_') zoomBy(1 / 1.12)
    else if (event.key === '0') resetView()
    else return
    event.preventDefault()
  }

  canvas.addEventListener('wheel', onWheel, { passive: false })
  canvas.addEventListener('pointerdown', onPointerDown)
  canvas.addEventListener('pointermove', onPointerMove)
  canvas.addEventListener('pointerup', onPointerUp)
  canvas.addEventListener('pointercancel', onPointerUp)
  canvas.addEventListener('keydown', onKeyDown)

  function renderFrame(world: GameWorld, timeMs: number): void {
    const frame: CanvasFrame = {
      context,
      width: canvas.width,
      height: canvas.height,
      timeMs,
    }
    drawScene3D(frame, world, indicators, view)

    for (const layer of layers.values()) {
      context.save()
      try {
        context.beginPath()
        layer(frame)
      } finally {
        context.restore()
      }
    }
  }

  return {
    render(world, timeMs) {
      lastWorld = world
      lastTimeMs = timeMs
      renderFrame(world, timeMs)
    },
    addLayer(layer) {
      const registration = Symbol()
      layers.set(registration, layer)
      return () => layers.delete(registration)
    },
    dispose() {
      layers.clear()
      lastWorld = null
      canvas.removeEventListener('wheel', onWheel)
      canvas.removeEventListener('pointerdown', onPointerDown)
      canvas.removeEventListener('pointermove', onPointerMove)
      canvas.removeEventListener('pointerup', onPointerUp)
      canvas.removeEventListener('pointercancel', onPointerUp)
      canvas.removeEventListener('keydown', onKeyDown)
    },
    rotateBy,
    zoomBy,
    resetView,
  }
}

function normalizeAngle(angle: number): number {
  const fullTurn = Math.PI * 2
  return ((angle % fullTurn) + fullTurn) % fullTurn
}

function getCanvasContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Canvas 2D context is not available')
  return context
}
