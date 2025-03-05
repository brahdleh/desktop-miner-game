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
    className={`px-3 py-1 rounded text-sm font-pixel border-2 transition-colors ${
      disabled 
        ? 'bg-stone-600 text-stone-400 border-stone-500 cursor-not-allowed' 
        : 'bg-amber-700 hover:bg-amber-600 text-amber-200 border-amber-500 hover:border-amber-400'
    }`}
    style={{ 
      imageRendering: 'pixelated',
      boxShadow: disabled ? 'none' : '0 2px 0 #78350f'
    }}
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
                    bg-stone-800 border-4 border-amber-700 rounded-lg p-5 w-[30rem] text-stone-200"
         style={{ 
           imageRendering: 'pixelated',
           boxShadow: '0 0 20px rgba(0,0,0,0.5), inset 0 0 10px rgba(251, 191, 36, 0.2)',
           backgroundImage: 'repeating-linear-gradient(45deg, rgba(251, 191, 36, 0.03), rgba(251, 191, 36, 0.03) 10px, transparent 10px, transparent 20px)'
         }}>
      <div className="flex justify-between items-center mb-5 border-b-2 border-amber-800 pb-2">
        <h2 className="text-2xl font-bold text-amber-400" style={{ textShadow: '2px 2px 0 #78350f' }}>SHOP</h2>
        <button 
          onClick={onClose}
          className="text-amber-600 hover:text-amber-400 bg-stone-700 hover:bg-stone-600 w-8 h-8 flex items-center justify-center rounded-md border-2 border-amber-800"
        >
          ✕
        </button>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 font-bold text-amber-400 border-b-2 border-amber-900 pb-1 mb-3"
             style={{ textShadow: '1px 1px 0 #78350f' }}>
          Buy Items
        </div>
        
        <div className="flex justify-between items-center p-2 hover:bg-stone-700 rounded-md">
          <span className="flex items-center">
            <span className="inline-block w-4 h-4 mr-2 bg-amber-800 border border-amber-600"></span>
            Platform [J]
          </span>
          <div className="flex items-center">
            <span className="text-amber-400 mr-2 flex items-center">
              <span className="text-xs mr-1">⛏️</span>3
            </span>
            <MenuButton 
              onClick={() => onBuyItem(10)}
              disabled={player.gold < 3}
            >
              Buy
            </MenuButton>
          </div>
        </div>
        
        <div className="flex justify-between items-center p-2 hover:bg-stone-700 rounded-md">
          <span className="flex items-center">
            <span className="inline-block w-4 h-4 mr-2 bg-amber-500 border border-amber-300"></span>
            Torch [K]
          </span>
          <div className="flex items-center">
            <span className="text-amber-400 mr-2 flex items-center">
              <span className="text-xs mr-1">⛏️</span>5
            </span>
            <MenuButton 
              onClick={() => onBuyItem(12)}
              disabled={player.gold < 5}
            >
              Buy
            </MenuButton>
          </div>
        </div>
        
        <div className="flex justify-between items-center p-2 hover:bg-stone-700 rounded-md">
          <span className="flex items-center">
            <span className="inline-block w-4 h-4 mr-2 bg-amber-700 border border-amber-500"></span>
            Ladder [L]
          </span>
          <div className="flex items-center">
            <span className="text-amber-400 mr-2 flex items-center">
              <span className="text-xs mr-1">⛏️</span>10
            </span>
            <MenuButton 
              onClick={() => onBuyItem(11)}
              disabled={player.gold < 10}
            >
              Buy
            </MenuButton>
          </div>
        </div>
        
        <div className="flex justify-between items-center p-2 hover:bg-stone-700 rounded-md">
          <span className="flex items-center">
            <span className="inline-block w-4 h-4 mr-2 bg-stone-500 border border-stone-400"></span>
            Refiner [N]
          </span>
          <div className="flex items-center">
            <span className="text-amber-400 mr-2 flex items-center">
              <span className="text-xs mr-1">⛏️</span>50
            </span>
            <MenuButton 
              onClick={() => onBuyItem(14)}
              disabled={player.gold < 50}
            >
              Buy
            </MenuButton>
          </div>
        </div>
        
        <div className="flex justify-between items-center p-2 hover:bg-stone-700 rounded-md">
          <span className="flex items-center">
            <span className="inline-block w-4 h-4 mr-2 bg-blue-700 border border-blue-500"></span>
            Collector [M]
          </span>
          <div className="flex items-center">
            <span className="text-amber-400 mr-2 flex items-center">
              <span className="text-xs mr-1">⛏️</span>100
            </span>
            <MenuButton 
              onClick={() => onBuyItem(19)}
              disabled={player.gold < 100}
            >
              Buy
            </MenuButton>
          </div>
        </div>
        
        <div className="flex justify-between items-center p-2 hover:bg-stone-700 rounded-md">
          <span className="flex items-center">
            <span className="inline-block w-4 h-4 mr-2 bg-amber-900 border border-amber-700"></span>
            Chest [O]
          </span>
          <div className="flex items-center">
            <span className="text-amber-400 mr-2 flex items-center">
              <span className="text-xs mr-1">⛏️</span>150
            </span>
            <MenuButton 
              onClick={() => onBuyItem(20)}
              disabled={player.gold < 150}
            >
              Buy
            </MenuButton>
          </div>
        </div>
        
        <div className="flex justify-between items-center p-2 hover:bg-stone-700 rounded-md">
          <span className="flex items-center">
            <span className="inline-block w-4 h-4 mr-2 bg-stone-600 border border-stone-500"></span>
            Tube [Q]
          </span>
          <div className="flex items-center">
            <span className="text-amber-400 mr-2 flex items-center">
              <span className="text-xs mr-1">⛏️</span>50
            </span>
            <MenuButton 
              onClick={() => onBuyItem(21)}
              disabled={player.gold < 50}
            >
              Buy
            </MenuButton>
          </div>
        </div>
        
        <div className="col-span-2 font-bold text-amber-400 border-b-2 border-amber-900 pb-1 mb-3 mt-4"
             style={{ textShadow: '1px 1px 0 #78350f' }}>
          Upgrades
        </div>
        
        <div className="col-span-2 flex justify-between items-center p-2 hover:bg-stone-700 rounded-md">
          <span className="flex items-center">
            <span className="inline-block w-6 h-6 mr-2 text-center text-amber-900 bg-amber-400 rounded-full border-2 border-amber-600">P</span>
            Proficiency (Level {player.proficiency})
          </span>
          <div className="flex items-center">
            {proficiencyMaxed ? (
              <span className="text-stone-400 bg-stone-700 px-3 py-1 rounded border-2 border-stone-600">MAXED</span>
            ) : (
              <>
                <span className="text-amber-400 mr-2 flex items-center">
                  <span className="text-xs mr-1">⛏️</span>{proficiencyCost}
                </span>
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
        
        <div className="col-span-2 flex justify-between items-center p-2 hover:bg-stone-700 rounded-md">
          <span className="flex items-center">
            <span className="inline-block w-6 h-6 mr-2 text-center text-amber-900 bg-amber-400 rounded-full border-2 border-amber-600">S</span>
            Strength (Level {player.strength})
          </span>
          <div className="flex items-center">
            {strengthMaxed ? (
              <span className="text-stone-400 bg-stone-700 px-3 py-1 rounded border-2 border-stone-600">MAXED</span>
            ) : (
              <>
                <span className="text-amber-400 mr-2 flex items-center">
                  <span className="text-xs mr-1">⛏️</span>{strengthCost}
                </span>
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
        
        <div className="col-span-2 mt-5 text-center text-sm text-amber-700 bg-stone-900 p-2 rounded-md border border-amber-900">
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
                    bg-stone-800 border-4 border-amber-700 rounded-lg p-5 w-[32rem] text-stone-200"
         style={{ 
           imageRendering: 'pixelated',
           boxShadow: '0 0 20px rgba(0,0,0,0.5), inset 0 0 10px rgba(251, 191, 36, 0.2)',
           backgroundImage: 'repeating-linear-gradient(45deg, rgba(251, 191, 36, 0.03), rgba(251, 191, 36, 0.03) 10px, transparent 10px, transparent 20px)'
         }}>
      <div className="flex justify-between items-center mb-5 border-b-2 border-amber-800 pb-2">
        <h2 className="text-2xl font-bold text-amber-400" style={{ textShadow: '2px 2px 0 #78350f' }}>CRAFTING</h2>
        <button 
          onClick={onClose}
          className="text-amber-600 hover:text-amber-400 bg-stone-700 hover:bg-stone-600 w-8 h-8 flex items-center justify-center rounded-md border-2 border-amber-800"
        >
          ✕
        </button>
      </div>
      
      <div className="space-y-5">
        {/* Tool Upgrades - Combined Pickaxe and Backpack */}
        <div className="border-b-2 border-amber-900 pb-4">
          <h3 className="font-bold text-amber-400 mb-3" style={{ textShadow: '1px 1px 0 #78350f' }}>Tool Upgrades</h3>
          <div className="grid grid-cols-2 gap-4">
            {/* Pickaxe Upgrade */}
            <div className="bg-stone-700 p-3 rounded-md border-2 border-amber-900">
              {nextPickaxe ? (
                <div className="flex flex-col space-y-2">
                  <div className="flex items-center mb-1">
                    <span className="text-amber-400 mr-2">⛏️</span>
                    <span className="font-bold">{nextPickaxe.name} Pickaxe</span>
                  </div>
                  {nextPickaxe.requirements && (
                    <div className="text-sm text-stone-400 mb-2">
                      Requires: {nextPickaxe.requirements.amount}x {
                        BLOCK_TYPES_ARRAY[nextPickaxe.requirements.blockType].name
                      }
                    </div>
                  )}
                  <div className="text-right">
                    <MenuButton 
                      onClick={onCraftPickaxe}
                      disabled={!hasPickaxeMaterials}
                    >
                      Craft
                    </MenuButton>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-stone-400">
                  <span className="text-amber-700 mr-2">⛏️</span> Final Pickaxe Reached
                </div>
              )}
            </div>
            
            {/* Backpack Upgrade */}
            <div className="bg-stone-700 p-3 rounded-md border-2 border-amber-900">
              {nextBackpack ? (
                <div className="flex flex-col space-y-2">
                  <div className="flex items-center mb-1">
                    <span className="text-amber-400 mr-2">🎒</span>
                    <span className="font-bold">{nextBackpack.name} Backpack</span>
                  </div>
                  {nextBackpack.requirements && (
                    <div className="text-sm text-stone-400 mb-2">
                      Requires: {nextBackpack.requirements.amount}x {
                        BLOCK_TYPES_ARRAY[nextBackpack.requirements.blockType].name
                      }
                    </div>
                  )}
                  <div className="text-right">
                    <MenuButton 
                      onClick={onCraftBackpack}
                      disabled={!hasBackpackMaterials}
                    >
                      Craft
                    </MenuButton>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-stone-400">
                  <span className="text-amber-700 mr-2">🎒</span> Final Backpack Reached
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Two-column layout for Refiners and Ladders */}
        <div className="grid grid-cols-2 gap-4">
          {/* Refiner Crafting - Left Column */}
          <div>
            <h3 className="font-bold text-amber-400 mb-3" style={{ textShadow: '1px 1px 0 #78350f' }}>Refiners [1-4]</h3>
            <div className="space-y-3 bg-stone-700 p-3 rounded-md border-2 border-amber-900">
              <div className="flex flex-col space-y-2 border-b border-stone-600 pb-2">
                <div className="flex items-center">
                  <span className="inline-block w-4 h-4 mr-2 bg-amber-600 border border-amber-400"></span>
                  <span>Copper Refiner</span>
                </div>
                <div className="text-sm text-stone-400">Refiner + Copper</div>
                <div className="text-right">
                  <MenuButton 
                    onClick={() => onCraftRefiner(22)}
                    disabled={!hasRefinerMaterials(14, 5)}
                  >
                    Craft
                  </MenuButton>
                </div>
              </div>
              
              <div className="flex flex-col space-y-2 border-b border-stone-600 pb-2">
                <div className="flex items-center">
                  <span className="inline-block w-4 h-4 mr-2 bg-stone-400 border border-stone-300"></span>
                  <span>Iron Refiner</span>
                </div>
                <div className="text-sm text-stone-400">Copper Refiner + Iron</div>
                <div className="text-right">
                  <MenuButton 
                    onClick={() => onCraftRefiner(23)}
                    disabled={!hasRefinerMaterials(22, 6)}
                  >
                    Craft
                  </MenuButton>
                </div>
              </div>
              
              <div className="flex flex-col space-y-2 border-b border-stone-600 pb-2">
                <div className="flex items-center">
                  <span className="inline-block w-4 h-4 mr-2 bg-amber-400 border border-amber-300"></span>
                  <span>Gold Refiner</span>
                </div>
                <div className="text-sm text-stone-400">Iron Refiner + Gold</div>
                <div className="text-right">
                  <MenuButton 
                    onClick={() => onCraftRefiner(24)}
                    disabled={!hasRefinerMaterials(23, 7)}
                  >
                    Craft
                  </MenuButton>
                </div>
              </div>
              
              <div className="flex flex-col space-y-2">
                <div className="flex items-center">
                  <span className="inline-block w-4 h-4 mr-2 bg-cyan-300 border border-cyan-200"></span>
                  <span>Diamond Refiner</span>
                </div>
                <div className="text-sm text-stone-400">Gold Refiner + Diamond</div>
                <div className="text-right">
                  <MenuButton 
                    onClick={() => onCraftRefiner(25)}
                    disabled={!hasRefinerMaterials(24, 8)}
                  >
                    Craft
                  </MenuButton>
                </div>
              </div>
            </div>
          </div>
          
          {/* Ladder Crafting - Right Column */}
          <div>
            <h3 className="font-bold text-amber-400 mb-3" style={{ textShadow: '1px 1px 0 #78350f' }}>Ladders [5-8]</h3>
            <div className="space-y-3 bg-stone-700 p-3 rounded-md border-2 border-amber-900">
              <div className="flex flex-col space-y-2 border-b border-stone-600 pb-2">
                <div className="flex items-center">
                  <span className="inline-block w-4 h-4 mr-2 bg-stone-500 border border-stone-400"></span>
                  <span>Stone Ladder</span>
                </div>
                <div className="text-sm text-stone-400">Ladder + Polished Stone</div>
                <div className="text-right">
                  <MenuButton 
                    onClick={() => onCraftRefiner(26)}
                    disabled={!hasRefinerMaterials(11, 15)}
                  >
                    Craft
                  </MenuButton>
                </div>
              </div>
              
              <div className="flex flex-col space-y-2 border-b border-stone-600 pb-2">
                <div className="flex items-center">
                  <span className="inline-block w-4 h-4 mr-2 bg-stone-600 border border-stone-500"></span>
                  <span>Slate Ladder</span>
                </div>
                <div className="text-sm text-stone-400">Ladder + Polished Slate</div>
                <div className="text-right">
                  <MenuButton 
                    onClick={() => onCraftRefiner(27)}
                    disabled={!hasRefinerMaterials(26, 16)}
                  >
                    Craft
                  </MenuButton>
                </div>
              </div>
              
              <div className="flex flex-col space-y-2 border-b border-stone-600 pb-2">
                <div className="flex items-center">
                  <span className="inline-block w-4 h-4 mr-2 bg-red-700 border border-red-600"></span>
                  <span>Magma Ladder</span>
                </div>
                <div className="text-sm text-stone-400">Ladder + Polished Magma</div>
                <div className="text-right">
                  <MenuButton 
                    onClick={() => onCraftRefiner(28)}
                    disabled={!hasRefinerMaterials(27, 17)}
                  >
                    Craft
                  </MenuButton>
                </div>
              </div>
              
              <div className="flex flex-col space-y-2">
                <div className="flex items-center">
                  <span className="inline-block w-4 h-4 mr-2 bg-stone-800 border border-stone-700"></span>
                  <span>Bedrock Ladder</span>
                </div>
                <div className="text-sm text-stone-400">Ladder + Polished Bedrock</div>
                <div className="text-right">
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
    </div>
  );
}; 