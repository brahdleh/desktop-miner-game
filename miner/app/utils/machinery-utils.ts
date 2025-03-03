import { Block, Player } from '../types'
import { MACHINE_STORAGE_LIMIT } from '../constants'
import { addToInventory, canHoldBlock } from './data-utils'
import { getBlockInventory, getSelectedBlockType, removeFromInventory } from './data-utils'

// Initialize storage state for a machine if needed
export function initializeStorageState(block: Block): void {
  if (!block.storageState) {
    block.storageState = {
      storedBlocks: []
    }
  }
}

// Initialize machine state for a refiner if needed
export function initializeRefinerState(block: Block): void {
  if (!block.machineState) {
    block.machineState = {
      processingBlockType: null,
      processingStartTime: null,
      isFinished: false
    }
  }
}

// Check if a machine has space for more items
export function hasStorageSpace(block: Block, limit: number = MACHINE_STORAGE_LIMIT): boolean {
  initializeStorageState(block)
  return block.storageState!.storedBlocks.length < limit
}

// Add to storage
export function addToStorage(block: Block, itemType: number, count: number = 1): boolean {
  // Initialize storage state if needed
  if (!block.storageState) {
    block.storageState = { storedBlocks: [] };
  }

  // Check if storage is full
  if (block.storageState.storedBlocks.length >= MACHINE_STORAGE_LIMIT) {
    return false;
  }

  // Add item to storage
  block.storageState.storedBlocks.push({ blockType: itemType, count: 1 });
  return true
}


/**
 * Handles the common logic for depositing an item into any storage
 */
export function depositItemIntoStorage(
  player: Player,
  storageBlock: Block,
): { success: boolean; reason?: string } {
  const selectedBlockType = getSelectedBlockType(player);
  if (selectedBlockType === null) 
    return { success: false, reason: "No block selected!" };
  
  const selectedBlockCount = getBlockInventory(player, selectedBlockType);
  if (selectedBlockCount <= 0) 
    return { success: false, reason: "No block selected!" };

  if (!addToStorage(storageBlock, selectedBlockType, 1)) {
    return { success: false, reason: "Storage is full!" };
  }
  removeFromInventory(player, selectedBlockType, 1);
  
  return { success: true };
}

/**
 * Handles the common logic for collecting an item from any storage
 */
export function collectItemFromStorage(
  player: Player,
  storageBlock: Block
): { success: boolean; reason?: string } {
  if (!storageBlock.storageState?.storedBlocks || 
      storageBlock.storageState.storedBlocks.length === 0) {
    return { success: false, reason: "Storage is empty!" };
  }

  // Get the first item from storage
  const blockToCollect = storageBlock.storageState.storedBlocks[0];
  
  // Check if player can hold the item
  if (canHoldBlock(player, blockToCollect.blockType)) {
    // Remove from storage and add to player inventory
    storageBlock.storageState.storedBlocks.shift();
    addToInventory(player, blockToCollect.blockType);
    return { success: true };
  } else {
    return { success: false, reason: "Not Enough Inventory!" };
  }
}
