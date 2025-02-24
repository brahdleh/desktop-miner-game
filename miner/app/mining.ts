import { Player, Block } from './types'
import { 
  DEFAULT_MINE_TIME, BLOCK_SIZE, MAX_PROFICIENCY_LEVEL, MAX_STRENGTH_LEVEL,
  REFINABLE_BLOCKS, REFINING_TIME
} from './constants'
import { 
  updatePickaxePower, getProficiencyUpgradeCost, getStrengthUpgradeCost, updateBackpackCapacity
} from './utils/calculation-utils'
import { 
  getBlockData, getPickaxeData, getBackpackData, 
  canHoldBlock, getBlockInventory, buyBlock, removeFromInventory,
  findNearbyBlock, isRefinable, addToInventory, getSelectedBlockType,
  getGridPosition,
  distanceToBlock
} from './utils/data-utils'
import { mineBlock, placeBlock } from './utils/mine-utils';


export function handleMining(
  player: Player, 
  miningTargetBlock: Block | null,
  miningProgress: number,
  blocks: Block[]
): { miningProgress: number; miningTargetBlock: Block | null; requiredTime?: number } {
  if (!miningTargetBlock) {
    return { miningProgress, miningTargetBlock }
  }
  const blockData = getBlockData(miningTargetBlock.blockType)

  miningProgress += 16.67 // approximate per frame at ~60fps
  
  // Calculate required time based on block type
  const baseTime = DEFAULT_MINE_TIME / player.pickaxePower
  const requiredTime = baseTime * blockData.miningTimeMultiplier
  
  if (miningProgress >= requiredTime) {
    // Check if inventory is full based on block density
    if (canHoldBlock(player, miningTargetBlock.blockType)) {
      addToInventory(player, miningTargetBlock.blockType)
      mineBlock(miningTargetBlock, blocks)
    }

    return { miningProgress: 0, miningTargetBlock: null }
  }

  return { miningProgress, miningTargetBlock, requiredTime }
}

export function attemptSell(player: Player) {
  const selectedBlockType = getSelectedBlockType(player)
  if (selectedBlockType === null) return
  const selectedBlockCount = getBlockInventory(player, selectedBlockType)
  if (selectedBlockCount > 0) {
    const blockData = getBlockData(selectedBlockType)
    player.gold += blockData.value
    removeFromInventory(player, selectedBlockType, 1)
  }
}

export function attemptBuy(player: Player, blockType: number): { success: boolean; reason?: string } {
  const itemData = getBlockData(blockType)
  if (player.gold < itemData.value) {
    return { success: false, reason: "Not enough gold!" }
  }
  if (player.inventory >= player.backpackCapacity) {
    return { success: false, reason: "Inventory Full!" }
  }
  
  buyBlock(player, blockType)
  return { success: true }
}

export function attemptProficiencyUpgrade(player: Player) {
  // Check if already at max level
  if (player.proficiency >= MAX_PROFICIENCY_LEVEL) return

  const cost = getProficiencyUpgradeCost(player)
  
  if (player.gold >= cost) {
    player.gold -= cost
    player.proficiency += 1
    updatePickaxePower(player)
  }
}

export function attemptStrengthUpgrade(player: Player) {
  // Check if already at max level
  if (player.strength >= MAX_STRENGTH_LEVEL) return

  const cost = getStrengthUpgradeCost(player)
  
  if (player.gold >= cost) {
    player.gold -= cost
    player.strength += 1
    updateBackpackCapacity(player)
  }
}

export function canMineBlock(
  block: Block,
  clickX: number,
  clickY: number,
  player: Player,
): { canMine: boolean; reason?: string } {
  
  // Check if already mined
  if (block.isMined || !block.mineable) {
    return { canMine: false }
  }

  const isClickInBlock = 
    clickX >= block.x &&
    clickX < block.x + BLOCK_SIZE &&
    clickY >= block.y &&
    clickY < block.y + BLOCK_SIZE

  if (!isClickInBlock) {
    return { canMine: false }
  }

  // Distance check from player
  if (distanceToBlock(player, block.x, block.y) > BLOCK_SIZE * 1.8) {
    return { canMine: false }
  }

  // Check if inventory is full
  const canHold = canHoldBlock(player, block.blockType)
  return { 
    canMine: canHold, 
    reason: canHold ? undefined : "Not Enough Inventory!" 
  }
}

export function attemptPlaceBlock(
  player: Player,
  blocks: Block[],
  clickX: number,
  clickY: number
): boolean {
  const selectedBlockType = getSelectedBlockType(player)
  if (selectedBlockType === null) return false
  if (getBlockInventory(player, selectedBlockType) <= 0) return false

  const grid = getGridPosition(clickX, clickY)

  // Distance check
  if (distanceToBlock(player, grid[0], grid[1]) > BLOCK_SIZE * 3) return false

  // PlaceBlock checks for space
  if (placeBlock(player, blocks, grid[0], grid[1])) {
    removeFromInventory(player, selectedBlockType, 1)
    return true
  }
  return false
}

