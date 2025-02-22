import { Player, BlockData, Block } from "../types";
import { getSelectedBlockType } from "./data-utils"
import { BLOCK_SIZE } from "../constants"
import { getBlockData } from "./data-utils"

export function canPlaceBlock(size: [number, number], blocks: Block[], gridX: number, gridY: number): boolean {

  // Check if we have enough space treating click as bottom-left corner
  for (let dx = 0; dx < size[0]; dx++) {
    for (let dy = 0; dy < size[1]; dy++) {
      const blockAtPosition = blocks.find(b => 
        b.x === gridX + dx * BLOCK_SIZE && 
        b.y === gridY + dy * BLOCK_SIZE
      )
      // Check if block exists and is mined
      if (!blockAtPosition?.isMined) return false
    }
  }
  return true
}

export function placeBlock(player: Player, blocks: Block[], clickX: number, clickY: number): boolean {
  const selectedBlockType = getSelectedBlockType(player)  
  const blockData = getBlockData(selectedBlockType) as BlockData
  let size = blockData.size
  if (!size) size = [1, 1]

  const gridX = Math.floor(clickX / BLOCK_SIZE) * BLOCK_SIZE
  const gridY = Math.floor(clickY / BLOCK_SIZE) * BLOCK_SIZE

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
  let size = block.size
  if (!size) size = [1, 1]

  const gridX = Math.floor(block.x / BLOCK_SIZE) * BLOCK_SIZE
  const gridY = Math.floor(block.y / BLOCK_SIZE) * BLOCK_SIZE

  for (let dx = 0; dx < size[0]; dx++) {
    for (let dy = 0; dy < size[1]; dy++) {
      const blockAtPosition = blocks.find(b => 
        b.x === gridX + dx * BLOCK_SIZE && 
        b.y === gridY + dy * BLOCK_SIZE
      )
      if (blockAtPosition) {
        blockAtPosition.isMined = true
        blockAtPosition.isSecondaryBlock = false
      }
    }
  }
}
