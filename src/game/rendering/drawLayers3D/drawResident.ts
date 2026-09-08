import type { Resident } from '@/game/domain/Resident'
import { IsometricCamera } from '../isometric/IsometricCamera'
import type { Context } from './shared3D'
import { drawCountBubble } from './drawCountBubble'

export function drawResident(
  context: Context,
  camera: IsometricCamera,
  resident: Readonly<Resident>,
  count: number,
): void {
  const foot = camera.project(resident.position, 1)
  const body = camera.project(resident.position, 10)
  const head = camera.project(resident.position, 18)
  context.fillStyle = 'rgb(20 39 44 / 0.25)'
  context.beginPath()
  context.ellipse(foot.x + 2, foot.y + 2, 5 * camera.scale, 2.5 * camera.scale, 0, 0, Math.PI * 2)
  context.fill()
  context.strokeStyle = '#126d72'
  context.lineWidth = Math.max(2, 4 * camera.scale)
  context.lineCap = 'round'
  context.beginPath()
  context.moveTo(foot.x, foot.y)
  context.lineTo(body.x, body.y)
  context.stroke()
  context.fillStyle = '#f0b28c'
  context.beginPath()
  context.arc(head.x, head.y, Math.max(2.6, 3.5 * camera.scale), 0, Math.PI * 2)
  context.fill()
  if (count > 1) drawCountBubble(context, { x: head.x + 9, y: head.y - 3 }, count)
}
