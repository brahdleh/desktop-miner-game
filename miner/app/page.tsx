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
    const SURFACE_Y = 3 * BLOCK_SIZE // 3 blocks from the top
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

    const blocks: { x: number; y: number; isMined: boolean }[] = []
    let cameraOffsetY = 0
    let miningProgress = 0
    let miningTargetBlock: { x: number; y: number; isMined: boolean } | null = null
    const keys: { [key: string]: boolean } = {}

    function initGame() {
      // Generate top platform
      for (let x = 0; x < CANVAS_WIDTH; x += BLOCK_SIZE) {
        blocks.push({
          x: x,
          y: SURFACE_Y,
          isMined: false,
        })
      }

      // Generate mine shaft
      for (let y = SURFACE_Y + BLOCK_SIZE; y < SURFACE_Y + 50 * BLOCK_SIZE; y += BLOCK_SIZE) {
        for (let x = MINE_LEFT; x < MINE_LEFT + MINE_WIDTH * BLOCK_SIZE; x += BLOCK_SIZE) {
          blocks.push({
            x: x,
            y: y,
            isMined: false,
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
      if (pickaxeDisplay) pickaxeDisplay.textContent = player.currentPick === "default" ? "Default" : "Upgraded"
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
          if (player.velocityY > 0 && player.y + PLAYER_HEIGHT <= block.y + player.velocityY) {
            player.y = block.y - PLAYER_HEIGHT
            player.velocityY = 0
            player.onGround = true
          } else if (player.velocityY < 0 && player.y >= block.y + BLOCK_SIZE + player.velocityY) {
            player.y = block.y + BLOCK_SIZE
            player.velocityY = 0
          }
          if (player.velocityX > 0 && player.x + PLAYER_WIDTH <= block.x + player.velocityX) {
            player.x = block.x - PLAYER_WIDTH
          } else if (player.velocityX < 0 && player.x >= block.x + BLOCK_SIZE + player.velocityX) {
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

      // Surface check
      if (player.y <= SURFACE_Y) {
        player.gold += player.inventory
        player.inventory = 0
        updateHUD()
      }
    }

    function collision(a: { x: number; y: number }, b: { x: number; y: number }) {
      return a.x < b.x + BLOCK_SIZE && a.x + PLAYER_WIDTH > b.x && a.y < b.y + BLOCK_SIZE && a.y + PLAYER_HEIGHT > b.y
    }

    function handleMining() {
      if (miningTargetBlock) {
        miningProgress += 16.67 // Approximately 60 FPS
        if (miningProgress >= (player.currentPick === "default" ? DEFAULT_MINE_TIME : UPGRADED_MINE_TIME)) {
          miningTargetBlock.isMined = true
          player.inventory++
          miningTargetBlock = null
          miningProgress = 0
          updateHUD()
        }
      }
    }

    function draw() {
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

      // Draw blocks
      for (const block of blocks) {
        if (!block.isMined) {
          ctx.fillStyle = "#808080" // Grey color
          ctx.fillRect(block.x, block.y - cameraOffsetY, BLOCK_SIZE, BLOCK_SIZE)
          ctx.strokeStyle = "#000000" // Black border
          ctx.strokeRect(block.x, block.y - cameraOffsetY, BLOCK_SIZE, BLOCK_SIZE)
        }
      }

      // Draw player
      ctx.fillStyle = "#FF0000"
      ctx.fillRect(player.x, player.y - cameraOffsetY, PLAYER_WIDTH, PLAYER_HEIGHT)

      // Draw mining progress
      if (miningTargetBlock) {
        ctx.fillStyle = "rgba(255, 255, 0, 0.5)"
        ctx.fillRect(
          miningTargetBlock.x,
          miningTargetBlock.y - cameraOffsetY,
          BLOCK_SIZE * (miningProgress / (player.currentPick === "default" ? DEFAULT_MINE_TIME : UPGRADED_MINE_TIME)),
          BLOCK_SIZE,
        )
      }

      // Draw surface line
      ctx.strokeStyle = "#00FF00"
      ctx.beginPath()
      ctx.moveTo(0, SURFACE_Y - cameraOffsetY)
      ctx.lineTo(CANVAS_WIDTH, SURFACE_Y - cameraOffsetY)
      ctx.stroke()
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
        if (
          !block.isMined &&
          clickX >= block.x &&
          clickX < block.x + BLOCK_SIZE &&
          clickY >= block.y &&
          clickY < block.y + BLOCK_SIZE
        ) {
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
      if (e.key === "u" && player.y <= SURFACE_Y && player.gold >= UPGRADE_COST && player.currentPick === "default") {
        player.gold -= UPGRADE_COST
        player.currentPick = "upgraded"
        updateHUD()
      }
    })

    document.addEventListener("keyup", (e) => {
      keys[e.key] = false
    })

    initGame()
    updateHUD()
    gameLoop()

    // Cleanup function
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
  }, []) // Empty dependency array ensures this effect runs only once on mount

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div id="gameContainer" className="relative">
        <canvas id="gameCanvas" width="800" height="600" className="border-2 border-gray-800" ref={canvasRef}></canvas>
        <div id="hud" className="absolute top-2 left-2 bg-black bg-opacity-50 text-white p-2 rounded">
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