import type { GameSystem } from '@/game/core/GameSystem'
import type { GameWorld } from '@/game/core/GameWorld'
import { BusState } from '@/game/domain/Bus'
import { moveAlongPath } from './tools/movement/moveAlongPath'
import { getDirection } from '@/game/tools/geometry'

export class BusMovementSystem implements GameSystem {
  update(world: GameWorld, deltaSeconds: number): void {
    for (const bus of world.buses.values()) {
      const route = world.routes.get(bus.routeId)
      const leg = route?.legs[bus.legIndex]
      if (!route || !leg) continue

      if (bus.state === BusState.WaitingAtStop) {
        bus.waitingSecondsRemaining = Math.max(0, bus.waitingSecondsRemaining - deltaSeconds)
        if (bus.waitingSecondsRemaining === 0) {
          bus.pathIndex = 1
          bus.state = BusState.Moving
        }
        continue
      }

      const movement = moveAlongPath({
        position: bus.position,
        path: leg.path,
        pathIndex: bus.pathIndex,
        maxDistance: bus.speed * deltaSeconds,
      })

      bus.position = movement.position
      bus.pathIndex = movement.pathIndex
      if (movement.heading) {
        bus.direction = getDirection(movement.heading) ?? bus.direction
      }

      if (movement.completed) {
        bus.legIndex = (bus.legIndex + 1) % route.legs.length
        bus.state = BusState.WaitingAtStop
        bus.waitingSecondsRemaining = bus.stopWaitSeconds
        bus.pathIndex = 0
      }
    }
  }
}
