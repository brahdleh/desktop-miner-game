import { Player, Block, Zone, BlockData } from './types'
import {
  CANVAS_WIDTH, CANVAS_HEIGHT, SURFACE_Y, MINE_DEPTH_PX,
  MINE_LEFT, BLOCK_SIZE, PLAYER_WIDTH, PLAYER_HEIGHT,
  PICKAXE_COST_MULTIPLIER, BACKPACK_COST_MULTIPLIER,
  BLOCK_TYPES,
  PICKAXE_TYPES,
  BACKPACK_TYPES,
  MAX_PICKAXE_LEVEL,
  MAX_BACKPACK_LEVEL,
  PICKAXE_BASE_COST,
  BACKPACK_BASE_COST,
  REFINING_TIME
} from './constants'
import { getBlockTexture, getSceneTexture, getIconTexture, getPickTexture, getPlayerTexture } from './assets'

// Cache arrays so that Object.values() isn't re-computed each frame.
const BLOCK_TYPES_ARRAY = Object.values(BLOCK_TYPES)
const PICKAXE_TYPES_ARRAY = Object.values(PICKAXE_TYPES)
const BACKPACK_TYPES_ARRAY = Object.values(BACKPACK_TYPES)

const MAX_DARKNESS = 0.9 // Maximum darkness level (0-1)
const DARKNESS_START = 100 // Y position where darkness starts
const DARKNESS_RANGE = 500 // Distance over which darkness increases to max
const TORCH_INNER_RADIUS = 120
const TORCH_OUTER_RADIUS = 200

// Create and reuse an offscreen canvas for the lighting overlay.
let lightingCanvas: HTMLCanvasElement | null = null;
let lightingCtx: CanvasRenderingContext2D | null = null;

if (typeof document !== 'undefined') {
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
  requiredTime?: number
) {
  // Clear the main canvas
  ctx.clearRect(0, -CANVAS_HEIGHT, CANVAS_WIDTH, CANVAS_HEIGHT)

  drawBackground(ctx, cameraOffsetY)
  drawBlocks(player.y, ctx, blocks, cameraOffsetY)
  drawMiningProgress(ctx, miningTargetBlock, miningProgress, requiredTime, cameraOffsetY)
  drawPlayer(ctx, player, cameraOffsetY)
  drawZones(ctx, upgradeZone, sellZone, player, cameraOffsetY)
  drawDarknessOverlay(ctx, blocks, cameraOffsetY)
  drawInventory(ctx, player)
  drawHUD(ctx, player)
}

function drawBackground(ctx: CanvasRenderingContext2D, cameraOffsetY: number) {
  const roundedOffset = Math.round(cameraOffsetY)
  
  // Draw sky
  const skyTexture = getSceneTexture('sky')
  if (skyTexture) {
    ctx.drawImage(skyTexture, 0, -roundedOffset - 100, CANVAS_WIDTH, 100 + SURFACE_Y + 5)
  }

  // Draw buildings on surface
  const shopTexture = getSceneTexture('shop')
  const smithTexture = getSceneTexture('smith')
  //const sellTexture = getSceneTexture('sell')
  
  if (shopTexture) {
    ctx.drawImage(shopTexture, 0, SURFACE_Y - 200 - roundedOffset + 20, 200, 230)
  }
  
  if (smithTexture) {
    ctx.drawImage(smithTexture, CANVAS_WIDTH - 200, SURFACE_Y - 200 - roundedOffset + 20, 200, 230)
  }
  
  //if (sellTexture) {
  //  ctx.drawImage(sellTexture, 160, SURFACE_Y - 80 - roundedOffset + 10, 80, 90)
  //}

  // Draw underground areas
  const undergroundTexture = getSceneTexture('underground')
  const mineTexture = getSceneTexture('mine')
  //const dirtTexture = getSceneTexture('dirt')
  
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
  /*
  if (dirtTexture) {
    ctx.drawImage(dirtTexture, MINE_LEFT, SURFACE_Y - roundedOffset, 160, 40)
    ctx.drawImage(dirtTexture, MINE_LEFT + 160, SURFACE_Y - roundedOffset, 160, 40)
  }
  */
}

