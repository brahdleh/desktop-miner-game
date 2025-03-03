import { Player, Block } from './types'
import { 
  DEFAULT_MINE_TIME, BLOCK_SIZE, MAX_PROFICIENCY_LEVEL, MAX_STRENGTH_LEVEL,
  REFINABLE_BLOCKS,
} from './constants'
import { 
  updatePickaxePower, getProficiencyUpgradeCost, getStrengthUpgradeCost, updateBackpackCapacity,
  getRefiningTime
} from './utils/calculation-utils'
import { 
  getBlockData, getPickaxeData, getBackpackData, 
  canHoldBlock, getBlockInventory, buyBlock, removeFromInventory,
  findNearbyBlock, isRefinable, addToInventory, getSelectedBlockType,
  getGridPosition,
  distanceToBlock,
} from './utils/data-utils'
import { mineBlock, placeBlock, blockInReach } from './utils/mine-utils';
import { 
  depositItemIntoStorage, collectItemFromStorage
} from './utils/machinery-utils'
import { MACHINE_STORAGE_LIMIT } from './constants'


export function canMineBlock(
  block: Block,
  clickX: number,
  clickY: number,
  player: Player,
): { canMine: boolean; reason?: string } {
  
  if (!blockInReach(player, block, clickX, clickY)) {
    return { canMine: false }
  }

  // Check if already mined
  if (block.isMined || !block.mineable) {
    return { canMine: false }
  }

  // Check if this is a storage block with items
  if (['collector', 'chest'].includes(getBlockData(block.blockType).category) &&
      block.storageState &&
      block.storageState.storedBlocks.length > 0) {
    return { 
      canMine: false, 
      reason: "Empty storage before mining!" 
    }
  }

  // Check if inventory is full
  const canHold = canHoldBlock(player, block.blockType)
  return { 
    canMine: canHold, 
    reason: canHold ? undefined : "Not Enough Inventory!" 
  }
}


