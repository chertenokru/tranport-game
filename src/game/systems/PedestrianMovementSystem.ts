import type { GameSystem } from '@/game/core/GameSystem'
import type { GameWorld } from '@/game/core/GameWorld'
import type { Pedestrian, PedestrianState } from '@/game/domain/Pedestrian'

import { moveAlongPath } from './movement/moveAlongPath'

const MOVING_STATES: ReadonlySet<PedestrianState> = new Set([
  'walking',
  'walkingToStop',
  'walkingFromStop',
  'crossingRoad',
])

export class PedestrianMovementSystem implements GameSystem {
  update(world: GameWorld, deltaSeconds: number): void {
    for (const pedestrian of world.pedestrians.values()) {
      if (!MOVING_STATES.has(pedestrian.state)) {
        continue
      }

      this.movePedestrian(pedestrian, deltaSeconds)
    }
  }

  private movePedestrian(pedestrian: Pedestrian, deltaSeconds: number): void {
    const movement = moveAlongPath({
      position: pedestrian.position,
      path: pedestrian.path,
      pathIndex: pedestrian.pathIndex,
      maxDistance: pedestrian.walkingSpeed * deltaSeconds,
    })

    pedestrian.position = movement.position
    pedestrian.pathIndex = movement.pathIndex

    if (movement.completed) {
      this.finishPath(pedestrian)
    }
  }

  private finishPath(pedestrian: Pedestrian): void {
    pedestrian.path = []
    pedestrian.pathIndex = 0

    switch (pedestrian.state) {
      case 'walkingToStop':
        pedestrian.state = 'waitingBus'
        break

      case 'walking':
      case 'walkingFromStop':
        pedestrian.state = 'arrived'
        break

      case 'crossingRoad':
        pedestrian.state = 'walking'
        break
    }
  }
}
