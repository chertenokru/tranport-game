import type { GameWorld } from '@/game/core/GameWorld'
import { type Bus, BusState } from '@/game/domain/Bus'
import { getDirection } from '@/game/tools/geometry'
import { getPathMotion } from './getPathMotion'

export function getBusMotion(world: GameWorld, bus: Bus) {
  const leg = world.routes.get(bus.routeId)?.legs[bus.legIndex]
  if (!leg || bus.state === BusState.WaitingAtStop) {
    return {
      velocity: { x: 0, y: 0 },
      duration: leg ? bus.waitingSecondsRemaining : Infinity,
      direction: bus.direction,
    }
  }
  const motion = getPathMotion(
    { position: bus.position, path: leg.path, pathIndex: bus.pathIndex },
    bus.speed,
  )
  return { ...motion, direction: getDirection(motion.velocity) ?? bus.direction }
}
