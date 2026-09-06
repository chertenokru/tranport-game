import { GameWorld } from '@/game/core/GameWorld'
import type { Building } from '@/game/domain/Building'
import type { BusStop } from '@/game/domain/BusStop'
import type { Road } from '@/game/domain/Road.ts'
import type { MapNode } from '@/game/world/MapNode.ts'
import type { MapEdge } from '@/game/world/MapEdge.ts'
import type { BusRoute } from '@/game/domain/BusRoute.ts'
import type { Bus } from '@/game/domain/Bus.ts'
import { VEHICLES_CONFIG } from '@/game/config/vehicles.config.ts'
import { PEDESTRIANS_CONFIG } from '@/game/config/pedestrians.config.ts'
import type { Pedestrian } from '@/game/domain/Pedestrian.ts'

export function createVerticalSliceWorld(): GameWorld {
  const world = new GameWorld()

  const house: Building = {
    id: 'building-house',
    name: 'Жилой дом',
    type: 'residential',
    position: {
      x: 80,
      y: 180,
    },
    size: {
      x: 120,
      y: 100,
    },
    entrance: {
      x: 140,
      y: 280,
    },
  }

  const office: Building = {
    id: 'building-office',
    name: 'Офис',
    type: 'office',
    position: {
      x: 760,
      y: 180,
    },
    entrance: {
      x: 820,
      y: 280,
    },
    size: {
      x: 120,
      y: 100,
    },
  }

  const houseStop: BusStop = {
    id: 'stop-house',
    name: 'Жилой квартал',
    vehiclePosition: {
      x: 260,
      y: 340,
    },
    waitingPosition: {
      x: 260,
      y: 296,
    },
  }

  const officeStop: BusStop = {
    id: 'stop-office',
    name: 'Деловой центр',
    vehiclePosition: {
      x: 700,
      y: 340,
    },
    waitingPosition: {
      x: 700,
      y: 296,
    },
  }

  const mainRoad: Road = {
    id: 'road-main',
    start: {
      x: 200,
      y: 340,
    },
    end: {
      x: 760,
      y: 340,
    },
    width: 64,
  }

  const houseStopNode: MapNode = {
    id: 'node-stop-house',
    position: houseStop.vehiclePosition,
    stopId: houseStop.id,
  }

  const officeStopNode: MapNode = {
    id: 'node-stop-office',
    position: officeStop.vehiclePosition,
    stopId: officeStop.id,
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

  const mainRoute: BusRoute = {
    id: 'route-main',
    name: 'Маршрут 1',
    stopIds: [houseStop.id, officeStop.id],
  }

  const standardBusConfig = VEHICLES_CONFIG.standardBus

  const initialBus: Bus = {
    id: 'bus-main',
    vehicleTypeId: standardBusConfig.id,
    routeId: mainRoute.id,
    speed: standardBusConfig.speed,
    capacity: standardBusConfig.capacity,
    passengerIds: [],
    stopWaitSeconds: standardBusConfig.stopWaitSeconds,
    position: {
      ...houseStop.vehiclePosition,
    },
    state: 'waitingAtStop',
    currentStopIndex: 0,
    direction: 1,
    size: standardBusConfig.size,
    path: [],
    pathIndex: 0,
    waitingSecondsRemaining: standardBusConfig.stopWaitSeconds,
  }

  const initialBus1: Bus = {
    id: 'bus-main1',
    vehicleTypeId: standardBusConfig.id,
    routeId: mainRoute.id,
    speed: standardBusConfig.speed,
    capacity: standardBusConfig.capacity,
    passengerIds: [],
    stopWaitSeconds: standardBusConfig.stopWaitSeconds,
    position: {
      ...officeStop.vehiclePosition,
    },
    state: 'waitingAtStop',
    currentStopIndex: 1,
    direction: -1,
    size: standardBusConfig.size,
    path: [],
    pathIndex: 0,
    waitingSecondsRemaining: standardBusConfig.stopWaitSeconds,
  }

  const pedestrianConfig = PEDESTRIANS_CONFIG.default

  const initialPedestrian: Pedestrian = {
    id: 'pedestrian-main',
    originBuildingId: house.id,
    routeId: mainRoute.id,
    boardingStopId: houseStop.id,
    destinationStopId: officeStop.id,
    destinationBuildingId: office.id,
    walkingSpeed: pedestrianConfig.walkingSpeed,
    radius: pedestrianConfig.radius,
    position: {
      ...house.entrance,
    },
    state: 'choosingTransport',
    path: [],
    pathIndex: 0,
    transportDecision: null,
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

  world.routes.set(mainRoute.id, mainRoute)

  world.buses.set(initialBus.id, initialBus)
  world.buses.set(initialBus1.id, initialBus1)

  world.pedestrians.set(initialPedestrian.id, initialPedestrian)

  return world
}
