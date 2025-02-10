import { Player, Block, Zone } from './types'
import {
  CANVAS_WIDTH, CANVAS_HEIGHT, SURFACE_Y, MINE_DEPTH_PX,
  MINE_LEFT, BLOCK_SIZE, MINE_WIDTH, PLAYER_WIDTH, PLAYER_HEIGHT,
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
}

function drawBackground(ctx: CanvasRenderingContext2D, cameraOffsetY: number) {
  // Round camera offset to prevent sub-pixel rendering artifacts
  const roundedOffset = Math.round(cameraOffsetY)
  
  // Sky gradient
  const skyGradient = ctx.createLinearGradient(0, -roundedOffset, 0, SURFACE_Y - roundedOffset)
  skyGradient.addColorStop(0, "#87CEEB")    // Light blue sky
  skyGradient.addColorStop(1, "#B0E0E6")    // Slightly darker near ground
  ctx.fillStyle = skyGradient
  ctx.fillRect(0, -roundedOffset, CANVAS_WIDTH, SURFACE_Y)

  // Underground not mineable - with gradient
  const groundGradient = ctx.createLinearGradient(0, SURFACE_Y - roundedOffset, 0, SURFACE_Y - roundedOffset + 100)
  groundGradient.addColorStop(0, "#4A4A4A")    // Darker at top
  groundGradient.addColorStop(1, "#333333")    // Lighter as it goes down
  ctx.fillStyle = groundGradient
  ctx.fillRect(0, SURFACE_Y - roundedOffset, CANVAS_WIDTH, MINE_DEPTH_PX)

  // Underground shaft from sky to darkness
  const shaftGradient = ctx.createLinearGradient(0, SURFACE_Y - roundedOffset, 0, SURFACE_Y - roundedOffset + 100)
  shaftGradient.addColorStop(0, "#B0E0E6")     // Match lower sky color
  shaftGradient.addColorStop(1, "#6CA6CD")     // Darker closer to bedrock
  ctx.fillStyle = shaftGradient
  ctx.fillRect(
    MINE_LEFT, 
    SURFACE_Y - roundedOffset, 
    MINE_LEFT + 80,
    MINE_DEPTH_PX
  )
}

function drawBlocks(
  ctx: CanvasRenderingContext2D, 
  blocks: Block[], 
  cameraOffsetY: number
) {
  for (const block of blocks) {
    if (!block.isMined) {

      const blockData = Object.values(BLOCK_TYPES)[block.blockType]
      ctx.fillStyle = blockData.color
      
      ctx.fillRect(
        block.x, 
        block.y - cameraOffsetY, 
        BLOCK_SIZE, 
        BLOCK_SIZE
      )
      ctx.strokeStyle = "#000000"
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
      zone.y + 120 - cameraOffsetY
    )
  
    if (nextBackpack.requirements) {
      const blockType = Object.values(BLOCK_TYPES)[nextBackpack.requirements.blockType]
      ctx.font = "12px Arial"
      ctx.fillText(
        `Requires: ${nextBackpack.requirements.amount}x ${blockType.name}`,
        zone.x + 20,
        zone.y + 140 - cameraOffsetY
      )
    }
  } else {
    ctx.font = "14px Arial"
    ctx.fillText(
      "Final Backpack",
      zone.x + 10,
      zone.y + 160 - cameraOffsetY
    )
  }
}


function drawInventory(
  ctx: CanvasRenderingContext2D,
  player: Player
) {
  const slotSize = 40
  const padding = 5
  const startX = 10
  const startY = CANVAS_HEIGHT - 170
  
  // Draw inventory slots
  for (let i = 0; i < 10; i++) {
    // Calculate position
    const column = Math.floor(i / 5)  // 0 for first column, 1 for second
    const row = i % 5                 // 0-4 for each column
    
    const x = startX + column * (slotSize + padding)
    const y = startY - row * (slotSize + padding)

    const blockData = Object.values(BLOCK_TYPES)[i]
    const blockValue = blockData.value

    // Draw slot background
    ctx.fillStyle = i === player.selectedSlot ? "#FFFF00" : "#E4E6EB"
    ctx.fillRect(x, y, slotSize, slotSize)
    
    // Draw block count and value
    if (player.blockInventory[i] > 0) {
      // Draw block icon
      ctx.fillStyle = blockData.color
      ctx.fillRect(x + 3, y + 3, slotSize - 6, slotSize - 6)
      
      // Draw count
      ctx.fillStyle = "white"
      ctx.font = "12px Arial"
      ctx.fillText(
        player.blockInventory[i].toString(),
        x + 6,
        y + slotSize - 8
      )
      
      // Draw value
      ctx.fillStyle = "#FFD700"  // Gold color
      ctx.font = "10px Arial"
      ctx.fillText(
        `${blockValue}g`,
        x + 5,
        y + 14
      )
    }
  }
}

export function updateHUD(player: Player) {
  const goldDisplay = document.getElementById("goldDisplay")
  const inventoryDisplay = document.getElementById("inventoryDisplay")
  const pickaxeDisplay = document.getElementById("pickaxeDisplay")
  const backpackDisplay = document.getElementById("backpackDisplay")

  if (goldDisplay) goldDisplay.textContent = player.gold.toString()
  if (inventoryDisplay) {
    inventoryDisplay.textContent = 
      `${player.inventory} / ${player.backpackCapacity}`
  }
  if (pickaxeDisplay) {
    pickaxeDisplay.textContent = Object.values(PICKAXE_TYPES)[player.pickaxeType].name + " lvl " + String(player.pickaxeLevel)
  }
  if (backpackDisplay) {
    backpackDisplay.textContent = Object.values(BACKPACK_TYPES)[player.backpackType].name + " lvl " + String(player.backpackLevel)
  }
} 