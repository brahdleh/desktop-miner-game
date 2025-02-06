"use client"

import { useEffect, useRef } from "react"

export default function MiningGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (typeof window === "undefined" || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")!
    if (!ctx) return

    // -------------------------------------------------------------------------
    // Game constants
    // -------------------------------------------------------------------------
    const CANVAS_WIDTH = 800
    const CANVAS_HEIGHT = 600
    const BLOCK_SIZE = 40
    const PLAYER_WIDTH = 25
    const PLAYER_HEIGHT = 60
    const GRAVITY = 0.5
    const JUMP_STRENGTH = 10
    const MOVE_SPEED = 3
    const MINE_WIDTH = 8 // Number of blocks wide
    const MINE_LEFT = (CANVAS_WIDTH - MINE_WIDTH * BLOCK_SIZE) / 2
    const SURFACE_Y = 5 * BLOCK_SIZE // 3 blocks from the top, adjust as desired
    const UPGRADE_COST = 4
    const DEFAULT_MINE_TIME = 2000
    const UPGRADED_MINE_TIME = 1000

    // The total mine depth in blocks, for drawing large background
    const MINE_DEPTH_BLOCKS = 50
    const MINE_DEPTH_PX = MINE_DEPTH_BLOCKS * BLOCK_SIZE

    // Define zones on the surface where user must stand to do an action
    // Top-left for upgrade, top-right for selling:
    const UPGRADE_ZONE = {
      x: 0,
      y: SURFACE_Y - PLAYER_HEIGHT,
      width: 100,
      height: PLAYER_HEIGHT,
    }
    const SELL_ZONE = {
      x: CANVAS_WIDTH - 100,
      y: SURFACE_Y - PLAYER_HEIGHT,
      width: 100,
      height: PLAYER_HEIGHT,
    }

    // -------------------------------------------------------------------------
    // Game variables
    // -------------------------------------------------------------------------
    const player = {
      x: CANVAS_WIDTH / 2 - PLAYER_WIDTH / 2,
      y: SURFACE_Y - PLAYER_HEIGHT,
      velocityX: 0,
      velocityY: 0,
      onGround: false,
      inventory: 0,
      gold: 0,
      currentPick: "default" as "default" | "upgraded",
    }

    interface Block {
      x: number
      y: number
      isMined: boolean
      mineable: boolean
    }

    const blocks: Block[] = []
    let cameraOffsetY = 0
    let miningProgress = 0
    let miningTargetBlock: Block | null = null
    const keys: { [key: string]: boolean } = {}

    // -------------------------------------------------------------------------
    // Initialization
    // -------------------------------------------------------------------------
    function initGame() {
      // 1) Generate top "grass" platform
      //    - If it’s within the shaft's horizontal range, we'll mark it as mineable=false
      for (let x = 0; x < CANVAS_WIDTH; x += BLOCK_SIZE) {
        if(x >= MINE_LEFT && x < MINE_LEFT + MINE_WIDTH * BLOCK_SIZE) {
          blocks.push({
            x,
            y: SURFACE_Y,
            isMined: false,
            mineable: true, // surface is mineable in shaft range
          })
        } else {
          blocks.push({
            x,
            y: SURFACE_Y,
            isMined: false,
            mineable: false, // surface is NOT mineable in shaft range
          })
        }
      }

      // 2) Generate mine shaft (all mineable)
      for (let y = SURFACE_Y + BLOCK_SIZE; y < SURFACE_Y + MINE_DEPTH_PX; y += BLOCK_SIZE) {
        for (let x = MINE_LEFT; x < MINE_LEFT + MINE_WIDTH * BLOCK_SIZE; x += BLOCK_SIZE) {
          blocks.push({
            x,
            y,
            isMined: false,
            mineable: true,
          })
        }
      }
    }

    // -------------------------------------------------------------------------
    // HUD
    // -------------------------------------------------------------------------
    function updateHUD() {
      const goldDisplay = document.getElementById("goldDisplay")
      const inventoryDisplay = document.getElementById("inventoryDisplay")
      const pickaxeDisplay = document.getElementById("pickaxeDisplay")

      if (goldDisplay) goldDisplay.textContent = player.gold.toString()
      if (inventoryDisplay) inventoryDisplay.textContent = player.inventory.toString()
      if (pickaxeDisplay) {
        pickaxeDisplay.textContent =
          player.currentPick === "default" ? "Default" : "Upgraded"
      }
    }

    // -------------------------------------------------------------------------
    // Input & Player Movement
    // -------------------------------------------------------------------------
    function handleInput() {
      player.velocityX = 0
      if (keys["ArrowLeft"] || keys["a"]) player.velocityX = -MOVE_SPEED
      if (keys["ArrowRight"] || keys["d"]) player.velocityX = MOVE_SPEED
      if ((keys["ArrowUp"] || keys["w"]) && player.onGround) {
        player.velocityY = -JUMP_STRENGTH
        player.onGround = false
      }
    }

    function collision(a: { x: number; y: number }, b: { x: number; y: number }) {
      return (
        a.x < b.x + BLOCK_SIZE &&
        a.x + PLAYER_WIDTH > b.x &&
        a.y < b.y + BLOCK_SIZE &&
        a.y + PLAYER_HEIGHT > b.y
      )
    }

    function updatePlayer() {
      player.x += player.velocityX
      player.y += player.velocityY
      player.velocityY += GRAVITY

      // Collision detection with blocks
      player.onGround = false
      for (const block of blocks) {
        if (!block.isMined && collision(player, block)) {
          // Vertical collision
          if (player.velocityY > 0 && player.y + PLAYER_HEIGHT <= block.y + player.velocityY) {
            // landing on top of a block
            player.y = block.y - PLAYER_HEIGHT
            player.velocityY = 0
            player.onGround = true
          } else if (
            player.velocityY < 0 &&
            player.y >= block.y + BLOCK_SIZE + player.velocityY
          ) {
            // hitting the bottom of a block from below
            player.y = block.y + BLOCK_SIZE
            player.velocityY = 0
          }
          // Horizontal collisions
          if (player.velocityX > 0 && player.x + PLAYER_WIDTH <= block.x + player.velocityX) {
            player.x = block.x - PLAYER_WIDTH
          } else if (
            player.velocityX < 0 &&
            player.x >= block.x + BLOCK_SIZE + player.velocityX
          ) {
            player.x = block.x + BLOCK_SIZE
          }
        }
      }

      // Handle left/right boundary restrictions:
      // - If player is ABOVE surface, let them move across the entire canvas
      // - If player is BELOW surface, clamp to the shaft walls
      if (player.y > SURFACE_Y) {
        // Below surface -> clamp to the shaft only
        const leftLimit = MINE_LEFT
        const rightLimit = MINE_LEFT + MINE_WIDTH * BLOCK_SIZE - PLAYER_WIDTH
        if (player.x < leftLimit) player.x = leftLimit
        if (player.x > rightLimit) player.x = rightLimit
      } else {
        // At or above surface -> clamp to canvas edges
        player.x = Math.max(0, Math.min(player.x, CANVAS_WIDTH - PLAYER_WIDTH))
      }

      // Camera follow (vertical)
      // Keep the player near the bottom or top of the canvas as they move
      cameraOffsetY = Math.max(player.y + PLAYER_HEIGHT/2 - CANVAS_HEIGHT/4)
    }

    // -------------------------------------------------------------------------
    // Mining
    // -------------------------------------------------------------------------
    function handleMining() {
      // If currently mining a block
      if (miningTargetBlock) {
        miningProgress += 16.67 // approximate per frame at ~60fps
        const requiredTime =
          player.currentPick === "default" ? DEFAULT_MINE_TIME : UPGRADED_MINE_TIME
        if (miningProgress >= requiredTime) {
          miningTargetBlock.isMined = true
          player.inventory++
          miningTargetBlock = null
          miningProgress = 0
          updateHUD()
        }
      }
    }

    // -------------------------------------------------------------------------
    // Drawing
    // -------------------------------------------------------------------------
    function draw() {
      // Clear entire canvas
      ctx.clearRect(0, -CANVAS_HEIGHT, CANVAS_WIDTH, CANVAS_HEIGHT)

      // Sky (above surface)
      ctx.fillStyle = "#add8e6"
      ctx.fillRect(0, -cameraOffsetY, CANVAS_WIDTH, SURFACE_Y)

      // Underground background - big rectangle covering the mineshaft
      ctx.fillStyle = "#333333"
      ctx.fillRect(0, SURFACE_Y - cameraOffsetY, CANVAS_WIDTH, MINE_DEPTH_PX)

      // Draw blocks
      for (const block of blocks) {
        if (!block.isMined) {
          if (!block.mineable) {
            // Grass surface
            ctx.fillStyle = "#228B22"
          } else {
            // Rock
            ctx.fillStyle = "#808080"
          }
          ctx.fillRect(block.x, block.y - cameraOffsetY, BLOCK_SIZE, BLOCK_SIZE)
          ctx.strokeStyle = "#000000"
          ctx.strokeRect(block.x, block.y - cameraOffsetY, BLOCK_SIZE, BLOCK_SIZE)
        }
      }

      // Draw player
      ctx.fillStyle = "#FF0000"
      ctx.fillRect(player.x, player.y - cameraOffsetY, PLAYER_WIDTH, PLAYER_HEIGHT)

      // Draw mining progress (overlay)
      if (miningTargetBlock) {
        const requiredTime =
          player.currentPick === "default" ? DEFAULT_MINE_TIME : UPGRADED_MINE_TIME
        ctx.fillStyle = "rgba(255, 255, 0, 0.5)"
        ctx.fillRect(
          miningTargetBlock.x,
          miningTargetBlock.y - cameraOffsetY,
          BLOCK_SIZE * (miningProgress / requiredTime),
          BLOCK_SIZE,
        )
      }

      // Draw surface zones (Upgrade on left, Sell on right)
      // Just a simple label so the user knows where to stand
      ctx.fillStyle = "rgba(0, 0, 0, 0.5)"
      ctx.fillRect(UPGRADE_ZONE.x, UPGRADE_ZONE.y - cameraOffsetY, UPGRADE_ZONE.width, UPGRADE_ZONE.height)
      ctx.fillRect(SELL_ZONE.x, SELL_ZONE.y - cameraOffsetY, SELL_ZONE.width, SELL_ZONE.height)

      ctx.fillStyle = "#fff"
      ctx.font = "12px Arial"
      ctx.fillText(
        "UPGRADE (E)",
        UPGRADE_ZONE.x + 2,
        UPGRADE_ZONE.y + 30 - cameraOffsetY,
      )
      ctx.fillText(
        "SELL (E)",
        SELL_ZONE.x + 20,
        SELL_ZONE.y + 30 - cameraOffsetY,
      )
    }

    // -------------------------------------------------------------------------
    // Actions: Sell & Upgrade
    // -------------------------------------------------------------------------
    function attemptSell() {
      // If inventory > 0, increase gold by inventory, empty inventory
      if (player.inventory > 0) {
        player.gold += player.inventory
        player.inventory = 0
        updateHUD()
      }
    }

    function attemptUpgrade() {
      // If you still have default pick, and can afford it
      if (player.currentPick === "default" && player.gold >= UPGRADE_COST) {
        player.gold -= UPGRADE_COST
        player.currentPick = "upgraded"
        updateHUD()
      }
    }

    // Checks if the player is inside a "zone"
    function isPlayerInZone(zone: { x: number; y: number; width: number; height: number }) {
      const pxCenter = player.x + PLAYER_WIDTH / 2
      const pyBottom = player.y + PLAYER_HEIGHT
      return (
        pxCenter >= zone.x &&
        pxCenter <= zone.x + zone.width &&
        pyBottom >= zone.y &&
        player.y <= zone.y + zone.height
      )
    }

    // -------------------------------------------------------------------------
    // Game Loop
    // -------------------------------------------------------------------------
    function gameLoop() {
      handleInput()
      updatePlayer()
      handleMining()
      draw()
      requestAnimationFrame(gameLoop)
    }

    // -------------------------------------------------------------------------
    // Event Listeners
    // -------------------------------------------------------------------------
    const handleKeyDown = (e: KeyboardEvent) => {
      keys[e.key] = true

      // Press 'E' to interact: either upgrade or sell, depending on zone
      if (e.key === "e") {
        // Check if in upgrade zone
        if (isPlayerInZone(UPGRADE_ZONE) && player.y <= SURFACE_Y) {
          attemptUpgrade()
        }
        // Check if in sell zone
        else if (isPlayerInZone(SELL_ZONE) && player.y <= SURFACE_Y) {
          attemptSell()
        }
      }
    }
    const handleKeyUp = (e: KeyboardEvent) => {
      keys[e.key] = false
    }

    const handleMouseDown = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      const clickX = e.clientX - rect.left
      const clickY = e.clientY - rect.top + cameraOffsetY

      for (const block of blocks) {
        // Only mine if:
        //  - Not mined yet
        //  - Is mineable
        //  - Click is inside the block
        //  - Block is within "2 blocks" of the player's position
        if (
          !block.isMined &&
          block.mineable &&
          clickX >= block.x &&
          clickX < block.x + BLOCK_SIZE &&
          clickY >= block.y &&
          clickY < block.y + BLOCK_SIZE
        ) {
          // Distance check from player
          const distX = Math.abs((player.x + PLAYER_WIDTH / 2) - (block.x + BLOCK_SIZE / 2))
          const distY = Math.abs(
            (player.y + PLAYER_HEIGHT / 2) - (block.y + BLOCK_SIZE / 2),
          )
          if (distX <= BLOCK_SIZE * 2 && distY <= BLOCK_SIZE * 2) {
            miningTargetBlock = block
            miningProgress = 0
          }
          break
        }
      }
    }
    const handleMouseUp = () => {
      miningTargetBlock = null
      miningProgress = 0
    }

    // Add listeners
    document.addEventListener("keydown", handleKeyDown)
    document.addEventListener("keyup", handleKeyUp)
    canvas.addEventListener("mousedown", handleMouseDown)
    canvas.addEventListener("mouseup", handleMouseUp)

    // Initialize
    initGame()
    updateHUD()
    gameLoop()

    // Cleanup on unmount
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.removeEventListener("keyup", handleKeyUp)
      canvas.removeEventListener("mousedown", handleMouseDown)
      canvas.removeEventListener("mouseup", handleMouseUp)
    }
  }, [])

  return (
    <div className="flex justify-center items-center min-h-screen bg-black">
      <div id="gameContainer" className="relative">
        <canvas
          id="gameCanvas"
          width="800"
          height="600"
          className="border-2 border-white-600"
          ref={canvasRef}
        ></canvas>

        {/* HUD */}
        <div
          id="hud"
          className="absolute top-2 left-2 bg-black bg-opacity-50 text-white p-2 rounded"
        >
          Gold: <span id="goldDisplay">0</span>
          <br />
          Inventory: <span id="inventoryDisplay">0</span>
          <br />
          Pickaxe: <span id="pickaxeDisplay">Default</span>
        </div>
      </div>
    </div>
  )
}
