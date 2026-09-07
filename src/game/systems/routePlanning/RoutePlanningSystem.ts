import type { GameSystem } from '@/game/core/GameSystem.ts'
import type { GameWorld } from '@/game/core/GameWorld.ts'
import { type Resident, ResidentState, type TransitJourney } from '@/game/domain/Resident.ts'
import type { PedestrianWaypoint } from '@/game/domain/PedestrianCrossing'
import type { BusId } from '@/game/domain/ids.ts'
import { TransportDecisionReason, TransportMode } from '@/game/domain/TransportDecision.ts'
import { chooseTransport } from './tools/chooseTransport.ts'
import { findBestBusOption } from './tools/findBestBusOption.ts'
import { getBuildingEntrance } from '@/game/tools/getBuildingEntrance.ts'
import { buildPedestrianPath, pedestrianPathDistance } from '@/game/tools/routing/buildPedestrianPath'

interface TransitOption {
  readonly transit: TransitJourney
  readonly boardingPath: readonly PedestrianWaypoint[]
  readonly busId: BusId
  readonly choice: ReturnType<typeof chooseTransport>
}

export class RoutePlanningSystem implements GameSystem {
  update(world: GameWorld, deltaSeconds: number): void {
    void deltaSeconds
    for (const resident of world.residents.values()) {
      if (resident.state === ResidentState.ChoosingTransport && resident.journey) {
        this.planJourney(world, resident)
      }
    }
  }

  private planJourney(world: GameWorld, resident: Resident): void {
    const journey = resident.journey
    if (!journey) return
    const destination = world.buildings.get(journey.destinationBuildingId)
    if (!destination) return

    const destinationPosition = getBuildingEntrance(destination)
    const walkingPath = buildPedestrianPath(world, resident.position, destinationPosition)
    const walkingDistance = pedestrianPathDistance(walkingPath)
    const pathsToStops = new Map([...world.stops.values()].map((stop) =>
      [stop.id, buildPedestrianPath(world, resident.position, stop.waitingPosition)]))
    const distancesFromStops = new Map([...world.stops.values()].map((stop) =>
      [stop.id, pedestrianPathDistance(buildPedestrianPath(world, stop.waitingPosition, destinationPosition))]))
    const walkingTime = walkingDistance / resident.walkingSpeed
    const buses = [...world.buses.values()]
    let bestOption: TransitOption | null = null
    let unavailableReason = TransportDecisionReason.TransitUnavailable

    // The destination belongs to the resident; stops and a bus route are chosen here.
    for (const route of world.routes.values()) {
      if (route.legs.length < 2) continue

      for (let boardingIndex = 0; boardingIndex < route.legs.length; boardingIndex++) {
        const boardingStop = world.stops.get(route.legs[boardingIndex]!.fromStopId)
        if (!boardingStop) continue

        for (let destinationIndex = 0; destinationIndex < route.legs.length; destinationIndex++) {
          if (boardingIndex === destinationIndex) continue
          const destinationStop = world.stops.get(route.legs[destinationIndex]!.fromStopId)
          if (!destinationStop || destinationStop.id === boardingStop.id) continue

          unavailableReason = TransportDecisionReason.NoBusAvailable
          const boardingPath = pathsToStops.get(boardingStop.id)!
          const walkingToStopDistance = pedestrianPathDistance(boardingPath)
          const walkingFromStopDistance = distancesFromStops.get(destinationStop.id)!
          const busOption = findBestBusOption({
            buses,
            route,
            boardingStopIndex: boardingIndex,
            alightingStopIndex: destinationIndex,
            passengerArrivalTime: walkingToStopDistance / resident.walkingSpeed,
          })
          if (!busOption) continue

          const choice = chooseTransport({
            walkingDistance,
            walkingSpeed: resident.walkingSpeed,
            walkingToStopDistance,
            expectedWaitingTime: busOption.waitingTime,
            busTravelTime: busOption.busTravelTime,
            walkingFromStopDistance,
            busTimeAdvantageFactor: resident.busTimeAdvantageFactor,
          })

          if (!bestOption || choice.busTime < bestOption.choice.busTime) {
            bestOption = {
              transit: {
                routeId: route.id,
                boardingStopId: boardingStop.id,
                destinationStopId: destinationStop.id,
              },
              boardingPath,
              busId: busOption.busId,
              choice,
            }
          }
        }
      }
    }

    const useBus = bestOption?.choice.mode === TransportMode.Bus
    resident.transportDecision = {
      selectedMode: useBus ? TransportMode.Bus : TransportMode.Walking,
      reason: bestOption
        ? useBus
          ? TransportDecisionReason.BusSelected
          : TransportDecisionReason.BusNotCompetitive
        : unavailableReason,
      walkingTime,
      busTime: bestOption?.choice.busTime ?? null,
      evaluatedBusId: bestOption?.busId ?? null,
    }
    journey.transit = useBus && bestOption ? bestOption.transit : null
    resident.state = useBus ? ResidentState.WalkingToStop : ResidentState.Walking
    resident.path = useBus && bestOption ? bestOption.boardingPath : walkingPath
    resident.pathIndex = 1
  }
}
