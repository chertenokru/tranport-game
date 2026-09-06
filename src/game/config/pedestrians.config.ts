export interface PedestrianTypeConfig {
  readonly walkingSpeed: number
  readonly radius: number
  readonly busTimeAdvantageFactor: number
}

export const PEDESTRIANS_CONFIG = {
  default: {
    walkingSpeed: 40,
    radius: 6,
    busTimeAdvantageFactor: 0.9,
  },
} as const satisfies Record<string, PedestrianTypeConfig>
