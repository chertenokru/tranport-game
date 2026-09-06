import type { GameSystem } from '@/game/core/GameSystem'
import type { GameWorld } from '@/game/core/GameWorld'
import type { Bus } from '@/game/domain/Bus'
import type { BusRoute } from '@/game/domain/BusRoute'
import type { BusStopId } from '@/game/domain/ids'
import { getRouteDepartureDirection } from '@/game/systems/movement/getRouteDepartureDirection.ts'

export class PassengerSystem implements GameSystem {
  update(world: GameWorld, deltaSeconds: number): void {
    void deltaSeconds
    for (const bus of world.buses.values()) {
      if (bus.state !== 'waitingAtStop') {
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

      const pedestrian = world.pedestrians.get(passengerId)

      if (!pedestrian || pedestrian.destinationStopId !== currentStopId) {
        continue
      }

      const stop = world.stops.get(currentStopId)
      const destination = world.buildings.get(pedestrian.destinationBuildingId)

      if (!stop || !destination) {
        continue
      }

      bus.passengerIds.splice(index, 1)

      pedestrian.position = {
        ...stop.waitingPosition,
      }
      pedestrian.path = [stop.waitingPosition, destination.entrance]
      pedestrian.pathIndex = 1
      pedestrian.state = 'walkingFromStop'
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

    for (const pedestrian of world.pedestrians.values()) {
      if (
        pedestrian.state !== 'waitingBus' ||
        pedestrian.routeId !== route.id ||
        pedestrian.boardingStopId !== currentStopId
      ) {
        continue
      }

      if (bus.passengerIds.length >= bus.capacity) {
        return
      }

      const destinationIndex = route.stopIds.indexOf(pedestrian.destinationStopId)

      if (
        destinationIndex < 0 ||
        !this.isDestinationAhead(bus.currentStopIndex, destinationIndex, departureDirection)
      ) {
        continue
      }

      pedestrian.state = 'insideBus'
      pedestrian.path = []
      pedestrian.pathIndex = 0

      bus.passengerIds.push(pedestrian.id)
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
