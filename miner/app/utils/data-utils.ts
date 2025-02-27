import { BLOCK_TYPES, PICKAXE_TYPES, BACKPACK_TYPES, BLOCK_SIZE, REFINABLE_BLOCKS, BLOCK_ID_TO_TYPE, PLAYER_HEIGHT, PLAYER_WIDTH, MACHINE_INTERACTION_DISTANCE } from '../constants'
import { Block, Player, BlockData } from '../types'

export function getBlockData(blockType: number): BlockData {
  return Object.values(BLOCK_TYPES)[blockType] as BlockData
}

export function getGridPosition(x: number, y: number): [number, number] {
  return [
    Math.floor(x / BLOCK_SIZE) * BLOCK_SIZE,
    Math.floor(y / BLOCK_SIZE) * BLOCK_SIZE
  ]
}

export function distanceToBlock(player: Player, x: number, y: number): number {
  
  const distX = Math.abs(player.x - x)
  const distYHead = Math.abs(player.y - y)
  const distYCore = Math.abs(player.y + PLAYER_HEIGHT/2 - y)
  
  return Math.min(
    Math.sqrt(distX * distX + distYHead * distYHead),
    Math.sqrt(distX * distX + distYCore * distYCore)
  )
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

export function getBlockInventory(player: Player, blockType: number): number {
  const slotIndex = player.inventorySlots.findIndex(
    slot => slot.blockType === blockType && slot.count > 0
  )
  
  if (slotIndex === -1) return 0
  return player.inventorySlots[slotIndex].count
}
export function getSelectedBlockType(player: Player): number | null {
  const slot = player.inventorySlots[player.selectedSlot];
  // Explicitly check if blockType is null, rather than falsy
  return slot.blockType === null ? null : slot.blockType;
}

function findAvailableSlot(player: Player, blockType: number): number {
  // First try to find an existing stack of the same block type
  const existingSlot = player.inventorySlots.findIndex(
    slot => slot.blockType === blockType && slot.count > 0
  )
  if (existingSlot !== -1) return existingSlot

  // Then try to find an empty slot
  return player.inventorySlots.findIndex(slot => slot.blockType === null)
}

export function addToInventory(player: Player, blockType: number): boolean {
  // First check if we can hold this block
  if (!canHoldBlock(player, blockType)) return false
  
  const slotIndex = findAvailableSlot(player, blockType)
  if (slotIndex === -1) return false // No available slots

  const slot = player.inventorySlots[slotIndex]
  if (slot.blockType === null) {
    // Initialize empty slot
    player.inventorySlots[slotIndex] = {
      blockType,
      count: 1
    }
  } else {
    // Add to existing stack
    slot.count++
  }
  
  player.inventory += getBlockData(blockType).density
  return true
}
export function removeFromInventory(player: Player, blockType: number, count: number): boolean {
  const slotIndex = player.inventorySlots.findIndex(
    slot => slot.blockType === blockType && slot.count > 0
  )
  
  if (slotIndex === -1) return false

  const slot = player.inventorySlots[slotIndex]
  slot.count -= count
  player.inventory -= getBlockData(blockType).density * count

  // Clear the slot if it's empty
  if (slot.count === 0) {
    player.inventorySlots[slotIndex] = { blockType: null, count: 0 }
  }

  return true
}

export function buyBlock(player: Player, blockType: number): void {
  const blockData = getBlockData(blockType)
  if (player.gold >= blockData.value && canHoldBlock(player, blockType)) {
    player.gold -= blockData.value
    addToInventory(player, blockType)
  }
}

export function findNearbyBlock(player: Player, blockType: number, blocks: Block[]): Block | null {

  for (const block of blocks) {
    if (block.blockType === blockType && !block.isMined) {
      if (distanceToBlock(player, block.x, block.y) <= MACHINE_INTERACTION_DISTANCE) {
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

export function clamp(value: number, min: number, max: number): number{
  return Math.max(Math.min(value, max), min)
}




