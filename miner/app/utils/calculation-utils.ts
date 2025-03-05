import { 
    PICKAXE_MINE_INCREMENT, PROFICIENCY_BASE_COST, PROFICIENCY_COST_MULTIPLIER,
    STRENGTH_BASE_COST, STRENGTH_COST_MULTIPLIER,
    BACKPACK_CAPACITY_INCREMENT
} from '../constants'
import { getPickaxeData, getBackpackData, getBlockData } from './data-utils'
import { Player } from '../types'

export function updatePickaxePower(player: Player): void {
  const pickaxeData = getPickaxeData(player.pickaxeType)
  // Proficiency multipler power of 1.5 each time
  const proficiencyMultiplier = Math.pow(PICKAXE_MINE_INCREMENT, player.proficiency - 1)
  const power = pickaxeData.miningTimeMultiplier * proficiencyMultiplier
  player.pickaxePower = power
}

export function updateBackpackCapacity(player: Player): void {
  const backpackData = getBackpackData(player.backpackType)
  // Strength multipler is geometric sum of 5 + 10 + 20 + 40...
  const strengthMultiplier = 5 * (Math.pow(BACKPACK_CAPACITY_INCREMENT, player.strength - 1) - 1) / (BACKPACK_CAPACITY_INCREMENT - 1)
  const capacity = backpackData.capacity + strengthMultiplier
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

export function getLadderSpeed(ladderType: number): number {
  // map ladder speeds to the ladder type
  const ladderSpeeds: {[key: number]: number} = {
    11: 1, // Ladder
    26: 2, // Stone ladder
    27: 4, // Slate ladder
    28: 8, // Magma ladder
    29: 16 // Bedrock ladder
  }

  return ladderSpeeds[ladderType] || 1
}




