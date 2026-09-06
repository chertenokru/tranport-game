import { type Building, BuildingType } from '@/game/domain/Building'

export function drawBuilding(
  context: CanvasRenderingContext2D,
  building: Readonly<Building>,
  residentsCount: number,
): void {
  context.save()

  try {
    const residential = building.type === BuildingType.Residential
    const { position, size } = building

    context.fillStyle = residential ? '#f59e0b' : '#64748b'
    context.fillRect(position.x, position.y, size.x, size.y)

    context.fillStyle = '#f8fafc'
    context.font = '16px sans-serif'
    context.textAlign = 'center'
    context.textBaseline = 'middle'

    context.fillText(building.name, position.x + size.x / 2, position.y + size.y / 2)

    context.fillStyle = residential ? '#0f172a' : '#f8fafc'
    context.font = 'bold 11px sans-serif'
    context.textAlign = 'left'

    context.fillText(`×${residentsCount}`, position.x + 10, position.y + 15)
  } finally {
    context.restore()
  }
}
