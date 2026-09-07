import type { GameSystem } from '@/game/core/GameSystem'
import type { GameWorld } from '@/game/core/GameWorld'
import { type Bus, BusState } from '@/game/domain/Bus'
import type { BusRoute } from '@/game/domain/BusRoute'
import type { BusStopId } from '@/game/domain/ids'
import { ResidentState } from '@/game/domain/Resident'
import { getBuildingEntrance } from '@/game/tools/getBuildingEntrance.ts'

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

      const currentStopId = route.legs[bus.legIndex]?.fromStopId

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

      if (
        !resident ||
        !journey ||
        journey.transit?.routeId !== bus.routeId ||
        journey.transit.destinationLegIndex !== bus.legIndex ||
        journey.transit.destinationStopId !== currentStopId
      ) {
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
      resident.path = [stop.waitingPosition, getBuildingEntrance(destination)]
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
    for (const resident of world.residents.values()) {
      const transit = resident.journey?.transit
      if (
        resident.state !== ResidentState.WaitingBus ||
        !transit ||
        transit.routeId !== route.id ||
        transit.boardingStopId !== currentStopId ||
        transit.boardingLegIndex !== bus.legIndex
      ) {
        continue
      }

      const destinationLeg = route.legs[transit.destinationLegIndex]
      if (
        !destinationLeg ||
        destinationLeg.fromStopId !== transit.destinationStopId ||
        transit.destinationLegIndex === transit.boardingLegIndex
      )
        continue

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
}
