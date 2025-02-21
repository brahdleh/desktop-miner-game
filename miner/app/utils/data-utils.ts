import { BLOCK_TYPES, PICKAXE_TYPES, BACKPACK_TYPES } from '../constants'
import { Player } from '../types'

export function getBlockData(blockType: number) {
  return Object.values(BLOCK_TYPES)[blockType]
}

export function getPickaxeData(pickaxeType: number) {
  return Object.values(PICKAXE_TYPES)[pickaxeType]
}

export function getBackpackData(backpackType: number) {
  return Object.values(BACKPACK_TYPES)[backpackType]
}

export function canHoldBlock(player: Player, blockType: number): boolean {
    const blockData = getBlockData(blockType)
    return player.inventory + blockData.density <= player.backpackCapacity
}

export function getBlockInventory(player: Player): number {
  return player.blockInventory[player.selectedSlot]
}

export function buyBlock(player: Player, blockType: number): void {
  const blockData = getBlockData(blockType)
  if (player.gold >= blockData.value && canHoldBlock(player, blockType)) {
    player.gold -= blockData.value
    player.blockInventory[blockType] ++
    player.inventory += blockData.density
  }
}





