import type { GameSystem } from '@/game/core/GameSystem'
import type { GameWorld } from '@/game/core/GameWorld'
import { BusState } from '@/game/domain/Bus'
import { ResidentState } from '@/game/domain/Resident'
import { BusMovementSystem } from './BusMovementSystem'
import { PassengerSystem } from './PassengerSystem'
import { PedestrianMovementSystem } from './PedestrianMovementSystem'
import { calculateRemainingPathDistance } from './tools/movement/calculateRemainingPathDistance'

// Synchronize only transport: a walker cannot board a bus that left earlier in the step.
export class TransportSystem implements GameSystem {
  private readonly passengers = new PassengerSystem()
  private readonly pedestrians = new PedestrianMovementSystem()
  private readonly buses = new BusMovementSystem((world, bus) =>
    this.passengers.serviceStop(world, bus),
  )

  update(world: GameWorld, deltaSeconds: number): void {
    if (!Number.isFinite(deltaSeconds) || deltaSeconds < 0)
      throw new RangeError('Invalid transport time step')
    let remaining = deltaSeconds
    do {
      // Settle arrivals and departures that take no time, including zero dwell.
      this.pedestrians.update(world, 0)
      this.buses.update(world, 0)
      if (remaining === 0) return

      const step = this.nextStep(world, remaining)
      this.pedestrians.update(world, step)
      this.buses.update(world, step)
      remaining = Math.max(0, remaining - step)
    } while (remaining > 0)
  }

  private nextStep(world: GameWorld, maximum: number): number {
    let step = maximum
    for (const bus of world.buses.values()) {
      const leg = world.routes.get(bus.routeId)?.legs[bus.legIndex]
      if (!leg) continue
      const duration =
        bus.state === BusState.WaitingAtStop
          ? bus.waitingSecondsRemaining
          : calculateRemainingPathDistance({
              position: bus.position,
              path: leg.path,
              pathIndex: bus.pathIndex,
            }) / bus.speed
      if (duration > 0) step = Math.min(step, duration)
    }
    for (const resident of world.residents.values()) {
      if (resident.state !== ResidentState.WalkingToStop) continue
      const duration = calculateRemainingPathDistance(resident) / resident.walkingSpeed
      if (duration > 0) step = Math.min(step, duration)
    }
    return step
  }
}
