import type { GameWorld } from '@/game/core/GameWorld'
import type { Bus } from '@/game/domain/Bus'
import type { ResidentId } from '@/game/domain/ids'
import { ResidentState } from '@/game/domain/Resident'
import { CollisionShape, type CollisionBody } from '@/game/tools/collision/CollisionBody'
import { findCollisionTime } from '@/game/tools/collision/findCollisionTime'
import { getVehicleBounds } from '@/game/tools/getVehicleBounds'
import { getBusMotion, type BusMotions } from '../tools/movement/getBusMotion'
import { getResidentMotion } from '../tools/movement/getResidentMotion'
import { isResidentWalking } from '../tools/movement/isResidentWalking'

export class PedestrianCollisionSystem {
  constructor(private readonly minimumGap = 0) {}

  // Called before movement, for an interval with no turns or state transitions.
  // Death is applied first so a victim cannot move farther or board at the end of the step.
  resolveStep(world: GameWorld, duration: number, motions?: BusMotions): ReadonlyMap<ResidentId, number> {
    const allowedDurations = new Map<ResidentId, number>()
    const vehicles = [...world.buses.values()].map((bus) => {
      const motion = motions?.get(bus.id) ?? getBusMotion(world, bus)
      const body: CollisionBody = {
        shape: CollisionShape.Rectangle,
        ...getVehicleBounds({ ...bus, direction: motion.direction }),
        velocity: motion.velocity,
      }
      return { bus, body }
    })

    for (const resident of world.residents.values()) {
      if (
        !isResidentWalking(resident.state) &&
        resident.state !== ResidentState.WaitingBus &&
        !(resident.state === ResidentState.ChoosingTransport && resident.currentBuildingId === null)
      )
        continue

      const velocity = isResidentWalking(resident.state)
        ? getResidentMotion(world, resident).velocity
        : { x: 0, y: 0 }
      const body: CollisionBody = {
        shape: CollisionShape.Circle,
        radius: resident.radius,
        position: resident.position,
        velocity,
      }
      let first: { bus: Bus; time: number; pedestrianCaused: boolean } | null = null
      for (const vehicle of vehicles) {
        const time = findCollisionTime(vehicle.body, body, duration)
        if (time === null || (first && time >= first.time)) continue

        const busOnlyTime = findCollisionTime(
          vehicle.body,
          { ...body, velocity: { x: 0, y: 0 } },
          duration,
        )
        const pedestrianOnlyTime = findCollisionTime(
          { ...vehicle.body, velocity: { x: 0, y: 0 } },
          body,
          duration,
        )
        first = {
          bus: vehicle.bus,
          time,
          pedestrianCaused: busOnlyTime === null && pedestrianOnlyTime !== null,
        }
      }
      if (!first) continue

      if (first.pedestrianCaused) {
        const speed = Math.hypot(velocity.x, velocity.y)
        const gapDuration = speed > 0 ? this.minimumGap / speed : 0
        allowedDurations.set(resident.id, Math.max(0, first.time - gapDuration))
        continue
      }

      resident.position = {
        x: resident.position.x + velocity.x * first.time,
        y: resident.position.y + velocity.y * first.time,
      }
      resident.state = ResidentState.Dead
      resident.currentBuildingId = null
      resident.journey = null
      resident.transportDecision = null
      resident.path = []
      resident.pathIndex = 0
      first.bus.collisionCount++
      world.accidents++
    }

    return allowedDurations
  }
}
