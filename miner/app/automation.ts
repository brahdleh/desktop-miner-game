import { Player, Block } from './types'
import { BLOCK_SIZE, REFINABLE_BLOCKS, REFINING_TIME } from './constants'

// Constants for automation
const COLLECTOR_ID = 19
const CHEST_ID = 20
const TUBE_ID = 21
const REFINER_ID = 14

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

// Maximum distance for tubes to connect machinery
const MAX_TUBE_DISTANCE = 5 // Maximum blocks distance for tube connections

interface Connection {
  source: Block
  target: Block
  path: Block[] // Tube blocks forming the path
}

// Find all tube connections between machinery
function findConnections(blocks: Block[]): Connection[] {
  const connections: Connection[] = []
  
  // Find all machinery blocks
  const collectors = blocks.filter(b => b.blockType === COLLECTOR_ID && !b.isSecondaryBlock)
  const refiners = blocks.filter(b => b.blockType === REFINER_ID && !b.isSecondaryBlock)
  const chests = blocks.filter(b => b.blockType === CHEST_ID && !b.isSecondaryBlock)
  const tubes = blocks.filter(b => b.blockType === TUBE_ID)
  
  // For each collector, find connections to refiners and chests
  collectors.forEach(collector => {
    // Find connections to refiners
    refiners.forEach(refiner => {
      const path = findTubePath(collector, refiner, tubes)
      if (path.length > 0) {
        connections.push({
          source: collector,
          target: refiner,
          path
        })
      }
    })
    
    // Find connections to chests
    chests.forEach(chest => {
      const path = findTubePath(collector, chest, tubes)
      if (path.length > 0) {
        connections.push({
          source: collector,
          target: chest,
          path
        })
      }
    })
  })
  
  // For each refiner, find connections to chests
  refiners.forEach(refiner => {
    chests.forEach(chest => {
      const path = findTubePath(refiner, chest, tubes)
      if (path.length > 0) {
        connections.push({
          source: refiner,
          target: chest,
          path
        })
      }
    })
  })
  
  return connections
}

// Find a path of tubes between two machinery blocks
function findTubePath(source: Block, target: Block, tubes: Block[]): Block[] {
  // Simple distance check for now - in the future this could be a proper pathfinding algorithm
  const sourceX = source.x
  const sourceY = source.y
  const targetX = target.x
  const targetY = target.y
  
  // Check if direct connection is possible (within MAX_TUBE_DISTANCE)
  const distance = Math.sqrt(
    Math.pow(targetX - sourceX, 2) + 
    Math.pow(targetY - sourceY, 2)
  )
  
  if (distance > MAX_TUBE_DISTANCE * 36) { // Convert blocks to pixels
    return []
  }
  
  // Find tubes that could form a path
  const possibleTubes = tubes.filter(tube => {
    // Check if tube is between source and target
    return isPointBetween(
      sourceX, sourceY, 
      targetX, targetY, 
      tube.x, tube.y
    )
  })
  
  // If we have tubes that could form a path, return them
  return possibleTubes
}

// Helper function to check if a point is roughly between two other points
function isPointBetween(x1: number, y1: number, x2: number, y2: number, px: number, py: number): boolean {
  // Calculate distances
  const distTotal = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2))
  const dist1 = Math.sqrt(Math.pow(px - x1, 2) + Math.pow(py - y1, 2))
  const dist2 = Math.sqrt(Math.pow(px - x2, 2) + Math.pow(py - y2, 2))
  
  // Allow some tolerance (10% of total distance)
  const tolerance = distTotal * 0.1
  
  // Point is between if sum of distances is approximately equal to total distance
  return Math.abs(dist1 + dist2 - distTotal) < tolerance
}

// Improved function to find a path between two machinery blocks using BFS
function findPath(source: Block, targetType: number, blocks: Block[]): { target: Block, path: Block[] } | null {
  // Queue for BFS
  const queue: { block: Block, path: Block[] }[] = [{ block: source, path: [] }];
  // Set to track visited blocks
  const visited = new Set<string>();
  
  // Add source to visited
  visited.add(`${source.x},${source.y}`);
  
  while (queue.length > 0) {
    const { block, path } = queue.shift()!;
    
    // Check all adjacent blocks
    for (const dir of DIRECTIONS) {
      // Calculate adjacent block position
      const nextX = block.x + dir.dx * BLOCK_SIZE;
      const nextY = block.y + dir.dy * BLOCK_SIZE;
      
      // Skip if already visited
      const key = `${nextX},${nextY}`;
      if (visited.has(key)) continue;
      
      // Find block at this position
      const nextBlock = blocks.find(b => 
        !b.isMined && 
        b.x === nextX && 
        b.y === nextY
      );
      
      // Skip if no block or not a tube or target
      if (!nextBlock) continue;
      
      // If it's the target type, return the path
      if (nextBlock.blockType === targetType && !nextBlock.isSecondaryBlock) {
        return { 
          target: nextBlock, 
          path: [...path, nextBlock] 
        };
      }
      
      // If it's a tube, add to queue
      if (nextBlock.blockType === TUBE_ID) {
        visited.add(key);
        queue.push({ 
          block: nextBlock, 
          path: [...path, nextBlock] 
        });
      }
    }
  }
  
  // No path found
  return null;
}

