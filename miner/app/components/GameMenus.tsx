import React from 'react';
import { Player } from '../types';
import { 
  BLOCK_TYPES, 
  PICKAXE_TYPES, 
  BACKPACK_TYPES,
  MAX_PROFICIENCY_LEVEL,
  MAX_STRENGTH_LEVEL
} from '../constants';
import { getProficiencyUpgradeCost, getStrengthUpgradeCost } from '../utils/calculation-utils';
import { getBlockInventory } from '../utils/data-utils';

// Cache arrays so that Object.values() isn't re-computed each render
const BLOCK_TYPES_ARRAY = Object.values(BLOCK_TYPES);
const PICKAXE_TYPES_ARRAY = Object.values(PICKAXE_TYPES);
const BACKPACK_TYPES_ARRAY = Object.values(BACKPACK_TYPES);

interface MenuButtonProps {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}

const MenuButton: React.FC<MenuButtonProps> = ({ onClick, disabled, children }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`px-3 py-1 rounded text-sm ${
      disabled 
        ? 'bg-gray-500 text-gray-300 cursor-not-allowed' 
        : 'bg-blue-600 hover:bg-blue-700 text-white'
    }`}
  >
    {children}
  </button>
);

interface ShopMenuProps {
  player: Player;
  onClose: () => void;
  onBuyItem: (blockType: number) => void;
  onUpgradeProficiency: () => void;
  onUpgradeStrength: () => void;
}

export const ShopMenu: React.FC<ShopMenuProps> = ({ 
  player, 
  onClose, 
  onBuyItem,
  onUpgradeProficiency,
  onUpgradeStrength
}) => {
  const proficiencyMaxed = player.proficiency >= MAX_PROFICIENCY_LEVEL;
  const proficiencyCost = getProficiencyUpgradeCost(player);
  
  const strengthMaxed = player.strength >= MAX_STRENGTH_LEVEL;
  const strengthCost = getStrengthUpgradeCost(player);

  return (
    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
                    bg-gray-800 border-2 border-yellow-500 rounded-lg p-4 w-[30rem] text-white">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-yellow-400">SHOP</h2>
        <button 
          onClick={onClose}
          className="text-gray-400 hover:text-white"
        >
          ✕
        </button>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 font-bold text-yellow-300 border-b border-yellow-700 pb-1 mb-1">
          Buy Items
        </div>
        
        <div className="flex justify-between items-center">
          <span>Platform [J]</span>
          <div className="flex items-center">
            <span className="text-yellow-400 mr-2">3</span>
            <MenuButton 
              onClick={() => onBuyItem(10)}
              disabled={player.gold < 3}
            >
              Buy
            </MenuButton>
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <span>Torch [K]</span>
          <div className="flex items-center">
            <span className="text-yellow-400 mr-2">5</span>
            <MenuButton 
              onClick={() => onBuyItem(12)}
              disabled={player.gold < 5}
            >
              Buy
            </MenuButton>
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <span>Ladder [L]</span>
          <div className="flex items-center">
            <span className="text-yellow-400 mr-2">10</span>
            <MenuButton 
              onClick={() => onBuyItem(11)}
              disabled={player.gold < 10}
            >
              Buy
            </MenuButton>
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <span>Refiner [N]</span>
          <div className="flex items-center">
            <span className="text-yellow-400 mr-2">50</span>
            <MenuButton 
              onClick={() => onBuyItem(14)}
              disabled={player.gold < 50}
            >
              Buy
            </MenuButton>
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <span>Collector [M]</span>
          <div className="flex items-center">
            <span className="text-yellow-400 mr-2">100</span>
            <MenuButton 
              onClick={() => onBuyItem(19)}
              disabled={player.gold < 100}
            >
              Buy
            </MenuButton>
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <span>Chest [O]</span>
          <div className="flex items-center">
            <span className="text-yellow-400 mr-2">150</span>
            <MenuButton 
              onClick={() => onBuyItem(20)}
              disabled={player.gold < 150}
            >
              Buy
            </MenuButton>
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <span>Tube [Q]</span>
          <div className="flex items-center">
            <span className="text-yellow-400 mr-2">50</span>
            <MenuButton 
              onClick={() => onBuyItem(21)}
              disabled={player.gold < 50}
            >
              Buy
            </MenuButton>
          </div>
        </div>
        
        <div className="col-span-2 font-bold text-yellow-300 border-b border-yellow-700 pb-1 mb-1 mt-3">
          Upgrades
        </div>
        
        <div className="col-span-2 flex justify-between items-center">
          <span>Proficiency</span>
          <div className="flex items-center">
            {proficiencyMaxed ? (
              <span className="text-gray-400">MAXED</span>
            ) : (
              <>
                <span className="text-yellow-400 mr-2">{proficiencyCost}</span>
                <MenuButton 
                  onClick={onUpgradeProficiency}
                  disabled={player.gold < proficiencyCost}
                >
                  Upgrade
                </MenuButton>
              </>
            )}
          </div>
        </div>
        
        <div className="col-span-2 flex justify-between items-center">
          <span>Strength</span>
          <div className="flex items-center">
            {strengthMaxed ? (
              <span className="text-gray-400">MAXED</span>
            ) : (
              <>
                <span className="text-yellow-400 mr-2">{strengthCost}</span>
                <MenuButton 
                  onClick={onUpgradeStrength}
                  disabled={player.gold < strengthCost}
                >
                  Upgrade
                </MenuButton>
              </>
            )}
          </div>
        </div>
        
        <div className="col-span-2 mt-4 text-center text-xs text-gray-400">
          Press P to sell blocks
        </div>
      </div>
    </div>
  );
};

