// Utility functions for bingo game logic

import type { BingoCardProps } from "@/components/bingo-card/bingocard";

// Simple seeded random number generator
function seededRandom(seed: string): () => number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  let state = Math.abs(hash);
  
  return function() {
    state = (state * 9301 + 49297) % 233280;
    return state / 233280;
  };
}

// Generate bingo data from seed
export function generateBingoData(
  seed: string,
  size: number,
  teams: Array<{ name: string; color: string }>,
  itemTitles?: string[]
): BingoCardProps["bingoData"] {
  const random = seededRandom(seed);
  const totalCells = size * size;
  const data: BingoCardProps["bingoData"] = [];
  
  // Default item titles if not provided
  const defaultTitles = Array.from({ length: 100 }, (_, i) => `Bingo Title Card ${i + 1}`);
  const titles = itemTitles && itemTitles.length > 0 
    ? itemTitles 
    : defaultTitles;
  
  for (let i = 0; i < totalCells; i++) {
    // Select a random title
    const titleIndex = Math.floor(random() * titles.length);
    const title = titles[titleIndex];
    
    // Generate slot items based on teams (random assignment)
    const slotItems: Array<{ color: string; number: number }> = [];
    const numSlots = Math.floor(random() * 4) + 1; // 1-4 slots
    
    for (let j = 0; j < numSlots; j++) {
      const teamIndex = Math.floor(random() * teams.length);
      const team = teams[teamIndex];
      const number = Math.floor(random() * 5) + 1; // 1-5
      slotItems.push({ color: team.color, number });
    }
    
    data.push({
      title,
      slotItems: slotItems as any,
      favorite: false,
      locked: false,
      disabled: false,
    });
  }
  
  return data;
}

// Convert room boardSize (0, 50, 100) to actual grid size
export function getGridSize(boardSize: number): number {
  if (boardSize === 0) return 5; // 5x5 grid
  if (boardSize === 50) return 7; // 7x7 grid
  if (boardSize === 100) return 10; // 10x10 grid
  return 5; // default
}

