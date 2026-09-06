import { BusState, type Bus } from '@/game/domain/Bus'
import type { BusId, RouteId } from '@/game/domain/ids'

import { estimateBusBoarding } from './estimateBusBoarding.ts'

export interface BestBusOptionInput {
  readonly buses: readonly Bus[]
  readonly routeId: RouteId
  readonly boardingStopIndex: number
  readonly destinationStopIndex: number
  readonly passengerArrivalTime: number
  readonly legDistances: readonly number[]
}

export interface BusTravelOption {
  readonly busId: BusId
  readonly waitingTime: number
  readonly boardingStopTime: number
  readonly movementTime: number
  readonly intermediateStopTime: number
  readonly busTravelTime: number
  readonly totalTimeAfterReachingStop: number
}

export function findBestBusOption(input: BestBusOptionInput): BusTravelOption | null {
  const routeStopCount = input.legDistances.length + 1

  if (
    input.boardingStopIndex < 0 ||
    input.boardingStopIndex >= routeStopCount ||
    input.destinationStopIndex < 0 ||
    input.destinationStopIndex >= routeStopCount ||
    input.boardingStopIndex === input.destinationStopIndex
  ) {
    throw new RangeError('Invalid bus journey stop indexes')
  }

  const firstLegIndex = Math.min(input.boardingStopIndex, input.destinationStopIndex)

  const lastLegIndex = Math.max(input.boardingStopIndex, input.destinationStopIndex)

  const busTravelDistance = input.legDistances
    .slice(firstLegIndex, lastLegIndex)
    .reduce((total, distance) => total + distance, 0)

  const intermediateStopCount = Math.max(
    0,
    Math.abs(input.destinationStopIndex - input.boardingStopIndex) - 1,
  )

  let bestOption: BusTravelOption | null = null

  for (const bus of input.buses) {
    if (bus.routeId !== input.routeId) {
      continue
    }

    if (
      bus.currentStopIndex === input.boardingStopIndex &&
      bus.state === BusState.WaitingAtStop &&
      bus.passengerIds.length === bus.capacity
    ) {
      continue
    }

    const boardingEstimate = estimateBusBoarding({
      bus,
      routeStopCount,
      boardingStopIndex: input.boardingStopIndex,
      destinationStopIndex: input.destinationStopIndex,
      passengerArrivalTime: input.passengerArrivalTime,
      legDistances: input.legDistances,
    })

    if (!boardingEstimate) {
      continue
    }

    const movementTime = busTravelDistance / bus.speed
    const intermediateStopTime = intermediateStopCount * bus.stopWaitSeconds
    const busTravelTime = boardingEstimate.remainingStopTime + movementTime + intermediateStopTime
    const totalTimeAfterReachingStop = boardingEstimate.waitingTime + busTravelTime

    if (!bestOption || totalTimeAfterReachingStop < bestOption.totalTimeAfterReachingStop) {
      bestOption = {
        busId: bus.id,
        waitingTime: boardingEstimate.waitingTime,
        boardingStopTime: boardingEstimate.remainingStopTime,
        movementTime,
        intermediateStopTime,
        busTravelTime,
        totalTimeAfterReachingStop,
      }
    }
  }

  return bestOption
}
