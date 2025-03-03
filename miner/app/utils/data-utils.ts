import { 
  BLOCK_TYPES, PICKAXE_TYPES, BACKPACK_TYPES, BLOCK_SIZE, 
  PLAYER_HEIGHT, PLAYER_WIDTH, MACHINE_INTERACTION_DISTANCE 
} from '../constants'
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
  
  const distX = Math.abs(player.x - PLAYER_WIDTH/4 - x)
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
    if (player.inventory + blockData.density > player.backpackCapacity) {
      return false
    }
    if (findAvailableSlot(player, blockType) === -1) {
      return false
    }
    return true
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
  const emptySlot = player.inventorySlots.findIndex(slot => slot.blockType === null)
  
  // Return -1 if no slot is available (all slots are full with different items)
  return emptySlot;
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

export function findNearbyBlock(player: Player, blockCategory: string, blocks: Block[]): Block | null {

  for (const block of blocks) {
    const blockData = getBlockData(block.blockType)
    if (blockData.category === blockCategory && !block.isMined) {
      if (distanceToBlock(player, block.x, block.y) <= MACHINE_INTERACTION_DISTANCE) {
        if (block.isSecondaryBlock) {
          const mainBlock = blocks.find(b => b.x === block.mainBlockX && b.y === block.mainBlockY)
          if (mainBlock) {
            return mainBlock
          }
        }
        return block
      }
    }
  }
  return null
}

// Helper function to get all secondary blocks of a machine
export function getSecondaryBlocks(mainBlock: Block, blocks: Block[]): Block[] {
  return blocks.filter(b => 
    !b.isMined && 
    b.isSecondaryBlock && 
    b.mainBlockX === mainBlock.x && 
    b.mainBlockY === mainBlock.y
  );
}

export function getMainBlock(block: Block, blocks: Block[]): Block | Block {
  if (block.isSecondaryBlock) {
    const mainBlock = blocks.find(b => b.x === block.mainBlockX && b.y === block.mainBlockY)
    if (mainBlock) {
      return mainBlock
    }
  }
  return block
}

export function isRefinable(blockType: number): boolean {
  return getBlockData(blockType).category === 'block'
}
export function isClimbable(blockType: number): boolean {
  return getBlockData(blockType).climbable
}
export function isSolid(blockType: number): boolean {
  return getBlockData(blockType).solid
}

export function clamp(value: number, min: number, max: number): number{
  return Math.max(Math.min(value, max), min)
}




