import { Block, BlockData } from '../types'
import { BLOCK_SIZE, REFINABLE_BLOCKS, BLOCK_TYPES } from '../constants'
import { getBlockTexture, getIconTexture } from '../assets'
import { getRefiningTime } from '../utils/calculation-utils'

// Cache arrays so that Object.values() isn't re-computed each frame.
const BLOCK_TYPES_ARRAY = Object.values(BLOCK_TYPES)

/**
 * Draws a tube block with proper connections to adjacent tubes
 */
export function drawTube(
  ctx: CanvasRenderingContext2D,
  tubeBlock: Block,
  blocks: Block[],
  x: number,
  y: number
) {
  const tubeTexture = getBlockTexture('tube');
  const tubeCornerTexture = getBlockTexture('tube2');
  const tube3WayTexture = getBlockTexture('tube3');
  const tube4WayTexture = getBlockTexture('tube4');
  const tubeID = 21
  
  if (!tubeTexture || !tubeCornerTexture) {
    // Fallback to basic rendering if textures aren't available
    const fallbackTexture = getBlockTexture('tube');
    if (fallbackTexture) {
      ctx.drawImage(fallbackTexture, x, y, BLOCK_SIZE, BLOCK_SIZE);
    }
    return;
  }
  
  // Find adjacent tubes and machines (only cardinal directions, not diagonals)
  const adjacentConnections = {
    top: blocks.find(b => isValidTubeConnection(b, tubeBlock.x, tubeBlock.y - BLOCK_SIZE)),
    right: blocks.find(b => isValidTubeConnection(b, tubeBlock.x + BLOCK_SIZE, tubeBlock.y)),
    bottom: blocks.find(b => isValidTubeConnection(b, tubeBlock.x, tubeBlock.y + BLOCK_SIZE)),
    left: blocks.find(b => isValidTubeConnection(b, tubeBlock.x - BLOCK_SIZE, tubeBlock.y))
  };
  
  // Helper function to check if a block is a valid tube connection
  function isValidTubeConnection(block: Block, checkX: number, checkY: number) {
    if (!block || block.isMined) return false;
    
    // Check if it's a tube
    if (block.blockType === tubeID && block.x === checkX && block.y === checkY) return true;
    
    // Check if it's a machine (refiner, collector, chest)
    const blockData = BLOCK_TYPES_ARRAY[block.blockType] as BlockData;
    if (!blockData) return false;
    
    // Check if it's a machine type that can connect to tubes
    const isMachine = blockData.category === 'refiner' || 
                      block.blockType === 19 || // Collector
                      block.blockType === 20;   // Chest
    
    // Check if the position matches
    return isMachine && 
           block.x === checkX && 
           block.y === checkY;
  }
  
  // Count adjacent connections
  const connectionCount = Object.values(adjacentConnections).filter(Boolean).length;
  
  // Save the current context state
  ctx.save();
  
  // Case 1: No adjacent connections - use default texture
  if (connectionCount === 0) {
    ctx.drawImage(tubeTexture, x, y, BLOCK_SIZE, BLOCK_SIZE);
  }
  // Case 2: One adjacent connection - use straight tube with rotation
  else if (connectionCount === 1) {
    // Determine rotation angle based on which side has the adjacent connection
    let angle = 0;
    if (adjacentConnections.top) angle = 0; 
    else if (adjacentConnections.right) angle = Math.PI / 2;
    else if (adjacentConnections.bottom) angle = 0;
    else if (adjacentConnections.left) angle = Math.PI / 2;
    
    // Set the transformation origin to the center of the block
    ctx.translate(x + BLOCK_SIZE / 2, y + BLOCK_SIZE / 2);
    ctx.rotate(angle);
    ctx.drawImage(tubeTexture, -BLOCK_SIZE / 2, -BLOCK_SIZE / 2, BLOCK_SIZE, BLOCK_SIZE);
  }
  // Case 3: Two adjacent connections
  else if (connectionCount === 2) {
    // Check if connections are on opposite sides (straight connection)
    if ((adjacentConnections.top && adjacentConnections.bottom) || 
        (adjacentConnections.left && adjacentConnections.right)) {
      // Use straight tube with appropriate rotation
      let angle = 0;
      if (adjacentConnections.left && adjacentConnections.right) {
        angle = Math.PI / 2; // 90 degrees for horizontal
      }
      
      // Set the transformation origin to the center of the block
      ctx.translate(x + BLOCK_SIZE / 2, y + BLOCK_SIZE / 2);
      ctx.rotate(angle);
      ctx.drawImage(tubeTexture, -BLOCK_SIZE / 2, -BLOCK_SIZE / 2, BLOCK_SIZE, BLOCK_SIZE);
    } 
    // Corner connection
    else {
      // Determine which corner configuration we have and set rotation accordingly
      let angle = 0;
      
      if (adjacentConnections.bottom && adjacentConnections.right) {
        angle = 0; // Default orientation of tube2
      } else if (adjacentConnections.bottom && adjacentConnections.left) {
        angle = Math.PI / 2; // 90 degrees
      } else if (adjacentConnections.top && adjacentConnections.left) {
        angle = Math.PI; // 180 degrees
      } else if (adjacentConnections.top && adjacentConnections.right) {
        angle = 3 * Math.PI / 2; // 270 degrees
      }
      
      // Set the transformation origin to the center of the block
      ctx.translate(x + BLOCK_SIZE / 2, y + BLOCK_SIZE / 2);
      ctx.rotate(angle);
      ctx.drawImage(tubeCornerTexture, -BLOCK_SIZE / 2, -BLOCK_SIZE / 2, BLOCK_SIZE, BLOCK_SIZE);
    }
  }
  // Case 4: Three adjacent connections - use tube3 with appropriate rotation
  else if (connectionCount === 3 && tube3WayTexture) {
    let angle = 0;
    
    // Determine which side doesn't have a connection and rotate accordingly
    if (!adjacentConnections.top) {
      angle = Math.PI / 2; // Default orientation (open at top)
    } else if (!adjacentConnections.right) {
      angle = Math.PI; // 90 degrees (open at right)
    } else if (!adjacentConnections.bottom) {
      angle = -Math.PI/2; // 180 degrees (open at bottom)
    } else if (!adjacentConnections.left) {
      angle = 0; // 270 degrees (open at left)
    }
    
    // Set the transformation origin to the center of the block
    ctx.translate(x + BLOCK_SIZE / 2, y + BLOCK_SIZE / 2);
    ctx.rotate(angle);
    ctx.drawImage(tube3WayTexture, -BLOCK_SIZE / 2, -BLOCK_SIZE / 2, BLOCK_SIZE, BLOCK_SIZE);
  }
  // Case 5: Four adjacent connections - use tube4 (no rotation needed)
  else if (connectionCount === 4 && tube4WayTexture) {
    ctx.drawImage(tube4WayTexture, x, y, BLOCK_SIZE, BLOCK_SIZE);
  }
  // Fallback for 3 or 4 connections if textures aren't available
  else {
    ctx.drawImage(tubeTexture, x, y, BLOCK_SIZE, BLOCK_SIZE);
  }
  
  // Restore the context state
  ctx.restore();
}

