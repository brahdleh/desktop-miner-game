import { Block } from './types'
import { REFINABLE_BLOCKS } from './constants'
import { 
  initializeStorageState, initializeRefinerState,
  hasStorageSpace, addToStorage
} from './utils/machinery-utils'
import { getRefiningTime } from './utils/calculation-utils'
import { getBlockData, isRefinable } from './utils/data-utils';
import { 
  MachineNetwork, 
  getBlockKey, 
  buildMachineNetwork,
  isMachineBlock, 
  } from './utils/network-utils';

// Global machine network
let machineNetwork: MachineNetwork | null = null;


// Initialize or update the machine network
export function initializeMachineNetwork(blocks: Block[]): void {
  machineNetwork = buildMachineNetwork(blocks);
  console.log(`Machine network initialized with ${machineNetwork.size} machines`);
}

// Update the network when a block is added or removed
export function updateNetworkonEdit(block: Block, blocks: Block[]): void {

  if (isMachineBlock(block) || getBlockData(block.blockType).category === 'tube') {
    if (!machineNetwork) {
      initializeMachineNetwork(blocks);
      return;
    } else {
      machineNetwork = buildMachineNetwork(blocks);
    }
  }
}

// Process all automation machinery using the network
export function processAutomation(blocks: Block[]) {
  // Initialize network if it doesn't exist
  if (!machineNetwork) {
    initializeMachineNetwork(blocks);
  }
  
  // Get all relevant machines
  const collectors = blocks.filter(b => !b.isMined && getBlockData(b.blockType).category === 'collector' && !b.isSecondaryBlock);
  const refiners = blocks.filter(b => !b.isMined && getBlockData(b.blockType).category === 'refiner' && !b.isSecondaryBlock);
  const chests = blocks.filter(b => !b.isMined && getBlockData(b.blockType).category === 'chest' && !b.isSecondaryBlock);
  
  // Initialize states
  collectors.forEach(initializeStorageState);
  chests.forEach(initializeStorageState);
  refiners.forEach(initializeRefinerState);
  
  // Process collector transfers
  processCollectors(collectors);
  
  // Process refiner to chest transfers
  processRefiners(refiners);
}

// Process collectors to transfer items
function processCollectors(collectors: Block[]) {
  collectors.forEach(collector => {
    // Skip if collector is empty
    if (!collector.storageState?.storedBlocks || collector.storageState.storedBlocks.length === 0) return;
    
    // Check if there's a refinable block in the collector
    const refinableBlockIndex = collector.storageState.storedBlocks.findIndex(item => 
      isRefinable(item.blockType)
    );
    
    if (refinableBlockIndex >= 0) {
      // Try to transfer to a refiner first
      const refinedSuccessfully = transferToNearestRefiner(collector, refinableBlockIndex);
      
      // If we couldn't refine, try to transfer to a chest
      if (!refinedSuccessfully) {
        transferToNearestChest(collector);
      }
    } else {
      // If no refinable blocks, transfer to a chest
      transferToNearestChest(collector);
    }
  });
}

// Process refiners to transfer completed items
function processRefiners(refiners: Block[]) {
  refiners.forEach(refiner => {
    // Skip if refiner is not processing or not finished
    if (!refiner.machineState?.processingBlockType) return;
    
    const inputBlockType = refiner.machineState.processingBlockType;
    const refiningTime = getRefiningTime(refiner.blockType, inputBlockType);
    const elapsedTime = Date.now() - (refiner.machineState.processingStartTime || 0);
    
    // Check if refining is complete
    if (elapsedTime >= refiningTime) {
      // Mark as finished if not already
      if (!refiner.machineState.isFinished) {
        refiner.machineState.isFinished = true;
      }
      
      transferRefinedItemToChest(refiner, inputBlockType);
    }
  });
}

// Transfer item from collector to nearest available refiner
function transferToNearestRefiner(collector: Block, refinableBlockIndex: number): boolean {
  const collectorConnections = machineNetwork?.get(getBlockKey(collector)) || [];
  
  // Find the closest connected refiner that's available
  for (const connection of collectorConnections) {
    const refiner = connection.machine;
    if (getBlockData(refiner.blockType).category === 'refiner' && 
        refiner.machineState && 
        refiner.machineState.processingBlockType === null) {
      
      // Transfer the block to the refiner
      const blockToRefine = collector.storageState!.storedBlocks.splice(refinableBlockIndex, 1)[0];
      
      // Initialize refiner state if needed
      initializeRefinerState(refiner);
      
      // Start processing in the refiner
      refiner.machineState!.processingBlockType = blockToRefine.blockType;
      refiner.machineState!.processingStartTime = Date.now();
      refiner.machineState!.isFinished = false;
      
      return true;
    }
  }
  
  return false;
}

// Transfer refined item from refiner to nearest available chest
function transferRefinedItemToChest(refiner: Block, inputBlockType: number): boolean {
  const refinerConnections = machineNetwork?.get(getBlockKey(refiner)) || [];
  
  // Find the closest connected chest with space
  for (const connection of refinerConnections) {
    const chest = connection.machine;
    if (getBlockData(chest.blockType).category === 'chest' && hasStorageSpace(chest)) {
      // Get the refined block type
      const outputBlockType = REFINABLE_BLOCKS[inputBlockType as keyof typeof REFINABLE_BLOCKS];
      
      // Add to chest
      addToStorage(chest, outputBlockType, 1);
      
      // Reset refiner
      refiner.machineState!.processingBlockType = null;
      refiner.machineState!.processingStartTime = null;
      refiner.machineState!.isFinished = false;
      
      return true;
    }
  }
  
  return false;
}

// Transfer item from collector to nearest available chest
function transferToNearestChest(collector: Block): boolean {
  if (!collector.storageState?.storedBlocks || collector.storageState.storedBlocks.length === 0) return false;
  
  const collectorConnections = machineNetwork?.get(getBlockKey(collector)) || [];
  
  // Find the closest connected chest with space
  for (const connection of collectorConnections) {
    const chest = connection.machine;
    if (getBlockData(chest.blockType).category === 'chest' && hasStorageSpace(chest)) {
      // Transfer the first block to the chest
      const blockToTransfer = collector.storageState.storedBlocks.shift();
      
      if (blockToTransfer) {
        addToStorage(chest, blockToTransfer.blockType);
        return true;
      }
    }
  }
  
  return false;
}