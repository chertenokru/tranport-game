import { defineStore } from 'pinia'
import { ref } from 'vue'
import { GAME_CONFIG } from '@/game/config/game.config.ts'
import type { GameSessionSnapshot } from '@/features/game-session/model/GameSession.ts'

export type GameStatus = 'idle' | 'running' | 'paused' | 'finished'

export const useGameSessionStore = defineStore('GameSession', () => {
  const status = ref<GameStatus>('idle')
  const money = ref<number>(GAME_CONFIG.economy.startingMoney)
  const activeBuses = ref(0)
  const activePedestrians = ref(0)
  const accidents = ref(0)
  const elapsedTimeSeconds = ref(0)
  const deliveredPassengers = ref(0)

  function start() {
    status.value = 'running'
    money.value = GAME_CONFIG.economy.startingMoney
    activeBuses.value = 0
    activePedestrians.value = 0
    accidents.value = 0
    elapsedTimeSeconds.value = 0
    deliveredPassengers.value = 0
  }

  function togglePause() {
    if (status.value === 'running') {
      status.value = 'paused'
      return
    }

    if (status.value === 'paused') {
      status.value = 'running'
    }
  }

  function applySnapshot(snapshot: Readonly<GameSessionSnapshot>) {
    elapsedTimeSeconds.value = snapshot.elapsedTimeSeconds
    money.value = snapshot.money
    deliveredPassengers.value = snapshot.deliveredPassengers
    accidents.value = snapshot.accidents
    activeBuses.value = snapshot.activeBuses
    activePedestrians.value = snapshot.activePedestrians
  }

  return {
    status,
    money,
    activeBuses,
    activePedestrians,
    accidents,
    elapsedTimeSeconds,
    deliveredPassengers,
    start,
    togglePause,
    applySnapshot,
  }
})
