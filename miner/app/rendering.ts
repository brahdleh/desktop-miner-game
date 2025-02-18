import { Player, Block, Zone } from './types'
import {
  CANVAS_WIDTH, CANVAS_HEIGHT, SURFACE_Y, MINE_DEPTH_PX,
  MINE_LEFT, BLOCK_SIZE, PLAYER_WIDTH, PLAYER_HEIGHT,
  DEFAULT_MINE_TIME,
  PICKAXE_COST_MULTIPLIER, BACKPACK_COST_MULTIPLIER,
  BLOCK_TYPES,
  PICKAXE_TYPES,
  PICKAXE_MINE_INCREMENT,
  BACKPACK_TYPES,
  MAX_PICKAXE_LEVEL,
  MAX_BACKPACK_LEVEL,
  PICKAXE_BASE_COST,
  BACKPACK_BASE_COST,
  REFINING_TIME
} from './constants'
import { getBlockTexture, getSceneTexture, getIconTexture, getPickTexture } from './assets'

// Cache arrays so that Object.values() isn't re-computed each frame.
const BLOCK_TYPES_ARRAY = Object.values(BLOCK_TYPES)
const PICKAXE_TYPES_ARRAY = Object.values(PICKAXE_TYPES)
const BACKPACK_TYPES_ARRAY = Object.values(BACKPACK_TYPES)

const MAX_DARKNESS = 0.85 // Maximum darkness level (0-1)
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
  sellZone: Zone
) {
  // Clear the main canvas
  ctx.clearRect(0, -CANVAS_HEIGHT, CANVAS_WIDTH, CANVAS_HEIGHT)

  drawBackground(ctx, cameraOffsetY)
  drawBlocks(player.y, ctx, blocks, cameraOffsetY)
  drawPlayer(ctx, player, cameraOffsetY)
  drawMiningProgress(ctx, miningTargetBlock, miningProgress, player, cameraOffsetY)
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
    ctx.drawImage(skyTexture, 0, -roundedOffset - 100, CANVAS_WIDTH, 100 + SURFACE_Y)
  }

  // Draw buildings on surface
  const shopTexture = getSceneTexture('shop')
  const smithTexture = getSceneTexture('smith')
  //const sellTexture = getSceneTexture('sell')
  
  if (shopTexture) {
    ctx.drawImage(shopTexture, 0, SURFACE_Y - 160 - roundedOffset + 20, 160, 180)
  }
  
  if (smithTexture) {
    ctx.drawImage(smithTexture, CANVAS_WIDTH - 160, SURFACE_Y - 160 - roundedOffset + 20, 160, 180)
  }
  
  //if (sellTexture) {
  //  ctx.drawImage(sellTexture, 160, SURFACE_Y - 80 - roundedOffset + 10, 80, 90)
  //}

  // Draw underground areas
  const undergroundTexture = getSceneTexture('underground')
  const mineTexture = getSceneTexture('mine')
  const dirtTexture = getSceneTexture('dirt')
  
  if (undergroundTexture) {
    for (let y = SURFACE_Y; y < SURFACE_Y + MINE_DEPTH_PX; y += 160) {
      for (let x = 0; x < CANVAS_WIDTH; x += 160) {
        ctx.drawImage(undergroundTexture, x, y - roundedOffset, 160, 160)
      }
    }
  }

  // Draw mine shaft
  if (mineTexture) {
    for (let y = SURFACE_Y; y < SURFACE_Y + MINE_DEPTH_PX; y += 160) {
      ctx.drawImage(mineTexture, MINE_LEFT, y - roundedOffset, 160, 160)
      ctx.drawImage(mineTexture, MINE_LEFT + 160, y - roundedOffset, 160, 160)
    }
  }
  if (dirtTexture) {
    ctx.drawImage(dirtTexture, MINE_LEFT, SURFACE_Y - roundedOffset, 160, 40)
    ctx.drawImage(dirtTexture, MINE_LEFT + 160, SURFACE_Y - roundedOffset, 160, 40)
  }
}

