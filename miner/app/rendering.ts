import { Player, Block, Zone, BlockData } from './types'
import {
  CANVAS_WIDTH, CANVAS_HEIGHT, SURFACE_Y, MINE_DEPTH_PX,
  MINE_LEFT, BLOCK_SIZE, PLAYER_WIDTH, PLAYER_HEIGHT,
  BLOCK_TYPES,
  PICKAXE_TYPES,
  MINE_WIDTH
} from './constants'
import { getBlockTexture, getSceneTexture, getIconTexture, getPickTexture, getPlayerTexture } from './assets'
import { getSelectedBlockType, distanceToBlock } from './utils/data-utils'
import { canPlaceBlock } from './utils/mine-utils'
import { drawTube, drawTorch, drawRefiner, drawStorageBlock } from './utils/render-utils'

// Cache arrays so that Object.values() isn't re-computed each frame.
const BLOCK_TYPES_ARRAY = Object.values(BLOCK_TYPES)
const PICKAXE_TYPES_ARRAY = Object.values(PICKAXE_TYPES)

const MAX_DARKNESS = 0.9 // Maximum darkness level (0-1)
const DARKNESS_START = 100 // Y position where darkness starts
const DARKNESS_RANGE = 500 // Distance over which darkness increases to max
const TORCH_INNER_RADIUS = 120
const TORCH_OUTER_RADIUS = 200

// Create and reuse an offscreen canvas for the lighting overlay.
let lightingCanvas: HTMLCanvasElement | null = null;
let lightingCtx: CanvasRenderingContext2D | null = null;

if (typeof window !== 'undefined') {
  lightingCanvas = document.createElement('canvas');
  lightingCanvas.width = CANVAS_WIDTH;
  lightingCanvas.height = CANVAS_HEIGHT;
  lightingCtx = lightingCanvas.getContext('2d');
}

export function draw(
  ctx: CanvasRenderingContext2D,
  player: Player,
  blocks: Block[],
  miningTargetBlock: Block | null,
  miningProgress: number,
  cameraOffsetY: number,
  upgradeZone: Zone,
  sellZone: Zone,
  requiredTime?: number,
  isPlacingMode?: boolean,
  previewX?: number,
  previewY?: number
) {
  // Clear the main canvas
  ctx.clearRect(0, -CANVAS_HEIGHT, CANVAS_WIDTH, CANVAS_HEIGHT)

  drawBackground(ctx, cameraOffsetY)
  
  // Draw block placement preview if in placing mode
  if (isPlacingMode && previewX !== undefined && previewY !== undefined) {
    drawBlockPreview(ctx, player, blocks, previewX, previewY, cameraOffsetY)
  }
  
  drawZones(ctx, upgradeZone, sellZone, player, cameraOffsetY)
  drawBuildings(ctx, cameraOffsetY)
  drawBlocks(player.y, ctx, blocks, cameraOffsetY)
  drawMiningProgress(ctx, miningTargetBlock, miningProgress, requiredTime, cameraOffsetY)
  drawPlayer(ctx, player, cameraOffsetY)
  drawDarknessOverlay(ctx, blocks, cameraOffsetY)
  drawInventory(ctx, player)
  drawHUD(ctx, player)
  drawDepthProgressBar(ctx, player)
}

function drawBackground(ctx: CanvasRenderingContext2D, cameraOffsetY: number) {
  const roundedOffset = Math.round(cameraOffsetY)
  
  // Draw sky
  const skyTexture = getSceneTexture('sky')
  if (skyTexture) {
    ctx.drawImage(skyTexture, 0, -roundedOffset - 100, CANVAS_WIDTH, 100 + SURFACE_Y + 5)
  }

  // Draw underground areas
  const undergroundTexture = getSceneTexture('underground')
  const mineTexture = getSceneTexture('mine')
  
  if (undergroundTexture) {
    for (let y = SURFACE_Y+5; y < SURFACE_Y + MINE_DEPTH_PX; y += 4*BLOCK_SIZE) {
      for (let x = 0; x < CANVAS_WIDTH; x += 4*BLOCK_SIZE) {
        ctx.drawImage(undergroundTexture, x, y - roundedOffset, 4*BLOCK_SIZE, 4*BLOCK_SIZE)
      }
    }
  }

  // Draw mine shaft
  if (mineTexture) {
    for (let y = SURFACE_Y+5; y < SURFACE_Y + MINE_DEPTH_PX; y += 4*BLOCK_SIZE) {
      ctx.drawImage(mineTexture, MINE_LEFT, y - roundedOffset, 4.5*BLOCK_SIZE, 4*BLOCK_SIZE)
      ctx.drawImage(mineTexture, MINE_LEFT + 4.5*BLOCK_SIZE, y - roundedOffset, 4.5*BLOCK_SIZE, 4*BLOCK_SIZE)
    }
  }
}
function drawBuildings(ctx: CanvasRenderingContext2D, cameraOffsetY: number) {
  const roundedOffset = Math.round(cameraOffsetY)
  // Draw buildings on surface
  const shopTexture = getSceneTexture('shop')
  const smithTexture = getSceneTexture('smith')
  //const sellTexture = getSceneTexture('sell')
  
  if (shopTexture) {
    ctx.drawImage(shopTexture, 0, SURFACE_Y - 200 - roundedOffset + 8, 200, 230)
  }
  
  if (smithTexture) {
    ctx.drawImage(smithTexture, CANVAS_WIDTH - 200, SURFACE_Y - 200 - roundedOffset + 8, 200, 230)
  }
}

