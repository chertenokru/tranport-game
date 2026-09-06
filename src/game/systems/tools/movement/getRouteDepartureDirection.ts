export function getRouteDepartureDirection(
  currentStopIndex: number,
  currentDirection: 1 | -1,
  stopCount: number,
): 1 | -1 {
  const nextStopIndex = currentStopIndex + currentDirection

  if (nextStopIndex < 0 || nextStopIndex >= stopCount) {
    return currentDirection === 1 ? -1 : 1
  }

  return currentDirection
}
