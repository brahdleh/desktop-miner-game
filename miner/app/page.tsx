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
  attemptDepositInMachinery,
  attemptCollectFromMachinery,
  findNearbyMachinery,
  attemptCraftRefiner,
} from "./mining"
import { draw } from "./rendering"
import { initializeBlocks, initializePlayer } from "./init"
import { saveGame, loadGame } from "./storage"
import { loadAllTextures } from "./assets"
import { getGridPosition } from "./utils/data-utils"
import { processAutomation } from './automation'


export default function MiningGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [notifications, setNotifications] = useState<{id: number, text: string, type: 'success' | 'warning'}[]>([])
  const nextNotificationId = useRef(0)

  const showNotification = (text: string, type: 'success' | 'warning' = 'success') => {
    const id = nextNotificationId.current++
    setNotifications(prev => [...prev, { id, text, type }])
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id))
    }, 2000)
  }

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
      // Add mode state
      let isPlacingMode = false
      let previewX = 0
      let previewY = 0

      // Add variables to track last mouse position
      let lastMouseX = 0
      let lastMouseY = 0

      // -------------------------------------------------------------------------
      // Game Loop
      // -------------------------------------------------------------------------
      function gameLoop() {
        handleInput(player, keys)
        updatePlayer(player, blocks)
        
        // Process automation machinery
        processAutomation(blocks)
        
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
          miningResult.requiredTime,
          isPlacingMode,
          previewX,
          previewY
        )
        
        requestAnimationFrame(gameLoop)
      }

      // -------------------------------------------------------------------------
      // Event Listeners
      // -------------------------------------------------------------------------
      const handleKeyDown = (e: KeyboardEvent) => {
        keys[e.key] = true

        // Toggle between mining and placing modes with F key
        if (e.key === 'f' || e.key === 'F') {
          isPlacingMode = !isPlacingMode
          showNotification(isPlacingMode ? 'Block Placement Mode' : 'Mining Mode')
          
          // Update preview coordinates when switching to placement mode
          if (isPlacingMode) {
            // Get current mouse position and update preview coordinates
            const rect = canvas.getBoundingClientRect()
            const mouseX = lastMouseX || rect.width / 2
            const mouseY = lastMouseY || rect.height / 2
            
            const worldX = mouseX
            const worldY = mouseY + cameraOffsetY
            
            // Get grid-aligned position for preview
            const gridPos = getGridPosition(worldX, worldY)
            previewX = gridPos[0]
            previewY = gridPos[1]
          }
          return
        }

        // Save/Load/Export/Import shortcuts
        if (e.shiftKey) {
          if (e.key === 'S') {
            e.preventDefault()
            saveGame(player, blocks)
            showNotification('Game Saved!')
          } else if (e.key === 'L') {
            const savedData = loadGame()
            if (savedData.player && savedData.blocks) {
              Object.assign(player, savedData.player)
              blocks.length = 0
              blocks.push(...savedData.blocks)
              showNotification('Game Loaded!')
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
          const rowHeight = 3
          
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

        // Universal machinery interactions
        if (e.key === "t") {
          const depositCheck = attemptDepositInMachinery(player, blocks)
          if (depositCheck.reason) {
            showNotification(depositCheck.reason, 'warning')
          } else {
            showNotification('Item deposited successfully', 'success')
          }
          return
        }
        
        if (e.key === "y") {
          const collectCheck = attemptCollectFromMachinery(player, blocks)
          if (collectCheck.reason) {
            showNotification(collectCheck.reason, 'warning')
          } else {
            showNotification('Item collected successfully', 'success')
          }
          return
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
              const buyResult1 = attemptBuy(player, 10)
              if (buyResult1.reason) showNotification(buyResult1.reason, 'warning')
              break
            case "k":
              const buyResult2 = attemptBuy(player, 12)
              if (buyResult2.reason) showNotification(buyResult2.reason, 'warning')
              break
            case "l":
              const buyResult3 = attemptBuy(player, 11)
              if (buyResult3.reason) showNotification(buyResult3.reason, 'warning')
              break
            case "n":
              const buyResult4 = attemptBuy(player, 14)
              if (buyResult4.reason) showNotification(buyResult4.reason, 'warning')
              break
            case "m":
              const buyResult5 = attemptBuy(player, 19)
              if (buyResult5.reason) showNotification(buyResult5.reason, 'warning')
              break
            case "o":
              const buyResult6 = attemptBuy(player, 20)
              if (buyResult6.reason) showNotification(buyResult6.reason, 'warning')
              break
            case "q":
              const buyResult7 = attemptBuy(player, 21)
              if (buyResult7.reason) showNotification(buyResult7.reason, 'warning')
              break
          }
        }

        if (isPlayerInZone(player, CRAFT_ZONE) && player.y <= SURFACE_Y) {
          if (e.key === "e") {
            attemptCraftPickaxe(player)
          }
          if (e.key === "r") {
            attemptCraftBackpack(player)
          }
          
          // Add new key handlers for crafting refiners
          if (e.key === "1") {
            // Craft copper refiner (ID 22)
            if (attemptCraftRefiner(player, 22)) {
              showNotification('Crafted Copper Refiner!', 'success')
            } else {
              showNotification('Need more materials!', 'warning')
            }
          }
          if (e.key === "2") {
            // Craft iron refiner (ID 23)
            if (attemptCraftRefiner(player, 23)) {
              showNotification('Crafted Iron Refiner!', 'success')
            } else {
              showNotification('Need more materials!', 'warning')
            }
          }
          if (e.key === "3") {
            // Craft gold refiner (ID 24)
            if (attemptCraftRefiner(player, 24)) {
              showNotification('Crafted Gold Refiner!', 'success')
            } else {
              showNotification('Need more materials!', 'warning')
            }
          }
          if (e.key === "4") {
            // Craft diamond refiner (ID 25)
            if (attemptCraftRefiner(player, 25)) {
              showNotification('Crafted Diamond Refiner!', 'success')
            } else {
              showNotification('Need more materials!', 'warning')
            }
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

        // Left click for mining or placing based on mode
        if (e.button === 0) {
          if (isPlacingMode) {
            const placeResult = attemptPlaceBlock(player, blocks, clickX, clickY)
            if (!placeResult.canPlace && placeResult.reason) {
              showNotification(placeResult.reason, 'warning')
            }
          } else {
            // Mining mode (original behavior)
            for (const block of blocks) {
              const miningCheck = canMineBlock(block, clickX, clickY, player)
              if (miningCheck.reason) {
                showNotification(miningCheck.reason, 'warning')
                return
              }
              if (miningCheck.canMine) {
                miningTargetBlock = block
                miningProgress = 0
                break
              }
            }
          }
          return
        }
      }

      const handleMouseUp = () => {
        miningTargetBlock = null
        miningProgress = 0
      }

      const handleMouseMove = (e: MouseEvent) => {
        // Update last mouse position
        const rect = canvas.getBoundingClientRect()
        lastMouseX = e.clientX - rect.left
        lastMouseY = e.clientY - rect.top
        
        if (isPlacingMode) {
          const mouseX = lastMouseX
          const mouseY = lastMouseY + cameraOffsetY
          
          // Get grid-aligned position for preview
          const gridPos = getGridPosition(mouseX, mouseY)
          previewX = gridPos[0]
          previewY = gridPos[1]
        }
      }

      // Prevent context menu
      canvas.addEventListener("contextmenu", (e) => e.preventDefault())

      // Add listeners
      document.addEventListener("keydown", handleKeyDown)
      document.addEventListener("keyup", handleKeyUp)
      canvas.addEventListener("mousedown", handleMouseDown)
      canvas.addEventListener("mouseup", handleMouseUp)
      canvas.addEventListener("mousemove", handleMouseMove)

      // Initialize and start game
      gameLoop()

      // Cleanup
      return () => {
        document.removeEventListener("keydown", handleKeyDown)
        document.removeEventListener("keyup", handleKeyUp)
        canvas.removeEventListener("mousedown", handleMouseDown)
        canvas.removeEventListener("mouseup", handleMouseUp)
        canvas.removeEventListener("mousemove", handleMouseMove)
        
        // Optional: Auto-save on exit
        saveGame(player, blocks)
      }
    })
  }, [])

  return (
    <div className="flex justify-center items-center min-h-screen bg-black">
      <div id="gameContainer" className="relative">
        {/* Notifications */}
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 flex flex-col gap-2">
          {notifications.map(notification => (
            <div 
              key={notification.id}
              className={`px-4 py-2 rounded-md
                ${notification.type === 'success' ? 'bg-green-500' : 'bg-yellow-500'} text-white`}
            >
              {notification.text}
            </div>
          ))}
        </div>
        
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
          <span className="text-xs opacity-50">L CLICK to mine/place</span>
          <br />
          <span className="text-xs opacity-50">F to toggle mode</span>
          <br />
          <span className="text-xs opacity-50">SHIFT S to Save</span>
          <br />
          <span className="text-xs opacity-50">SHIFT L to Load</span>
          <br />
          <span className="text-xs opacity-50">↑↓←→ for Inventory</span>
          <br />
          <span className="text-xs opacity-50">T Deposit to Machinery</span>
          <br />
          <span className="text-xs opacity-50">Y Collect from Machinery</span>
          <br />
          <span className="text-xs opacity-50">In Craft Zone: 1-4 for Refiners</span>
        </div>
      </div>
    </div>
  )
}
