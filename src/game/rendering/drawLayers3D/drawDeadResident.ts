import type { Resident } from '@/game/domain/Resident'
import { IsometricCamera } from '../isometric/IsometricCamera'
import type { Context } from './shared3D'

export function drawDeadResident(
  context: Context,
  camera: IsometricCamera,
  resident: Readonly<Resident>,
): void {
  const point = camera.project(resident.position, 3)
  context.strokeStyle = '#d6404b'
  context.lineWidth = 3
  context.lineCap = 'round'
  context.beginPath()
  context.moveTo(point.x - 6, point.y - 6)
  context.lineTo(point.x + 6, point.y + 6)
  context.moveTo(point.x + 6, point.y - 6)
  context.lineTo(point.x - 6, point.y + 6)
  context.stroke()
}
