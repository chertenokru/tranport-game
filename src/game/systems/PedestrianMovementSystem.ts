import type { GameSystem } from '@/game/core/GameSystem'
import type { GameWorld } from '@/game/core/GameWorld'
import { type Resident, ResidentState } from '@/game/domain/Resident'

import { moveAlongPath } from '@/game/systems/tools/movement/moveAlongPath'

const MOVING_STATES: ReadonlySet<ResidentState> = new Set([
  ResidentState.Walking,
  ResidentState.WalkingToStop,
  ResidentState.WalkingFromStop,
  ResidentState.CrossingRoad,
])

export class PedestrianMovementSystem implements GameSystem {
  update(world: GameWorld, deltaSeconds: number): void {
    for (const resident of world.residents.values()) {
      if (!MOVING_STATES.has(resident.state)) {
        continue
      }

      this.movePedestrian(resident, deltaSeconds)
    }
  }

  private movePedestrian(resident: Resident, deltaSeconds: number): void {
    const movement = moveAlongPath({
      position: resident.position,
      path: resident.path,
      pathIndex: resident.pathIndex,
      maxDistance: resident.walkingSpeed * deltaSeconds,
    })

    resident.position = movement.position
    resident.pathIndex = movement.pathIndex

    if (movement.completed) {
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