function drawBlocks(
  player_y: number,
  ctx: CanvasRenderingContext2D, 
  blocks: Block[], 
  cameraOffsetY: number
) {
  // Only process blocks that are within the visible area
  const visibleBlocks = blocks.filter(block => 
    !block.isMined && 
    Math.abs(block.y - player_y) <= CANVAS_HEIGHT
  )
  
  for (const block of visibleBlocks) {
    const blockData = BLOCK_TYPES_ARRAY[block.blockType] as BlockData
    const texture = getBlockTexture(blockData.name)
    const x = block.x
    const y = block.y - cameraOffsetY

    if (!texture) continue // Skip if no texture is available

    // Special handling for tubes
    if (block.blockType === 21) {
      drawTube(ctx, block, blocks, x, y);
      continue;
    }

    // Torch animation
    if (block.blockType === 12) {
      drawTorch(ctx, x, y);
      continue;
    }

    // Special handling for refiners
    if (blockData.category === 'refiner') {
      drawRefiner(ctx, block, blockData, x, y);
      continue;
    }

    // Special handling for collector (type 19)
    if (blockData.category === 'collector' && !block.isSecondaryBlock) {
      drawStorageBlock(ctx, block, x, y, 'collector');
      continue;
    }

    // Special handling for chest (type 20)
    if (blockData.category === 'chest' && !block.isSecondaryBlock) {
      drawStorageBlock(ctx, block, x, y, 'chest');
      continue;
    }

    // Regular block drawing
    ctx.drawImage(texture, x, y, BLOCK_SIZE, BLOCK_SIZE)
  }
}

function drawPlayer(
  ctx: CanvasRenderingContext2D, 
  player: Player, 
  cameraOffsetY: number
) {
  const playerStanding = getPlayerTexture('standing')
  const playerJump = getPlayerTexture('jump')
  const playerWalk1 = getPlayerTexture('step1')
  const playerWalk2 = getPlayerTexture('step2')
  const pickaxeType = PICKAXE_TYPES_ARRAY[player.pickaxeType].name.toLowerCase()
  const pickIcon = getPickTexture(pickaxeType)
  
  // Animation frame selection (4 frames per walk cycle)
  const walkFrame = Math.floor(Date.now() / 100) % 4
  let currentTexture = playerStanding

  if (!player.onGround) {
    currentTexture = playerJump
  } else if (player.isWalking) {
    // Alternate between walk1, standing, walk2, standing
    switch(walkFrame) {
      case 0: currentTexture = playerWalk1; break;
      case 1: currentTexture = playerStanding; break;
      case 2: currentTexture = playerWalk2; break;
      case 3: currentTexture = playerStanding; break;
    }
  }

  if (currentTexture) {
    if (player.facingRight) {
      ctx.drawImage(currentTexture, player.x, player.y - cameraOffsetY, PLAYER_WIDTH, PLAYER_HEIGHT)
      if (pickIcon) {
        ctx.drawImage(pickIcon, player.x+18, player.y + 18- cameraOffsetY, 0.75*BLOCK_SIZE, 0.75*BLOCK_SIZE)
      }
    } else {
      // Flip context, draw player and pickaxe, then restore context
      ctx.save()
      ctx.scale(-1, 1)
      ctx.drawImage(currentTexture, -player.x - PLAYER_WIDTH, player.y - cameraOffsetY, PLAYER_WIDTH, PLAYER_HEIGHT)
      if (pickIcon) {
        ctx.drawImage(pickIcon, -player.x-12, player.y + 18- cameraOffsetY, 0.75*BLOCK_SIZE, 0.75*BLOCK_SIZE)
      }
      ctx.restore()
    }
  }
}

