import { Player, Block } from './types'
import { REFINABLE_BLOCKS, BLOCK_SIZE, MACHINE_STORAGE_LIMIT } from './constants'
import { 
  COLLECTOR_ID, CHEST_ID, REFINER_ID,
  initializeStorageState, initializeRefinerState,
  hasMachineSpace, addItemToMachine
} from './utils/machinery-utils'
import { getRefiningTime } from './utils/calculation-utils'
import { getBlockData } from './utils/data-utils';

// Directions for adjacent blocks
const DIRECTIONS = [
  { dx: 0, dy: -1 }, // Up
  { dx: 1, dy: 0 },  // Right
  { dx: 0, dy: 1 },  // Down
  { dx: -1, dy: 0 }, // Left
];

// Helper function to check if a block is a refiner
function isRefiner(blockType: number): boolean {
  return getBlockData(blockType).category === 'refiner';
}

// Process all automation machinery
export function processAutomation(blocks: Block[]) {
  // Process collectors first
  const collectors = blocks.filter(b => !b.isMined && b.blockType === COLLECTOR_ID && !b.isSecondaryBlock)
  
  // Process refiners
  const refiners = blocks.filter(b => !b.isMined && isRefiner(b.blockType) && !b.isSecondaryBlock)
  
  // Process chests
  const chests = blocks.filter(b => !b.isMined && b.blockType === CHEST_ID && !b.isSecondaryBlock)
  
  // Initialize storage states if needed
  collectors.forEach(initializeStorageState)
  chests.forEach(initializeStorageState)
  
  // Initialize refiner states if needed
  refiners.forEach(initializeRefinerState)
  
  // Process collector to refiner transfers
  collectors.forEach(collector => {
    // Skip if collector is empty
    if (!collector.storageState?.storedBlocks || collector.storageState.storedBlocks.length === 0) return
    
    // Check if there's a refinable block in the collector
    const refinableBlockIndex = collector.storageState.storedBlocks.findIndex(item => 
      REFINABLE_BLOCKS[item.blockType as keyof typeof REFINABLE_BLOCKS] !== undefined
    )
    
    if (refinableBlockIndex >= 0) {
      // Find a path to an available refiner
      const availableRefiner = refiners.find(refiner => 
        refiner.machineState && refiner.machineState.processingBlockType === null
      )
      
      let refinedSuccessfully = false
      
      if (availableRefiner) {
        const path = findPathBetweenMachines(collector, availableRefiner, blocks)
        
        if (path) {
          // Transfer the block to the refiner
          const blockToRefine = collector.storageState.storedBlocks.splice(refinableBlockIndex, 1)[0]
          
          // Initialize refiner state if needed
          initializeRefinerState(availableRefiner)
          
          // Start processing in the refiner
          availableRefiner.machineState!.processingBlockType = blockToRefine.blockType
          availableRefiner.machineState!.processingStartTime = Date.now()
          availableRefiner.machineState!.isFinished = false
          
          refinedSuccessfully = true
        }
      }
      
      // If we couldn't refine (no refiner or no path), try to transfer to a chest
      if (!refinedSuccessfully) {
        transferToChest(collector, chests, blocks)
      }
    } else {
      // If no refinable blocks, try to transfer to a chest
      transferToChest(collector, chests, blocks)
    }
  })
  
  // Process refiner to chest transfers for completed items
  refiners.forEach(refiner => {
    // Skip if refiner is not processing or not finished
    if (!refiner.machineState?.processingBlockType) return
    
    const inputBlockType = refiner.machineState.processingBlockType
    const refiningTime = getRefiningTime(refiner.blockType, inputBlockType)
    const elapsedTime = Date.now() - (refiner.machineState.processingStartTime || 0)
    
    // Check if refining is complete
    if (elapsedTime >= refiningTime) {
      // Mark as finished if not already
      if (!refiner.machineState.isFinished) {
        refiner.machineState.isFinished = true
      }
      
      // Try to transfer to a chest
      const availableChest = chests.find(chest => 
        chest.storageState && chest.storageState.storedBlocks.length < MACHINE_STORAGE_LIMIT
      )
      
      if (availableChest) {
        const path = findPathBetweenMachines(refiner, availableChest, blocks)
        
        if (path) {
          // Get the refined block type
          const outputBlockType = REFINABLE_BLOCKS[inputBlockType as keyof typeof REFINABLE_BLOCKS]
          
          // Add to chest
          initializeStorageState(availableChest)
          availableChest.storageState!.storedBlocks.push({
            blockType: outputBlockType,
            count: 1
          })
          
          // Reset refiner
          refiner.machineState.processingBlockType = null
          refiner.machineState.processingStartTime = null
          refiner.machineState.isFinished = false
        }
      }
    }
  })
}

// Helper function to transfer items from a collector to a chest
function transferToChest(collector: Block, chests: Block[], blocks: Block[]) {
  if (!collector.storageState?.storedBlocks || collector.storageState.storedBlocks.length === 0) return
  
  // Find an available chest
  const availableChests = chests.filter(chest => 
    hasMachineSpace(chest)
  )
  
  for (const availableChest of availableChests) {
    const path = findPathBetweenMachines(collector, availableChest, blocks)
    
    if (path) {
      // Transfer the first block to the chest
      const blockToTransfer = collector.storageState.storedBlocks.shift()
      
      if (blockToTransfer) {
        initializeStorageState(availableChest)
        addItemToMachine(availableChest, blockToTransfer.blockType)
      }
      
      // Successfully transferred, so exit the function
      return
    }
  }
}

// Function to find a path between two machines using BFS
function findPathBetweenMachines(source: Block, target: Block, blocks: Block[]): Block[] | null {
  // Queue for BFS
  const queue: { block: Block, path: Block[] }[] = [{ block: source, path: [source] }]
  // Set to track visited blocks
  const visited = new Set<string>()
  
  // Add source to visited
  visited.add(`${source.x},${source.y}`)
  
  while (queue.length > 0) {
    const { block, path } = queue.shift()!
    
    // If we've reached the target, return the path
    if (block.x === target.x && block.y === target.y) {
      return path
    }
    
    // Check all adjacent blocks
    for (const dir of DIRECTIONS) {
      // Calculate adjacent block position
      const nextX = block.x + dir.dx * BLOCK_SIZE
      const nextY = block.y + dir.dy * BLOCK_SIZE
      
      // Skip if already visited
      const key = `${nextX},${nextY}`
      if (visited.has(key)) continue
      
      // Find block at this position
      const nextBlock = blocks.find(b => 
        !b.isMined && 
        b.x === nextX && 
        b.y === nextY
      )
      
      // Skip if no block
      if (!nextBlock) continue
      
      // Mark as visited
      visited.add(key)
      
      // If it's the target or a tube, add to queue
      if (nextBlock === target || nextBlock.blockType === 21) { // Target or Tube ID
        queue.push({ 
          block: nextBlock, 
          path: [...path, nextBlock] 
        })
      }
    }
  }
  
  // No path found
  return null
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