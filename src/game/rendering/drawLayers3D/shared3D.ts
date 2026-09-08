import { BuildingType } from '@/game/domain/Building'

export type Context = CanvasRenderingContext2D

export interface Palette {
  readonly roof: string
  readonly left: string
  readonly right: string
  readonly accent: string
  readonly glass: string
}

export interface Renderable {
  readonly depth: number
  draw(): void
}

export const COLORS = {
  skyTop: '#dfe8e8',
  skyBottom: '#f5f1e9',
  ground: '#d8ddd5',
  groundEdge: '#aeb8af',
  lawn: '#9bad87',
  lawnDark: '#78906f',
  pavement: '#d8d8d2',
  pavementEdge: '#aab0ac',
  asphalt: '#39464b',
  asphaltLight: '#4c5a5f',
  lane: '#e8eee9',
  cyan: '#1ba7b5',
  cyanDark: '#08727d',
  ink: '#14272c',
  white: '#f7faf7',
} as const

export const BUILDING_PALETTES: Record<BuildingType, Palette> = {
  [BuildingType.Residential]: {
    roof: '#e8e4da',
    left: '#c7c0b2',
    right: '#b1aa9d',
    accent: '#aa7a43',
    glass: '#50808a',
  },
  [BuildingType.Office]: {
    roof: '#d8dddc',
    left: '#8f9b9c',
    right: '#728083',
    accent: '#2b8f9b',
    glass: '#315f69',
  },
  [BuildingType.Shop]: {
    roof: '#e5e1d6',
    left: '#b9b6aa',
    right: '#9b9d93',
    accent: '#1ba7b5',
    glass: '#2d6872',
  },
}
