import type { Resident } from '@/game/domain/Resident'
import {
  type TransportDecision,
  TransportDecisionReason,
  TransportMode,
} from '@/game/domain/TransportDecision'
import type { CanvasFrame } from '../CanvasLayer'

export function drawDecisionIndicator(
  { context, width }: CanvasFrame,
  resident: Readonly<Resident>,
  decision: TransportDecision,
  remainingTimeMs: number,
): void {
  if (remainingTimeMs <= 0) {
    return
  }

  const walkingLabel = decision.walkingTime.toFixed(1)
  const busLabel = decision.busTime === null ? '—' : decision.busTime.toFixed(1)

  const busSelected = decision.selectedMode === TransportMode.Bus
  const selectedIcon = busSelected ? '🚌' : '🚶'
  const otherIcon = busSelected ? '🚶' : '🚌'
  const selectedTime = busSelected ? busLabel : walkingLabel
  const otherTime = busSelected ? walkingLabel : busLabel
  const label = `${selectedIcon} ${selectedTime} (${otherIcon} ${otherTime})`

  context.save()

  try {
    context.font = '10px sans-serif'

    const horizontalPadding = 8
    const indicatorHeight = 20
    const indicatorWidth = context.measureText(label).width + horizontalPadding

    const desiredX = resident.position.x - indicatorWidth / 2
    const indicatorX = Math.max(4, Math.min(desiredX, width - indicatorWidth - 4))
    const indicatorY = resident.position.y - resident.radius - indicatorHeight - 10

    const unavailable =
      decision.reason === TransportDecisionReason.NoBusAvailable ||
      decision.reason === TransportDecisionReason.TransitUnavailable

    context.globalAlpha *= Math.min(1, remainingTimeMs / 500)
    context.strokeStyle = unavailable ? '#ef4444' : busSelected ? '#2563eb' : '#f59e0b'
    context.lineWidth = 2
    context.setLineDash([])

    context.beginPath()
    context.moveTo(resident.position.x, resident.position.y - resident.radius)
    context.lineTo(indicatorX + indicatorWidth / 2, indicatorY + indicatorHeight)
    context.stroke()

    context.beginPath()
    context.roundRect(indicatorX, indicatorY, indicatorWidth, indicatorHeight, 6)

    context.fillStyle = 'rgb(192 192 195 / 0.92)'
    context.fill()
    context.stroke()

    context.fillStyle = '#000000'
    context.textAlign = 'center'
    context.textBaseline = 'middle'
    context.fillText(label, indicatorX + indicatorWidth / 2, indicatorY + indicatorHeight / 2)
  } finally {
    context.restore()
  }
}
