import type { Bus } from '@/game/domain/Bus'
import { IsometricCamera } from '../isometric/IsometricCamera'
import { getVehicleBounds } from '@/game/tools/getVehicleBounds'
import type { Context } from './shared3D'
import { COLORS } from './shared3D'
import { wallPanel } from './wallPanel'
import { drawBox } from './drawBox'
import { drawSoftShadow } from './drawSoftShadow'
import { rectCorners } from './rectCorners'
import { getVisibleEdges } from './getVisibleEdges'
import { fillPolygon } from './fillPolygon'
import { strokePolygon } from './strokePolygon'
import { drawCountBadge } from './drawCountBadge'

export function drawBus(context: Context, camera: IsometricCamera, bus: Readonly<Bus>): void {
  const bounds = getVehicleBounds(bus)
  const center = bounds.position
  // noinspection JSSuspiciousNameCombination
  const size = { x: bus.size.y, y: bus.size.x }
  drawSoftShadow(context, camera, center, size, bus.direction, 15)
  drawBox(context, camera, center, size, bus.direction, 15, {
    roof: '#eef3ef',
    left: COLORS.cyan,
    right: COLORS.cyanDark,
    accent: '#d8f3f1',
    glass: '#183d46',
  })

  const visibleEdges = getVisibleEdges(camera, center, rectCorners(center, size, bus.direction))
  for (const [windowStart, windowEnd] of visibleEdges) {
    const length = Math.hypot(windowEnd.x - windowStart.x, windowEnd.y - windowStart.y)
    const windows = Math.max(2, Math.floor(length / 7))
    for (let i = 0; i < windows; i++) {
      wallPanel(
        context,
        camera,
        windowStart,
        windowEnd,
        (i + 0.08) / windows,
        (i + 0.92) / windows,
        7,
        13,
        '#1c3842',
      )
      wallPanel(
        context,
        camera,
        windowStart,
        windowEnd,
        (i + 0.16) / windows,
        (i + 0.85) / windows,
        10,
        12.5,
        '#709aab',
      )
    }
    wallPanel(context, camera, windowStart, windowEnd, 0, 1, 4, 5, '#d4e8e2')
    for (const t of [0.22, 0.78]) {
      const wheel = Array.from({ length: 16 }, (_, i) => {
        const a = (i * Math.PI) / 8
        const u = t + (Math.cos(a) * 3) / length
        return camera.project(
          {
            x: windowStart.x + (windowEnd.x - windowStart.x) * u,
            y: windowStart.y + (windowEnd.y - windowStart.y) * u,
          },
          3 + Math.sin(a) * 3,
        )
      })
      fillPolygon(context, wheel, '#202a2c')
      strokePolygon(context, wheel, '#717d7b', 0.7)
    }
  }
  drawBox(
    context,
    camera,
    center,
    { x: size.x * 0.55, y: size.y * 0.35 },
    bus.direction,
    2,
    { roof: '#b8c9c5', left: '#748d8b', right: '#607978', accent: '', glass: '' },
    15,
  )

  const badge = camera.project(center, 28)
  drawCountBadge(context, badge, bus.passengerIds.length, bus.collisionCount)
}
