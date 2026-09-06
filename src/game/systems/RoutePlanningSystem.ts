import type { GameSystem } from '@/game/core/GameSystem'
import type { GameWorld } from '@/game/core/GameWorld'
import { ResidentState, type Resident, type TransitJourney } from '@/game/domain/Resident'
import type { Vector2 } from '@/game/domain/geometry'
import type { BusId } from '@/game/domain/ids'
import { TransportDecisionReason, TransportMode } from '@/game/domain/TransportDecision'
import { chooseTransport } from './chooseTransport'
import { findBestBusOption } from './findBestBusOption'
import { getRouteLegDistances } from './getRouteLegDistances'

interface TransitOption {
  readonly transit: TransitJourney
  readonly boardingPosition: Vector2
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

    const walkingDistance = distanceBetween(resident.position, destination.entrance)
    const walkingTime = walkingDistance / resident.walkingSpeed
    const buses = [...world.buses.values()]
    let bestOption: TransitOption | null = null
    let unavailableReason = TransportDecisionReason.TransitUnavailable

    // The destination belongs to the resident; stops and a bus route are chosen here.
    for (const route of world.routes.values()) {
      const legDistances = getRouteLegDistances(world, route)
      if (!legDistances) continue

      for (let boardingIndex = 0; boardingIndex < route.stopIds.length; boardingIndex++) {
        const boardingStop = world.stops.get(route.stopIds[boardingIndex]!)
        if (!boardingStop) continue

        for (
          let destinationIndex = 0;
          destinationIndex < route.stopIds.length;
          destinationIndex++
        ) {
          if (boardingIndex === destinationIndex) continue
          const destinationStop = world.stops.get(route.stopIds[destinationIndex]!)
          if (!destinationStop) continue

          unavailableReason = TransportDecisionReason.NoBusAvailable
          const walkingToStopDistance = distanceBetween(
            resident.position,
            boardingStop.waitingPosition,
          )
          const walkingFromStopDistance = distanceBetween(
            destinationStop.waitingPosition,
            destination.entrance,
          )
          const busOption = findBestBusOption({
            buses,
            routeId: route.id,
            boardingStopIndex: boardingIndex,
            destinationStopIndex: destinationIndex,
            passengerArrivalTime: walkingToStopDistance / resident.walkingSpeed,
            legDistances,
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
              boardingPosition: boardingStop.waitingPosition,
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
    resident.path = [
      resident.position,
      useBus && bestOption ? bestOption.boardingPosition : destination.entrance,
    ]
    resident.pathIndex = 1
  }
}

function distanceBetween(from: Vector2, to: Vector2): number {
  return Math.hypot(to.x - from.x, to.y - from.y)
}
