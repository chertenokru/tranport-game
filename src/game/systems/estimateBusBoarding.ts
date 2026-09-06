import { BusState, type Bus } from '@/game/domain/Bus'

import { calculateRemainingPathDistance } from './movement/calculateRemainingPathDistance'
import { getRouteDepartureDirection } from '@/game/systems/movement/getRouteDepartureDirection.ts'

export interface BusBoardingInput {
  readonly bus: Bus
  readonly routeStopCount: number
  readonly boardingStopIndex: number
  readonly destinationStopIndex: number
  readonly passengerArrivalTime: number
  readonly legDistances: readonly number[]
}

export interface BusBoardingEstimate {
  readonly waitingTime: number
  readonly remainingStopTime: number
}

export function estimateBusBoarding(input: BusBoardingInput): BusBoardingEstimate | null {
  const {
    bus,
    routeStopCount,
    boardingStopIndex,
    destinationStopIndex,
    passengerArrivalTime,
    legDistances,
  } = input

  if (
    routeStopCount < 2 ||
    legDistances.length !== routeStopCount - 1 ||
    boardingStopIndex < 0 ||
    boardingStopIndex >= routeStopCount ||
    destinationStopIndex < 0 ||
    destinationStopIndex >= routeStopCount ||
    passengerArrivalTime < 0 ||
    bus.speed <= 0
  ) {
    throw new RangeError('Invalid bus waiting time input')
  }

  const roundTripDistance = legDistances.reduce((total, distance) => total + distance, 0) * 2

  const roundTripTime =
    roundTripDistance / bus.speed + bus.stopWaitSeconds * (routeStopCount - 1) * 2

  if (roundTripTime <= 0) {
    return null
  }

  let elapsedTime = 0
  let stopIndex = bus.currentStopIndex
  let direction = bus.direction

  const getBoardingEstimateAtStop = (
    arrivalTime: number,
    departureTime: number,
  ): BusBoardingEstimate | null => {
    if (stopIndex !== boardingStopIndex) {
      return null
    }

    const departureDirection = getRouteDepartureDirection(stopIndex, direction, routeStopCount)

    const destinationIsAhead = (destinationStopIndex - boardingStopIndex) * departureDirection > 0

    if (!destinationIsAhead || passengerArrivalTime > departureTime) {
      return null
    }

    const boardingTime = Math.max(passengerArrivalTime, arrivalTime)

    return {
      waitingTime: boardingTime - passengerArrivalTime,
      remainingStopTime: departureTime - boardingTime,
    }
  }

  if (bus.state === BusState.WaitingAtStop) {
    const boardingEstimate = getBoardingEstimateAtStop(0, bus.waitingSecondsRemaining)

    if (boardingEstimate) {
      return boardingEstimate
    }

    elapsedTime = bus.waitingSecondsRemaining
  } else {
    const nextStopIndex = stopIndex + direction

    if (nextStopIndex < 0 || nextStopIndex >= routeStopCount) {
      return null
    }

    elapsedTime =
      calculateRemainingPathDistance({
        position: bus.position,
        path: bus.path,
        pathIndex: bus.pathIndex,
      }) / bus.speed

    stopIndex = nextStopIndex

    const boardingEstimate = getBoardingEstimateAtStop(
      elapsedTime,
      elapsedTime + bus.stopWaitSeconds,
    )

    if (boardingEstimate) {
      return boardingEstimate
    }

    elapsedTime += bus.stopWaitSeconds
  }

  const forecastEndTime = passengerArrivalTime + roundTripTime

  while (elapsedTime <= forecastEndTime) {
    direction = getRouteDepartureDirection(stopIndex, direction, routeStopCount)

    const nextStopIndex = stopIndex + direction
    const legDistance = legDistances[Math.min(stopIndex, nextStopIndex)]

    if (legDistance === undefined) {
      return null
    }

    elapsedTime += legDistance / bus.speed
    stopIndex = nextStopIndex

    const boardingEstimate = getBoardingEstimateAtStop(
      elapsedTime,
      elapsedTime + bus.stopWaitSeconds,
    )

    if (boardingEstimate) {
      return boardingEstimate
    }

    elapsedTime += bus.stopWaitSeconds
  }

  return null
}
