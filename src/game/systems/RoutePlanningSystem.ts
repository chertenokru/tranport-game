import type { GameSystem } from '@/game/core/GameSystem'
import type { GameWorld } from '@/game/core/GameWorld'
import type { Pedestrian } from '@/game/domain/Pedestrian'
import type { Vector2 } from '@/game/domain/geometry'

import { chooseTransport } from './chooseTransport'
import { findBestBusOption } from './findBestBusOption'
import { getRouteLegDistances } from './getRouteLegDistances'
import type { TransportDecisionReason } from '@/game/domain/TransportDecision.ts'

export class RoutePlanningSystem implements GameSystem {
  update(world: GameWorld, deltaSeconds: number): void {
    void deltaSeconds

    for (const pedestrian of world.pedestrians.values()) {
      if (pedestrian.state !== 'choosingTransport') {
        continue
      }

      this.planJourney(world, pedestrian)
    }
  }

  private planJourney(world: GameWorld, pedestrian: Pedestrian): void {
    const destination = world.buildings.get(pedestrian.destinationBuildingId)

    if (!destination) {
      return
    }

    const walkingDistance = distanceBetween(pedestrian.position, destination.entrance)

    const walkingTime = walkingDistance / pedestrian.walkingSpeed

    const route = world.routes.get(pedestrian.routeId)
    const boardingStop = world.stops.get(pedestrian.boardingStopId)
    const destinationStop = world.stops.get(pedestrian.destinationStopId)

    if (!route || !boardingStop || !destinationStop) {
      this.startWalkingWithoutTransit(
        pedestrian,
        destination.entrance,
        walkingTime,
        'transitUnavailable',
      )
      return
    }

    const boardingStopIndex = route.stopIds.indexOf(pedestrian.boardingStopId)
    const destinationStopIndex = route.stopIds.indexOf(pedestrian.destinationStopId)

    const legDistances = getRouteLegDistances(world, route)

    if (
      !legDistances ||
      boardingStopIndex < 0 ||
      destinationStopIndex < 0 ||
      boardingStopIndex === destinationStopIndex
    ) {
      this.startWalkingWithoutTransit(
        pedestrian,
        destination.entrance,
        walkingTime,
        'transitUnavailable',
      )
      return
    }

    const walkingToStopDistance = distanceBetween(pedestrian.position, boardingStop.waitingPosition)

    const walkingFromStopDistance = distanceBetween(
      destinationStop.waitingPosition,
      destination.entrance,
    )

    const passengerArrivalTime = walkingToStopDistance / pedestrian.walkingSpeed

    const bestBusOption = findBestBusOption({
      buses: [...world.buses.values()],
      routeId: route.id,
      boardingStopIndex,
      destinationStopIndex,
      passengerArrivalTime,
      legDistances,
    })

    if (!bestBusOption) {
      this.startWalkingWithoutTransit(
        pedestrian,
        destination.entrance,
        walkingTime,
        'noBusAvailable',
      )
      return
    }

    const selectedBus = world.buses.get(bestBusOption.busId)

    if (!selectedBus) {
      this.startWalkingWithoutTransit(
        pedestrian,
        destination.entrance,
        walkingTime,
        'noBusAvailable',
      )
      return
    }

    const choice = chooseTransport({
      walkingDistance,
      walkingSpeed: pedestrian.walkingSpeed,
      walkingToStopDistance,
      expectedWaitingTime: bestBusOption.waitingTime,
      busTravelTime: bestBusOption.busTravelTime,
      walkingFromStopDistance,
      busTimeAdvantageFactor: pedestrian.busTimeAdvantageFactor,
    })

    pedestrian.transportDecision = {
      selectedMode: choice.mode,
      reason: choice.mode === 'bus' ? 'busSelected' : 'busNotCompetitive',
      walkingTime: choice.walkingTime,
      busTime: choice.busTime,
      evaluatedBusId: selectedBus.id,
    }

    console.table([
      {
        pedestrianId: pedestrian.id,
        walkingSpeed: pedestrian.walkingSpeed,
        walkingDistance: walkingDistance.toFixed(2),
        walkingTime: choice.walkingTime.toFixed(2),

        walkingToStopTime: passengerArrivalTime.toFixed(2),
        selectedBusId: selectedBus.id,
        busState: selectedBus.state,
        currentBusWait: selectedBus.waitingSecondsRemaining.toFixed(2),
        fullBusStopWait: selectedBus.stopWaitSeconds.toFixed(2),
        predictedWaitingTime: bestBusOption.waitingTime.toFixed(2),
        boardingStopTime: bestBusOption.boardingStopTime.toFixed(2),
        movementTime: bestBusOption.movementTime.toFixed(2),
        intermediateStopTime: bestBusOption.intermediateStopTime.toFixed(2),
        predictedTravelTime: bestBusOption.busTravelTime.toFixed(2),
        walkingFromStopTime: (walkingFromStopDistance / pedestrian.walkingSpeed).toFixed(2),

        busTime: choice.busTime.toFixed(2),
        requiredBusTime: (choice.walkingTime * pedestrian.busTimeAdvantageFactor).toFixed(2),

        selectedMode: choice.mode,
      },
    ])

    if (choice.mode === 'bus') {
      pedestrian.state = 'walkingToStop'
      pedestrian.path = [pedestrian.position, boardingStop.waitingPosition]
      pedestrian.pathIndex = 1
      return
    }

    this.startWalking(pedestrian, destination.entrance)
  }

  private startWalkingWithoutTransit(
    pedestrian: Pedestrian,
    destination: Vector2,
    walkingTime: number,
    reason: TransportDecisionReason,
  ): void {
    pedestrian.transportDecision = {
      selectedMode: 'walking',
      reason,
      walkingTime,
      busTime: null,
      evaluatedBusId: null,
    }

    this.startWalking(pedestrian, destination)
  }

  private startWalking(pedestrian: Pedestrian, destination: Vector2): void {
    pedestrian.state = 'walking'
    pedestrian.path = [pedestrian.position, destination]
    pedestrian.pathIndex = 1
  }
}

function distanceBetween(from: Vector2, to: Vector2): number {
  return Math.hypot(to.x - from.x, to.y - from.y)
}
