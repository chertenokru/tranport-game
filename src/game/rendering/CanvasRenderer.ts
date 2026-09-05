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
    this.drawRoads(world)
    this.drawBuildings(world)
    this.drawBusStops(world)
    this.drawBuses(world)
    this.drawPedestrians(world)
    this.drawDebugInformation(world)
  }

  private clear(): void {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height)
  }

  private drawBackground(): void {
    this.context.fillStyle = '#dbeafe'
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height)
  }

  private drawRoads(world: GameWorld): void {
    const context = this.context

    context.save()
    context.lineCap = 'butt'

    for (const road of world.roads.values()) {
      context.beginPath()
      context.moveTo(road.start.x, road.start.y)
      context.lineTo(road.end.x, road.end.y)
      context.strokeStyle = '#475569'
      context.lineWidth = road.width
      context.stroke()

      context.beginPath()
      context.moveTo(road.start.x, road.start.y)
      context.lineTo(road.end.x, road.end.y)
      context.strokeStyle = '#f8fafc'
      context.lineWidth = 2
      context.setLineDash([16, 12])
      context.stroke()
    }

    context.restore()
  }

  private drawBuildings(world: GameWorld): void {
    const context = this.context

    context.save()

    for (const building of world.buildings.values()) {
      context.fillStyle = building.type === 'residential' ? '#f59e0b' : '#64748b'

      context.fillRect(building.position.x, building.position.y, building.size.x, building.size.y)

      context.fillStyle = '#f8fafc'
      context.font = '16px sans-serif'
      context.textAlign = 'center'
      context.textBaseline = 'middle'

      context.fillText(
        building.name,
        building.position.x + building.size.x / 2,
        building.position.y + building.size.y / 2,
      )
    }

    context.restore()
  }

  private drawBusStops(world: GameWorld): void {
    const context = this.context

    context.save()

    for (const stop of world.stops.values()) {
      context.strokeStyle = '#334155'
      context.fillStyle = '#2563eb'
      context.lineWidth = 4

      context.beginPath()
      context.moveTo(stop.waitingPosition.x, stop.waitingPosition.y)
      context.lineTo(stop.waitingPosition.x, stop.waitingPosition.y - 16)
      context.stroke()

      context.beginPath()
      context.arc(stop.waitingPosition.x, stop.waitingPosition.y - 22, 10, 0, Math.PI * 2)
      context.fill()

      context.fillStyle = '#0f172a'
      context.font = '10px sans-serif'
      context.textAlign = 'center'
      context.fillText(stop.name, stop.waitingPosition.x, stop.waitingPosition.y - 40)
    }

    context.restore()
  }

  private drawBuses(world: GameWorld): void {
    const context = this.context

    for (const bus of world.buses.values()) {
      context.save()

      const halfWidth = bus.size.x / 2
      const halfHeight = bus.size.y / 2

      if (bus.direction === -1) {
        context.translate(bus.position.x, bus.position.y - halfWidth)
        context.scale(-1, 1)
      } else {
        context.translate(bus.position.x, bus.position.y + halfWidth / 3)
      }

      context.fillStyle = '#ef4444'
      context.fillRect(-halfWidth, -halfHeight, bus.size.x, bus.size.y)

      context.fillStyle = '#bfdbfe'
      context.fillRect(halfWidth - 10, -halfHeight + 3, 7, bus.size.y / 3)

      context.fillStyle = '#0f172a'

      context.beginPath()
      context.arc(-halfWidth + 10, halfHeight, 4, 0, Math.PI * 2)
      context.fill()

      context.beginPath()
      context.arc(halfWidth - 10, halfHeight, 4, 0, Math.PI * 2)
      context.fill()

      context.restore()
    }
  }

  private drawPedestrians(world: GameWorld): void {
    const context = this.context

    context.save()
    context.fillStyle = '#16a34a'

    for (const pedestrian of world.pedestrians.values()) {
      if (
        pedestrian.state === 'insideBus' ||
        pedestrian.state === 'idleInBuilding' ||
        pedestrian.state === 'dead'
      ) {
        continue
      }

      context.beginPath()
      context.arc(pedestrian.position.x, pedestrian.position.y, pedestrian.radius, 0, Math.PI * 2)
      context.fill()
    }

    context.restore()
  }

  private drawDebugInformation(world: GameWorld): void {
    this.context.fillStyle = '#0f172a'
    this.context.font = '16px monospace'
    this.context.fillText(`Money: ${world.money}`, 16, 28)
  }
}
