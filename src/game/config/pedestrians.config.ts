export interface PedestrianTypeConfig {
  readonly walkingSpeed: number
  readonly radius: number
}

export const PEDESTRIANS_CONFIG = {
  default: {
    walkingSpeed: 40,
    radius: 6,
  },
} as const satisfies Record<string, PedestrianTypeConfig>
