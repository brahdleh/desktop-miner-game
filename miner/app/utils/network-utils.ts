import { Block } from '../types';
import { BLOCK_SIZE } from '../constants';
import { getBlockData, getSecondaryBlocks } from './data-utils';

export interface MachineConnection {
  machine: Block;
  distance: number;
  path: Block[];
}

// Directions for adjacent blocks
export const DIRECTIONS = [
    { dx: 0, dy: -1 }, // Up
    { dx: 1, dy: 0 },  // Right
    { dx: 0, dy: 1 },  // Down
    { dx: -1, dy: 0 }, // Left
  ]

// Map of machine coordinates to their network connections
export type MachineNetwork = Map<string, MachineConnection[]>;

// Generate a unique key for a block based on its coordinates
export function getBlockKey(block: Block): string {
  return `${block.x},${block.y}`;
}

// Check if a block is a machine that can be part of the automation network
export function isMachineBlock(block: Block): boolean {
  if (block.isSecondaryBlock) return false;
  if (block.isMined) return false;
  
  const blockData = getBlockData(block.blockType);
  return ['refiner', 'collector', 'chest'].includes(blockData.category);
}

// Build the entire machine network from scratch
export function buildMachineNetwork(blocks: Block[]): MachineNetwork {
  const network: MachineNetwork = new Map();
  
  // Find all machines
  const machines = blocks.filter(isMachineBlock);
  
  // Create a network node for each machine
  machines.forEach(machine => {
    const connections = findAllConnections(machine, machines, blocks);
    network.set(getBlockKey(machine), connections);
  });
  
  return network;
}

// Find all connections for a specific machine
function findAllConnections(
  source: Block, 
  allMachines: Block[], 
  allBlocks: Block[]
): MachineConnection[] {
  const connections: MachineConnection[] = [];
  const sourceKey = getBlockKey(source);
  
  // Find all other machines that this one can connect to
  for (const targetMachine of allMachines) {
    // Skip self
    if (getBlockKey(targetMachine) === sourceKey) continue;
    
    // Find path between machines
    const path = findPathBetweenMachines(source, targetMachine, allBlocks);
    
    if (path) {
      connections.push({
        machine: targetMachine,
        distance: path.length,
        path: path
      });
    }
  }
  
  // Sort connections by distance
  return connections.sort((a, b) => a.distance - b.distance);
}

// Helper function to find a path between two machines using BFS
function findPathBetweenMachines(source: Block, target: Block, blocks: Block[]): Block[] | null {
  // Queue for BFS
  const queue: { block: Block, path: Block[] }[] = [{ block: source, path: [source] }];
  // Set to track visited blocks
  const visited = new Set<string>();
  
  // Add source to visited
  visited.add(getBlockKey(source));
  
  // Find all secondary blocks of the source and target
  const sourceBlocks = [source, ...getSecondaryBlocks(source, blocks)];
  const targetBlocks = [target, ...getSecondaryBlocks(target, blocks)];
  
  // Mark all source blocks as visited
  for (const sourceBlock of sourceBlocks) {
    visited.add(getBlockKey(sourceBlock));
    if (sourceBlock !== source) {
      queue.push({ block: sourceBlock, path: [sourceBlock] });
    }
  }
  
  while (queue.length > 0) {
    const { block, path } = queue.shift()!;
    
    // If we've reached any of the target blocks, return the path
    if (targetBlocks.some(tb => tb.x === block.x && tb.y === block.y)) {
      return path;
    }
    
    // Check all adjacent blocks
    for (const dir of DIRECTIONS) {
      // Calculate adjacent block position
      const nextX = block.x + dir.dx * BLOCK_SIZE;
      const nextY = block.y + dir.dy * BLOCK_SIZE;
      const nextKey = `${nextX},${nextY}`;
      
      // Skip if already visited
      if (visited.has(nextKey)) continue;
      
      // Find block at this position
      const nextBlock = blocks.find(b => 
        !b.isMined && 
        b.x === nextX && 
        b.y === nextY
      );
      
      // Skip if no block
      if (!nextBlock) continue;
      
      // Mark as visited
      visited.add(nextKey);
      
      // If it's one of the target blocks or a tube, add to queue
      const blockData = getBlockData(nextBlock.blockType)
      if (targetBlocks.some(tb => tb.x === nextBlock.x && tb.y === nextBlock.y) || 
          blockData.category === 'tube') {
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