function drawMiningProgress(
  ctx: CanvasRenderingContext2D,
  miningTargetBlock: Block | null,
  miningProgress: number,
  requiredTime: number | undefined,
  cameraOffsetY: number
) {
  if (!miningTargetBlock || !requiredTime) return

  ctx.fillStyle = "rgba(255, 255, 0, 0.5)"
  ctx.fillRect(
    miningTargetBlock.x,
    miningTargetBlock.y - cameraOffsetY,
    BLOCK_SIZE * (miningProgress / requiredTime),
    BLOCK_SIZE
  )
}

function drawZones(
  ctx: CanvasRenderingContext2D,
  upgradeZone: Zone,
  craftZone: Zone,
  player: Player,
  cameraOffsetY: number
) {
  // Draw zones if player is in range
  if (player.x >= upgradeZone.x && player.x <= upgradeZone.x + upgradeZone.width) {
      // Upgrade zone background
      ctx.fillStyle = "rgba(0, 0, 0, 0.5)"
      ctx.fillRect(
      upgradeZone.x, 
      upgradeZone.y - cameraOffsetY, 
      upgradeZone.width, 
      upgradeZone.height
    )
    drawZoneText(ctx, upgradeZone, player, cameraOffsetY)
  }
  if (player.x >= craftZone.x && player.x <= craftZone.x + craftZone.width) {
      // Craft zone background
      ctx.fillStyle = "rgba(0, 0, 0, 0.5)"
      ctx.fillRect(
      craftZone.x, 
      craftZone.y - cameraOffsetY, 
      craftZone.width, 
      craftZone.height
    )
    drawCraftZoneText(ctx, craftZone, player, cameraOffsetY)
  }
}

function drawZoneText(
  ctx: CanvasRenderingContext2D,
  zone: Zone,
  player: Player,
  cameraOffsetY: number
) {
  const startX = zone.x + 10
  const startY = zone.y - cameraOffsetY

  // Header
  ctx.fillStyle = "#fff"
  ctx.font = "bold 18px Arial"
  ctx.fillText("SHOP", startX, startY + 25)

  // Divider
  ctx.strokeStyle = "#ffffff"
  ctx.beginPath()
  ctx.moveTo(startX, startY + 35)
  ctx.lineTo(zone.x + zone.width - 10, startY + 35)
  ctx.stroke()

  // Info
  ctx.font = "14px Arial"
  ctx.fillText("Open Shop [E]   Sell Blocks [P]", startX, startY + 60)
}

function drawCraftZoneText(
  ctx: CanvasRenderingContext2D,
  zone: Zone,
  player: Player,
  cameraOffsetY: number
) {
  ctx.fillStyle = "#fff"
  
  // Header
  ctx.font = "bold 18px Arial"
  ctx.fillText("BLACKSMITH", zone.x + 10, zone.y + 25 - cameraOffsetY)

  // Divider
  ctx.strokeStyle = "#ffffff"
  ctx.beginPath()
  ctx.moveTo(zone.x + 10, zone.y + 35 - cameraOffsetY)
  ctx.lineTo(zone.x + zone.width - 10, zone.y + 35 - cameraOffsetY)
  ctx.stroke()
  
  // Info
  ctx.font = "14px Arial"
  ctx.fillText("Open Blacksmith [E]", zone.x + 10, zone.y + 60 - cameraOffsetY)

}  

function drawInventory(ctx: CanvasRenderingContext2D, player: Player) {
  const slotSize = 35
  const padding = 5
  const startX = 10
  const startY = CANVAS_HEIGHT - 50
  
  const selectedSlotTexture = getIconTexture('inventory_selected')
  const unselectedSlotTexture = getIconTexture('inventory')
  
  if (!player.inventorySlots) return

  for (let i = 0; i < player.inventorySlots.length; i++) {
    const column = Math.floor(i / 3)
    const row = (i % 3) 
    const x = startX + column * (slotSize + padding)
    const y = startY - row * (slotSize + padding)

    // Draw the slot background.
    const slotTexture = i === player.selectedSlot ? selectedSlotTexture : unselectedSlotTexture
    if (slotTexture) {
      ctx.drawImage(slotTexture, x, y, slotSize, slotSize)
    }

    // Add null check for the slot
    const slot = player.inventorySlots[i]
    if (!slot) continue

    // If there's any block in this slot, draw its texture, count, and value.
    if (slot.blockType !== null && slot.count > 0) {
      const blockData = BLOCK_TYPES_ARRAY[slot.blockType]
      if (!blockData) continue // Skip if block data is undefined

      const texture = getBlockTexture(blockData.name)
      
      if (texture) {
        ctx.drawImage(texture, x + 3, y + 3, slotSize - 6, slotSize - 6)
      }
      
      ctx.fillStyle = "white"
      ctx.font = "11px Arial"
      ctx.strokeStyle = "black"
      ctx.lineWidth = 2
      ctx.strokeText(slot.count.toString(), x + 6, y + slotSize - 6)
      ctx.fillStyle = "white"
      ctx.fillText(slot.count.toString(), x + 6, y + slotSize - 6)
      
      const coinIcon = getIconTexture('coin')
      if (coinIcon) {
        ctx.drawImage(coinIcon, x + 3, y + 3, 10, 10)
        ctx.fillStyle = "#FFD700"
        ctx.font = "10px Arial"
        ctx.strokeText(blockData.value.toString(), x + 12, y + 12)
        ctx.fillText(blockData.value.toString(), x + 12, y + 12)
      }
    }
  }
}

