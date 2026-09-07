import { GameWorld } from '@/game/core/GameWorld'
import { type Building, BuildingType } from '@/game/domain/Building'
import { Direction } from '@/game/domain/Direction'
import type { Intersection } from '@/game/domain/Intersection'
import type { IntersectionId, RoadId } from '@/game/domain/ids'
import type { Road } from '@/game/domain/Road'
import type { Vector2 } from '@/game/domain/geometry'
import { getRoadEndpoints } from '@/game/tools/getRoadEndpoints'
import type { MapNodeId } from './MapNode'
import { connectNodes } from '@/game/world/connectNodes.ts'
import type { BusStop } from '@/game/domain/BusStop.ts'
import { localToWorld } from '@/game/tools/geometry.ts'
import { createBus } from './createBus'
import { VEHICLES_CONFIG } from '@/game/config/vehicles.config.ts'
import { createBusRoute } from '@/game/tools/routing/createBusRoute'
import { addPedestrianCrossing } from './addPedestrianCrossing'

const ROAD_WIDTH = 64

interface RoadStopPlacement {
  readonly roadId: RoadId
  readonly distanceFromStart: number
  readonly stop: Omit<BusStop, 'vehiclePosition' | 'roadNodeId'>
}

const STOP_PLACEMENTS: readonly RoadStopPlacement[] = [
  {
    roadId: 'road-upper-left',
    distanceFromStart: 32,
    stop: {
      id: 'stop-upper-house',
      travelDirection: Direction.West,
      name: 'Дом 1',
      waitingPosition: { x: 96, y: 106 },
      direction: Direction.South,
    },
  },
  {
    roadId: 'road-upper-right',
    distanceFromStart: 352,
    stop: {
      id: 'stop-upper-office',
      travelDirection: Direction.West,
      name: 'Офис 1',
      waitingPosition: { x: 864, y: 106 },
      direction: Direction.South,
    },
  },
  {
    roadId: 'road-middle',
    distanceFromStart: 168,
    stop: {
      id: 'stop-shop',
      travelDirection: Direction.North,
      name: 'Магазин',
      waitingPosition: { x: 524, y: 350 },
      direction: Direction.West,
    },
  },
  {
    roadId: 'road-middle',
    distanceFromStart: 168,
    stop: {
      id: 'stop-shop-south',
      name: 'Магазин — на юг',
      waitingPosition: { x: 436, y: 350 },
      direction: Direction.East,
      travelDirection: Direction.South,
    },
  },
  {
    roadId: 'road-lower-left',
    distanceFromStart: 32,
    stop: {
      id: 'stop-lower-house',
      travelDirection: Direction.East,
      name: 'Дом 2',
      waitingPosition: { x: 96, y: 594 },
      direction: Direction.North,
    },
  },
  {
    roadId: 'road-lower-right',
    distanceFromStart: 352,
    stop: {
      id: 'stop-lower-office',
      travelDirection: Direction.East,
      name: 'Офис 2',
      waitingPosition: { x: 864, y: 594 },
      direction: Direction.North,
    },
  },
]

