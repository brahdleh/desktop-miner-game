import { Player, Block } from './types'
import { 
  DEFAULT_MINE_TIME, BLOCK_SIZE, MAX_PROFICIENCY_LEVEL, MAX_STRENGTH_LEVEL,
  REFINABLE_BLOCKS,
  MINING_REACH
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
  distanceToBlock
} from './utils/data-utils'
import { mineBlock, placeBlock } from './utils/mine-utils';
import { 
  initializeStorageState, hasMachineSpace, addItemToMachine
} from './utils/machinery-utils'
import { MACHINE_STORAGE_LIMIT } from './constants'

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

  // Check if this is a storage block with items
  if ((miningTargetBlock.blockType === 19 || miningTargetBlock.blockType === 20) &&
      miningTargetBlock.storageState &&
      miningTargetBlock.storageState.storedBlocks.length > 0) {
    return { 
      miningProgress: 0, 
      miningTargetBlock: null, 
      success: false, 
      message: "Empty storage before mining!" 
    }
  }

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
  if (distanceToBlock(player, block.x, block.y) > MINING_REACH) {
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
  // Check for any refiner type nearby
  const refinerTypes = [14, 22, 23, 24, 25]; // All refiner block types
  
  for (const refinerType of refinerTypes) {
    const refiner = findNearbyBlock(player, refinerType, blocks);
    if (refiner) {
      if (refiner.isSecondaryBlock) {
        const mainBlock = blocks.find(b => b.x === refiner.mainBlockX && b.y === refiner.mainBlockY);
        if (!mainBlock) continue;
        return mainBlock;
      }
      return refiner;
    }
  }
  
  return null;
}

