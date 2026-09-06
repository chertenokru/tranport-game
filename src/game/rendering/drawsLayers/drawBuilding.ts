import { type Building, BuildingType } from '@/game/domain/Building'
import { getDirectionAngle } from '@/game/tools/geometry.ts'

const BUILDING_COLORS: Record<BuildingType, { body: string; text: string }> = {
  [BuildingType.Residential]: {
    body: '#f59e0b',
    text: '#0f172a',
  },
  [BuildingType.Office]: {
    body: '#64748b',
    text: '#f8fafc',
  },
  [BuildingType.Shop]: {
    body: '#8b5cf6',
    text: '#f8fafc',
  },
}
export function drawBuilding(
  context: CanvasRenderingContext2D,
  building: Readonly<Building>,
  residentsCount: number,
): void {
  const { position, size, direction } = building
  const colors = BUILDING_COLORS[building.type]
  const angle = getDirectionAngle(direction)
  context.save()

  try {
    context.translate(position.x, position.y)
    context.rotate(angle)

    context.fillStyle = colors.body
    context.fillRect(-size.x / 2, -size.y / 2, size.x, size.y)

    // В исходной ориентации дверь расположена снизу.
    context.fillStyle = '#1e293b'
    context.fillRect(-8, size.y / 2 - 10, 16, 10)

    // Название и счётчик остаются горизонтальными.
    context.rotate(-angle)

    context.fillStyle = colors.text
    context.textAlign = 'center'
    context.textBaseline = 'middle'

    context.font = '16px sans-serif'
    context.fillText(building.name, 0, -8)

    context.font = 'bold 11px sans-serif'
    context.fillText(`×${residentsCount}`, 0, 14)
  } finally {
    context.restore()
  }
}
