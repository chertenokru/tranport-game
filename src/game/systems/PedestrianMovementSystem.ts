import type { GameSystem } from '@/game/core/GameSystem'
import type { GameWorld } from '@/game/core/GameWorld'
import { type Resident, ResidentState } from '@/game/domain/Resident'
import type { ResidentId } from '@/game/domain/ids'

import { moveAlongPath } from '@/game/systems/tools/movement/moveAlongPath'
import { isResidentWalking } from './tools/movement/isResidentWalking'

export class PedestrianMovementSystem implements GameSystem {
  update(
    world: GameWorld,
    deltaSeconds: number,
    allowedDurations: ReadonlyMap<ResidentId, number> = new Map(),
  ): void {
    for (const resident of world.residents.values()) {
      if (!isResidentWalking(resident.state)) {
        continue
      }

      this.movePedestrian(world, resident, Math.min(deltaSeconds, allowedDurations.get(resident.id) ?? deltaSeconds))
    }
  }

  private movePedestrian(world: GameWorld, resident: Resident, deltaSeconds: number): void {
    const blockedIndex = resident.path.findIndex((point, index) => index >= resident.pathIndex &&
      point.crossingId !== undefined && !world.crossingOccupants.get(point.crossingId)?.has(resident.id))
    const movement = moveAlongPath({
      position: resident.position,
      path: blockedIndex < 0 ? resident.path : resident.path.slice(0, blockedIndex),
      pathIndex: resident.pathIndex,
      maxDistance: resident.walkingSpeed * deltaSeconds,
    })

    resident.position = movement.position
    resident.pathIndex = movement.pathIndex

    if (movement.completed && resident.pathIndex >= resident.path.length) {
      this.finishPath(resident)
    }
  }

  private finishPath(resident: Resident): void {
    resident.path = []
    resident.pathIndex = 0

    switch (resident.state) {
      case ResidentState.WalkingToStop:
        resident.state = ResidentState.WaitingBus
        break

      case ResidentState.Walking:
      case ResidentState.WalkingFromStop:
        resident.state = ResidentState.Arrived
        break

      case ResidentState.CrossingRoad:
        resident.state = ResidentState.Walking
        break
    }
  }
}