interface CraftingMenuProps {
  player: Player;
  onClose: () => void;
  onCraftPickaxe: () => void;
  onCraftBackpack: () => void;
  onCraftRefiner: (refinerType: number) => void;
}

export const CraftingMenu: React.FC<CraftingMenuProps> = ({ 
  player, 
  onClose, 
  onCraftPickaxe,
  onCraftBackpack,
  onCraftRefiner
}) => {
  // Get next pickaxe info
  const nextPickaxeType = player.pickaxeType + 1;
  const nextPickaxe = PICKAXE_TYPES_ARRAY[nextPickaxeType];
  
  // Get next backpack info
  const nextBackpackType = player.backpackType + 1;
  const nextBackpack = BACKPACK_TYPES_ARRAY[nextBackpackType];
  
  // Check if player has required materials for pickaxe
  const hasPickaxeMaterials = nextPickaxe && nextPickaxe.requirements ? 
    player.inventorySlots.some(slot => 
      slot.blockType === nextPickaxe.requirements?.blockType && 
      slot.count >= nextPickaxe.requirements?.amount
    ) : false;
  
  // Check if player has required materials for backpack
  const hasBackpackMaterials = nextBackpack && nextBackpack.requirements ? 
    player.inventorySlots.some(slot => 
      slot.blockType === nextBackpack.requirements?.blockType && 
      slot.count >= nextBackpack.requirements?.amount
    ) : false;

  // Helper function to check if player has materials for a refiner
  const hasRefinerMaterials = (baseType: number, oreType: number) => {
    if (getBlockInventory(player, baseType) < 1) return false
    if (getBlockInventory(player, oreType) < 1) return false
    return true
  };

  return (
    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
                    bg-gray-800 border-2 border-yellow-500 rounded-lg p-4 w-[32rem] text-white">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-yellow-400">CRAFTING</h2>
        <button 
          onClick={onClose}
          className="text-gray-400 hover:text-white"
        >
          ✕
        </button>
      </div>
      
      <div className="space-y-4">
        {/* Tool Upgrades - Combined Pickaxe and Backpack */}
        <div className="border-b border-yellow-700 pb-3">
          <h3 className="font-bold text-yellow-300 mb-2">Tool Upgrades</h3>
          <div className="grid grid-cols-2 gap-4">
            {/* Pickaxe Upgrade */}
            <div>
              {nextPickaxe ? (
                <div className="flex justify-between items-center">
                  <div>
                    <div>{nextPickaxe.name} Pickaxe</div>
                    {nextPickaxe.requirements && (
                      <div className="text-sm text-gray-400">
                        Requires: {nextPickaxe.requirements.amount}x {
                          BLOCK_TYPES_ARRAY[nextPickaxe.requirements.blockType].name
                        }
                      </div>
                    )}
                  </div>
                  <MenuButton 
                    onClick={onCraftPickaxe}
                    disabled={!hasPickaxeMaterials}
                  >
                    Craft
                  </MenuButton>
                </div>
              ) : (
                <div className="text-gray-400">Final Pickaxe Reached</div>
              )}
            </div>
            
            {/* Backpack Upgrade */}
            <div>
              {nextBackpack ? (
                <div className="flex justify-between items-center">
                  <div>
                    <div>{nextBackpack.name} Backpack</div>
                    {nextBackpack.requirements && (
                      <div className="text-sm text-gray-400">
                        Requires: {nextBackpack.requirements.amount}x {
                          BLOCK_TYPES_ARRAY[nextBackpack.requirements.blockType].name
                        }
                      </div>
                    )}
                  </div>
                  <MenuButton 
                    onClick={onCraftBackpack}
                    disabled={!hasBackpackMaterials}
                  >
                    Craft
                  </MenuButton>
                </div>
              ) : (
                <div className="text-gray-400">Final Backpack Reached</div>
              )}
            </div>
          </div>
        </div>
        
        {/* Two-column layout for Refiners and Ladders */}
        <div className="grid grid-cols-2 gap-4">
          {/* Refiner Crafting - Left Column */}
          <div>
            <h3 className="font-bold text-yellow-300 mb-2">Refiners [1-4]</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <div>
                  <div>Copper Refiner</div>
                  <div className="text-sm text-gray-400">Refiner + Copper</div>
                </div>
                <MenuButton 
                  onClick={() => onCraftRefiner(22)}
                  disabled={!hasRefinerMaterials(14, 5)}
                >
                  Craft
                </MenuButton>
              </div>
              
              <div className="flex justify-between items-center">
                <div>
                  <div>Iron Refiner</div>
                  <div className="text-sm text-gray-400">Copper Refiner + Iron</div>
                </div>
                <MenuButton 
                  onClick={() => onCraftRefiner(23)}
                  disabled={!hasRefinerMaterials(22, 6)}
                >
                  Craft
                </MenuButton>
              </div>
              
              <div className="flex justify-between items-center">
                <div>
                  <div>Gold Refiner</div>
                  <div className="text-sm text-gray-400">Iron Refiner + Gold</div>
                </div>
                <MenuButton 
                  onClick={() => onCraftRefiner(24)}
                  disabled={!hasRefinerMaterials(23, 7)}
                >
                  Craft
                </MenuButton>
              </div>
              
              <div className="flex justify-between items-center">
                <div>
                  <div>Diamond Refiner</div>
                  <div className="text-sm text-gray-400">Gold Refiner + Diamond</div>
                </div>
                <MenuButton 
                  onClick={() => onCraftRefiner(25)}
                  disabled={!hasRefinerMaterials(24, 8)}
                >
                  Craft
                </MenuButton>
              </div>
            </div>
          </div>
          
          {/* Ladder Crafting - Right Column */}
          <div>
            <h3 className="font-bold text-yellow-300 mb-2">Ladders [5-8]</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <div>
                  <div>Stone Ladder</div>
                  <div className="text-sm text-gray-400">Ladder + Polished Stone</div>
                </div>
                <MenuButton 
                  onClick={() => onCraftRefiner(26)}
                  disabled={!hasRefinerMaterials(11, 15)}
                >
                  Craft
                </MenuButton>
              </div>
              
              <div className="flex justify-between items-center">
                <div>
                  <div>Slate Ladder</div>
                  <div className="text-sm text-gray-400">Ladder + Polished Slate</div>
                </div>
                <MenuButton 
                  onClick={() => onCraftRefiner(27)}
                  disabled={!hasRefinerMaterials(26, 16)}
                >
                  Craft
                </MenuButton>
              </div>
              
              <div className="flex justify-between items-center">
                <div>
                  <div>Magma Ladder</div>
                  <div className="text-sm text-gray-400">Ladder + Polished Magma</div>
                </div>
                <MenuButton 
                  onClick={() => onCraftRefiner(28)}
                  disabled={!hasRefinerMaterials(27, 17)}
                >
                  Craft
                </MenuButton>
              </div>
              
              <div className="flex justify-between items-center">
                <div>
                  <div>Bedrock Ladder</div>
                  <div className="text-sm text-gray-400">Ladder + Polished Bedrock</div>
                </div>
                <MenuButton 
                  onClick={() => onCraftRefiner(29)}
                  disabled={!hasRefinerMaterials(28, 18)}
                >
                  Craft
                </MenuButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 