/**
 * Draws a torch with animation
 */
export function drawTorch(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number
) {
  const torchTexture = getBlockTexture('torch');
  const torch2Texture = getBlockTexture('torch2');
  
  if (!torchTexture) return;
  
  // Animate between two torch frames
  const torchFrame = Math.floor(Date.now() / 1000) % 2;
  let currentTexture = torchTexture;
  
  if (torchFrame === 1 && torch2Texture) {
    currentTexture = torch2Texture;
  }
  
  ctx.drawImage(currentTexture, x, y, BLOCK_SIZE, BLOCK_SIZE);
}

/**
 * Draws a refiner with animation based on processing state
 */
export function drawRefiner(
  ctx: CanvasRenderingContext2D,
  block: Block,
  blockData: BlockData,
  x: number,
  y: number
) {
  // Only draw if this is the main block of the refiner
  if (!blockData || !blockData.size || block.isSecondaryBlock) return;
  
  // Get the appropriate refiner background texture based on refiner type
  const refinerBackgroundTexture = getBlockTexture(blockData.name);
  
  // Get the core textures for animation
  const refinerCore = getBlockTexture('refiner_core');
  const refinerCore2 = getBlockTexture('refiner_core2');
  const refinerCore3 = getBlockTexture('refiner_core3');
  const refinerCore4 = getBlockTexture('refiner_core4');
  
  if (!refinerBackgroundTexture || !refinerCore) return;
  
  // Draw the refiner background
  ctx.drawImage(
    refinerBackgroundTexture, 
    x, 
    y, 
    BLOCK_SIZE * blockData.size[0], 
    BLOCK_SIZE * blockData.size[1]
  );
  
  // Calculate position for the core (centered in the refiner)
  const coreWidth = BLOCK_SIZE * 2;
  const coreHeight = BLOCK_SIZE * 1.2;
  const coreX = x + (BLOCK_SIZE * blockData.size[0] - coreWidth) / 2;
  const coreY = y + BLOCK_SIZE * 0.5;
  
  // If the refiner is processing, draw the animated core and progress bar
  if (block.machineState?.processingBlockType !== null && block.machineState) {
    const inputBlockType = block.machineState.processingBlockType;
    
    // Calculate the refining time based on refiner type and input block
    const refiningTime = getRefiningTime(block.blockType, inputBlockType);
    
    // Calculate progress
    const elapsedTime = Date.now() - (block.machineState?.processingStartTime || 0);
    const progress = Math.min(elapsedTime / refiningTime, 1);
    
    // Animate the core based on progress or time
    let currentCoreTexture;
    if (progress < 1) {
      // Cycle through core textures based on time for animation effect
      const animationFrame = Math.floor(Date.now() / 250) % 3;
      
      switch (animationFrame) {
        case 0: currentCoreTexture = refinerCore2; break;
        case 1: currentCoreTexture = refinerCore3; break;
        case 2: currentCoreTexture = refinerCore4; break;
        default: currentCoreTexture = refinerCore2;
      }
      
      // Draw the animated core
      if (currentCoreTexture) {
        ctx.drawImage(currentCoreTexture, coreX, coreY, coreWidth, coreHeight);
      }
    } else {
      // When processing is complete, use the idle core
      ctx.drawImage(refinerCore, coreX, coreY, coreWidth, coreHeight);
    }
    
    // Draw progress bar
    const barWidth = BLOCK_SIZE * blockData.size[0] * 0.75;
    const barHeight = 4;
    const barX = x + (BLOCK_SIZE * blockData.size[0] - barWidth) / 2;
    const barY = y + BLOCK_SIZE * 0.2;
    
    // Draw background of progress bar
    ctx.fillStyle = "rgba(50, 50, 50, 0.7)";
    ctx.fillRect(barX, barY, barWidth, barHeight);
    
    // Draw filled portion of progress bar
    ctx.fillStyle = "rgba(0, 200, 0, 0.8)";
    ctx.fillRect(barX, barY, barWidth * progress, barHeight);
    
    // Draw border of progress bar
    ctx.strokeStyle = "rgba(200, 200, 200, 0.8)";
    ctx.strokeRect(barX, barY, barWidth, barHeight);
    
    // If processing is complete, draw the finished product
    if (progress >= 1) {
      const processedBlockType = REFINABLE_BLOCKS[inputBlockType as keyof typeof REFINABLE_BLOCKS];
      if (processedBlockType) {
        const processedBlockData = BLOCK_TYPES_ARRAY[processedBlockType];
        const processedTexture = getBlockTexture(processedBlockData.name);
        
        if (processedTexture) {
          // Draw the processed block in the center of the refiner
          const outputX = x + (BLOCK_SIZE * (blockData.size[0] - 0.6)) / 2;
          const outputY = y + (BLOCK_SIZE * (blockData.size[1] - 0.2)) / 2;
          
          ctx.drawImage(
            processedTexture, 
            outputX, 
            outputY, 
            BLOCK_SIZE * 0.6,
            BLOCK_SIZE * 0.6
          );
        }
      }
    }
  } else {
    // Draw the idle core (no animation)
    ctx.drawImage(refinerCore, coreX, coreY, coreWidth, coreHeight);
  }
}