export function attemptCraft(player: Player, blockType: number) {
  const itemData = getBlockData(blockType) // Refiner block type
  if (itemData.requirements) {
    const { blockType, amount } = itemData.requirements
    if (getBlockInventory(player, blockType) < amount) return false
    
    // Consume materials
    removeFromInventory(player, blockType, amount)
    // add item
    addToInventory(player, blockType)    
    return true
  }
  return false
}

export function attemptCraftPickaxe(player: Player) {
  // Get next pickaxe type
  const nextPickaxeType = player.pickaxeType + 1
  const nextPickaxe = getPickaxeData(nextPickaxeType)
  if (!nextPickaxe) return false
  
  // Check requirements
  if (nextPickaxe.requirements) {
    const { blockType, amount } = nextPickaxe.requirements
    if (getBlockInventory(player, blockType) < amount) return false
    
    // Consume materials
    removeFromInventory(player, blockType, amount)
    
    // Upgrade pickaxe
    player.pickaxeType = nextPickaxeType
    updatePickaxePower(player)
    
    return true
  }
  
  return false
}

export function attemptCraftBackpack(player: Player) {
  // Get next backpack type
  const nextBackpackType = player.backpackType + 1
  const nextBackpack = getBackpackData(nextBackpackType)
  if (!nextBackpack) return false
  
  // Check requirements
  if (nextBackpack.requirements) {
    const { blockType, amount } = nextBackpack.requirements
    if (getBlockInventory(player, blockType) < amount) return false
    
    // Consume materials
    removeFromInventory(player, blockType, amount)
    
    // Upgrade backpack
    player.backpackType = nextBackpackType

    // Update backpack capacity
    updateBackpackCapacity(player)
    
    return true
  }

  return false
}

export function findNearbyRefiner(player: Player, blocks: Block[]): Block | null {
  const refiner = findNearbyBlock(player, 14, blocks)
  if (!refiner) return null
  if (refiner.isSecondaryBlock) {
    const mainBlock = blocks.find(b => b.x === refiner.mainBlockX && b.y === refiner.mainBlockY)
    if (!mainBlock) return null
    return mainBlock
  }
  return refiner
}

export function attemptDepositInRefiner(player: Player, blocks: Block[]): { success: boolean; reason?: string } {
  const refiner = findNearbyRefiner(player, blocks)
  if (!refiner) return { success: false, reason: "No refiner nearby!" }

  const selectedBlockType = getSelectedBlockType(player)
  if (selectedBlockType === null) return { success: false, reason: "No block selected!" }
  
  const selectedBlockCount = getBlockInventory(player, selectedBlockType)
  if (selectedBlockCount <= 0) return { success: false, reason: "No block selected!" }

  if (!isRefinable(selectedBlockType)) return { success: false, reason: "Block cannot be refined!" }

  // Initialize machine state if needed
  if (!refiner.machineState) {
    refiner.machineState = {
      processingBlockType: null,
      processingStartTime: null,
      isFinished: false
    }
  }

  if (refiner.machineState.processingBlockType !== null) {
    return { success: false, reason: "Refiner is busy!" }
  }

  // Start processing
  refiner.machineState.processingBlockType = selectedBlockType
  refiner.machineState.processingStartTime = Date.now()
  refiner.machineState.isFinished = false

  removeFromInventory(player, selectedBlockType, 1)
  return { success: true }
}

export function attemptCollectFromRefiner(player: Player, blocks: Block[]): { success: boolean; reason?: string } {
  const refiner = findNearbyRefiner(player, blocks)
  if (!refiner) return { success: false, reason: "No refiner nearby!" }
  
  if (!refiner.machineState?.processingBlockType) {
    return { success: false, reason: "Nothing to collect!" }
  }

  const inputBlockType = refiner.machineState.processingBlockType
  const outputBlockType = REFINABLE_BLOCKS[inputBlockType as keyof typeof REFINABLE_BLOCKS]
  if (!outputBlockType) return { success: false, reason: "Block Error??!" }

  if (!canHoldBlock(player, outputBlockType)) {
    return { success: false, reason: "Not Enough Inventory!" }
  }

  const elapsedTime = Date.now() - (refiner.machineState.processingStartTime || 0)
  if (elapsedTime < REFINING_TIME) {
    addToInventory(player, inputBlockType)
  } else {
    addToInventory(player, outputBlockType)
  }

  // Reset machine state
  refiner.machineState.processingBlockType = null
  refiner.machineState.processingStartTime = null
  refiner.machineState.isFinished = false

  return { success: true }
}
