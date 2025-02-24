"use client"

import { useEffect, useRef, useState } from "react"
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
  attemptProficiencyUpgrade, 
  attemptStrengthUpgrade, 
  canMineBlock,
  attemptPlaceBlock,
  attemptCraftPickaxe,
  attemptCraftBackpack,
  attemptBuy,
  attemptDepositInRefiner,
  attemptCollectFromRefiner,
  findNearbyRefiner,
} from "./mining"
import { draw } from "./rendering"
import { initializeBlocks, initializePlayer } from "./init"
import { saveGame, loadGame, blocksToHexArray } from "./storage"
import { loadAllTextures } from "./assets"


export default function MiningGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  // Add state for save notification
  const [showSaveNotification, setShowSaveNotification] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined" || !canvasRef.current) return

    // Load textures before starting the game
    loadAllTextures().then(() => {
        const canvas = canvasRef.current!
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
        cameraOffsetY = Math.min(player.y - CANVAS_HEIGHT/3, SURFACE_Y + MINE_DEPTH_PX - CANVAS_HEIGHT)
        
        const miningResult = handleMining(
          player, 
          miningTargetBlock, 
          miningProgress,
          blocks
        )
        miningProgress = miningResult.miningProgress
        miningTargetBlock = miningResult.miningTargetBlock

        draw(
          ctx, 
          player, 
          blocks, 
          miningTargetBlock, 
          miningProgress, 
          cameraOffsetY, 
          UPGRADE_ZONE, 
          CRAFT_ZONE,
          miningResult.requiredTime
        )
        
        requestAnimationFrame(gameLoop)
      }

      // -------------------------------------------------------------------------
      // Event Listeners
      // -------------------------------------------------------------------------
      const handleKeyDown = (e: KeyboardEvent) => {
        keys[e.key] = true

        // Save/Load/Export/Import shortcuts
        if (e.shiftKey) {
          if (e.key === 'S') {
            e.preventDefault()
            saveGame(player, blocks)
            setShowSaveNotification(true)
            setTimeout(() => setShowSaveNotification(false), 2000)
          } else if (e.key === 'L') {
            const savedData = loadGame()
            if (savedData.player && savedData.blocks) {
              Object.assign(player, savedData.player)
              blocks.length = 0
              blocks.push(...savedData.blocks)
            }
          }/* else if (e.key === 'C') {
            e.preventDefault()
            const hexArray = blocksToHexArray(blocks)
            const hexString = JSON.stringify(hexArray)
            navigator.clipboard.writeText(hexString).then(() => {
              setShowSaveNotification(true)
              setTimeout(() => setShowSaveNotification(false), 2000)
            })
          }*/
          return
        }

        // Add inventory navigation with arrow keys
        if (e.key.startsWith("Arrow")) {
          e.preventDefault() // Prevent page scrolling
          
          const inventorySize = player.inventorySlots.length
          const rowHeight = 5
          
          let currentSlot = player.selectedSlot
          
          switch (e.key) {
            case "ArrowUp":
              // Move up one slot, wrap to bottom of same column if at top
              currentSlot = (currentSlot + 1 + rowHeight) % rowHeight + 
                           Math.floor(currentSlot / rowHeight) * rowHeight
              break
            case "ArrowDown":
              // Move down one slot, wrap to top of same column if at bottom
              currentSlot = ((currentSlot - 1 + rowHeight) % rowHeight) + 
                            Math.floor(currentSlot / rowHeight) * rowHeight
              break
            case "ArrowLeft":
              // Move left one column, wrap to rightmost column if at leftmost
              currentSlot = (((Math.floor(currentSlot / rowHeight) - 1 + 
                           Math.ceil(inventorySize / rowHeight)) % 
                           Math.ceil(inventorySize / rowHeight)) * rowHeight + 
                           (currentSlot % rowHeight))
              break
            case "ArrowRight":
              // Move right one column, wrap to leftmost column if at rightmost
              currentSlot = (((Math.floor(currentSlot / rowHeight) + 1) % 
                           Math.ceil(inventorySize / rowHeight)) * rowHeight + 
                           (currentSlot % rowHeight))
              break
          }
          
          // Only update if the new slot is within inventory bounds
          if (currentSlot < inventorySize) {
            player.selectedSlot = currentSlot
          }
        }

        // Check for refiner interactions
        if (e.key === "t") {
          const nearbyRefiner = findNearbyRefiner(player, blocks)
          if (nearbyRefiner) {
            attemptDepositInRefiner(player, blocks)
            return
          }
        }
        if (e.key === "y") {
          const nearbyRefiner = findNearbyRefiner(player, blocks)
          if (nearbyRefiner) {
            attemptCollectFromRefiner(player, blocks)
            return
          }
        }

        if (isPlayerInZone(player, UPGRADE_ZONE) && player.y <= SURFACE_Y) {
          switch (e.key) {
            case "e":
              attemptProficiencyUpgrade(player)
              break
            case "r":
              attemptStrengthUpgrade(player)
              break
            case "p":
              attemptSell(player)
              break
            case "j":
              attemptBuy(player, 10)
              break
            case "k":
              attemptBuy(player, 12)
              break
            case "l":
              attemptBuy(player, 11)
              break
            case "n":
              attemptBuy(player, 14)
          }
        }

        if (isPlayerInZone(player, CRAFT_ZONE) && player.y <= SURFACE_Y) {
          if (e.key === "e") {
            attemptCraftPickaxe(player)
          }
          if (e.key === "r") {
            attemptCraftBackpack(player)
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

        // Right click for placement
        if (e.button === 2) {
          attemptPlaceBlock(player, blocks, clickX, clickY)
          return
        }

        // Left click for mining
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
    })
  }, [])

  return (
    <div className="flex justify-center items-center min-h-screen bg-black">
      <div id="gameContainer" className="relative">
        {/* Add save notification */}
        {showSaveNotification && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded-md">
            Game Saved!
          </div>
        )}
        
        <canvas
          id="gameCanvas"
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="border-2 border-white-600"
          ref={canvasRef}
        ></canvas>

        {/* Controls */}
        <div
          id="controls"
          className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white p-2 rounded"
        >
          <span className="text-xs opacity-50">L CLICK to mine</span>
          <br />
          <span className="text-xs opacity-50">R CLICK to place</span>
          <br />
          <span className="text-xs opacity-50">SHIFT S to Save</span>
          <br />
          <span className="text-xs opacity-50">SHIFT L to Load</span>
          <br />
          <span className="text-xs opacity-50">↑↓←→ for Inventory</span>
          <br />
          <span className="text-xs opacity-50">T Deposit in Refiner</span>
          <br />
          <span className="text-xs opacity-50">Y Collect from Refiner</span>
        </div>
      </div>
    </div>
  )
}
