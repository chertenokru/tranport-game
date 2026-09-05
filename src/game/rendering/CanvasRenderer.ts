import type { GameWorld } from '@/game/core/GameWorld'

import type { GameRenderer } from './GameRenderer'

export class CanvasRenderer implements GameRenderer {
  private readonly context: CanvasRenderingContext2D

  constructor(private readonly canvas: HTMLCanvasElement) {
    const context = canvas.getContext('2d')

    if (!context) {
      throw new Error('Canvas 2D context is not available')
    }

    this.context = context
  }

  render(world: GameWorld): void {
    this.clear()
    this.drawBackground()
    this.drawTestBuilding()
    this.drawDebugInformation(world)
  }

  private clear(): void {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height)
  }

  private drawBackground(): void {
    this.context.fillStyle = '#dbeafe'
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height)
  }

  private drawTestBuilding(): void {
    this.context.fillStyle = '#64748b'
    this.context.fillRect(80, 80, 120, 100)

    this.context.fillStyle = '#f8fafc'
    this.context.font = '18px sans-serif'
    this.context.fillText('Здание', 105, 135)
  }

  private drawDebugInformation(world: GameWorld): void {
    this.context.fillStyle = '#0f172a'
    this.context.font = '16px monospace'
    this.context.fillText(`Money: ${world.money}`, 16, 28)
  }
}
