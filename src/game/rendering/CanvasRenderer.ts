import type { GameWorld } from '@/game/core/GameWorld'

import type { GameRenderer } from './GameRenderer'
import type { TransportDecision } from '@/game/domain/TransportDecision.ts'
import type { ResidentId } from '@/game/domain/ids.ts'
import type { Resident } from '@/game/domain/Resident.ts'

const DECISION_INDICATOR_DURATION_MS = 4_000

interface DecisionIndicator {
  readonly decision: TransportDecision
  readonly expiresAt: number
}

export class CanvasRenderer implements GameRenderer {
  private readonly context: CanvasRenderingContext2D
  private readonly decisionIndicators = new Map<ResidentId, DecisionIndicator>()

  constructor(private readonly canvas: HTMLCanvasElement) {
    const context = canvas.getContext('2d')

    if (!context) {
      throw new Error('Canvas 2D context is not available')
    }

    this.context = context
  }

  render(world: GameWorld): void {
    const currentTime = performance.now()

    this.updateDecisionIndicators(world, currentTime)
    this.clear()
    this.drawBackground()
    this.drawRoads(world)
    this.drawBuildings(world)
    this.drawBusStops(world)
    this.drawBuses(world)
    this.drawPedestrians(world, currentTime)
    this.drawDebugInformation(world)
  }

  private clear(): void {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height)
  }

  private drawBackground(): void {
    this.context.fillStyle = '#dbeafe'
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height)
  }
  private updateDecisionIndicators(world: GameWorld, currentTime: number): void {
    for (const resident of world.residents.values()) {
      const decision = resident.transportDecision

      if (!decision) {
        this.decisionIndicators.delete(resident.id)
        continue
      }

      const currentIndicator = this.decisionIndicators.get(resident.id)

      if (!currentIndicator || currentIndicator.decision !== decision) {
        this.decisionIndicators.set(resident.id, {
          decision,
          expiresAt: currentTime + DECISION_INDICATOR_DURATION_MS,
        })
      }
    }

    for (const pedestrianId of this.decisionIndicators.keys()) {
      if (!world.residents.has(pedestrianId)) {
        this.decisionIndicators.delete(pedestrianId)
      }
    }
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
    const residents = [...world.residents.values()]
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
      const residentsCount = residents.filter(
        (r) => r.currentBuildingId === building.id && r.state === 'idleInBuilding',
      ).length
      context.textAlign = 'left'
      context.textBaseline = 'middle'
      context.font = 'bold 11px sans-serif'

      context.fillStyle = building.type === 'residential' ? '#0f172a' : '#f8fafc'
      context.fillText(`×${residentsCount}`, building.position.x + 10, building.position.y + 15)
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

      context.font = 'bold 11px sans-serif'
      context.textAlign = 'center'
      context.textBaseline = 'middle'
      context.fillStyle = '#2b35bc'

      if (bus.direction === -1) context.scale(-1, 1)
      context.fillText(`×${bus.passengerIds.length}`, 0, 4)
      context.restore()
    }
  }

  private drawPedestrians(world: GameWorld, currentTime: number): void {
    const context = this.context

    context.save()
    context.fillStyle = '#16a34a'

    const groups: Resident[][] = []
    for (const resident of world.residents.values()) {
      if (
        resident.state === 'insideBus' ||
        resident.state === 'idleInBuilding' ||
        resident.state === 'dead'
      ) {
        continue
      }

      const mergedGroup: Resident[] = []
      for (let index = groups.length - 1; index >= 0; index--) {
        const group = groups[index]!
        const overlaps = group.some((member) => {
          const dx = member.position.x - resident.position.x
          const dy = member.position.y - resident.position.y
          const combinedRadius = member.radius + resident.radius

          return dx * dx + dy * dy <= combinedRadius * combinedRadius
        })

        if (overlaps) {
          mergedGroup.unshift(...group)
          groups.splice(index, 1)
        }
      }

      mergedGroup.push(resident)
      groups.push(mergedGroup)
    }

    for (const group of groups) {
      const resident = group[0]!

      context.beginPath()
      context.arc(resident.position.x, resident.position.y, resident.radius, 0, Math.PI * 2)
      context.fill()
      this.drawDecisionIndicator(resident, currentTime)

      if (group.length > 1) {
        context.save()
        context.font = 'bold 10px sans-serif'
        context.textAlign = 'left'
        context.textBaseline = 'middle'
        context.fillStyle = '#0f172a'
        context.fillText(
          `×${group.length}`,
          resident.position.x + resident.radius + 3,
          resident.position.y,
        )
        context.restore()
      }
    }

    context.restore()
  }

  private drawDecisionIndicator(resident: Resident, currentTime: number): void {
    const indicator = this.decisionIndicators.get(resident.id)

    if (!indicator || currentTime >= indicator.expiresAt) {
      return
    }

    const context = this.context
    const decision = indicator.decision

    const walkingLabel = `${decision.walkingTime.toFixed(1)}`
    const busLabel = decision.busTime === null ? '—' : `${decision.busTime.toFixed(1)}`

    const selectedIcon = decision.selectedMode === 'bus' ? '🚌' : '🚶'
    const otherIcon = decision.selectedMode === 'bus' ? '🚶' : '🚌'
    const selectedTime = decision.selectedMode === 'bus' ? busLabel : walkingLabel
    const otherTime = decision.selectedMode === 'bus' ? walkingLabel : busLabel

    const label = `${selectedIcon} ${selectedTime} (${otherIcon} ${otherTime})`

    context.save()
    context.font = '10px sans-serif'

    const horizontalPadding = 8
    const indicatorHeight = 20
    const indicatorWidth = context.measureText(label).width + horizontalPadding

    const desiredX = resident.position.x - indicatorWidth / 2

    const indicatorX = Math.max(4, Math.min(desiredX, this.canvas.width - indicatorWidth - 4))

    const indicatorY = resident.position.y - resident.radius - indicatorHeight - 10

    const remainingTime = indicator.expiresAt - currentTime
    context.globalAlpha = Math.min(1, remainingTime / 500)

    context.strokeStyle =
      decision.reason === 'noBusAvailable' || decision.reason === 'transitUnavailable'
        ? '#ef4444'
        : decision.selectedMode === 'bus'
          ? '#2563eb'
          : '#f59e0b'
    context.lineWidth = 1

    context.beginPath()
    context.moveTo(resident.position.x, resident.position.y - resident.radius)
    context.lineTo(indicatorX + indicatorWidth / 2, indicatorY + indicatorHeight)
    context.stroke()

    const cornerRadius = 6

    context.beginPath()
    context.roundRect(indicatorX, indicatorY, indicatorWidth, indicatorHeight, cornerRadius)

    context.fillStyle = 'rgb(192 192 195 / 0.92)'
    context.fill()
    context.stroke()

    context.fillStyle = '#000000'
    context.textAlign = 'center'
    context.textBaseline = 'middle'

    context.fillText(label, indicatorX + indicatorWidth / 2, indicatorY + indicatorHeight / 2)

    context.restore()
  }

  private drawDebugInformation(world: GameWorld): void {
    this.context.fillStyle = '#0f172a'
    this.context.font = '16px monospace'
    this.context.fillText(`Money: ${world.money}`, 16, 28)
  }
}
