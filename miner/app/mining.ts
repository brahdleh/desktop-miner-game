import { Player, Block } from './types'
import { 
  DEFAULT_MINE_TIME, 
  BLOCK_SIZE,
  PICKAXE_BASE_COST, 
  PICKAXE_COST_MULTIPLIER,
  BACKPACK_BASE_COST, 
  BACKPACK_COST_MULTIPLIER,
  BASE_BACKPACK_CAPACITY, 
  BACKPACK_CAPACITY_INCREMENT,
  DENSE_BLOCK_TIME_MULTIPLIER,
  BLOCK_TYPES
} from './constants'

export function handleMining(
  player: Player, 
  miningTargetBlock: Block | null,
  miningProgress: number,
  updateHUD: () => void
): { miningProgress: number; miningTargetBlock: Block | null } {
  if (!miningTargetBlock) {
    return { miningProgress, miningTargetBlock }
  }

  // Stop mining if inventory becomes full
  if (player.inventory >= player.backpackCapacity) {
    return { miningProgress: 0, miningTargetBlock: null }
  }

  miningProgress += 16.67 // approximate per frame at ~60fps
  
  // Calculate required time based on block type
  const baseTime = DEFAULT_MINE_TIME / player.pickaxeLevel
  const blockData = Object.values(BLOCK_TYPES)[miningTargetBlock.blockType]
  const requiredTime = baseTime * blockData.miningTimeMultiplier
  
  if (miningProgress >= requiredTime) {
    miningTargetBlock.isMined = true
    if (player.inventory < player.backpackCapacity) {
      player.inventory++
      player.blockInventory[miningTargetBlock.blockType]++
    }
    updateHUD()
    return { miningProgress: 0, miningTargetBlock: null }
  }

  return { miningProgress, miningTargetBlock }
}

export function attemptSell(player: Player, updateHUD: () => void) {
  const selectedBlockCount = player.blockInventory[player.selectedSlot]
  if (selectedBlockCount > 0) {
    const blockData = Object.values(BLOCK_TYPES)[player.selectedSlot]
    player.gold += selectedBlockCount * blockData.value
    
    player.inventory -= selectedBlockCount
    player.blockInventory[player.selectedSlot] = 0
    
    updateHUD()
  }
}

export function attemptPickaxeUpgrade(player: Player, updateHUD: () => void) {
  const cost = PICKAXE_BASE_COST * Math.pow(PICKAXE_COST_MULTIPLIER, player.pickaxeLevel - 1)
  if (player.gold >= cost) {
    player.gold -= cost
    player.pickaxeLevel += 1
    updateHUD()
  }
}

export function attemptBackpackUpgrade(player: Player, updateHUD: () => void) {
  const cost = BACKPACK_BASE_COST * Math.pow(BACKPACK_COST_MULTIPLIER, player.backpackLevel - 1)
  if (player.gold >= cost) {
    player.gold -= cost
    player.backpackLevel += 1
    player.backpackCapacity = BASE_BACKPACK_CAPACITY + (player.backpackLevel - 1) * BACKPACK_CAPACITY_INCREMENT
    updateHUD()
  }
}

export function canMineBlock(
  block: Block,
  clickX: number,
  clickY: number,
  player: Player
): boolean {
  // Check if inventory is full
  if (player.inventory >= player.backpackCapacity) return false
  
  if (block.isMined || !block.mineable) return false

  const isClickInBlock = 
    clickX >= block.x &&
    clickX < block.x + BLOCK_SIZE &&
    clickY >= block.y &&
    clickY < block.y + BLOCK_SIZE

  if (!isClickInBlock) return false

  // Distance check from player
  const distX = Math.abs((player.x + BLOCK_SIZE / 2) - (block.x + BLOCK_SIZE / 2))
  const distY = Math.abs((player.y + BLOCK_SIZE / 2) - (block.y + BLOCK_SIZE / 2))
  
  return distX <= BLOCK_SIZE * 2 && distY <= BLOCK_SIZE * 2
}

export function attemptPlaceBlock(
  player: Player,
  blocks: Block[],
  clickX: number,
  clickY: number,
  updateHUD: () => void
): boolean {
  // Check if player has blocks to place
  if (player.blockInventory[player.selectedSlot] <= 0) return false

  // Calculate grid position
  const gridX = Math.floor(clickX / BLOCK_SIZE) * BLOCK_SIZE
  const gridY = Math.floor(clickY / BLOCK_SIZE) * BLOCK_SIZE

  // Check if position is valid (was previously mined)
  const existingBlock = blocks.find(b => 
    b.x === gridX && 
    b.y === gridY && 
    b.isMined && 
    b.mineable
  )

  if (!existingBlock) return false

  // Check if player is too far
  const distX = Math.abs((player.x + BLOCK_SIZE/2) - (gridX + BLOCK_SIZE/2))
  const distY = Math.abs((player.y + BLOCK_SIZE/2) - (gridY + BLOCK_SIZE/2))
  if (distX > BLOCK_SIZE * 2 || distY > BLOCK_SIZE * 2) return false

  // Place the block with the correct block type
  existingBlock.isMined = false
  existingBlock.blockType = player.selectedSlot  // Set block type to match inventory slot
  player.blockInventory[player.selectedSlot]--
  player.inventory--
  updateHUD()
  return true
} 