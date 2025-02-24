import { 
    PICKAXE_MINE_INCREMENT, PROFICIENCY_BASE_COST, PROFICIENCY_COST_MULTIPLIER,
    STRENGTH_BASE_COST, STRENGTH_COST_MULTIPLIER,
    BACKPACK_CAPACITY_INCREMENT
} from '../constants'
import { getPickaxeData, getBackpackData } from './data-utils'
import { Player } from '../types'

export function updatePickaxePower(player: Player): void {
  const pickaxeData = getPickaxeData(player.pickaxeType)
  const power = pickaxeData.miningTimeMultiplier * Math.pow(PICKAXE_MINE_INCREMENT, player.proficiency - 1)
  player.pickaxePower = power
}

export function updateBackpackCapacity(player: Player): void {
  const backpackData = getBackpackData(player.backpackType)
  const capacity = backpackData.capacity * Math.pow(BACKPACK_CAPACITY_INCREMENT, player.strength - 1)
  player.backpackCapacity = capacity
}

export function getProficiencyUpgradeCost(player: Player): number {
  const cost = PROFICIENCY_BASE_COST * Math.pow(PROFICIENCY_COST_MULTIPLIER, player.proficiency - 1)
  return cost
}

export function getStrengthUpgradeCost(player: Player): number {
  const cost = STRENGTH_BASE_COST * Math.pow(STRENGTH_COST_MULTIPLIER, player.strength - 1)
  return cost
}







