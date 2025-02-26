import { Player, Block } from './types'
import { REFINABLE_BLOCKS, REFINING_TIME } from './constants'
import { 
  COLLECTOR_ID, CHEST_ID, REFINER_ID,
  initializeStorageState, initializeRefinerState,
  hasMachineSpace, addItemToMachine, findMachineryPath
} from './utils/machinery-utils'

// Directions for adjacent blocks
const DIRECTIONS = [
  { dx: 0, dy: -1 }, // Up
  { dx: 1, dy: 0 },  // Right
  { dx: 0, dy: 1 },  // Down
  { dx: -1, dy: 0 }, // Left
  { dx: 1, dy: -1 }, // Up-Right
  { dx: 1, dy: 1 },  // Down-Right
  { dx: -1, dy: 1 }, // Down-Left
  { dx: -1, dy: -1 } // Up-Left
];

// Helper function to check if a block is refinable
function isRefinable(blockType: number): boolean {
  return Object.keys(REFINABLE_BLOCKS).includes(blockType.toString())
}

// Process a single collector
function processCollector(collector: Block, blocks: Block[]): void {
  initializeStorageState(collector)
  
  // Skip if collector has no items
  if (collector.storageState!.storedBlocks.length === 0) {
    return
  }
  
  // Process each item in the collector
  const itemsToRemove: number[] = []
  
  collector.storageState!.storedBlocks.forEach((block, index) => {
    // Try to send to a refiner first if the block is refinable
    if (isRefinable(block.blockType)) {
      // Find path to a refiner
      const refinerPath = findMachineryPath(collector, REFINER_ID, blocks)
      
      if (refinerPath) {
        const refiner = refinerPath.target
        
        // Initialize refiner state if needed
        initializeRefinerState(refiner)
        
        // Check if refiner is available
        if (refiner.machineState!.processingBlockType === null) {
          // Send item to refiner
          refiner.machineState!.processingBlockType = block.blockType
          refiner.machineState!.processingStartTime = Date.now()
          refiner.machineState!.isFinished = false
          
          // Mark item for removal from collector
          itemsToRemove.push(index)
        }
      }
    }
    
    // If item wasn't sent to a refiner (or isn't refinable), try to send to a chest
    if (!itemsToRemove.includes(index)) {
      // Find path to a chest
      const chestPath = findMachineryPath(collector, CHEST_ID, blocks)
      
      if (chestPath) {
        const chest = chestPath.target
        
        // Initialize chest state if needed
        initializeStorageState(chest)
        
        // Check if chest has space
        if (hasMachineSpace(chest)) {
          // Send item to chest
          addItemToMachine(chest, block.blockType, block.count)
          
          // Mark item for removal from collector
          itemsToRemove.push(index)
        }
      }
    }
  })
  
  // Remove processed items from collector (in reverse order to avoid index issues)
  itemsToRemove.sort((a, b) => b - a).forEach(index => {
    collector.storageState!.storedBlocks.splice(index, 1)
  })
}

// Process a single refiner
function processRefiner(refiner: Block, blocks: Block[]): void {
  if (!refiner.machineState || refiner.machineState.processingBlockType === null) {
    return
  }
  
  // Check if refining is complete
  const elapsedTime = Date.now() - (refiner.machineState.processingStartTime || 0)
  if (elapsedTime >= REFINING_TIME && !refiner.machineState.isFinished) {
    refiner.machineState.isFinished = true
    
    // Find path to a chest
    const chestPath = findMachineryPath(refiner, CHEST_ID, blocks)
    
    if (chestPath) {
      // Get the refined block type
      const inputBlockType = refiner.machineState.processingBlockType
      const outputBlockType = REFINABLE_BLOCKS[inputBlockType as keyof typeof REFINABLE_BLOCKS]
      
      const chest = chestPath.target
      
      // Initialize chest state if needed
      initializeStorageState(chest)
      
      // Check if chest has space
      if (hasMachineSpace(chest)) {
        // Send refined item to chest
        addItemToMachine(chest, outputBlockType)
        
        // Reset refiner
        refiner.machineState.processingBlockType = null
        refiner.machineState.processingStartTime = null
        refiner.machineState.isFinished = false
      }
    }
  }
}

// Main function to process all automation machinery
export function processAutomation(blocks: Block[]): void {
  // Process collectors
  blocks
    .filter(block => block.blockType === COLLECTOR_ID && !block.isSecondaryBlock)
    .forEach(collector => processCollector(collector, blocks))
  
  // Process refiners
  blocks
    .filter(block => block.blockType === REFINER_ID && !block.isSecondaryBlock)
    .forEach(refiner => processRefiner(refiner, blocks))
}

// Function to check if a player is near a specific block type
export function isPlayerNearBlockType(player: Player, blockType: number, blocks: Block[], maxDistance: number = 100): Block | null {
  for (const block of blocks) {
    if (block.blockType === blockType && !block.isSecondaryBlock) {
      const distance = Math.sqrt(
        Math.pow(block.x - player.x, 2) + 
        Math.pow(block.y - player.y, 2)
      )
      
      if (distance <= maxDistance) {
        return block
      }
    }
  }
  
  return null
} 