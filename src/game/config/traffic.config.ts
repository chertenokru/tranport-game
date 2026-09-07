export interface TrafficConfig {
  /** Clearance between vehicle bodies, and before an occupied zone. */
  readonly minimumGap: number
}

export const TRAFFIC_CONFIG = {
  minimumGap: 5,
} as const satisfies TrafficConfig