export function attemptDepositInRefiner(player: Player, blocks: Block[]): { success: boolean; reason?: string } {
  const refiner = findNearbyRefiner(player, blocks);
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

export function attemptCollectFromRefiner(player: Player, blocks: Block[]): { success: boolean; reason?: string } {
  const refiner = findNearbyRefiner(player, blocks);
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

// Find nearby collector
export function findNearbyCollector(player: Player, blocks: Block[]): Block | null {
  return findNearbyBlock(player, 19, blocks)
}

// Find nearby chest
export function findNearbyChest(player: Player, blocks: Block[]): Block | null {
  return findNearbyBlock(player, 20, blocks)
}

// Attempt to deposit a block into a collector
export function attemptDepositInCollector(player: Player, blocks: Block[]): { success: boolean; reason?: string } {
  const collector = findNearbyCollector(player, blocks)
  if (!collector) return { success: false, reason: "No collector nearby!" }

  const selectedBlockType = getSelectedBlockType(player)
  if (selectedBlockType === null) return { success: false, reason: "No block selected!" }
  
  const selectedBlockCount = getBlockInventory(player, selectedBlockType)
  if (selectedBlockCount <= 0) return { success: false, reason: "No block selected!" }

  // Initialize storage state if needed
  initializeStorageState(collector)

  // Check if collector is full
  if (!hasMachineSpace(collector, MACHINE_STORAGE_LIMIT)) {
    return { success: false, reason: "Collector is full!" }
  }

  // Add item to collector - allow any block type
  addItemToMachine(collector, selectedBlockType)
  removeFromInventory(player, selectedBlockType, 1)
  return { success: true }
}

// Attempt to collect a block from a chest
export function attemptCollectFromChest(player: Player, blocks: Block[]): { success: boolean; reason?: string } {
  const chest = findNearbyChest(player, blocks)
  if (!chest) return { success: false, reason: "No chest nearby!" }
  
  if (!chest.storageState?.storedBlocks || chest.storageState.storedBlocks.length === 0) {
    return { success: false, reason: "Chest is empty!" }
  }

  // Get the first item from the chest (without removing it yet)
  const blockToCollect = chest.storageState.storedBlocks[0];
  
  // Check if player can hold the item
  if (canHoldBlock(player, blockToCollect.blockType)) {
    // Only remove the item if the player can hold it
    chest.storageState.storedBlocks.shift();
    addToInventory(player, blockToCollect.blockType);
    return { success: true };
  } else {
    return { success: false, reason: "Not Enough Inventory!" }
  }
}

// Find any nearby machinery (refiner, collector, or chest)
export function findNearbyMachinery(player: Player, blocks: Block[]): { block: Block, type: 'refiner' | 'collector' | 'chest' } | null {
  // Check for refiner first
  const refiner = findNearbyRefiner(player, blocks)
  if (refiner) {
    return { block: refiner, type: 'refiner' }
  }
  
  // Check for collector
  const collector = findNearbyCollector(player, blocks)
  if (collector) {
    return { block: collector, type: 'collector' }
  }
  
  // Check for chest
  const chest = findNearbyChest(player, blocks)
  if (chest) {
    return { block: chest, type: 'chest' }
  }
  
  return null
}

// Universal deposit function
export function attemptDepositInMachinery(player: Player, blocks: Block[]): { success: boolean; reason?: string } {
  const machinery = findNearbyMachinery(player, blocks)
  if (!machinery) {
    return { success: false, reason: "No machinery nearby!" }
  }
  
  // Handle based on machinery type
  switch (machinery.type) {
    case 'refiner':
      return attemptDepositInRefiner(player, blocks)
    case 'collector':
      return attemptDepositInCollector(player, blocks)
    case 'chest':
      // Allow depositing into chests
      return attemptDepositInChest(player, blocks)
    default:
      return { success: false, reason: "Unknown machinery type!" }
  }
}

// Universal collect function
export function attemptCollectFromMachinery(player: Player, blocks: Block[]): { success: boolean; reason?: string } {
  const machinery = findNearbyMachinery(player, blocks)
  if (!machinery) {
    return { success: false, reason: "No machinery nearby!" }
  }
  
  // Handle based on machinery type
  switch (machinery.type) {
    case 'refiner':
      return attemptCollectFromRefiner(player, blocks)
    case 'collector':
      // Allow collecting from collectors
      return attemptCollectFromCollector(player, blocks)
    case 'chest':
      return attemptCollectFromChest(player, blocks)
    default:
      return { success: false, reason: "Unknown machinery type!" }
  }
}

// Attempt to deposit into a chest
export function attemptDepositInChest(player: Player, blocks: Block[]): { success: boolean; reason?: string } {
  const chest = findNearbyChest(player, blocks)
  if (!chest) return { success: false, reason: "No chest nearby!" }

  const selectedBlockType = getSelectedBlockType(player)
  if (selectedBlockType === null) return { success: false, reason: "No block selected!" }
  
  const selectedBlockCount = getBlockInventory(player, selectedBlockType)
  if (selectedBlockCount <= 0) return { success: false, reason: "No block selected!" }

  // Initialize storage state if needed
  initializeStorageState(chest)

  // Check if chest is full
  if (!hasMachineSpace(chest)) {
    return { success: false, reason: "Chest is full!" }
  }

  // Add item to chest
  addItemToMachine(chest, selectedBlockType)
  removeFromInventory(player, selectedBlockType, 1)
  return { success: true }
}

// New function to collect from a collector
export function attemptCollectFromCollector(player: Player, blocks: Block[]): { success: boolean; reason?: string } {
  const collector = findNearbyCollector(player, blocks)
  if (!collector) return { success: false, reason: "No collector nearby!" }
  
  if (!collector.storageState?.storedBlocks || collector.storageState.storedBlocks.length === 0) {
    return { success: false, reason: "Collector is empty!" }
  }

  // Get the first item from the collector (without removing it yet)
  const blockToCollect = collector.storageState.storedBlocks[0];
  
  // Check if player can hold the item
  if (canHoldBlock(player, blockToCollect.blockType)) {
    // Only remove the item if the player can hold it
    collector.storageState.storedBlocks.shift();
    addToInventory(player, blockToCollect.blockType);
    return { success: true };
  } else {
    return { success: false, reason: "Not Enough Inventory!" }
  }
}

// Add a function to craft advanced refiners
export function attemptCraftRefiner(player: Player, refinerType: number): boolean {
  const blockData = getBlockData(refinerType);
  
  if (!blockData || blockData.category !== 'refiner') {
    return false;
  }
  
  // Check requirements
  if (blockData.requirements) {
    const { blockType, amount, base } = blockData.requirements;
    
    // Check if player has the required materials
    if (getBlockInventory(player, blockType) < amount) {
      return false;
    }
    
    // Check if player has the required base refiner
    if (base && getBlockInventory(player, base) < 1) {
      return false;
    }
    
    // Consume materials
    removeFromInventory(player, blockType, amount);
    
    // Consume the base refiner if required
    if (base) {
      removeFromInventory(player, base, 1);
    }
    
    // Add the new refiner to inventory
    addToInventory(player, refinerType);
    
    return true;
  }
  
  return false;
}
