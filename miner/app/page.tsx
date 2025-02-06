"use client"

import { useEffect, useRef } from "react"

export default function MiningGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (typeof window === "undefined" || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Game constants
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
    const SURFACE_Y = 5 * BLOCK_SIZE // 3 blocks from the top
    const UPGRADE_COST = 4
    const DEFAULT_MINE_TIME = 2000
    const UPGRADED_MINE_TIME = 1000

    // Game variables
    const player = {
      x: CANVAS_WIDTH / 2 - PLAYER_WIDTH / 2,
      y: SURFACE_Y - PLAYER_HEIGHT,
      velocityX: 0,
      velocityY: 0,
      onGround: false,
      inventory: 0,
      gold: 0,
      currentPick: "default",
    }

    // Updated block type to include 'mineable'
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

    // Generate initial blocks
    function initGame() {
      // 1) Generate top "grass" platform (non-mineable if outside of shaft column)
      for (let x = 0; x < CANVAS_WIDTH; x += BLOCK_SIZE) {
        if(x >= MINE_LEFT && x < MINE_LEFT + MINE_WIDTH * BLOCK_SIZE) {
          blocks.push({
            x: x,
            y: SURFACE_Y,
            isMined: false,
            mineable: true, // top platform is NOT mineable
          })
        } else {
          blocks.push({
            x: x,
            y: SURFACE_Y,
            isMined: false,
            mineable: false, // top platform is NOT mineable
          })
        }
      }

      // 2) Generate mine shaft (mineable)
      for (let y = SURFACE_Y + BLOCK_SIZE; y < SURFACE_Y + 50 * BLOCK_SIZE; y += BLOCK_SIZE) {
        for (let x = MINE_LEFT; x < MINE_LEFT + MINE_WIDTH * BLOCK_SIZE; x += BLOCK_SIZE) {
          blocks.push({
            x: x,
            y: y,
            isMined: false,
            mineable: true,
          })
        }
      }
    }

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

    function handleInput() {
      player.velocityX = 0
      if (keys["ArrowLeft"] || keys["a"]) player.velocityX = -MOVE_SPEED
      if (keys["ArrowRight"] || keys["d"]) player.velocityX = MOVE_SPEED
      if ((keys["ArrowUp"] || keys["w"]) && player.onGround) {
        player.velocityY = -JUMP_STRENGTH
        player.onGround = false
      }
    }

    function updatePlayer() {
      player.x += player.velocityX
      player.y += player.velocityY
      player.velocityY += GRAVITY

      // Collision detection
      player.onGround = false
      for (const block of blocks) {
        if (!block.isMined && collision(player, block)) {
          // Vertical collisions
          if (player.velocityY > 0 && player.y + PLAYER_HEIGHT <= block.y + player.velocityY) {
            player.y = block.y - PLAYER_HEIGHT
            player.velocityY = 0
            player.onGround = true
          } else if (
            player.velocityY < 0 &&
            player.y >= block.y + BLOCK_SIZE + player.velocityY
          ) {
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

      // Screen boundaries
      player.x = Math.max(0, Math.min(player.x, CANVAS_WIDTH - PLAYER_WIDTH))

      // Camera follow
      if (player.y > CANVAS_HEIGHT - PLAYER_HEIGHT / 2 + cameraOffsetY) {
        cameraOffsetY = player.y - (CANVAS_HEIGHT - PLAYER_HEIGHT / 2)
      } else if (player.y < PLAYER_HEIGHT / 2 + cameraOffsetY) {
        cameraOffsetY = Math.max(0, player.y - PLAYER_HEIGHT / 2)
      }

      // Surface check (auto-sell upon reaching surface)
      if (player.y <= SURFACE_Y) {
        player.gold += player.inventory
        player.inventory = 0
        updateHUD()
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

    function handleMining() {
      if (miningTargetBlock) {
        miningProgress += 16.67 // Approx for 60 FPS
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

    function draw() {
      // Fill background with dark grey
      ctx.fillStyle = "#333333"
      ctx.fillRect(0, SURFACE_Y, CANVAS_WIDTH, CANVAS_HEIGHT)
      
      // Fill the sky with blue
      ctx.fillStyle = "#add8e6"
      ctx.fillRect(0, 0, CANVAS_WIDTH, SURFACE_Y)

      // Draw blocks
      for (const block of blocks) {
        if (!block.isMined) {
          // If it's the top non-mineable platform, draw green (grass)
          if (!block.mineable) {
            ctx.fillStyle = "#228B22" // grass-green
          } else {
            ctx.fillStyle = "#808080" // grey for mineable rock
          }
          ctx.fillRect(block.x, block.y - cameraOffsetY, BLOCK_SIZE, BLOCK_SIZE)
          ctx.strokeStyle = "#000000"
          ctx.strokeRect(block.x, block.y - cameraOffsetY, BLOCK_SIZE, BLOCK_SIZE)
        }
      }

      // Draw player
      ctx.fillStyle = "#FF0000"
      ctx.fillRect(player.x, player.y - cameraOffsetY, PLAYER_WIDTH, PLAYER_HEIGHT)

      // Draw mining progress
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

      // Draw surface line for clarity (optional)
      ctx.strokeStyle = "#00FF00"
      ctx.beginPath()
      ctx.moveTo(0, SURFACE_Y - cameraOffsetY)
      ctx.lineTo(CANVAS_WIDTH, SURFACE_Y - cameraOffsetY)
      ctx.stroke()
    }

    // Helper: Sell blocks via button
    function sellBlocks() {
      // Only allow selling if at/above surface, similar to auto-sell logic
      if (player.y <= SURFACE_Y && player.inventory > 0) {
        player.gold += player.inventory
        player.inventory = 0
        updateHUD()
      }
    }

    // Helper: Upgrade pickaxe via button
    function upgradePickaxe() {
      // Only allow upgrading if at/above surface, have enough gold, and still default pick
      if (player.y <= SURFACE_Y && player.gold >= UPGRADE_COST && player.currentPick === "default") {
        player.gold -= UPGRADE_COST
        player.currentPick = "upgraded"
        updateHUD()
      }
    }

    function gameLoop() {
      handleInput()
      updatePlayer()
      handleMining()
      draw()
      requestAnimationFrame(gameLoop)
    }

    canvas.addEventListener("mousedown", (e) => {
      const rect = canvas.getBoundingClientRect()
      const clickX = e.clientX - rect.left
      const clickY = e.clientY - rect.top + cameraOffsetY

      for (const block of blocks) {
        // Only mine if block is not mined, *is mineable*, and the click is inside it
        if (
          !block.isMined &&
          block.mineable &&
          clickX >= block.x &&
          clickX < block.x + BLOCK_SIZE &&
          clickY >= block.y &&
          clickY < block.y + BLOCK_SIZE
        ) {
          // Check distance from player (simple range check)
          if (
            Math.abs(player.x - block.x) <= BLOCK_SIZE * 2 &&
            Math.abs(player.y + PLAYER_HEIGHT / 2 - (block.y + BLOCK_SIZE / 2)) <= BLOCK_SIZE * 2
          ) {
            miningTargetBlock = block
            miningProgress = 0
          }
          break
        }
      }
    })

    canvas.addEventListener("mouseup", () => {
      miningTargetBlock = null
      miningProgress = 0
    })

    document.addEventListener("keydown", (e) => {
      keys[e.key] = true
      // Keyboard shortcut for upgrading
      if (e.key === "u") {
        upgradePickaxe()
      }
    })

    document.addEventListener("keyup", (e) => {
      keys[e.key] = false
    })

    initGame()
    updateHUD()
    gameLoop()

    // Cleanup on unmount
    return () => {
      document.removeEventListener("keydown", (e) => {
        keys[e.key] = true
      })
      document.removeEventListener("keyup", (e) => {
        keys[e.key] = false
      })
      canvas.removeEventListener("mousedown", () => {})
      canvas.removeEventListener("mouseup", () => {})
    }
  }, [])

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div id="gameContainer" className="relative">
        <canvas
          id="gameCanvas"
          width="800"
          height="600"
          className="border-2 border-gray-800"
          ref={canvasRef}
        ></canvas>

        {/* HUD - typically top-left */}
        <div id="hud" className="absolute top-2 left-2 bg-black bg-opacity-50 text-white p-2 rounded">
          Gold: <span id="goldDisplay">0</span>
          <br />
          Inventory: <span id="inventoryDisplay">0</span>
          <br />
          Pickaxe: <span id="pickaxeDisplay">Default</span>
        </div>

        {/* 3) Sell blocks section (top-left as well) */}
        <div className="absolute top-2 left-32 bg-white bg-opacity-75 text-black p-2 rounded">
          <button onClick={() => { /* Must wrap in arrow function to access the scope properly */ 
            const event = new Event("SellClicked")
            document.dispatchEvent(event) // not strictly required, but can help separate concerns
          }}>
            Sell Blocks
          </button>
        </div>

        {/* 4) Upgrade pickaxe section (top-right) */}
        <div className="absolute top-2 right-2 bg-white bg-opacity-75 text-black p-2 rounded">
          <button onClick={() => {
            const event = new Event("UpgradeClicked")
            document.dispatchEvent(event)
          }}>
            Upgrade Pickaxe
          </button>
        </div>
      </div>

      {/*
        We can directly call sellBlocks/upgradePickaxe from the onClick as well:
        <button onClick={sellBlocks}>Sell Blocks</button>
        <button onClick={upgradePickaxe}>Upgrade Pickaxe</button>

        However, if you prefer to keep all game logic inside useEffect, you might
        dispatch events or use a ref-based approach. Shown above is one example.
      */}
    </div>
  )
}