function drawBlocks(
  player_y: number,
  ctx: CanvasRenderingContext2D, 
  blocks: Block[], 
  cameraOffsetY: number
) {
  for (const block of blocks) {
    if (block.isMined) continue
    if (Math.abs(block.y - player_y) > CANVAS_HEIGHT) continue // just draw what is in sight

    const blockData = BLOCK_TYPES_ARRAY[block.blockType]
    const texture = getBlockTexture(blockData.name)
    const x = block.x
    const y = block.y - cameraOffsetY

    if (texture) {
      ctx.drawImage(texture, x, y, BLOCK_SIZE, BLOCK_SIZE)
    } else {
      ctx.fillStyle = blockData.color
      ctx.fillRect(x, y, BLOCK_SIZE, BLOCK_SIZE)
    }
    
    // Optional: Draw a light border for visibility.
    ctx.strokeStyle = "rgba(0, 0, 0, 0.2)"
    ctx.strokeRect(x, y, BLOCK_SIZE, BLOCK_SIZE)

    // Draw refiner state if this is a refiner
    if (block.blockType === 14 && block.machineState) {
      if (block.machineState.processingBlockType !== null) {
        // Draw the block being processed in the center
        const processedBlockData = BLOCK_TYPES_ARRAY[block.machineState.processingBlockType]
        const processedTexture = getBlockTexture(processedBlockData.name)
        
        if (processedTexture) {
          ctx.drawImage(processedTexture, x + BLOCK_SIZE/4, y + BLOCK_SIZE/4, BLOCK_SIZE/2, BLOCK_SIZE/2)
        } else {
          ctx.fillStyle = processedBlockData.color
          ctx.fillRect(x + BLOCK_SIZE/4, y + BLOCK_SIZE/4, BLOCK_SIZE/2, BLOCK_SIZE/2)
        }

        // Draw progress bar
        const elapsedTime = Date.now() - (block.machineState.processingStartTime || 0)
        const progress = Math.min(elapsedTime / REFINING_TIME, 1)
        
        // Background
        ctx.fillStyle = "rgba(0, 0, 0, 0.5)"
        ctx.fillRect(x, y + BLOCK_SIZE - 5, BLOCK_SIZE, 3)
        
        // Progress
        ctx.fillStyle = progress >= 1 ? "#00FF00" : "#FFFF00"
        ctx.fillRect(x, y + BLOCK_SIZE - 5, BLOCK_SIZE * progress, 3)

        // Outline when complete
        if (progress >= 1) {
          ctx.strokeStyle = "#00FF00"
          ctx.lineWidth = 2
          ctx.strokeRect(x, y, BLOCK_SIZE, BLOCK_SIZE)
          ctx.lineWidth = 1
        }
      }
    }
  }
}

function drawPlayer(
  ctx: CanvasRenderingContext2D, 
  player: Player, 
  cameraOffsetY: number
) {
  ctx.fillStyle = "#FF0000"
  ctx.fillRect(
    player.x, 
    player.y - cameraOffsetY, 
    PLAYER_WIDTH, 
    PLAYER_HEIGHT
  )
}

