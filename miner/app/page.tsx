"use client"

import { useEffect, useRef } from "react"
import { Player, Block } from "./types"
import { 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT, 
  SURFACE_Y,
  UPGRADE_ZONE,
  MINE_DEPTH_PX,
  CRAFT_ZONE,
  PLAYER_HEIGHT,
  BLOCK_SIZE
} from "./constants"
import { handleInput, updatePlayer, isPlayerInZone } from "./player"
import { 
  handleMining, 
  attemptSell, 
  attemptPickaxeUpgrade, 
  attemptBackpackUpgrade, 
  canMineBlock,
  attemptPlaceBlock,
  attemptCraftPickaxe,
  attemptCraftBackpack
} from "./mining"
import { draw, updateHUD } from "./rendering"
import { initializeBlocks, initializePlayer } from "./init"
import { saveGame, loadGame } from "./storage"


export default function MiningGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (typeof window === "undefined" || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")!
    if (!ctx) return

    // -------------------------------------------------------------------------
    // Game state
    // -------------------------------------------------------------------------
    const player: Player = initializePlayer()
    const blocks: Block[] = initializeBlocks()
    const keys: { [key: string]: boolean } = {}
    let cameraOffsetY = 0
    let miningProgress = 0
    let miningTargetBlock: Block | null = null

    // -------------------------------------------------------------------------
    // Game Loop
    // -------------------------------------------------------------------------
    function gameLoop() {
      handleInput(player, keys)
      updatePlayer(player, blocks)
      
      // Update camera
      cameraOffsetY = Math.min(player.y - CANVAS_HEIGHT/5, SURFACE_Y + MINE_DEPTH_PX - CANVAS_HEIGHT)
      
      const miningResult = handleMining(
        player, 
        miningTargetBlock, 
        miningProgress, 
        () => updateHUD(player)
      )
      miningProgress = miningResult.miningProgress
      miningTargetBlock = miningResult.miningTargetBlock

      draw(ctx, player, blocks, miningTargetBlock, miningProgress, cameraOffsetY, 
           UPGRADE_ZONE, CRAFT_ZONE)
      
      requestAnimationFrame(gameLoop)
    }

    // -------------------------------------------------------------------------
    // Event Listeners
    // -------------------------------------------------------------------------
    const handleKeyDown = (e: KeyboardEvent) => {
      keys[e.key] = true

      // Save/Load shortcuts
      if (e.shiftKey) {
        if (e.key === 'S') {
          e.preventDefault() // Prevent browser save dialog
          saveGame(player, blocks)
        } else if (e.key === 'L') {
          const savedData = loadGame()
          if (savedData.player && savedData.blocks) {
            // Update player
            Object.assign(player, savedData.player)
            
            // Update blocks
            blocks.length = 0 // Clear existing blocks
            blocks.push(...savedData.blocks)
            
            // Update HUD
            updateHUD(player)
          }
        }
        return
      }

      // Add inventory navigation with arrow keys
      if (e.key === "ArrowUp" || e.key === "ArrowDown") {
        const delta = e.key === "ArrowDown" ? -1 : 1
        player.selectedSlot = (player.selectedSlot + delta + player.blockInventory.length) % player.blockInventory.length
      }

      if (isPlayerInZone(player, UPGRADE_ZONE) && player.y <= SURFACE_Y) {
        switch (e.key) {
          case "e":
            attemptPickaxeUpgrade(player, () => updateHUD(player))
            break
          case "r":
            attemptBackpackUpgrade(player, () => updateHUD(player))
            break
          case "p":
            attemptSell(player, () => updateHUD(player))
            break
        }
      }

      if (isPlayerInZone(player, CRAFT_ZONE) && player.y <= SURFACE_Y) {
        if (e.key === "e") {
          attemptCraftPickaxe(player, () => updateHUD(player))
        }
        if (e.key === "r") {
          attemptCraftBackpack(player, () => updateHUD(player))
        }
      }

      // Allow s to place block just below player to help escape the mine
      if (e.key === "s") {
        attemptPlaceBlock(player, blocks, player.x, player.y + PLAYER_HEIGHT + 0.8*BLOCK_SIZE, () => updateHUD(player))
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      keys[e.key] = false
    }

    const handleMouseDown = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      const clickX = e.clientX - rect.left
      const clickY = e.clientY - rect.top + cameraOffsetY

      // Right click for placement
      if (e.button === 2) {
        attemptPlaceBlock(player, blocks, clickX, clickY, () => updateHUD(player))
        return
      }

      // Left click for mining (existing code)
      for (const block of blocks) {
        if (canMineBlock(block, clickX, clickY, player)) {
          miningTargetBlock = block
          miningProgress = 0
          break
        }
      }
    }

    const handleMouseUp = () => {
      miningTargetBlock = null
      miningProgress = 0
    }


    // Prevent context menu
    canvas.addEventListener("contextmenu", (e) => e.preventDefault())

    // Add listeners
    document.addEventListener("keydown", handleKeyDown)
    document.addEventListener("keyup", handleKeyUp)
    canvas.addEventListener("mousedown", handleMouseDown)
    canvas.addEventListener("mouseup", handleMouseUp)

    // Initialize and start game
    updateHUD(player)
    gameLoop()

    // Cleanup
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.removeEventListener("keyup", handleKeyUp)
      canvas.removeEventListener("mousedown", handleMouseDown)
      canvas.removeEventListener("mouseup", handleMouseUp)
      
      // Optional: Auto-save on exit
      saveGame(player, blocks)
    }
  }, [])

  return (
    <div className="flex justify-center items-center min-h-screen bg-black">
      <div id="gameContainer" className="relative">
        <canvas
          id="gameCanvas"
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="border-2 border-white-600"
          ref={canvasRef}
        ></canvas>

        {/* HUD */}
        <div
          id="hud"
          className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white p-2 rounded"
        >
          Gold: <span id="goldDisplay">0</span>
          <br />
          Inventory: <span id="inventoryDisplay">0</span>
          <br />
          Pickaxe: <span id="pickaxeDisplay">Default</span>
          <br />
          Backpack: <span id="backpackDisplay">Default</span>
        </div>

        {/* Controls */}
        <div
          id="controls"
          className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white p-2 rounded"
        >
          <span className="text-xs opacity-50">L CLICK to mine</span>
          <br />
          <span className="text-xs opacity-50">R CLICK to place</span>
          <br />
          <span className="text-xs opacity-50">s to place down</span>
          <br />
          <span className="text-xs opacity-50">SHIFT S to Save</span>
          <br />
          <span className="text-xs opacity-50">SHIFT L to Load</span>
        </div>
      </div>
    </div>
  )
}
