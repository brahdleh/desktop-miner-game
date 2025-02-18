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
  BACKPACK_BASE_COST
} from './constants'
import { getBlockTexture, getSceneTexture, getIconTexture, getPickTexture } from './assets'

const MAX_DARKNESS = 0.85 // Maximum darkness level (0-1)
const DARKNESS_START = 300 // Y position where darkness starts
const DARKNESS_RANGE = 1000 // Distance over which darkness increases to max
const TORCH_INNER_RADIUS = 160
const TORCH_OUTER_RADIUS = 240

/*
function calculateDarknessLevel(y: number): number {
  if (y < DARKNESS_START) return 0
  const darknessFactor = Math.min(1, (y - DARKNESS_START) / DARKNESS_RANGE)
  return darknessFactor * MAX_DARKNESS
}
*/

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
  // Clear canvas
  ctx.clearRect(0, -CANVAS_HEIGHT, CANVAS_WIDTH, CANVAS_HEIGHT)

  drawBackground(ctx, cameraOffsetY)
  drawBlocks(ctx, blocks, cameraOffsetY)
  drawPlayer(ctx, player, cameraOffsetY)
  drawMiningProgress(ctx, miningTargetBlock, miningProgress, player, cameraOffsetY)
  drawZones(ctx, upgradeZone, sellZone, player, cameraOffsetY)
  drawInventory(ctx, player)
  drawHUD(ctx, player)
  drawDarknessOverlay(ctx, blocks, cameraOffsetY)
}

function drawBackground(ctx: CanvasRenderingContext2D, cameraOffsetY: number) {
  const roundedOffset = Math.round(cameraOffsetY)
  
  // Draw sky
  const skyTexture = getSceneTexture('sky')
  if (skyTexture) {
    ctx.drawImage(skyTexture, 0, -roundedOffset-100, CANVAS_WIDTH, 100+SURFACE_Y)
  }

  // Draw buildings on surface
  const shopTexture = getSceneTexture('shop')
  const smithTexture = getSceneTexture('smith')
  const sellTexture = getSceneTexture('sell')
  
  if (shopTexture) {
    ctx.drawImage(shopTexture, 0, SURFACE_Y - 160 - roundedOffset + 20, 160, 160 + 20)
  }
  
  if (smithTexture) {
    ctx.drawImage(smithTexture, CANVAS_WIDTH - 160, SURFACE_Y - 160 - roundedOffset + 20, 160, 160 + 20)
  }
  
  if (sellTexture) {
    ctx.drawImage(sellTexture, 160, SURFACE_Y - 80 - roundedOffset + 10, 80, 80 + 10)
  }

  // Draw underground areas
  const undergroundTexture = getSceneTexture('underground')
  const mineTexture = getSceneTexture('mine')
  
  // Tile the underground texture
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
}