export function handleMining(
  player: Player, 
  miningTargetBlock: Block | null,
  miningProgress: number,
  blocks: Block[]
): { miningProgress: number; miningTargetBlock: Block | null; requiredTime?: number; success?: boolean; message?: string } {
  
  if (!miningTargetBlock) {
    return { miningProgress, miningTargetBlock }
  }
  const blockData = getBlockData(miningTargetBlock.blockType)

  miningProgress += 16.67 // approximate per frame at ~60fps
  
  // Calculate required time based on block type and player's pickaxe power
  const baseTime = DEFAULT_MINE_TIME / player.pickaxePower
  const requiredTime = baseTime * blockData.miningTimeMultiplier
  
  if (miningProgress >= requiredTime) {
    // Check if inventory is full based on block density
    if (canHoldBlock(player, miningTargetBlock.blockType)) {
      addToInventory(player, miningTargetBlock.blockType)
      mineBlock(miningTargetBlock, blocks)
      return { miningProgress: 0, miningTargetBlock: null, requiredTime, success: true }
    }

    // Mining failed due to full inventory
    return { miningProgress: 0, miningTargetBlock: null, requiredTime, success: false }
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

export function attemptProficiencyUpgrade(player: Player): boolean {
  // Check if already at max level
  if (player.proficiency >= MAX_PROFICIENCY_LEVEL) return false

  const cost = getProficiencyUpgradeCost(player)
  
  if (player.gold >= cost) {
    player.gold -= cost
    player.proficiency += 1
    updatePickaxePower(player)
    return true
  }
  return false
}

export function attemptStrengthUpgrade(player: Player): boolean {
  // Check if already at max level
  if (player.strength >= MAX_STRENGTH_LEVEL) return false

  const cost = getStrengthUpgradeCost(player)
  
  if (player.gold >= cost) {
    player.gold -= cost
    player.strength += 1
    updateBackpackCapacity(player)
    return true
  }
  return false
}


export function attemptPlaceBlock(
  player: Player,
  blocks: Block[],
  clickX: number,
  clickY: number
): { canPlace: boolean; reason?: string } {
  const selectedBlockType = getSelectedBlockType(player)
  if (selectedBlockType === null) return { canPlace: false, reason: "No block selected!"}
  if (getBlockInventory(player, selectedBlockType) <= 0) return { canPlace: false, reason: "No block selected!" }

  const grid = getGridPosition(clickX, clickY)

  // Distance check
  if (distanceToBlock(player, grid[0], grid[1]) > BLOCK_SIZE * 3) return { canPlace: false }

  // PlaceBlock checks for space
  if (placeBlock(player, blocks, grid[0], grid[1])) {
    removeFromInventory(player, selectedBlockType, 1)
    return { canPlace: true }
  }
  return { canPlace: false }
}

export function attemptCraft(player: Player, blockType: number) {
  const itemData = getBlockData(blockType) // Refiner block type
  if (itemData.requirements) {
    const { blockType: requiredBlockType, amount, base } = itemData.requirements
    
    // Check for required materials
    if (getBlockInventory(player, requiredBlockType) < amount) return false
    
    // Check if this is an upgrade that requires a base item
    if (base !== undefined && getBlockInventory(player, base) < 1) {
      return false
    }
    
    // Consume materials
    removeFromInventory(player, requiredBlockType, amount)
    
    // If there's a base item, remove it from inventory
    if (base !== undefined) {
      removeFromInventory(player, base, 1)
    }
    
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

export function attemptDepositInStorage(player: Player, blocks: Block[]): { success: boolean; reason?: string } {
  // Check for nearby storage blocks (excluding refiners which have special handling)
  const storageBlock = findNearbyBlock(player, 'collector', blocks) || 
                       findNearbyBlock(player, 'chest', blocks);
  
  if (!storageBlock) {
    return { success: false, reason: "No storage nearby!" };
  }
  
  // Use the helper function with appropriate storage limit
  const storageLimit = storageBlock && 
                      getBlockData(storageBlock.blockType).category === 'collector' ? 
                      MACHINE_STORAGE_LIMIT : Infinity;
                      
  return depositItemIntoStorage(player, storageBlock);
}

export function attemptCollectFromStorage(player: Player, blocks: Block[]): { success: boolean; reason?: string } {
  // Check for nearby storage blocks (excluding refiners which have special handling)
  const storageBlock = findNearbyBlock(player, 'collector', blocks) || 
                       findNearbyBlock(player, 'chest', blocks);
  
  if (!storageBlock) {
    return { success: false, reason: "No storage nearby!" };
  }
  
  return collectItemFromStorage(player, storageBlock);
}

// Simplified refiner deposit function - refiners need special handling due to processing
export function attemptDepositInRefiner(player: Player, blocks: Block[]): { success: boolean; reason?: string } {
  const refiner = findNearbyBlock(player, 'refiner', blocks);
  if (!refiner) return { success: false, reason: "No refiner nearby!" };

  const selectedBlockType = getSelectedBlockType(player);
  if (selectedBlockType === null) return { success: false, reason: "No block selected!" };
  
  const selectedBlockCount = getBlockInventory(player, selectedBlockType);
  if (selectedBlockCount <= 0) return { success: false, reason: "No block selected!" };

  if (!isRefinable(selectedBlockType)) return { success: false, reason: "Block cannot be refined!" };

  // Initialize machine state if needed
  if (!refiner.machineState) {
    refiner.machineState = {
      processingBlockType: null,
      processingStartTime: null,
      isFinished: false
    };
  }

  if (refiner.machineState.processingBlockType !== null) {
    return { success: false, reason: "Refiner is busy!" };
  }

  // Start processing
  refiner.machineState.processingBlockType = selectedBlockType;
  refiner.machineState.processingStartTime = Date.now();
  refiner.machineState.isFinished = false;

  removeFromInventory(player, selectedBlockType, 1);
  return { success: true };
}

// Simplified refiner collect function - refiners need special handling due to processing
export function attemptCollectFromRefiner(player: Player, blocks: Block[]): { success: boolean; reason?: string } {
  const refiner = findNearbyBlock(player, 'refiner', blocks);
  if (!refiner) return { success: false, reason: "No refiner nearby!" };
  
  if (!refiner.machineState?.processingBlockType) {
    return { success: false, reason: "Nothing to collect!" };
  }

  const inputBlockType = refiner.machineState.processingBlockType;
  const outputBlockType = REFINABLE_BLOCKS[inputBlockType as keyof typeof REFINABLE_BLOCKS];
  if (!outputBlockType) return { success: false, reason: "Block Error??!" };

  if (!canHoldBlock(player, outputBlockType)) {
    return { success: false, reason: "Not Enough Inventory!" };
  }

  // Get the refining time based on the refiner type and input block
  const refiningTime = getRefiningTime(refiner.blockType, inputBlockType);
  
  const elapsedTime = Date.now() - (refiner.machineState.processingStartTime || 0);
  if (elapsedTime < refiningTime) {
    // If not finished refining, return the original block
    addToInventory(player, inputBlockType);
  } else {
    // If finished refining, return the refined block
    addToInventory(player, outputBlockType);
  }

  // Reset machine state
  refiner.machineState.processingBlockType = null;
  refiner.machineState.processingStartTime = null;
  refiner.machineState.isFinished = false;

  return { success: true };
}

// Universal machinery interaction function
export function attemptInteractWithMachinery(
  player: Player, 
  blocks: Block[], 
  action: 'deposit' | 'collect'
): { success: boolean; reason?: string } {
  // First check for refiner (special case)
  const refiner = findNearbyBlock(player, 'refiner', blocks);
  if (refiner) {
    if (action === 'deposit') {
      return attemptDepositInRefiner(player, blocks);
    } else {
      return attemptCollectFromRefiner(player, blocks);
    }
  }
  
  // Then try other storage types
  if (action === 'deposit') {
    return attemptDepositInStorage(player, blocks);
  } else {
    return attemptCollectFromStorage(player, blocks);
  }
}
