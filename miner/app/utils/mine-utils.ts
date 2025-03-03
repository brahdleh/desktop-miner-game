import { Player, BlockData, Block } from "../types";
import { getSelectedBlockType, distanceToBlock } from "./data-utils"
import { BLOCK_SIZE, MINE_LEFT, MINE_WIDTH, MINING_REACH } from "../constants"
import { getBlockData } from "./data-utils"
import { updateNetworkonEdit } from "../automation"

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
  if (gridX + size[0] > MINE_LEFT + MINE_WIDTH || gridX < MINE_LEFT) return false
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
    // update the network
    updateNetworkonEdit(mainBlock, blocks)
    return true
  } 
  return false
}

export function blockInReach(player: Player, block: Block, clickX: number, clickY: number): boolean {

const isClickInBlock = 
    clickX >= block.x &&
    clickX < block.x + BLOCK_SIZE &&
    clickY >= block.y &&
    clickY < block.y + BLOCK_SIZE

  if (!isClickInBlock) {
    return false
  }

  // Distance check from player
  if (distanceToBlock(player, block.x, block.y) > MINING_REACH) {
    return false
  }
  return true
}


export function mineBlock(block: Block, blocks: Block[]): boolean {

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
  // update the network
  updateNetworkonEdit(block, blocks)
  return true;
}