function drawHUD(ctx: CanvasRenderingContext2D, player: Player) {
  const startX = 1
  const startY = CANVAS_HEIGHT - 250
  const iconSize = 20
  
  // Gold display.
  const coinIcon = getIconTexture('coin')
  if (coinIcon) {
    ctx.drawImage(coinIcon, startX + 10, startY + 10 + 14, iconSize, iconSize)
    ctx.fillStyle = "white"
    ctx.font = "14px Arial"
    ctx.fillText(player.gold.toString(), startX + iconSize + 15, startY + 40)
  }
  
  // Backpack display.
  const backpackIcon = getIconTexture('backpack')
  if (backpackIcon) {
    ctx.drawImage(backpackIcon, startX + 9, startY + 10 + 39, iconSize, iconSize)
    ctx.fillStyle = "white"
    ctx.font = "14px Arial"
    ctx.fillText(`${player.inventory} / ${Math.floor(player.backpackCapacity)}`, startX + iconSize + 15, startY + 65)
  }
  
  // Pickaxe display.
  const pickaxeType = PICKAXE_TYPES_ARRAY[player.pickaxeType].name.toLowerCase()
  const pickIcon = getPickTexture(pickaxeType)
  if (pickIcon) {
    ctx.drawImage(pickIcon, startX + 10, startY + 10 + 63, iconSize, iconSize)
    ctx.fillStyle = "white"
    ctx.font = "14px Arial"
    ctx.fillText(`${player.pickaxePower.toPrecision(2)}x`, startX + iconSize + 15, startY + 88)
  }

  // Selected block info
  const selectedBlockType = getSelectedBlockType(player)
  let selectedBlockName = "Empty"
  if(selectedBlockType){
    const selectedBlockData = BLOCK_TYPES_ARRAY[selectedBlockType]
    selectedBlockName = selectedBlockData.name
  }
  ctx.fillStyle = "#999999"  // Light grey color
  ctx.font = "italic 14px Arial"
  ctx.fillText(`${selectedBlockName}`, startX + 12, startY + 110)
}

function drawDarknessOverlay(
  ctx: CanvasRenderingContext2D,
  blocks: Block[],
  cameraOffsetY: number
) {
  if (!lightingCtx || !lightingCanvas) return

  // Clear the offscreen canvas.
  lightingCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
  
  // Create a vertical gradient for darkness.
  const gradient = lightingCtx.createLinearGradient(
    0, DARKNESS_START - cameraOffsetY,
    0, DARKNESS_START + DARKNESS_RANGE - cameraOffsetY
  )
  gradient.addColorStop(0, 'rgba(0, 0, 0, 0)')
  gradient.addColorStop(1, `rgba(0, 0, 0, ${MAX_DARKNESS})`)
  
  lightingCtx.fillStyle = gradient
  lightingCtx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

  // Use destination-out to "punch" light around torches.
  lightingCtx.globalCompositeOperation = 'destination-out'
  
  // Only process torches that are visible on screen
  const visibleTorches = blocks.filter(block => 
    block.blockType === 12 && 
    !block.isMined && 
    block.y >= cameraOffsetY - TORCH_OUTER_RADIUS && 
    block.y <= cameraOffsetY + CANVAS_HEIGHT + TORCH_OUTER_RADIUS
  )
  
  for (const block of visibleTorches) {
    const centerX = block.x + BLOCK_SIZE / 2
    const centerY = block.y - cameraOffsetY + BLOCK_SIZE / 2
    const torchGradient = lightingCtx.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, TORCH_OUTER_RADIUS
    )
    
    torchGradient.addColorStop(0, 'rgba(0, 0, 0, 1)')
    torchGradient.addColorStop(TORCH_INNER_RADIUS / TORCH_OUTER_RADIUS, 'rgba(0, 0, 0, 0.7)')
    torchGradient.addColorStop(1, 'rgba(0, 0, 0, 0)')
    
    lightingCtx.fillStyle = torchGradient
    lightingCtx.beginPath()
    lightingCtx.arc(centerX, centerY, TORCH_OUTER_RADIUS, 0, Math.PI * 2)
    lightingCtx.fill()
  }
  
  // Reset composite mode before drawing to main canvas.
  lightingCtx.globalCompositeOperation = 'source-over'
  
  // Draw the lighting overlay onto the main canvas.
  ctx.drawImage(lightingCanvas, 0, 0);
}

