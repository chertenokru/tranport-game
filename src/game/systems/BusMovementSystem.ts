import type { GameSystem } from '@/game/core/GameSystem'
import type { GameWorld } from '@/game/core/GameWorld'
import { type Bus, BusState } from '@/game/domain/Bus'
import { moveAlongPath } from './tools/movement/moveAlongPath'
import { getDirection } from '@/game/tools/geometry'
import type { BusMotions } from './tools/movement/getBusMotion'

export class BusMovementSystem implements GameSystem {
  constructor(private readonly onStop: (world: GameWorld, bus: Bus) => void = () => {}) {}

  update(world: GameWorld, deltaSeconds: number, motions?: BusMotions): void {
    if (!Number.isFinite(deltaSeconds) || deltaSeconds < 0)
      throw new RangeError('Invalid transport time step')
    for (const bus of world.buses.values()) {
      const motion = motions?.get(bus.id)
      if (motion && bus.state === BusState.Moving) bus.direction = motion.direction
      const speed = motion ? Math.hypot(motion.velocity.x, motion.velocity.y) : bus.speed
      this.moveBus(world, bus, deltaSeconds, speed)
    }
  }

  private moveBus(world: GameWorld, bus: Bus, remainingSeconds: number, speed: number): void {
    do {
      const route = world.routes.get(bus.routeId)
      const leg = route?.legs[bus.legIndex]
      if (!route || !leg) return

      if (bus.state === BusState.WaitingAtStop) {
        this.onStop(world, bus)
        const elapsed = Math.min(remainingSeconds, bus.waitingSecondsRemaining)
        bus.waitingSecondsRemaining -= elapsed
        remainingSeconds -= elapsed
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
        maxDistance: speed * remainingSeconds,
      })

      bus.position = movement.position
      bus.pathIndex = movement.pathIndex
      if (movement.heading) {
        bus.direction = getDirection(movement.heading) ?? bus.direction
      }

      if (movement.completed) {
        remainingSeconds = speed > 0 ? movement.remainingDistance / speed : 0
        bus.legIndex = (bus.legIndex + 1) % route.legs.length
        bus.state = BusState.WaitingAtStop
        bus.waitingSecondsRemaining = bus.stopWaitSeconds
        bus.pathIndex = 0
        this.onStop(world, bus)
      } else {
        return
      }
    } while (remainingSeconds > 0)
  }
}
