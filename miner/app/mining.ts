import { Player, Block } from './types'
import { 
  DEFAULT_MINE_TIME, BLOCK_SIZE, MAX_BACKPACK_LEVEL, MAX_PICKAXE_LEVEL,
  REFINABLE_BLOCKS, REFINING_TIME
} from './constants'
import { 
  updatePickaxePower, getPickaxeUpgradeCost, getBackpackUpgradeCost, updateBackpackCapacity
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
    player.gold += blockData.value * selectedBlockCount
    removeFromInventory(player, selectedBlockType, selectedBlockCount)
  }
}

export function attemptBuy(player: Player, blockType: number) {
  const itemData = getBlockData(blockType)
  if (player.gold >= itemData.value && player.inventory < player.backpackCapacity) {
    buyBlock(player, blockType)
  }
}

export function attemptPickaxeUpgrade(player: Player) {
  // Check if already at max level
  if (player.pickaxeLevel >= MAX_PICKAXE_LEVEL) return

  const cost = getPickaxeUpgradeCost(player)
  
  if (player.gold >= cost) {
    player.gold -= cost
    player.pickaxeLevel += 1
    updatePickaxePower(player)
  }
}

export function attemptBackpackUpgrade(player: Player) {
  // Check if already at max level
  if (player.backpackLevel >= MAX_BACKPACK_LEVEL) return

  const cost = getBackpackUpgradeCost(player)
  
  if (player.gold >= cost) {
    player.gold -= cost
    player.backpackLevel += 1
    updateBackpackCapacity(player)
  }
}

export function canMineBlock(
  block: Block,
  clickX: number,
  clickY: number,
  player: Player,
): boolean {
  // Check if inventory is full
  if (!canHoldBlock(player, block.blockType)) return false

  // Check if secondary block or already mined
  //if (block.isSecondaryBlock) return false
  if (block.isMined || !block.mineable) return false

  const isClickInBlock = 
    clickX >= block.x &&
    clickX < block.x + BLOCK_SIZE &&
    clickY >= block.y &&
    clickY < block.y + BLOCK_SIZE

  if (!isClickInBlock) return false

  // Distance check from player
  return distanceToBlock(player, block.x, block.y) <= BLOCK_SIZE * 1.8
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

export function attemptCraftRefiner(player: Player) {
  const itemData = getBlockData(14) // Refiner block type
  if (itemData.requirements) {
    const { blockType, amount } = itemData.requirements
    if (getBlockInventory(player, blockType) < amount) return false
    
    // Consume materials
    removeFromInventory(player, blockType, amount)
    // add item
    addToInventory(player, 14)    
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
    player.pickaxeLevel = 1  // Reset level when upgrading type
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
    player.backpackLevel = 1  // Reset level when upgrading type

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

export function attemptDepositInRefiner(player: Player, blocks: Block[]) {
  const refiner = findNearbyRefiner(player, blocks)
  if (!refiner) return false

  const selectedBlockType = getSelectedBlockType(player)
  if (selectedBlockType === null) return false
  const selectedBlockCount = getBlockInventory(player, selectedBlockType)
  if (selectedBlockCount <= 0) return false

  // Check if the selected block is refinable
  if (!isRefinable(selectedBlockType)) return false

  // Initialize machine state if needed
  if (!refiner.machineState) {
    refiner.machineState = {
      processingBlockType: null,
      processingStartTime: null,
      isFinished: false
    }
  }

  // Check if refiner is already processing
  if (refiner.machineState.processingBlockType !== null) return false

  // Start processing
  refiner.machineState.processingBlockType = selectedBlockType
  refiner.machineState.processingStartTime = Date.now()
  refiner.machineState.isFinished = false

  // Remove block from inventory
  removeFromInventory(player, selectedBlockType, 1)

  return true
}

export function attemptCollectFromRefiner(player: Player, blocks: Block[]) {
  const refiner = findNearbyRefiner(player, blocks)
  if (!refiner || !refiner.machineState?.processingBlockType) return false

  // Check what block is output and that it exists
  const inputBlockType = refiner.machineState.processingBlockType
  const outputBlockType = REFINABLE_BLOCKS[inputBlockType as keyof typeof REFINABLE_BLOCKS]
  if (!outputBlockType) return false

  // Check if inventory has space assuming density does not change
  if (!canHoldBlock(player, outputBlockType)) return false

  // If refining is incomplete return original block
  const elapsedTime = Date.now() - (refiner.machineState.processingStartTime || 0)
  if (elapsedTime < REFINING_TIME) {
    addToInventory(player, inputBlockType)
  } else {
    // Add refined block to inventory
    addToInventory(player, outputBlockType)
  }

  // Reset machine state
  refiner.machineState.processingBlockType = null
  refiner.machineState.processingStartTime = null
  refiner.machineState.isFinished = false

  return true
}
