export interface PopulationConfig {
  readonly cycleIntervalSeconds: number
  readonly maxResidents: number
  readonly groupProbability: number
  readonly minGroupSize: number
  readonly maxGroupSize: number
  readonly retentionProbability: number
}

export const POPULATION_CONFIG = {
  cycleIntervalSeconds: 4,
  maxResidents: 200,
  groupProbability: 0.9,
  minGroupSize: 5,
  maxGroupSize: 30,
  retentionProbability: 0.5,
} as const satisfies PopulationConfig
