import { Block } from '../types'
import { BLOCK_SIZE, MACHINE_STORAGE_LIMIT } from '../constants'

// Constants for automation
export const COLLECTOR_ID = 19
export const CHEST_ID = 20
export const TUBE_ID = 21
export const REFINER_ID = 14

// Directions for adjacent blocks
export const DIRECTIONS = [
  { dx: 0, dy: -1 }, // Up
  { dx: 1, dy: 0 },  // Right
  { dx: 0, dy: 1 },  // Down
  { dx: -1, dy: 0 }, // Left
]

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
export function hasMachineSpace(block: Block, limit: number = MACHINE_STORAGE_LIMIT): boolean {
  initializeStorageState(block)
  return block.storageState!.storedBlocks.length < limit
}

// Add an item to a machine's storage
export function addItemToMachine(block: Block, itemType: number, count: number = 1): boolean {
  initializeStorageState(block)
  
  if (!hasMachineSpace(block)) return false
  
  block.storageState!.storedBlocks.push({ blockType: itemType, count })
  return true
}

// Find a path between two machinery blocks using BFS
export function findMachineryPath(source: Block, targetType: number, blocks: Block[]): { target: Block, path: Block[] } | null {
  // Queue for BFS
  const queue: { block: Block, path: Block[] }[] = [{ block: source, path: [] }]
  // Set to track visited blocks
  const visited = new Set<string>()
  
  // Add source to visited
  visited.add(`${source.x},${source.y}`)
  
  while (queue.length > 0) {
    const { block, path } = queue.shift()!
    
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
      
      // If it's the target type, return the path
      if (nextBlock.blockType === targetType && !nextBlock.isSecondaryBlock) {
        return { 
          target: nextBlock, 
          path: [...path, nextBlock] 
        }
      }
      
      // If it's a tube, add to queue
      if (nextBlock.blockType === TUBE_ID) {
        visited.add(key)
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