function drawBlocks(
  player_y: number,
  ctx: CanvasRenderingContext2D, 
  blocks: Block[], 
  cameraOffsetY: number
) {
  for (const block of blocks) {
    if (block.isMined) continue
    if (Math.abs(block.y - player_y) > CANVAS_HEIGHT) continue

    const blockData = BLOCK_TYPES_ARRAY[block.blockType] as BlockData
    const texture = getBlockTexture(blockData.name)
    const x = block.x
    const y = block.y - cameraOffsetY

    // Torch animation
    if (block.blockType === 12) {
      const torchFrame = Math.floor(Date.now() / 1000) % 2
      let currentTexture = texture
      if (torchFrame === 0) {
        currentTexture = getBlockTexture('torch')
      } else if (torchFrame === 1) {
        currentTexture = getBlockTexture('torch2')
      }
      if (currentTexture) {
        ctx.drawImage(currentTexture, x, y, BLOCK_SIZE, BLOCK_SIZE)
      }
      continue
    }

    // Special handling for refiner (type 14)
    if (block.blockType === 14) {
      // Only draw if this is the root block (bottom-left of the refiner)
      if (!blockData) continue
      if (!blockData.size) continue
      if (!block.isSecondaryBlock) {
        if (texture) {
          ctx.drawImage(texture, x, y, BLOCK_SIZE * blockData.size[0], BLOCK_SIZE * blockData.size[1])
        } else {
          ctx.fillStyle = blockData.color
          ctx.fillRect(x, y, BLOCK_SIZE * blockData.size[0], BLOCK_SIZE * blockData.size[1])
        }

        // Draw refiner state if processing
        if (block.machineState?.processingBlockType !== null) {
          // Center the processed block in the middle block
          const processedBlockData = BLOCK_TYPES_ARRAY[block.machineState!.processingBlockType]
          const processedTexture = getBlockTexture(processedBlockData.name)
          
          if (processedTexture) {
            ctx.drawImage(
              processedTexture, 
              x + BLOCK_SIZE, // Center block x
              y, // Bottom row
              BLOCK_SIZE, 
              BLOCK_SIZE
            )
          }

          // Draw progress bar at the bottom of the processed block
          const elapsedTime = Date.now() - (block.machineState!.processingStartTime || 0)
          const progress = Math.min(elapsedTime / REFINING_TIME, 1)
          
          // Background
          ctx.fillStyle = "rgba(0, 0, 0, 0.5)"
          ctx.fillRect(x + BLOCK_SIZE, y + BLOCK_SIZE - 5, BLOCK_SIZE, 3)
          
          // Progress
          ctx.fillStyle = progress >= 1 ? "#00FF00" : "#FFFF00"
          ctx.fillRect(x + BLOCK_SIZE, y + BLOCK_SIZE - 5, BLOCK_SIZE * progress, 2)
        }
      }
      continue // Skip regular block drawing for refiner blocks
    }

    // Regular block drawing
    if (texture) {
      ctx.drawImage(texture, x, y, BLOCK_SIZE, BLOCK_SIZE)
    } else {
      ctx.fillStyle = blockData.color
      ctx.fillRect(x, y, BLOCK_SIZE, BLOCK_SIZE)
    }
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
  // Draw zone backgrounds
  ctx.fillStyle = "rgba(0, 0, 0, 0.5)"
  ctx.fillRect(
    upgradeZone.x, 
    upgradeZone.y - cameraOffsetY, 
    upgradeZone.width, 
    upgradeZone.height
  )
  ctx.fillRect(
    craftZone.x, 
    craftZone.y - cameraOffsetY, 
    craftZone.width, 
    craftZone.height
  )

  // Draw the texts for each zone.
  drawZoneText(ctx, upgradeZone, player, cameraOffsetY)
  drawCraftZoneText(ctx, craftZone, player, cameraOffsetY)
}

function drawZoneText(
  ctx: CanvasRenderingContext2D,
  zone: Zone,
  player: Player,
  cameraOffsetY: number
) {
  const startX = zone.x + 10
  const startY = zone.y - cameraOffsetY
  const rightX = startX + 110
  const coinIcon = getIconTexture('coin')

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

  // Left column - Buy options
  drawShopOption(ctx, "Buy Platform [J]", startX, startY + 60, 3, coinIcon)
  drawShopOption(ctx, "Buy Torch [K]", startX, startY + 100, 5, coinIcon)
  drawShopOption(ctx, "Buy Ladder [L]", startX, startY + 140, 10, coinIcon)

  // Right column - Upgrades
  const pickaxeData = PICKAXE_TYPES_ARRAY[player.pickaxeType]
  const backpackData = BACKPACK_TYPES_ARRAY[player.backpackType]
  
  // Sell option
  drawShopOption(ctx, "Sell Blocks [P]", rightX, startY + 60)

  // Pickaxe upgrade
  const pickaxeMaxed = player.pickaxeLevel >= MAX_PICKAXE_LEVEL
  const pickaxeCost = PICKAXE_BASE_COST * pickaxeData.upgradeCostMultiplier * 
    Math.pow(PICKAXE_COST_MULTIPLIER, player.pickaxeLevel - 1)
  
  drawShopOption(
    ctx, 
    "↑ Pickaxe [E]", 
    rightX, 
    startY + 100,
    pickaxeMaxed ? "MAXED" : pickaxeCost,
    coinIcon
  )

  // Backpack upgrade
  const backpackMaxed = player.backpackLevel >= MAX_BACKPACK_LEVEL
  const backpackCost = BACKPACK_BASE_COST * backpackData.upgradeCostMultiplier * 
    Math.pow(BACKPACK_COST_MULTIPLIER, player.backpackLevel - 1)
  
  drawShopOption(
    ctx, 
    "↑ Backpack [R]", 
    rightX, 
    startY + 140,
    backpackMaxed ? "MAXED" : backpackCost,
    coinIcon
  )
}

// Helper function to draw shop options with consistent formatting
function drawShopOption(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  price?: number | string,
  coinIcon?: HTMLImageElement | null
) {
  ctx.font = "14px Arial"
  ctx.fillStyle = "#fff"
  ctx.fillText(text, x, y)

  if (price) {
    ctx.font = "12px Arial"
    if (coinIcon) {
      if (price !== "MAXED") {
        ctx.drawImage(coinIcon, x + 5, y + 5, 12, 12)
        ctx.fillText(`${price}`, x + 20, y + 15)
      } else {
        ctx.fillText(`MAXED`, x + 10, y + 15)
      }
    } else {
      ctx.fillText(`${price}`, x + 10, y + 15)
    }
  }
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
  ctx.fillText("CRAFTING", zone.x + 10, zone.y + 25 - cameraOffsetY)

  // Divider
  ctx.strokeStyle = "#ffffff"
  ctx.beginPath()
  ctx.moveTo(zone.x + 10, zone.y + 35 - cameraOffsetY)
  ctx.lineTo(zone.x + zone.width - 10, zone.y + 35 - cameraOffsetY)
  ctx.stroke()

  // Next pickaxe info
  const nextPickaxeType = player.pickaxeType + 1
  const nextPickaxe = PICKAXE_TYPES_ARRAY[nextPickaxeType]
  
  if (nextPickaxe) {
    ctx.font = "14px Arial"
    ctx.fillText(`${nextPickaxe.name} Pickaxe [E]`, zone.x + 10, zone.y + 60 - cameraOffsetY)
    
    if (nextPickaxe.requirements) {
      const blockData = BLOCK_TYPES_ARRAY[nextPickaxe.requirements.blockType]
      ctx.font = "12px Arial"
      ctx.fillText(`Requires: ${nextPickaxe.requirements.amount}x ${blockData.name}`, zone.x + 20, zone.y + 80 - cameraOffsetY)
    }
  } else {
    ctx.font = "14px Arial"
    ctx.fillText("Final Pickaxe", zone.x + 10, zone.y + 80 - cameraOffsetY)
  }

  // Next backpack info
  const nextBackpackType = player.backpackType + 1
  const nextBackpack = BACKPACK_TYPES_ARRAY[nextBackpackType]

  if (nextBackpack) {
    ctx.font = "14px Arial"
    ctx.fillText(`${nextBackpack.name} Backpack [R]`, zone.x + 10, zone.y + 110 - cameraOffsetY)
  
    if (nextBackpack.requirements) {
      const blockData = BLOCK_TYPES_ARRAY[nextBackpack.requirements.blockType]
      ctx.font = "12px Arial"
      ctx.fillText(`Requires: ${nextBackpack.requirements.amount}x ${blockData.name}`, zone.x + 20, zone.y + 130 - cameraOffsetY)
    }
  } else {
    ctx.font = "14px Arial"
    ctx.fillText("Final Backpack", zone.x + 10, zone.y + 130 - cameraOffsetY)
  }
  // refiner
  if (Object.values(BLOCK_TYPES)[14])
  {
    const refiner = Object.values(BLOCK_TYPES)[14]
    ctx.font = "14px Arial"
    ctx.fillText(`${refiner.name} [M]`, zone.x + 10, zone.y + 160 - cameraOffsetY)

    if(refiner.requirements) {
      const blockRequired = Object.values(BLOCK_TYPES)[refiner.requirements.blockType]
      ctx.font = "12px Arial"
      ctx.fillText(`Requires: ${refiner.requirements.amount}x ${blockRequired.name}`, zone.x + 20, zone.y + 180 - cameraOffsetY)
    }
  }
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
    const column = Math.floor(i / 5)
    const row = (i % 5) 
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
        ctx.drawImage(coinIcon, x + 3, y + 3, 12, 12)
        ctx.fillStyle = "#FFD700"
        ctx.font = "10px Arial"
        ctx.fillText(blockData.value.toString(), x + 16, y + 12)
      }
    }
  }
}

