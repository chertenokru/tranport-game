import { GAME_CONFIG } from '@/game/config/game.config'
import type { BusStop } from '@/game/domain/BusStop.ts'
import type { Building } from '@/game/domain/Building.ts'
import type { BuildingId, BusId, BusStopId, IntersectionId, ResidentId, RoadId, RouteId } from '@/game/domain/ids.ts'
import type { Road } from '@/game/domain/Road.ts'
import type { MapEdge, MapEdgeId } from '@/game/world/MapEdge.ts'
import type { MapNode, MapNodeId } from '@/game/world/MapNode.ts'
import type { BusRoute } from '@/game/domain/BusRoute.ts'
import type { Bus } from '@/game/domain/Bus.ts'
import type { Resident } from '@/game/domain/Resident.ts'
import type { Intersection } from '@/game/domain/Intersection.ts'

export class GameWorld {
  money: number = GAME_CONFIG.economy.startingMoney
  deliveredPassengers = 0
  accidents = 0

  readonly buildings = new Map<BuildingId, Building>()
  readonly stops = new Map<BusStopId, BusStop>()
  readonly roads = new Map<RoadId, Road>()
  readonly roadNodes = new Map<MapNodeId, MapNode>()
  readonly roadEdges = new Map<MapEdgeId, MapEdge>()
  readonly intersections = new Map<IntersectionId, Intersection>()
  readonly routes = new Map<RouteId, BusRoute>()
  readonly buses = new Map<BusId, Bus>()
  readonly residents = new Map<ResidentId, Resident>()
  readonly population = { secondsUntilNextCycle: 0, nextResidentId: 1 }

  reset(): void {
    this.money = GAME_CONFIG.economy.startingMoney
    this.deliveredPassengers = 0
    this.accidents = 0
    this.buses.clear()
    this.residents.clear()
    this.population.secondsUntilNextCycle = 0
    this.population.nextResidentId = 1
  }
}