/**
 * Draws a storage block (collector or chest) with mini inventory
 */
export function drawStorageBlock(
  ctx: CanvasRenderingContext2D,
  block: Block,
  x: number,
  y: number,
  type: 'collector' | 'chest'
) {
  const texture = getBlockTexture(type === 'collector' ? 'collector' : 'chest');
  
  if (!texture) return;
  
  // Draw the base texture
  ctx.drawImage(texture, x, y, BLOCK_SIZE, BLOCK_SIZE);
  
  // Draw mini inventory
  drawMachineInventory(ctx, block, x, y);
}

/**
 * Helper function to draw mini inventory for machines
 */
export function drawMachineInventory(
  ctx: CanvasRenderingContext2D,
  block: Block,
  x: number,
  y: number,
) {
  // Only draw if the block has storage state
  if (!block.storageState || !block.storageState.storedBlocks) return;
  
  const slotSize = 10; // Size of each inventory slot
  const padding = 1; // Padding between slots
  const startX = x + (BLOCK_SIZE - (slotSize * 3 + padding * 2)) / 2; // Center horizontally
  const startY = y + BLOCK_SIZE - slotSize * 3 - padding * 2 - 4; // Position near bottom
  
  // Get inventory slot textures from the same ones used in main rendering
  const unselectedSlotTexture = getIconTexture('inventory');
  
  // Draw up to 9 slots in a 3x3 grid
  for (let i = 0; i < 9; i++) {
    const row = Math.floor(i / 3);
    const col = i % 3;
    const slotX = startX + col * (slotSize + padding);
    const slotY = startY + row * (slotSize + padding);
    
    // Draw slot background using the inventory texture
    if (unselectedSlotTexture) {
      ctx.drawImage(unselectedSlotTexture, slotX, slotY, slotSize, slotSize);
    }
    
    // Draw item in slot if it exists
    const item = block.storageState.storedBlocks[i];
    if (item) {
      const blockData = BLOCK_TYPES_ARRAY[item.blockType];
      if (blockData) {
        const itemTexture = getBlockTexture(blockData.name);
        if (itemTexture) {
          ctx.drawImage(itemTexture, slotX + 1, slotY + 1, slotSize - 2, slotSize - 2);
          
          // Draw count if more than 1
          if (item.count > 1) {
            ctx.fillStyle = "white";
            ctx.font = "6px Arial";
            ctx.fillText(item.count.toString(), slotX + 2, slotY + slotSize - 2);
          }
        }
      }
    }
  }
} 