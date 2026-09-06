import { GAME_CONFIG } from '@/game/config/game.config'
import type { BusStop } from '@/game/domain/BusStop.ts'
import type { Building } from '@/game/domain/Building.ts'
import type {
  BuildingId,
  BusId,
  BusStopId,
  PedestrianId,
  RoadId,
  RouteId,
} from '@/game/domain/ids.ts'
import type { Road } from '@/game/domain/Road.ts'
import type { MapEdge, MapEdgeId } from '@/game/world/MapEdge.ts'
import type { MapNode, MapNodeId } from '@/game/world/MapNode.ts'
import type { BusRoute } from '@/game/domain/BusRoute.ts'
import type { Bus } from '@/game/domain/Bus.ts'
import type { Pedestrian } from '@/game/domain/Pedestrian.ts'

export class GameWorld {
  money: number = GAME_CONFIG.economy.startingMoney
  deliveredPassengers = 0
  accidents = 0

  readonly buildings = new Map<BuildingId, Building>()
  readonly stops = new Map<BusStopId, BusStop>()
  readonly roads = new Map<RoadId, Road>()
  readonly roadNodes = new Map<MapNodeId, MapNode>()
  readonly roadEdges = new Map<MapEdgeId, MapEdge>()
  readonly routes = new Map<RouteId, BusRoute>()
  readonly buses = new Map<BusId, Bus>()
  readonly pedestrians = new Map<PedestrianId, Pedestrian>()

  reset(): void {
    this.money = GAME_CONFIG.economy.startingMoney
    this.deliveredPassengers = 0
    this.accidents = 0
    this.buses.clear()
    this.pedestrians.clear()
  }
}