// Update the drawBlockPreview function to only render when in placement range
function drawBlockPreview(
  ctx: CanvasRenderingContext2D,
  player: Player,
  blocks: Block[],
  x: number,
  y: number,
  cameraOffsetY: number
) {
  const selectedBlockType = getSelectedBlockType(player)
  if (selectedBlockType === null) return
  
  const blockData = BLOCK_TYPES_ARRAY[selectedBlockType] as BlockData
  if (!blockData) return
  
  // Check if player is close enough to place and if placement is valid
  // Also check if we're below ground level
  const isInRange = y >= SURFACE_Y && distanceToBlock(player, x, y) <= BLOCK_SIZE * 3
  
  // Only render preview if in range
  if (!isInRange) return
  
  const texture = getBlockTexture(blockData.name)
  if (!texture) return
  
  // Get block size (default to 1x1 if not specified)
  const blockWidth = blockData.size ? blockData.size[0] * BLOCK_SIZE : BLOCK_SIZE
  const blockHeight = blockData.size ? blockData.size[1] * BLOCK_SIZE : BLOCK_SIZE
  
  // Check if placement is valid
  const canPlace = canPlaceBlock(blockData.size || [1, 1], blocks, x, y)
  
  // Draw with transparency
  ctx.globalAlpha = canPlace ? 0.7 : 0.3
  ctx.drawImage(texture, x, y - cameraOffsetY, blockWidth, blockHeight)
  ctx.globalAlpha = 1.0
  
  // Draw border
  ctx.strokeStyle = canPlace ? "rgba(0, 255, 0, 0.7)" : "rgba(255, 0, 0, 0.7)"
  ctx.lineWidth = 2
  ctx.strokeRect(x, y - cameraOffsetY, blockWidth, blockHeight)
}

// Add this function to draw the depth progress bar
function drawDepthProgressBar(ctx: CanvasRenderingContext2D, player: Player) {
  const barWidth = MINE_WIDTH * BLOCK_SIZE - 50
  const barHeight = 12
  const barX = MINE_LEFT + 25
  const barY = CANVAS_HEIGHT - 40
  const padding = 2
  
  // Draw background
  ctx.fillStyle = "rgba(0, 0, 0, 0.5)"
  ctx.fillRect(barX, barY, barWidth, barHeight)
  
  // Calculate progress (player's depth as a percentage of total mine depth)
  const playerDepth = Math.max(0, player.y - SURFACE_Y)
  const maxDepth = MINE_DEPTH_PX
  const progress = Math.min(playerDepth / maxDepth, 1)
  
  // Draw progress bar
  ctx.fillStyle = "rgba(0, 200, 0, 0.7)"
  ctx.fillRect(barX + padding, barY + padding, (barWidth - padding * 2) * progress, barHeight - padding * 2)
  
  // Draw border
  ctx.strokeStyle = "white"
  ctx.lineWidth = 1
  ctx.strokeRect(barX, barY, barWidth, barHeight)
  
  // Draw pickaxe icon at current position
  const pickaxeType = PICKAXE_TYPES_ARRAY[player.pickaxeType].name.toLowerCase()
  const pickIcon = getPickTexture(pickaxeType)
  if (pickIcon) {
    const iconSize = 20
    const iconX = barX + padding + (barWidth - padding * 2) * progress - iconSize / 2
    ctx.drawImage(pickIcon, iconX, barY -3, iconSize, iconSize)
  }
  
  // Save current context state
  ctx.save()
  
  // Draw depth text
  ctx.fillStyle = "white"
  ctx.font = "10px Arial"
  ctx.textAlign = "right"
  ctx.fillText(`Depth: ${Math.floor(playerDepth / BLOCK_SIZE)}m`, barX + barWidth - 5, barY + barHeight + 12)
  
  // Restore context state to reset text alignment and other properties
  ctx.restore()
}