// Process a single collector
function processCollector(collector: Block, blocks: Block[]): void {
  if (!collector.storageState) {
    collector.storageState = {
      storedBlocks: []
    }
  }
  
  // Skip if collector has no items
  if (!collector.storageState.storedBlocks || collector.storageState.storedBlocks.length === 0) {
    return
  }
  
  // Process each item in the collector
  const itemsToRemove: number[] = []
  
  collector.storageState.storedBlocks.forEach((block, index) => {
    // Try to send to a refiner first if the block is refinable
    if (isRefinable(block.blockType)) {
      // Find path to a refiner
      const refinerPath = findPath(collector, REFINER_ID, blocks);
      
      if (refinerPath) {
        const refiner = refinerPath.target;
        
        // Initialize refiner state if needed
        if (!refiner.machineState) {
          refiner.machineState = {
            processingBlockType: null,
            processingStartTime: null,
            isFinished: false
          }
        }
        
        // Check if refiner is available
        if (refiner.machineState.processingBlockType === null) {
          // Send item to refiner
          refiner.machineState.processingBlockType = block.blockType;
          refiner.machineState.processingStartTime = Date.now();
          refiner.machineState.isFinished = false;
          
          // Mark item for removal from collector
          itemsToRemove.push(index);
        }
      }
    }
    
    // If item wasn't sent to a refiner, try to send to a chest
    if (!itemsToRemove.includes(index)) {
      // Find path to a chest
      const chestPath = findPath(collector, CHEST_ID, blocks);
      
      if (chestPath) {
        const chest = chestPath.target;
        
        // Initialize chest state if needed
        if (!chest.storageState) {
          chest.storageState = {
            storedBlocks: []
          }
        }
        
        // Check if chest has space (simple check for now)
        if (chest.storageState.storedBlocks.length < 10) { // Arbitrary limit
          // Send item to chest
          chest.storageState.storedBlocks.push(block);
          
          // Mark item for removal from collector
          itemsToRemove.push(index);
        }
      }
    }
  });
  
  // Remove processed items from collector (in reverse order to avoid index issues)
  itemsToRemove.sort((a, b) => b - a).forEach(index => {
    collector.storageState!.storedBlocks.splice(index, 1);
  });
}

// Process a single refiner
function processRefiner(refiner: Block, blocks: Block[]): void {
  if (!refiner.machineState || refiner.machineState.processingBlockType === null) {
    return;
  }
  
  // Check if refining is complete
  const elapsedTime = Date.now() - (refiner.machineState.processingStartTime || 0);
  if (elapsedTime >= REFINING_TIME && !refiner.machineState.isFinished) {
    refiner.machineState.isFinished = true;
    
    // Find path to a chest
    const chestPath = findPath(refiner, CHEST_ID, blocks);
    
    if (chestPath) {
      // Get the refined block type
      const inputBlockType = refiner.machineState.processingBlockType;
      const outputBlockType = REFINABLE_BLOCKS[inputBlockType as keyof typeof REFINABLE_BLOCKS];
      
      const chest = chestPath.target;
      
      // Initialize chest state if needed
      if (!chest.storageState) {
        chest.storageState = {
          storedBlocks: []
        }
      }
      
      // Check if chest has space
      if (chest.storageState.storedBlocks.length < 10) { // Arbitrary limit
        // Send refined item to chest
        chest.storageState.storedBlocks.push({ blockType: outputBlockType, count: 1 });
        
        // Reset refiner
        refiner.machineState.processingBlockType = null;
        refiner.machineState.processingStartTime = null;
        refiner.machineState.isFinished = false;
      }
    }
  }
}

// Helper function to check if a block is refinable
function isRefinable(blockType: number): boolean {
  return Object.keys(REFINABLE_BLOCKS).includes(blockType.toString())
}

// Main function to process all automation machinery
export function processAutomation(blocks: Block[]): void {
  // Process collectors
  blocks
    .filter(block => block.blockType === COLLECTOR_ID && !block.isSecondaryBlock)
    .forEach(collector => processCollector(collector, blocks));
  
  // Process refiners
  blocks
    .filter(block => block.blockType === REFINER_ID && !block.isSecondaryBlock)
    .forEach(refiner => processRefiner(refiner, blocks));
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