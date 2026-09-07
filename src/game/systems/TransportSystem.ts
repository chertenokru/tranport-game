import type { GameSystem } from '@/game/core/GameSystem'
import type { GameWorld } from '@/game/core/GameWorld'
import { BusMovementSystem } from './BusMovementSystem'
import { PassengerSystem } from './PassengerSystem'
import { PedestrianMovementSystem } from './PedestrianMovementSystem'
import { getPathMotion } from './tools/movement/getPathMotion'
import { isResidentWalking } from './tools/movement/isResidentWalking'
import { PedestrianCollisionSystem } from './collision/PedestrianCollisionSystem'
import { BusTrafficSystem } from './traffic/BusTrafficSystem'
import { TRAFFIC_CONFIG, type TrafficConfig } from '@/game/config/traffic.config'

// Synchronize only transport: a walker cannot board a bus that left earlier in the step.
export class TransportSystem implements GameSystem {
  private readonly traffic: BusTrafficSystem
  private readonly collisions = new PedestrianCollisionSystem()
  private readonly passengers = new PassengerSystem()
  private readonly pedestrians = new PedestrianMovementSystem()
  private readonly buses = new BusMovementSystem((world, bus) =>
    this.passengers.serviceStop(world, bus),
  )

  constructor(trafficConfig: TrafficConfig = TRAFFIC_CONFIG) {
    this.traffic = new BusTrafficSystem(trafficConfig)
  }

  update(world: GameWorld, deltaSeconds: number): void {
    if (!Number.isFinite(deltaSeconds) || deltaSeconds < 0)
      throw new RangeError('Invalid transport time step')
    let remaining = deltaSeconds
    do {
      // Settle arrivals and departures that take no time, including zero dwell.
      this.collisions.resolveStep(world, 0)
      this.pedestrians.update(world, 0)
      this.buses.update(world, 0)
      if (remaining === 0) return

      const traffic = this.traffic.plan(world, this.nextStep(world, remaining))
      const step = traffic.duration
      this.collisions.resolveStep(world, step, traffic.motions)
      this.pedestrians.update(world, step)
      this.buses.update(world, step, traffic.motions)
      remaining = Math.max(0, remaining - step)
    } while (remaining > 0)
  }

  private nextStep(world: GameWorld, maximum: number): number {
    let step = maximum
    for (const resident of world.residents.values()) {
      if (!isResidentWalking(resident.state)) continue
      const { duration } = getPathMotion(resident, resident.walkingSpeed)
      if (duration > 0) step = Math.min(step, duration)
    }
    return step
  }
}
