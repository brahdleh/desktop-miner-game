import { Player, Block } from './types'
import { 
  DEFAULT_MINE_TIME, 
  BLOCK_SIZE,
  PICKAXE_BASE_COST, 
  PICKAXE_COST_MULTIPLIER,
  PICKAXE_MINE_INCREMENT,
  BACKPACK_BASE_COST, 
  BACKPACK_COST_MULTIPLIER,
  BACKPACK_CAPACITY_INCREMENT,
  BLOCK_TYPES,
  PICKAXE_TYPES,
  BACKPACK_TYPES,
  MAX_BACKPACK_LEVEL,
  MAX_PICKAXE_LEVEL
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
  const pickaxeData = Object.values(PICKAXE_TYPES)[player.pickaxeType]
  const pickaxeBoost = pickaxeData.miningTimeMultiplier * Math.pow(PICKAXE_MINE_INCREMENT, player.pickaxeLevel - 1)
  const baseTime = DEFAULT_MINE_TIME / pickaxeBoost
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
  // Check if already at max level
  if (player.pickaxeLevel >= MAX_PICKAXE_LEVEL) return

  const cost = PICKAXE_BASE_COST * Math.pow(PICKAXE_COST_MULTIPLIER, player.pickaxeLevel - 1)
  if (player.gold >= cost) {
    player.gold -= cost
    player.pickaxeLevel += 1
    updateHUD()
  }
}

export function attemptBackpackUpgrade(player: Player, updateHUD: () => void) {
  // Check if already at max level
  if (player.backpackLevel >= MAX_BACKPACK_LEVEL) return

  const cost = BACKPACK_BASE_COST * Math.pow(BACKPACK_COST_MULTIPLIER, player.backpackLevel - 1)
  if (player.gold >= cost) {
    player.gold -= cost
    player.backpackLevel += 1
    const backpackData = Object.values(BACKPACK_TYPES)[player.backpackType]
    player.backpackCapacity = backpackData.capacity * Math.pow(BACKPACK_CAPACITY_INCREMENT, player.backpackLevel - 1)
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

export function attemptCraftPickaxe(player: Player, updateHUD: () => void): boolean {
  // Get next pickaxe type
  const nextPickaxeType = player.pickaxeType + 1
  const nextPickaxe = Object.values(PICKAXE_TYPES)[nextPickaxeType]
  
  // Check if next pickaxe exists
  if (!nextPickaxe) return false
  
  // Check requirements
  if (nextPickaxe.requirements) {
    const { blockType, amount } = nextPickaxe.requirements
    if (player.blockInventory[blockType] < amount) return false
    
    // Consume materials
    player.blockInventory[blockType] -= amount
    player.inventory -= amount
    
    // Upgrade pickaxe
    player.pickaxeType = nextPickaxeType
    player.pickaxeLevel = 1  // Reset level when upgrading type
    
    updateHUD()
    return true
  }
  
  return false
}

export function attemptCraftBackpack(player: Player, updateHUD: () => void): boolean {
  // Get next backpack type
  const nextBackpackType = player.backpackType + 1
  const nextBackpack = Object.values(BACKPACK_TYPES)[nextBackpackType]
  
  // Check if next backpack exists
  if (!nextBackpack) return false
  
  // Check requirements
  if (nextBackpack.requirements) {
    const { blockType, amount } = nextBackpack.requirements
    if (player.blockInventory[blockType] < amount) return false
    
    // Consume materials
    player.blockInventory[blockType] -= amount
    player.inventory -= amount 
    
    // Upgrade backpack
    player.backpackType = nextBackpackType
    player.backpackLevel = 1  // Reset level when upgrading type

    // Update backpack capacity
    const backpackData = Object.values(BACKPACK_TYPES)[player.backpackType]
    player.backpackCapacity = backpackData.capacity * Math.pow(BACKPACK_CAPACITY_INCREMENT, player.backpackLevel - 1)
    
    updateHUD()
    return true

  }

  return false
}
