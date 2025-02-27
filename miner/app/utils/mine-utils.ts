import { Player, BlockData, Block } from "../types";
import { getSelectedBlockType } from "./data-utils"
import { BLOCK_SIZE } from "../constants"
import { getBlockData } from "./data-utils"

export function canPlaceBlock(size: [number, number], blocks: Block[], gridX: number, gridY: number): boolean {
  for (let dx = 0; dx < size[0]; dx++) {
    for (let dy = 0; dy < size[1]; dy++) {
      const blockAtPosition = blocks.find(b => 
        b.x === gridX + dx * BLOCK_SIZE && 
        b.y === gridY + dy * BLOCK_SIZE
      )
      // Allow placement if block doesn't exist or is mined
      if (blockAtPosition && !blockAtPosition.isMined) return false
    }
  }
  return true
}

export function placeBlock(player: Player, blocks: Block[], gridX: number, gridY: number): boolean {
  const selectedBlockType = getSelectedBlockType(player)  
  if (selectedBlockType === null) return false
  const blockData = getBlockData(selectedBlockType) as BlockData
  let size = blockData.size
  if (!size) size = [1, 1]

  if (!canPlaceBlock(size, blocks, gridX, gridY)) return false

  // Create the main block (bottom-left)
  const mainBlock = blocks.find(b => b.x === gridX && b.y === gridY)
  if (mainBlock) {
    mainBlock.isMined = false
    mainBlock.blockType = selectedBlockType
    mainBlock.isSecondaryBlock = false
    mainBlock.machineState = {
      processingBlockType: null,
      processingStartTime: null,
      isFinished: false
    }

    // Create secondary blocks
    for (let dx = 0; dx < size[0]; dx++) {
      for (let dy = 0; dy < size[1]; dy++) {
        if (dx === 0 && dy === 0) continue // Skip main block
        const secondaryBlock = blocks.find(b => 
          b.x === gridX + dx * BLOCK_SIZE && 
          b.y === gridY + dy * BLOCK_SIZE
        )
        if (secondaryBlock) {
          secondaryBlock.isMined = false
          secondaryBlock.blockType = selectedBlockType
          secondaryBlock.isSecondaryBlock = true
          secondaryBlock.mainBlockX = gridX
          secondaryBlock.mainBlockY = gridY
        }
      }
    }
    return true
  } 
  return false
}

export function mineBlock(block: Block, blocks: Block[]) {
  // Check if this is a storage block with items
  if ((block.blockType === 19 || block.blockType === 20) && 
      block.storageState &&
      block.storageState.storedBlocks.length > 0) {
    // Don't allow mining if storage has items
    return false;
  }
  
  // If this is a secondary block, find the main block first
  if (block.isSecondaryBlock && block.mainBlockX !== undefined && block.mainBlockY !== undefined) {
    const mainBlock = blocks.find(b => 
      b.x === block.mainBlockX && 
      b.y === block.mainBlockY
    )
    if (mainBlock) {
      // Check if main block is a storage with items
      if ((mainBlock.blockType === 19 || mainBlock.blockType === 20) && 
          mainBlock.storageState &&
          mainBlock.storageState.storedBlocks.length > 0) {
        return false;
      }
      
      // Mine the main block
      mainBlock.isMined = true
      
      // Find and mine all secondary blocks that reference this main block
      blocks.forEach(b => {
        if (b.mainBlockX === mainBlock.x && b.mainBlockY === mainBlock.y && b.isSecondaryBlock) {
          b.isMined = true
        }
      })
    }
  } else {
    // Original behavior for mining main blocks
    block.isMined = true
    
    // Find and mine all secondary blocks that reference this block as their main block
    blocks.forEach(b => {
      if (b.mainBlockX === block.x && b.mainBlockY === block.y  && b.isSecondaryBlock) {
        b.isMined = true
      }
    })
  }
  
  return true;
}
