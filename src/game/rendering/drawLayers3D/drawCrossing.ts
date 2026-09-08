import type { PedestrianCrossing } from '@/game/domain/PedestrianCrossing'
import { PedestrianSignalColor } from '@/game/domain/PedestrianCrossing'
import { IsometricCamera } from '../isometric/IsometricCamera'
import { getPedestrianSignal } from '@/game/tools/getPedestrianSignal'
import { localToWorld } from '@/game/tools/geometry'
import type { Context } from './shared3D'
import { COLORS } from './shared3D'
import { drawSignal } from './drawSignal'
import { drawFlatRect } from './drawFlatRect'

export function drawCrossing(
  context: Context,
  camera: IsometricCamera,
  crossing: Readonly<PedestrianCrossing>,
  elapsedSeconds: number,
): void {
  const signal = getPedestrianSignal(crossing, elapsedSeconds)
  const stripeColor = signal?.color === PedestrianSignalColor.Green ? '#d9f4e2' : COLORS.white
  for (
    let offset = -crossing.roadWidth / 2 + 5;
    offset <= crossing.roadWidth / 2 - 5;
    offset += 7
  ) {
    const center = localToWorld({ x: offset, y: 0 }, crossing.position, crossing.direction)
    // noinspection JSSuspiciousNameCombination
    drawFlatRect(
      context,
      camera,
      center,
      // noinspection JSSuspiciousNameCombination
      { x: 3.8, y: crossing.width },
      crossing.direction,
      stripeColor,
      3,
    )
  }

  if (!signal) return
  const lightColor = {
    [PedestrianSignalColor.Green]: '#37d67a',
    [PedestrianSignalColor.Yellow]: '#ffc857',
    [PedestrianSignalColor.Red]: '#ff5c65',
  }[signal.color]
  for (const side of [-1, 1]) {
    const position = localToWorld(
      { x: side * (crossing.roadWidth / 2 + 6), y: 0 },
      crossing.position,
      crossing.direction,
    )
    drawSignal(context, camera, position, lightColor)
  }
}
