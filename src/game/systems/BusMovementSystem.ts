import type { GameSystem } from '@/game/core/GameSystem'
import type { GameWorld } from '@/game/core/GameWorld'
import type { Bus } from '@/game/domain/Bus'
import type { BusRoute } from '@/game/domain/BusRoute'
import type { BusStopId } from '@/game/domain/ids'
import type { Vector2 } from '@/game/domain/geometry'
import type { MapNode, MapNodeId } from '@/game/world/MapNode'

import { findShortestRoadPath } from './findShortestRoadPath'
import { moveAlongPath } from '@/game/systems/movement/moveAlongPath.ts'

export class BusMovementSystem implements GameSystem {
  update(world: GameWorld, deltaSeconds: number): void {
    for (const bus of world.buses.values()) {
      if (bus.state === 'waitingAtStop') {
        this.updateWaitingBus(world, bus, deltaSeconds)
        continue
      }

      this.updateMovingBus(bus, deltaSeconds)
    }
  }

  private updateWaitingBus(world: GameWorld, bus: Bus, deltaSeconds: number): void {
    bus.waitingSecondsRemaining = Math.max(0, bus.waitingSecondsRemaining - deltaSeconds)

    if (bus.waitingSecondsRemaining > 0) {
      return
    }

    const route = world.routes.get(bus.routeId)

    if (!route) {
      return
    }

    this.planNextLeg(world, bus, route)
  }

  private planNextLeg(world: GameWorld, bus: Bus, route: BusRoute): void {
    const nextStopIndex = this.getNextStopIndex(bus, route)

    if (nextStopIndex === null) {
      return
    }

    const currentStopId = route.stopIds[bus.currentStopIndex]
    const nextStopId = route.stopIds[nextStopIndex]

    if (!currentStopId || !nextStopId) {
      return
    }

    const currentNode = this.findStopNode(world, currentStopId)

    const nextNode = this.findStopNode(world, nextStopId)

    if (!currentNode || !nextNode) {
      return
    }

    const nodePath = findShortestRoadPath(world, currentNode.id, nextNode.id)

    if (!nodePath || nodePath.length < 2) {
      return
    }

    const positionPath = this.createPositionPath(world, nodePath)

    if (!positionPath) {
      return
    }

    bus.path = positionPath
    bus.pathIndex = 1
    bus.state = 'moving'
  }

  private getNextStopIndex(bus: Bus, route: BusRoute): number | null {
    if (route.stopIds.length < 2) {
      return null
    }

    let nextStopIndex = bus.currentStopIndex + bus.direction

    if (nextStopIndex < 0 || nextStopIndex >= route.stopIds.length) {
      bus.direction = bus.direction === 1 ? -1 : 1
      nextStopIndex = bus.currentStopIndex + bus.direction
    }

    return nextStopIndex
  }

  private findStopNode(world: GameWorld, stopId: BusStopId): MapNode | undefined {
    for (const node of world.roadNodes.values()) {
      if (node.stopId === stopId) {
        return node
      }
    }

    return undefined
  }

  private createPositionPath(world: GameWorld, nodePath: readonly MapNodeId[]): Vector2[] | null {
    const positions: Vector2[] = []

    for (const nodeId of nodePath) {
      const node = world.roadNodes.get(nodeId)

      if (!node) {
        return null
      }

      positions.push(node.position)
    }

    return positions
  }

  private updateMovingBus(bus: Bus, deltaSeconds: number): void {
    const movement = moveAlongPath({
      position: bus.position,
      path: bus.path,
      pathIndex: bus.pathIndex,
      maxDistance: bus.speed * deltaSeconds,
    })

    bus.position = movement.position
    bus.pathIndex = movement.pathIndex

    if (movement.completed) {
      this.finishLeg(bus)
    }
  }

  private finishLeg(bus: Bus): void {
    bus.currentStopIndex += bus.direction
    bus.state = 'waitingAtStop'
    bus.waitingSecondsRemaining = bus.stopWaitSeconds
    bus.path = []
    bus.pathIndex = 0
  }
}
