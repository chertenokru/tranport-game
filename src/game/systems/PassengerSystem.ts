import type { GameSystem } from '@/game/core/GameSystem'
import type { GameWorld } from '@/game/core/GameWorld'
import { BusState, type Bus } from '@/game/domain/Bus'
import type { BusRoute } from '@/game/domain/BusRoute'
import type { BusStopId } from '@/game/domain/ids'
import { ResidentState } from '@/game/domain/Resident'
import { getRouteDepartureDirection } from '@/game/systems/movement/getRouteDepartureDirection.ts'

export class PassengerSystem implements GameSystem {
  update(world: GameWorld, deltaSeconds: number): void {
    void deltaSeconds
    for (const bus of world.buses.values()) {
      if (bus.state !== BusState.WaitingAtStop) {
        continue
      }

      const route = world.routes.get(bus.routeId)

      if (!route) {
        continue
      }

      const currentStopId = route.stopIds[bus.currentStopIndex]

      if (!currentStopId) {
        continue
      }

      this.dropOffPassengers(world, bus, currentStopId)

      this.boardPassengers(world, bus, route, currentStopId)
    }
  }

  private dropOffPassengers(world: GameWorld, bus: Bus, currentStopId: BusStopId): void {
    for (let index = bus.passengerIds.length - 1; index >= 0; index--) {
      const passengerId = bus.passengerIds[index]

      if (!passengerId) {
        continue
      }

      const resident = world.residents.get(passengerId)
      const journey = resident?.journey

      if (!resident || !journey || journey.transit?.destinationStopId !== currentStopId) {
        continue
      }

      const stop = world.stops.get(currentStopId)
      const destination = world.buildings.get(journey.destinationBuildingId)

      if (!stop || !destination) {
        continue
      }

      bus.passengerIds.splice(index, 1)

      resident.position = {
        ...stop.waitingPosition,
      }
      resident.path = [stop.waitingPosition, destination.entrance]
      resident.pathIndex = 1
      resident.state = ResidentState.WalkingFromStop
    }
  }

  private boardPassengers(
    world: GameWorld,
    bus: Bus,
    route: BusRoute,
    currentStopId: BusStopId,
  ): void {
    const departureDirection = getRouteDepartureDirection(
      bus.currentStopIndex,
      bus.direction,
      route.stopIds.length,
    )

    for (const resident of world.residents.values()) {
      const transit = resident.journey?.transit
      if (
        resident.state !== ResidentState.WaitingBus ||
        !transit ||
        transit.routeId !== route.id ||
        transit.boardingStopId !== currentStopId
      ) {
        continue
      }

      const destinationIndex = route.stopIds.indexOf(transit.destinationStopId)

      if (
        destinationIndex < 0 ||
        !this.isDestinationAhead(bus.currentStopIndex, destinationIndex, departureDirection)
      ) {
        continue
      }

      if (bus.passengerIds.length >= bus.capacity) {
        resident.state = ResidentState.ChoosingTransport
        continue
      }

      resident.state = ResidentState.InsideBus
      resident.path = []
      resident.pathIndex = 0

      bus.passengerIds.push(resident.id)
    }
  }

  private isDestinationAhead(
    currentStopIndex: number,
    destinationStopIndex: number,
    direction: 1 | -1,
  ): boolean {
    return (destinationStopIndex - currentStopIndex) * direction > 0
  }
}