function drawMiningProgress(
  ctx: CanvasRenderingContext2D,
  miningTargetBlock: Block | null,
  miningProgress: number,
  player: Player,
  cameraOffsetY: number
) {
  if (!miningTargetBlock) return

  const pickaxeData = PICKAXE_TYPES_ARRAY[player.pickaxeType]
  const pickaxeBoost = pickaxeData.miningTimeMultiplier * Math.pow(PICKAXE_MINE_INCREMENT, player.pickaxeLevel - 1)
  const baseTime = DEFAULT_MINE_TIME / pickaxeBoost
  const blockData = BLOCK_TYPES_ARRAY[miningTargetBlock.blockType]
  const requiredTime = baseTime * blockData.miningTimeMultiplier

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
  ctx.fillStyle = "#fff"
  
  // Header
  ctx.font = "bold 18px Arial"
  ctx.fillText("SHOP", zone.x + 10, zone.y + 25 - cameraOffsetY)

  // Divider
  ctx.strokeStyle = "#ffffff"
  ctx.beginPath()
  ctx.moveTo(zone.x + 10, zone.y + 35 - cameraOffsetY)
  ctx.lineTo(zone.x + zone.width - 10, zone.y + 35 - cameraOffsetY)
  ctx.stroke()

  // Options
  ctx.font = "14px Arial"
  ctx.fillText("Sell Blocks [P]", zone.x + 10, zone.y + 60 - cameraOffsetY)

  // Pickaxe upgrade
  const pickaxeMaxed = player.pickaxeLevel >= MAX_PICKAXE_LEVEL
  ctx.fillText(pickaxeMaxed ? "Pickaxe MAX" : "↑ Pickaxe [E]", zone.x + 10, zone.y + 90 - cameraOffsetY)
  if (!pickaxeMaxed) {
    const pickaxeData = PICKAXE_TYPES_ARRAY[player.pickaxeType]
    const baseCost = PICKAXE_BASE_COST * pickaxeData.upgradeCostMultiplier
    const cost = baseCost * Math.pow(PICKAXE_COST_MULTIPLIER, player.pickaxeLevel - 1)
    ctx.font = "12px Arial"
    ctx.fillText(`Cost: ${cost} gold`, zone.x + 20, zone.y + 110 - cameraOffsetY)
  }
  
  // Backpack upgrade
  const backpackMaxed = player.backpackLevel >= MAX_BACKPACK_LEVEL
  ctx.font = "14px Arial"
  ctx.fillText(backpackMaxed ? "Backpack MAX" : "↑ Backpack [R]", zone.x + 10, zone.y + 140 - cameraOffsetY)
  if (!backpackMaxed) {
    const backpackData = BACKPACK_TYPES_ARRAY[player.backpackType]
    const baseCost = BACKPACK_BASE_COST * backpackData.upgradeCostMultiplier
    const cost = baseCost * Math.pow(BACKPACK_COST_MULTIPLIER, player.backpackLevel - 1)
    ctx.font = "12px Arial"
    ctx.fillText(`Cost: ${cost} gold`, zone.x + 20, zone.y + 160 - cameraOffsetY)
  }

  // Buy Options
  ctx.font = "14px Arial"
  ctx.fillText("Buy Platform [J]", zone.x + 120, zone.y + 60 - cameraOffsetY)
  ctx.fillText("Buy Torch [K]", zone.x + 120, zone.y + 90 - cameraOffsetY)
  ctx.fillText("Buy Ladder [L]", zone.x + 120, zone.y + 120 - cameraOffsetY)
  ctx.fillText("Buy Refiner [M]", zone.x + 120, zone.y + 150 - cameraOffsetY)
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
    ctx.fillText("Final Backpack", zone.x + 10, zone.y + 150 - cameraOffsetY)
  }
}

function drawInventory(ctx: CanvasRenderingContext2D, player: Player) {
  const slotSize = 35
  const padding = 5
  const startX = 10
  const startY = CANVAS_HEIGHT - 50
  
  const selectedSlotTexture = getIconTexture('inventory_selected')
  const unselectedSlotTexture = getIconTexture('inventory')
  
  for (let i = 0; i < Object.keys(BLOCK_TYPES).length; i++) {
    const column = Math.floor(i / 5)
    const row = i % 5
    const x = startX + column * (slotSize + padding)
    const y = startY - row * (slotSize + padding)

    // Draw the slot background.
    const slotTexture = i === player.selectedSlot ? selectedSlotTexture : unselectedSlotTexture
    if (slotTexture) {
      ctx.drawImage(slotTexture, x, y, slotSize, slotSize)
    }

    // If there's any block in this slot, draw its texture, count, and value.
    if (player.blockInventory[i] > 0) {
      const blockData = BLOCK_TYPES_ARRAY[i]
      const texture = getBlockTexture(blockData.name)
      
      if (texture) {
        ctx.drawImage(texture, x + 3, y + 3, slotSize - 6, slotSize - 6)
      }
      
      ctx.fillStyle = "white"
      ctx.font = "11px Arial"
      ctx.fillText(player.blockInventory[i].toString(), x + 6, y + slotSize - 8)
      
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
