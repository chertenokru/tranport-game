import { GameWorld } from '@/game/core/GameWorld'
import { type Building, BuildingType } from '@/game/domain/Building'
import type { BusStop } from '@/game/domain/BusStop'
import type { Road } from '@/game/domain/Road.ts'
import type { MapNode } from '@/game/world/MapNode.ts'
import type { MapEdge } from '@/game/world/MapEdge.ts'
import { createBusRoute } from '@/game/tools/routing/createBusRoute'
import { createBus } from './createBus'
import { VEHICLES_CONFIG } from '@/game/config/vehicles.config.ts'
import { Direction } from '@/game/domain/Direction.ts'
import { connectNodes } from '@/game/world/connectNodes.ts'

export function createVerticalSliceWorld(): GameWorld {
  const world = new GameWorld()

  const house: Building = {
    id: 'building-house',
    name: 'Жилой дом',
    type: BuildingType.Residential,
    position: { x: 140, y: 230 },
    size: { x: 120, y: 100 },
    direction: Direction.South,
  }

  const office: Building = {
    id: 'building-office',
    name: 'Офис',
    type: BuildingType.Office,
    position: { x: 820, y: 230 },
    size: { x: 120, y: 100 },
    direction: Direction.South,
  }

  const houseStop: BusStop = {
    id: 'stop-house',
    roadNodeId: 'node-stop-house',
    travelDirection: Direction.West,
    name: 'Жилой квартал',
    direction: Direction.South,
    vehiclePosition: { x: 260, y: 340 },
    waitingPosition: { x: 260, y: 296 },
  }

  const officeStop: BusStop = {
    id: 'stop-office',
    roadNodeId: 'node-stop-office',
    travelDirection: Direction.East,
    name: 'Деловой центр',
    direction: Direction.North,
    vehiclePosition: { x: 700, y: 340 },
    waitingPosition: { x: 700, y: 384 },
  }

  const mainRoad: Road = {
    id: 'road-main',
    position: { x: 480, y: 340 },
    length: 560,
    width: 64,
    direction: Direction.East,
  }

  const houseStopNode: MapNode = {
    id: 'node-stop-house',
    position: houseStop.vehiclePosition,
  }

  const officeStopNode: MapNode = {
    id: 'node-stop-office',
    position: officeStop.vehiclePosition,
  }

  const houseToOfficeEdge: MapEdge = {
    id: 'edge-house-office',
    from: houseStopNode.id,
    to: officeStopNode.id,
    roadId: mainRoad.id,
    traversalCost: 440,
  }

  const officeToHouseEdge: MapEdge = {
    id: 'edge-office-house',
    from: officeStopNode.id,
    to: houseStopNode.id,
    roadId: mainRoad.id,
    traversalCost: 440,
  }

  world.buildings.set(house.id, house)
  world.buildings.set(office.id, office)

  world.stops.set(houseStop.id, houseStop)
  world.stops.set(officeStop.id, officeStop)

  world.roads.set(mainRoad.id, mainRoad)
  world.roadNodes.set(houseStopNode.id, houseStopNode)
  world.roadNodes.set(officeStopNode.id, officeStopNode)

  world.roadEdges.set(houseToOfficeEdge.id, houseToOfficeEdge)
  world.roadEdges.set(officeToHouseEdge.id, officeToHouseEdge)

  for (const terminal of [
    {
      id: 'turnaround-house',
      position: { x: 200, y: 340 },
      side: Direction.East,
      neighborId: houseStopNode.id,
    },
    {
      id: 'turnaround-office',
      position: { x: 760, y: 340 },
      side: Direction.West,
      neighborId: officeStopNode.id,
    },
  ]) {
    const nodeId = `node-${terminal.id}`

    world.intersections.set(terminal.id, {
      id: terminal.id,
      position: terminal.position,
      size: mainRoad.width,
      direction: terminal.side,
      connections: new Map([[terminal.side, terminal.neighborId]]),
      movements: new Map([[terminal.side, new Set([terminal.side])]]),
    })

    world.roadNodes.set(nodeId, {
      id: nodeId,
      position: terminal.position,
      intersectionId: terminal.id,
    })

    connectNodes(world, terminal.neighborId, nodeId, {
      intersectionId: terminal.id,
    })

    connectNodes(world, nodeId, terminal.neighborId, {
      intersectionId: terminal.id,
    })
  }

  const mainRoute = createBusRoute(world, {
    id: 'route-main',
    name: 'Маршрут 1',
    stopIds: [houseStop.id, officeStop.id],
  })

  const standardBusConfig = VEHICLES_CONFIG.standardBus

  const initialBus = createBus(mainRoute, 'bus-main', standardBusConfig)
  const initialBus1 = createBus(
    mainRoute,
    'bus-main1',
    {
      ...standardBusConfig,
      stopWaitSeconds: standardBusConfig.stopWaitSeconds * 2,
    },
    1,
  )
  initialBus1.waitingSecondsRemaining = standardBusConfig.stopWaitSeconds

  world.routes.set(mainRoute.id, mainRoute)

  world.buses.set(initialBus.id, initialBus)
  world.buses.set(initialBus1.id, initialBus1)

  return world
}
