import { 
    PICKAXE_MINE_INCREMENT, PROFICIENCY_BASE_COST, PROFICIENCY_COST_MULTIPLIER,
    STRENGTH_BASE_COST, STRENGTH_COST_MULTIPLIER,
    BACKPACK_CAPACITY_INCREMENT
} from '../constants'
import { getPickaxeData, getBackpackData, getBlockData } from './data-utils'
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

export function getRefiningTime(refinerType: number, blockType: number): number {
  // Map refiner types to their base processing rates
  const refinerRates: {[key: number]: number} = {
    14: 20000, // Stone refiner
    22: 5000, // Copper refiner
    23: 1000,  // Iron refiner
    24: 200,  // Gold refiner
    25: 40    // Diamond refiner
  };
  
  const refinerRate = refinerRates[refinerType] || 30000; // Default to stone refiner rate
  const blockData = getBlockData(blockType);
  return refinerRate * Math.pow(blockData.miningTimeMultiplier, 0.8);
}







