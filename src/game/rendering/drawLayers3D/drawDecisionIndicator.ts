import type { Resident } from '@/game/domain/Resident'
import { TransportDecisionReason } from '@/game/domain/TransportDecision'
import { TransportMode } from '@/game/domain/TransportDecision'
import { IsometricCamera } from '../isometric/IsometricCamera'
import type { Context } from './shared3D'
import { COLORS } from './shared3D'

export function drawDecisionIndicator(
  context: Context,
  camera: IsometricCamera,
  resident: Readonly<Resident>,
  decision: Resident['transportDecision'] & {},
  remainingTimeMs: number,
  canvasWidth: number,
): void {
  if (remainingTimeMs <= 0) return
  const walking = decision.walkingTime.toFixed(1)
  const bus = decision.busTime === null ? '—' : decision.busTime.toFixed(1)
  const selectedBus = decision.selectedMode === TransportMode.Bus
  const label = selectedBus ? `BUS ${bus}  ·  WALK ${walking}` : `WALK ${walking}  ·  BUS ${bus}`
  const unavailable =
    decision.reason === TransportDecisionReason.NoBusAvailable ||
    decision.reason === TransportDecisionReason.TransitUnavailable
  const anchor = camera.project(resident.position, 27)

  context.save()
  context.globalAlpha = Math.min(1, remainingTimeMs / 500)
  context.font = '600 10px Inter, system-ui, sans-serif'
  const width = context.measureText(label).width + 16
  const x = Math.max(8, Math.min(anchor.x - width / 2, canvasWidth - width - 8))
  const y = anchor.y - 30
  context.fillStyle = 'rgb(247 250 247 / 0.94)'
  context.strokeStyle = unavailable ? '#d6404b' : selectedBus ? COLORS.cyan : '#c58b3a'
  context.lineWidth = 1.5
  context.beginPath()
  context.roundRect(x, y, width, 22, 7)
  context.fill()
  context.stroke()
  context.fillStyle = COLORS.ink
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.fillText(label, x + width / 2, y + 11)
  context.restore()
}
