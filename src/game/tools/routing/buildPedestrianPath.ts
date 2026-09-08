import type { GameWorld } from '@/game/core/GameWorld'
import type { Vector2 } from '@/game/domain/geometry'
import type { PedestrianWaypoint } from '@/game/domain/PedestrianCrossing'
import type { Road } from '@/game/domain/Road'
import { CROSSINGS_CONFIG } from '@/game/config/crossings.config'
import { getCrossingGeometry } from '@/game/tools/getCrossingGeometry'
import { rotatePoint } from '@/game/tools/geometry'

export function buildPedestrianPath(
  world: GameWorld,
  from: Vector2,
  to: Vector2,
  searchRadius: number = CROSSINGS_CONFIG.searchRadius,
): readonly PedestrianWaypoint[] {
  if (!Number.isFinite(searchRadius) || searchRadius < 0)
    throw new RangeError('Invalid crossing search radius')
  const used = new Set<string>()

  function segment(start: Vector2, end: Vector2): PedestrianWaypoint[] {
    const intersections = [...world.roads.values()]
      .flatMap((road) => {
        const contact = intersectRoad(start, end, road)
        return contact ? [{ road, ...contact }] : []
      })
      .sort((a, b) => a.time - b.time)

    for (const contact of intersections) {
      const candidates = [...world.crossings.values()]
        .filter((crossing) => crossing.roadId === contact.road.id && !used.has(crossing.id))
        .map((crossing) => ({
          crossing,
          distance: distanceBetween(crossing.position, contact.position),
        }))
        .filter(({ distance }) => distance <= searchRadius)
        .sort((a, b) => a.distance - b.distance || a.crossing.id.localeCompare(b.crossing.id))
      const crossing = candidates[0]?.crossing
      if (!crossing) continue
      used.add(crossing.id)
      const entrances = getCrossingGeometry(crossing).entrances
      const [entry, exit] = contact.side < 0 ? entrances : ([entrances[1], entrances[0]] as const)
      // Check the approach and departure too: a detour can meet another road.
      const approach = segment(start, entry)
      const departure = segment(exit, end)
      return [...approach, { ...exit, crossingId: crossing.id }, ...departure.slice(1)]
    }
    return [start, end]
  }

  return segment(from, to)
}

function intersectRoad(from: Vector2, to: Vector2, road: Road) {
  const normal = rotatePoint({ x: 1, y: 0 }, road.direction)
  const along = rotatePoint({ x: 0, y: 1 }, road.direction)
  const side = (point: Vector2) =>
    (point.x - road.position.x) * normal.x + (point.y - road.position.y) * normal.y
  const fromSide = side(from)
  const toSide = side(to)
  if (fromSide * toSide >= 0) return null
  const time = fromSide / (fromSide - toSide)
  const position = { x: from.x + (to.x - from.x) * time, y: from.y + (to.y - from.y) * time }
  const offset = (position.x - road.position.x) * along.x + (position.y - road.position.y) * along.y
  return Math.abs(offset) <= road.length / 2 ? { time, position, side: fromSide } : null
}

export function pedestrianPathDistance(path: readonly Vector2[]): number {
  let distance = 0
  for (let index = 1; index < path.length; index++)
    distance += distanceBetween(path[index - 1]!, path[index]!)
  return distance
}

function distanceBetween(from: Vector2, to: Vector2): number {
  return Math.hypot(to.x - from.x, to.y - from.y)
}
