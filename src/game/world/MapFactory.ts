import { GameWorld } from '@/game/core/GameWorld'
import { type Building, BuildingType } from '@/game/domain/Building'
import type { BusStop } from '@/game/domain/BusStop'
import type { Road } from '@/game/domain/Road.ts'
import type { MapNode } from '@/game/world/MapNode.ts'
import type { MapEdge } from '@/game/world/MapEdge.ts'
import type { BusRoute } from '@/game/domain/BusRoute.ts'
import { type Bus, BusState } from '@/game/domain/Bus.ts'
import { VEHICLES_CONFIG } from '@/game/config/vehicles.config.ts'
import { Direction } from '@/game/domain/Direction.ts'

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
    position: { x: 480, y: 340 },
    length: 560,
    width: 64,
    direction: Direction.East,
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
    state: BusState.WaitingAtStop,
    currentStopIndex: 0,
    // Автобус возле дома.
    routeDirection: 1,
    direction: Direction.East,
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
    stopWaitSeconds: standardBusConfig.stopWaitSeconds * 2,
    position: {
      ...officeStop.vehiclePosition,
    },
    state: BusState.WaitingAtStop,
    currentStopIndex: 1,
    // Автобус возле офиса.
    routeDirection: -1,
    direction: Direction.West,
    size: standardBusConfig.size,
    path: [],
    pathIndex: 0,
    waitingSecondsRemaining: standardBusConfig.stopWaitSeconds,
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

  return world
}