function drawHUD(ctx: CanvasRenderingContext2D, player: Player) {
  const startX = 5
  const startY = CANVAS_HEIGHT - 320
  const iconSize = 25
  
  // Gold display.
  const coinIcon = getIconTexture('coin')
  if (coinIcon) {
    ctx.drawImage(coinIcon, startX + 10, startY + 10, iconSize, iconSize)
    ctx.fillStyle = "white"
    ctx.font = "16px Arial"
    ctx.fillText(player.gold.toString(), startX + iconSize + 15, startY + 30)
  }
  
  // Backpack display.
  const backpackIcon = getIconTexture('backpack')
  if (backpackIcon) {
    ctx.drawImage(backpackIcon, startX + 9, startY + 10 + 30, iconSize, iconSize)
    ctx.fillStyle = "white"
    ctx.font = "16px Arial"
    ctx.fillText(`${player.inventory} / ${player.backpackCapacity}`, startX + iconSize + 15, startY + 60)
  }
  
  // Pickaxe display.
  const pickaxeType = PICKAXE_TYPES_ARRAY[player.pickaxeType].name.toLowerCase()
  const pickIcon = getPickTexture(pickaxeType)
  if (pickIcon) {
    ctx.drawImage(pickIcon, startX + 10, startY + 10 + 60, iconSize, iconSize)
    ctx.fillStyle = "white"
    ctx.font = "16px Arial"
    ctx.fillText(`Level ${player.pickaxeLevel}`, startX + iconSize + 15, startY + 90)
  }
}

function drawDarknessOverlay(
  ctx: CanvasRenderingContext2D,
  blocks: Block[],
  cameraOffsetY: number
) {
  if (!lightingCtx) return

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
  for (const block of blocks) {
    // Assuming blockType 12 represents a torch.
    if (block.blockType === 12 && !block.isMined) {
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
  }
  // Reset composite mode before drawing to main canvas.
  lightingCtx.globalCompositeOperation = 'source-over'
  
  // Draw the lighting overlay onto the main canvas.
  if (lightingCanvas) {
    ctx.drawImage(lightingCanvas, 0, 0);
  }
}
