import { BLOCK_TYPES, PICKAXE_TYPES, BACKPACK_TYPES, BLOCK_SIZE, REFINABLE_BLOCKS, BLOCK_ID_TO_TYPE } from '../constants'
import { Block, Player } from '../types'

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

export function gainBlock(player: Player, blockType: number): void {
  const blockData = getBlockData(blockType)
  player.blockInventory[blockType] ++
  player.inventory += blockData.density
}

export function buyBlock(player: Player, blockType: number): void {
  const blockData = getBlockData(blockType)
  if (player.gold >= blockData.value && canHoldBlock(player, blockType)) {
    player.gold -= blockData.value
    gainBlock(player, blockType)
  }
}

export function removeBlock(player: Player, blockType: number, count: number): void {
  const blockData = getBlockData(blockType)
  player.blockInventory[blockType] -= count
  player.inventory -= blockData.density * count
}

export function findNearbyBlock(player: Player, blockType: number, blocks: Block[]): Block | null {
  const playerCenterX = player.x + BLOCK_SIZE / 2
  const playerBottom = player.y + BLOCK_SIZE

  for (const block of blocks) {
    if (block.blockType === blockType && !block.isMined) {
      const distX = Math.abs((block.x + BLOCK_SIZE / 2) - playerCenterX)
      const distY = Math.abs((block.y) - playerBottom)
      
      if (distX <= BLOCK_SIZE && distY <= BLOCK_SIZE) {
        return block
      }
    }
  }
  return null
}

export function isRefinable(blockType: number): boolean {
  return REFINABLE_BLOCKS[blockType as keyof typeof REFINABLE_BLOCKS] !== undefined
}
export function isClimbable(blockType: number): boolean {
  return BLOCK_TYPES[BLOCK_ID_TO_TYPE[blockType]].climbable
}
export function isSolid(blockType: number): boolean {
  return BLOCK_TYPES[BLOCK_ID_TO_TYPE[blockType]].solid
}




