import type { GameWorld } from '@/game/core/GameWorld'
import type { Bus } from '@/game/domain/Bus'
import { ResidentState } from '@/game/domain/Resident'
import { CollisionShape, type CollisionBody } from '@/game/tools/collision/CollisionBody'
import { findCollisionTime } from '@/game/tools/collision/findCollisionTime'
import { getVehicleBounds } from '@/game/tools/getVehicleBounds'
import { getBusMotion } from '../tools/movement/getBusMotion'
import { getPathMotion } from '../tools/movement/getPathMotion'
import { isResidentWalking } from '../tools/movement/isResidentWalking'

export class PedestrianCollisionSystem {
  // Called before movement, for an interval with no turns or state transitions.
  // Death is applied first so a victim cannot move farther or board at the end of the step.
  resolveStep(world: GameWorld, duration: number): void {
    const vehicles = [...world.buses.values()].map((bus) => {
      const motion = getBusMotion(world, bus)
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
        ? getPathMotion(resident, resident.walkingSpeed).velocity
        : { x: 0, y: 0 }
      const body: CollisionBody = {
        shape: CollisionShape.Circle,
        radius: resident.radius,
        position: resident.position,
        velocity,
      }
      let first: { bus: Bus; time: number } | null = null
      for (const vehicle of vehicles) {
        const time = findCollisionTime(vehicle.body, body, duration)
        if (time !== null && (!first || time < first.time)) first = { bus: vehicle.bus, time }
      }
      if (!first) continue

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
  }
}
