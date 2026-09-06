import type { Resident } from '@/game/domain/Resident.ts'
import type { TransportDecision } from '@/game/domain/TransportDecision.ts'

const INDICATOR_DURATION_MS = 4_000

interface DecisionIndicator {
  readonly decision: TransportDecision
  readonly expiresAt: number
}

export class DecisionIndicators {
  private readonly indicators = new WeakMap<Resident, DecisionIndicator>()

  update(residents: Iterable<Resident>, timeMs: number): void {
    for (const resident of residents) {
      const decision = resident.transportDecision

      if (!decision) {
        this.indicators.delete(resident)
        continue
      }

      const current = this.indicators.get(resident)

      if (!current || current.decision !== decision) {
        this.indicators.set(resident, {
          decision,
          expiresAt: timeMs + INDICATOR_DURATION_MS,
        })
      }
    }
  }

  get(resident: Resident): DecisionIndicator | undefined {
    return this.indicators.get(resident)
  }
}
