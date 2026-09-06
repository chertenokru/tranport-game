import { defineStore } from 'pinia'
import { ref } from 'vue'
import { GAME_CONFIG } from '@/game/config/game.config.ts'
import type { GameSessionSnapshot } from '@/features/game-session/model/GameSession.ts'

export enum GameStatus {
  Idle = 'idle',
  Running = 'running',
  Paused = 'paused',
  Finished = 'finished',
}

export const useGameSessionStore = defineStore('GameSession', () => {
  const status = ref<GameStatus>(GameStatus.Idle)
  const money = ref<number>(GAME_CONFIG.economy.startingMoney)
  const activeBuses = ref(0)
  const totalResidents = ref(0)
  const idleResidents = ref(0)
  const accidents = ref(0)
  const elapsedTimeSeconds = ref(0)
  const deliveredPassengers = ref(0)

  function start() {
    status.value = GameStatus.Running
    money.value = GAME_CONFIG.economy.startingMoney
    activeBuses.value = 0
    totalResidents.value = 0
    idleResidents.value = 0
    accidents.value = 0
    elapsedTimeSeconds.value = 0
    deliveredPassengers.value = 0
  }

  function togglePause() {
    if (status.value === GameStatus.Running) {
      status.value = GameStatus.Paused
      return
    }

    if (status.value === GameStatus.Paused) {
      status.value = GameStatus.Running
    }
  }

  function applySnapshot(snapshot: Readonly<GameSessionSnapshot>) {
    elapsedTimeSeconds.value = snapshot.elapsedTimeSeconds
    money.value = snapshot.money
    deliveredPassengers.value = snapshot.deliveredPassengers
    accidents.value = snapshot.accidents
    activeBuses.value = snapshot.activeBuses
    totalResidents.value = snapshot.totalResidents
    idleResidents.value = snapshot.idleResidents
  }

  return {
    status,
    money,
    activeBuses,
    totalResidents,
    idleResidents,
    accidents,
    elapsedTimeSeconds,
    deliveredPassengers,
    start,
    togglePause,
    applySnapshot,
  }
})