export function createIShapedWorld(): GameWorld {
  const world = new GameWorld()

  const buildings: Building[] = [
    {
      id: 'building-upper-house',
      name: 'Дом 1',
      type: BuildingType.Residential,
      position: { x: 180, y: 70 },
      size: { x: 120, y: 80 },
      direction: Direction.South,
    },
    {
      id: 'building-upper-office',
      name: 'Офис 1',
      type: BuildingType.Office,
      position: { x: 780, y: 70 },
      size: { x: 120, y: 80 },
      direction: Direction.South,
    },
    {
      id: 'building-lower-house',
      name: 'Дом 2',
      type: BuildingType.Residential,
      position: { x: 180, y: 630 },
      size: { x: 120, y: 80 },
      direction: Direction.North,
    },
    {
      id: 'building-lower-office',
      name: 'Офис 2',
      type: BuildingType.Office,
      position: { x: 780, y: 630 },
      size: { x: 120, y: 80 },
      direction: Direction.North,
    },
    {
      id: 'building-shop',
      name: 'Магазин',
      type: BuildingType.Shop,
      position: { x: 558, y: 280 },
      size: { x: 70, y: 70 },
      direction: Direction.West,
    },
  ]

  for (const building of buildings) {
    world.buildings.set(building.id, building)
  }

  const roads: Road[] = [
    {
      id: 'road-upper-left',
      position: { x: 256, y: 150 },
      length: 384,
      width: ROAD_WIDTH,
      direction: Direction.East,
    },
    {
      id: 'road-upper-right',
      position: { x: 704, y: 150 },
      length: 384,
      width: ROAD_WIDTH,
      direction: Direction.East,
    },
    {
      id: 'road-middle',
      position: { x: 480, y: 350 },
      length: 336,
      width: ROAD_WIDTH,
      direction: Direction.South,
    },
    {
      id: 'road-lower-left',
      position: { x: 256, y: 550 },
      length: 384,
      width: ROAD_WIDTH,
      direction: Direction.East,
    },
    {
      id: 'road-lower-right',
      position: { x: 704, y: 550 },
      length: 384,
      width: ROAD_WIDTH,
      direction: Direction.East,
    },
  ]

  for (const road of roads) {
    world.roads.set(road.id, road)

    const { start, end } = getRoadEndpoints(road)

    const startId = `${road.id}-start`
    const endId = `${road.id}-end`

    world.roadNodes.set(startId, {
      id: startId,
      position: start,
    })

    world.roadNodes.set(endId, {
      id: endId,
      position: end,
    })

    const placements = STOP_PLACEMENTS.filter((placement) => placement.roadId === road.id).sort(
      (a, b) => a.distanceFromStart - b.distanceFromStart,
    )

    let previousNodeId = startId
    let previousDistance = 0

    for (const placement of placements) {
      const distance = placement.distanceFromStart

      if (
        !Number.isFinite(distance) ||
        distance <= 0 ||
        distance < previousDistance ||
        distance >= road.length
      ) {
        throw new Error(`Invalid stop position: "${placement.stop.id}"`)
      }

      const vehiclePosition = localToWorld(
        { x: 0, y: distance - road.length / 2 },
        road.position,
        road.direction,
      )

      // Opposite platforms at the same position share one road node.
      const nodeId = distance === previousDistance ? previousNodeId : `node-${placement.stop.id}`
      const stop: BusStop = {
        ...placement.stop,
        vehiclePosition,
        roadNodeId: nodeId,
      }

      world.stops.set(stop.id, stop)
      if (distance === previousDistance) continue

      world.roadNodes.set(nodeId, {
        id: nodeId,
        position: vehiclePosition,
      })

      connectNodes(world, previousNodeId, nodeId, { roadId: road.id })
      connectNodes(world, nodeId, previousNodeId, { roadId: road.id })

      previousNodeId = nodeId
      previousDistance = distance
    }

    connectNodes(world, previousNodeId, endId, { roadId: road.id })
    connectNodes(world, endId, previousNodeId, { roadId: road.id })
  }

  const upper = createIntersection(
    'intersection-upper',
    { x: 480, y: 150 },
    Direction.South,
    new Map([
      [Direction.West, 'road-upper-left-end'],
      [Direction.East, 'road-upper-right-start'],
      [Direction.South, 'road-middle-start'],
    ]),
  )

  const lower = createIntersection(
    'intersection-lower',
    { x: 480, y: 550 },
    Direction.North,
    new Map([
      [Direction.West, 'road-lower-left-end'],
      [Direction.East, 'road-lower-right-start'],
      [Direction.North, 'road-middle-end'],
    ]),
  )

  const turnarounds: Intersection[] = [
    createTurnaround(
      'intersection-upper-left-turnaround',
      { x: 32, y: 150 },
      Direction.East,
      'road-upper-left-start',
    ),
    createTurnaround(
      'intersection-upper-right-turnaround',
      { x: 928, y: 150 },
      Direction.West,
      'road-upper-right-end',
    ),
    createTurnaround(
      'intersection-lower-left-turnaround',
      { x: 32, y: 550 },
      Direction.East,
      'road-lower-left-start',
    ),
    createTurnaround(
      'intersection-lower-right-turnaround',
      { x: 928, y: 550 },
      Direction.West,
      'road-lower-right-end',
    ),
  ]
  for (const intersection of [upper, lower, ...turnarounds]) {
    world.intersections.set(intersection.id, intersection)

    const nodeId = `node-${intersection.id}`

    world.roadNodes.set(nodeId, {
      id: nodeId,
      position: intersection.position,
      intersectionId: intersection.id,
    })

    for (const neighborId of intersection.connections.values()) {
      connectNodes(world, neighborId, nodeId, {
        intersectionId: intersection.id,
      })

      connectNodes(world, nodeId, neighborId, {
        intersectionId: intersection.id,
      })
    }
  }

  addPedestrianCrossing(world, 'crossing-upper-left', 'road-upper-left', 176)
  addPedestrianCrossing(world, 'crossing-upper-right', 'road-upper-right', 208)
  addPedestrianCrossing(world, 'crossing-middle', 'road-middle', 218)
  addPedestrianCrossing(world, 'crossing-lower-left', 'road-lower-left', 176)
  addPedestrianCrossing(world, 'crossing-lower-right', 'road-lower-right', 208)

  const routes = [
    createBusRoute(world, {
      id: 'route-upper-lower',
      name: 'Дом 1 — Магазин — Офис 2',
      stopIds: ['stop-upper-house', 'stop-shop-south', 'stop-lower-office', 'stop-shop'],
    }),
    createBusRoute(world, {
      id: 'route-lower-upper',
      name: 'Дом 2 — Магазин — Офис 1',
      stopIds: ['stop-lower-house', 'stop-shop', 'stop-upper-office', 'stop-shop-south'],
    }),
  ]

  const vehicle = VEHICLES_CONFIG.standardBus

  for (const route of routes) {
    world.routes.set(route.id, route)
    const bus = createBus(route, 'bus-' + route.id, vehicle)
    world.buses.set(bus.id, bus)
    const bus1 = createBus(route, 'bus1-' + route.id, { ...vehicle, stopWaitSeconds: 2 })
    world.buses.set(bus1.id, bus1)
  }

  return world
}

function createIntersection(
  id: IntersectionId,
  position: Vector2,
  direction: Direction,
  connections: ReadonlyMap<Direction, MapNodeId>,
): Intersection {
  const sides = [...connections.keys()]

  return {
    id,
    position,
    direction,
    size: ROAD_WIDTH,
    connections,

    // Для этой карты разрешаем все проезды между разными сторонами.
    // Развороты внутри этих двух перекрёстков запрещены.
    movements: new Map(
      sides.map(
        (entrySide) =>
          [entrySide, new Set(sides.filter((exitSide) => exitSide !== entrySide))] as const,
      ),
    ),
  }
}

function createTurnaround(
  id: IntersectionId,
  position: Vector2,
  connectedSide: Direction,
  neighborId: MapNodeId,
): Intersection {
  return {
    id,
    position,
    size: ROAD_WIDTH,
    direction: connectedSide,
    connections: new Map([[connectedSide, neighborId]]),

    // Въезд и выезд через одну сторону — только разворот.
    movements: new Map([[connectedSide, new Set([connectedSide])]]),
  }
}
