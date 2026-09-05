import { GAME_CONFIG } from '@/game/config/game.config'

export class GameWorld {
  money: number = GAME_CONFIG.economy.startingMoney
  deliveredPassengers = 0
  accidents = 0

  reset(): void {
    this.money = GAME_CONFIG.economy.startingMoney
    this.deliveredPassengers = 0
    this.accidents = 0
  }
}
