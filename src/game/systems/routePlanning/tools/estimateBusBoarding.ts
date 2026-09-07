import { type Bus, BusState } from '@/game/domain/Bus'
import type { BusRoute } from '@/game/domain/BusRoute'
import { calculateRemainingPathDistance } from '@/game/systems/tools/movement/calculateRemainingPathDistance'

export interface BusBoardingInput {
  readonly bus: Bus
  readonly route: BusRoute
  readonly boardingStopIndex: number
  readonly passengerArrivalTime: number
}

export interface BusBoardingEstimate {
  readonly waitingTime: number
  readonly remainingStopTime: number
}

export function estimateBusBoarding({
  bus,
  route,
  boardingStopIndex,
  passengerArrivalTime,
}: BusBoardingInput): BusBoardingEstimate | null {
  const count = route.legs.length
  if (
    count < 2 ||
    bus.routeId !== route.id ||
    !Number.isInteger(bus.legIndex) ||
    !route.legs[bus.legIndex] ||
    !Number.isInteger(boardingStopIndex) ||
    !route.legs[boardingStopIndex] ||
    !Number.isFinite(passengerArrivalTime) ||
    passengerArrivalTime < 0 ||
    !Number.isFinite(bus.speed) ||
    bus.speed <= 0 ||
    !Number.isFinite(bus.stopWaitSeconds) ||
    bus.stopWaitSeconds < 0 ||
    !Number.isFinite(bus.waitingSecondsRemaining) ||
    bus.waitingSecondsRemaining < 0
  ) {
    throw new RangeError('Invalid bus waiting time input')
  }

  const cycleTime =
    route.legs.reduce((sum, leg) => sum + leg.distance, 0) / bus.speed + count * bus.stopWaitSeconds
  if (cycleTime <= 0) return null

  let legIndex = bus.legIndex
  let arrivalTime = 0
  let stopTime = bus.waitingSecondsRemaining

  if (bus.state === BusState.Moving) {
    arrivalTime =
      calculateRemainingPathDistance({
        position: bus.position,
        path: route.legs[legIndex]!.path,
        pathIndex: bus.pathIndex,
      }) / bus.speed
    legIndex = (legIndex + 1) % count
    stopTime = bus.stopWaitSeconds
  }

  // До ближайшего прибытия на выбранную остановку.
  while (legIndex !== boardingStopIndex) {
    arrivalTime += stopTime + route.legs[legIndex]!.distance / bus.speed
    legIndex = (legIndex + 1) % count
    stopTime = bus.stopWaitSeconds
  }

  let departureTime = arrivalTime + stopTime
  if (passengerArrivalTime > departureTime) {
    const cycles = Math.ceil((passengerArrivalTime - departureTime) / cycleTime)
    departureTime += cycles * cycleTime
    arrivalTime = departureTime - bus.stopWaitSeconds
  }

  const boardingTime = Math.max(passengerArrivalTime, arrivalTime)
  return {
    waitingTime: boardingTime - passengerArrivalTime,
    remainingStopTime: departureTime - boardingTime,
  }
}