function drawBlocks(
  ctx: CanvasRenderingContext2D, 
  blocks: Block[], 
  cameraOffsetY: number
) {
  for (const block of blocks) {
    if (!block.isMined) {
      const blockData = Object.values(BLOCK_TYPES)[block.blockType]
      const texture = getBlockTexture(blockData.name)
      
      if (texture) {
        // Draw texture
        ctx.drawImage(
          texture,
          block.x,
          block.y - cameraOffsetY,
          BLOCK_SIZE,
          BLOCK_SIZE
        )
      } else {
        // Fallback to color if texture not loaded
        ctx.fillStyle = blockData.color
        ctx.fillRect(
          block.x,
          block.y - cameraOffsetY,
          BLOCK_SIZE,
          BLOCK_SIZE
        )
      }
      
      // Optional: Keep the border for better visibility
      ctx.strokeStyle = "rgba(0, 0, 0, 0.2)"
      ctx.strokeRect(
        block.x,
        block.y - cameraOffsetY,
        BLOCK_SIZE,
        BLOCK_SIZE
      )
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

  // Calculate required time based on block type
  const pickaxeData = Object.values(PICKAXE_TYPES)[player.pickaxeType]
  const pickaxeBoost = pickaxeData.miningTimeMultiplier * Math.pow(PICKAXE_MINE_INCREMENT, player.pickaxeLevel - 1)
  const baseTime = DEFAULT_MINE_TIME / pickaxeBoost
  const blockData = Object.values(BLOCK_TYPES)[miningTargetBlock.blockType]
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

  // Draw zone text
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
  
  // Shop header
  ctx.font = "bold 18px Arial"  // Larger, bold font for header
  ctx.fillText(
    "SHOP",
    zone.x + 10,
    zone.y + 25 - cameraOffsetY
  )

  // Divider line
  ctx.strokeStyle = "#ffffff"
  ctx.beginPath()
  ctx.moveTo(zone.x + 10, zone.y + 35 - cameraOffsetY)
  ctx.lineTo(zone.x + zone.width - 10, zone.y + 35 - cameraOffsetY)
  ctx.stroke()

  // Shop options with improved spacing and formatting
  ctx.font = "14px Arial"
  
  // Sell blocks option
  ctx.fillText(
    "Sell Blocks [P]",
    zone.x + 10,
    zone.y + 60 - cameraOffsetY
  )
  
  // Pickaxe upgrade
  const pickaxeMaxed = player.pickaxeLevel >= MAX_PICKAXE_LEVEL
  ctx.fillText(
    pickaxeMaxed ? "Pickaxe MAX" : "↑ Pickaxe [E]",
    zone.x + 10,
    zone.y + 90 - cameraOffsetY
  )
  if (!pickaxeMaxed) {
    const pickaxeData = Object.values(PICKAXE_TYPES)[player.pickaxeType]
    const baseCost = PICKAXE_BASE_COST * pickaxeData.upgradeCostMultiplier
    const cost = baseCost * Math.pow(PICKAXE_COST_MULTIPLIER, player.pickaxeLevel - 1)
    ctx.font = "12px Arial"
    ctx.fillText(
      `Cost: ${cost} gold`,
      zone.x + 20,
      zone.y + 110 - cameraOffsetY
    )
  }
  
  // Backpack upgrade
  const backpackMaxed = player.backpackLevel >= MAX_BACKPACK_LEVEL
  ctx.font = "14px Arial"
  ctx.fillText(
    backpackMaxed ? "Backpack MAX" : "↑ Backpack [R]",
    zone.x + 10,
    zone.y + 140 - cameraOffsetY
  )
  if (!backpackMaxed) {
    const backpackData = Object.values(BACKPACK_TYPES)[player.backpackType]
    const baseCost = BACKPACK_BASE_COST * backpackData.upgradeCostMultiplier
    const cost = baseCost * Math.pow(BACKPACK_COST_MULTIPLIER, player.backpackLevel - 1)
    ctx.font = "12px Arial"
    ctx.fillText(
      `Cost: ${cost} gold`,
      zone.x + 20,
      zone.y + 160 - cameraOffsetY
    )
  }

  // Buy Options
  ctx.font = "14px Arial"
  ctx.fillText(
    "Buy Platform [J]",
    zone.x + 120,
    zone.y + 60 - cameraOffsetY
  )
  ctx.fillText(
    "Buy Torch [K]",
    zone.x + 120,
    zone.y + 90 - cameraOffsetY
  )
  ctx.fillText(
    "Buy Ladder [L]",
    zone.x + 120,
    zone.y + 120 - cameraOffsetY
  )
  
}

function drawCraftZoneText(
  ctx: CanvasRenderingContext2D,
  zone: Zone,
  player: Player,
  cameraOffsetY: number
) {
  ctx.fillStyle = "#fff"
  
  // Crafting header
  ctx.font = "bold 18px Arial"
  ctx.fillText(
    "CRAFTING",
    zone.x + 10,
    zone.y + 25 - cameraOffsetY
  )

  // Divider line
  ctx.strokeStyle = "#ffffff"
  ctx.beginPath()
  ctx.moveTo(zone.x + 10, zone.y + 35 - cameraOffsetY)
  ctx.lineTo(zone.x + zone.width - 10, zone.y + 35 - cameraOffsetY)
  ctx.stroke()

  // Show next pickaxe if available
  const nextPickaxeType = player.pickaxeType + 1
  const nextPickaxe = Object.values(PICKAXE_TYPES)[nextPickaxeType]
  
  if (nextPickaxe) {
    ctx.font = "14px Arial"
    ctx.fillText(
      `${nextPickaxe.name} Pickaxe [E]`,
      zone.x + 10,
      zone.y + 60 - cameraOffsetY
    )
    
    if (nextPickaxe.requirements) {
      const blockType = Object.values(BLOCK_TYPES)[nextPickaxe.requirements.blockType]
      ctx.font = "12px Arial"
      ctx.fillText(
        `Requires: ${nextPickaxe.requirements.amount}x ${blockType.name}`,
        zone.x + 20,
        zone.y + 80 - cameraOffsetY
      )
    }
  } else {
    ctx.font = "14px Arial"
    ctx.fillText(
      "Final Pickaxe",
      zone.x + 10,
      zone.y + 80 - cameraOffsetY
    )
  }


  // Show next backpack if available
  const nextBackpackType = player.backpackType + 1
  const nextBackpack = Object.values(BACKPACK_TYPES)[nextBackpackType]

  if (nextBackpack) {
    ctx.font = "14px Arial"
    ctx.fillText(
      `${nextBackpack.name} Backpack [R]`,
      zone.x + 10,
      zone.y + 110 - cameraOffsetY
    )
  
    if (nextBackpack.requirements) {
      const blockType = Object.values(BLOCK_TYPES)[nextBackpack.requirements.blockType]
      ctx.font = "12px Arial"
      ctx.fillText(
        `Requires: ${nextBackpack.requirements.amount}x ${blockType.name}`,
        zone.x + 20,
        zone.y + 130 - cameraOffsetY
      )
    }
  } else {
    ctx.font = "14px Arial"
    ctx.fillText(
      "Final Backpack",
      zone.x + 10,
      zone.y + 150 - cameraOffsetY
    )
  }
}


function drawInventory(ctx: CanvasRenderingContext2D, player: Player) {
  const slotSize = 35
  const padding = 5
  const startX = 10
  const startY = CANVAS_HEIGHT - 160
  
  const selectedSlotTexture = getIconTexture('inventory_selected')
  const unselectedSlotTexture = getIconTexture('inventory')
  
  // Draw inventory slots
  for (let i = 0; i < Object.keys(BLOCK_TYPES).length; i++) {
    const column = Math.floor(i / 5)
    const row = i % 5
    
    const x = startX + column * (slotSize + padding)
    const y = startY - row * (slotSize + padding)

    // Draw slot background using sprites
    const slotTexture = i === player.selectedSlot ? selectedSlotTexture : unselectedSlotTexture
    if (slotTexture) {
      ctx.drawImage(slotTexture, x, y, slotSize, slotSize)
    }

    // Draw block contents if any
    if (player.blockInventory[i] > 0) {
      const blockData = Object.values(BLOCK_TYPES)[i]
      const texture = getBlockTexture(blockData.name)
      
      if (texture) {
        ctx.drawImage(texture, x + 3, y + 3, slotSize - 6, slotSize - 6)
      }
      
      // Draw count
      ctx.fillStyle = "white"
      ctx.font = "11px Arial"
      ctx.fillText(player.blockInventory[i].toString(), x + 6, y + slotSize - 8)
      
      // Draw value with coin icon
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

// Rename updateHUD to drawHUD since it's now drawing directly
function drawHUD(ctx: CanvasRenderingContext2D, player: Player) {
  const padding = 10
  const iconSize = 25
  
  // Draw HUD background
  ctx.fillStyle = "rgba(0, 0, 0, 0.7)"
  ctx.fillRect(padding, CANVAS_HEIGHT - 100 - padding, 200, 100)
  
  // Draw gold with coin icon
  const coinIcon = getIconTexture('coin')
  if (coinIcon) {
    ctx.drawImage(coinIcon, padding + 5, CANVAS_HEIGHT - 100, iconSize, iconSize)
    ctx.fillStyle = "white"
    ctx.font = "16px Arial"
    ctx.fillText(player.gold.toString(), padding + iconSize + 10, CANVAS_HEIGHT - 100 + 20)
  }
  
  // Draw backpack with icon
  const backpackIcon = getIconTexture('backpack')
  if (backpackIcon) {
    ctx.drawImage(backpackIcon, padding + 5, CANVAS_HEIGHT - 100 + 30, iconSize, iconSize)
    ctx.fillStyle = "white"
    ctx.font = "16px Arial"
    ctx.fillText(
      `${player.inventory} / ${player.backpackCapacity}`,
      padding + iconSize + 10,
      CANVAS_HEIGHT - 100 + 50
    )
  }
  
  // Draw current pickaxe
  const pickaxeType = Object.values(PICKAXE_TYPES)[player.pickaxeType].name.toLowerCase()
  const pickIcon = getPickTexture(pickaxeType)
  if (pickIcon) {
    ctx.drawImage(pickIcon, padding + 5, CANVAS_HEIGHT - 100 + 55, iconSize, iconSize)
    ctx.fillStyle = "white"
    ctx.font = "16px Arial"
    ctx.fillText(
      `Level ${player.pickaxeLevel}`,
      padding + iconSize + 10,
      CANVAS_HEIGHT - 100 + 75
    )
  }
}

function drawDarknessOverlay(
  ctx: CanvasRenderingContext2D,
  blocks: Block[],
  cameraOffsetY: number
) {
  // Create a new canvas for the lighting
  const lightingCanvas = document.createElement('canvas')
  lightingCanvas.width = CANVAS_WIDTH
  lightingCanvas.height = CANVAS_HEIGHT
  const lightingCtx = lightingCanvas.getContext('2d')
  if (!lightingCtx) return

  // Fill with darkness gradient
  const gradient = lightingCtx.createLinearGradient(
    0, DARKNESS_START - cameraOffsetY,
    0, DARKNESS_START + DARKNESS_RANGE - cameraOffsetY
  )
  gradient.addColorStop(0, 'rgba(0, 0, 0, 0)')
  gradient.addColorStop(1, `rgba(0, 0, 0, ${MAX_DARKNESS})`)
  
  lightingCtx.fillStyle = gradient
  lightingCtx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

  // Create light around torches
  lightingCtx.globalCompositeOperation = 'destination-out'
  blocks.forEach(block => {
    if (block.blockType === 12 && !block.isMined) {
      const gradient = lightingCtx.createRadialGradient(
        block.x + BLOCK_SIZE/2,
        block.y - cameraOffsetY + BLOCK_SIZE/2,
        0,
        block.x + BLOCK_SIZE/2,
        block.y - cameraOffsetY + BLOCK_SIZE/2,
        TORCH_OUTER_RADIUS
      )
      
      gradient.addColorStop(0, 'rgba(0, 0, 0, 1)')
      gradient.addColorStop(TORCH_INNER_RADIUS/TORCH_OUTER_RADIUS, 'rgba(0, 0, 0, 0.7)')
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')
      
      lightingCtx.fillStyle = gradient
      lightingCtx.beginPath()
      lightingCtx.arc(
        block.x + BLOCK_SIZE/2,
        block.y - cameraOffsetY + BLOCK_SIZE/2,
        TORCH_OUTER_RADIUS,
        0,
        Math.PI * 2
      )
      lightingCtx.fill()
    }
  })

  // Draw the lighting canvas onto the main canvas
  ctx.drawImage(lightingCanvas, 0, 0)
}