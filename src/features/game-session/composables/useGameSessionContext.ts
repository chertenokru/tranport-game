import { inject, type InjectionKey, provide } from 'vue'

import type { GameSession } from '@/features/game-session/model/GameSession'

const gameSessionKey: InjectionKey<GameSession> = Symbol('game-session')

export function provideGameSession(session: GameSession): void {
  provide(gameSessionKey, session)
}

export function useGameSessionContext(): GameSession {
  const session = inject(gameSessionKey)

  if (!session) {
    throw new Error('GameSession is not provided. Use this composable inside GameView.')
  }

  return session
}
