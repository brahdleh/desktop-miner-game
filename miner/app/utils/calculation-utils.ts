import { 
    PICKAXE_MINE_INCREMENT, PICKAXE_BASE_COST, PICKAXE_COST_MULTIPLIER,
    BACKPACK_BASE_COST, BACKPACK_COST_MULTIPLIER,
    BACKPACK_CAPACITY_INCREMENT
} from '../constants'
import { getPickaxeData, getBackpackData } from './data-utils'
import { Player } from '../types'

export function updatePickaxePower(player: Player): void {
  const pickaxeData = getPickaxeData(player.pickaxeType)
  const power = pickaxeData.miningTimeMultiplier * Math.pow(PICKAXE_MINE_INCREMENT, player.pickaxeLevel - 1)
  player.pickaxePower = power
}

export function updateBackpackCapacity(player: Player): void {
  const backpackData = getBackpackData(player.backpackType)
  const capacity = backpackData.capacity * Math.pow(BACKPACK_CAPACITY_INCREMENT, player.backpackLevel - 1)
  player.backpackCapacity = capacity
}

export function getPickaxeUpgradeCost(player: Player): number {
  const pickaxeData = getPickaxeData(player.pickaxeType)
  const baseCost = PICKAXE_BASE_COST * pickaxeData.upgradeCostMultiplier
  const cost = baseCost * Math.pow(PICKAXE_COST_MULTIPLIER, player.pickaxeLevel - 1)
  return cost
}

export function getBackpackUpgradeCost(player: Player): number {
  const backpackData = getBackpackData(player.backpackType)
  const baseCost = BACKPACK_BASE_COST * backpackData.upgradeCostMultiplier
  const cost = baseCost * Math.pow(BACKPACK_COST_MULTIPLIER, player.backpackLevel - 1)
  return cost
}







