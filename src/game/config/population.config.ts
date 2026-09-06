export interface PopulationConfig {
  readonly cycleIntervalSeconds: number
  readonly maxResidents: number
  readonly groupProbability: number
  readonly minGroupSize: number
  readonly maxGroupSize: number
  readonly retentionProbability: number
}

export const POPULATION_CONFIG = {
  cycleIntervalSeconds: 8,
  maxResidents: 100,
  groupProbability: 0.6,
  minGroupSize: 5,
  maxGroupSize: 15,
  retentionProbability: 0.35,
} as const satisfies PopulationConfig
