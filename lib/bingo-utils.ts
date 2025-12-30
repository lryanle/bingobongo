// Utility functions for bingo game logic

import type { BingoCardProps } from "@/components/bingo-card/bingocard";

// Simple seeded random number generator
function seededRandom(seed: string): () => number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.codePointAt(i) || 0;
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
  
  // Use provided item titles - there should always be enough items provided
  // No fallback to defaults - items must be provided
  let titles: string[] = [];
  
  if (itemTitles && itemTitles.length > 0) {
    // Use provided items directly - they should already match grid size exactly
    // If more items than needed, use only the first totalCells
    // If fewer items than needed, this should never happen per user requirement
    titles = [...itemTitles];
    
    // Ensure we have exactly totalCells items
    if (titles.length < totalCells) {
      // This should never happen - user requirement states there will always be enough items
      // But handle gracefully by padding with empty strings
      titles = [...titles, ...new Array(totalCells - titles.length).fill("")];
    } else if (titles.length > totalCells) {
      // Use only the first totalCells items
      titles = titles.slice(0, totalCells);
    }
  } else {
    // No items provided - fill with empty strings (should not happen per user requirement)
    titles = new Array(totalCells).fill("");
  }
  
  for (let i = 0; i < totalCells; i++) {
    // Use the title at this index
    const title = titles[i] || "";
    
    // Start with no slot items - they will be added when items are claimed
    const slotItems: Array<{ color: string; number: number }> = [];
    
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

// Check if a team has won classic bingo based on claimed items
export function checkTeamBingoWin(
  claimedItems: Array<{ cellIndex: number; teamIndex: number }>,
  teamIndex: number,
  gridSize: number,
  requiredBingos: number = 1
): { hasWon: boolean; winningLines?: Array<{ type: 'row' | 'col' | 'diag'; index: number; cells: number[] }> } {
  // Filter claimed items for this team
  const teamClaims = claimedItems
    .filter((item) => item.teamIndex === teamIndex)
    .map((item) => item.cellIndex);

  if (teamClaims.length < gridSize * requiredBingos) {
    return { hasWon: false };
  }

  // Create a grid representation
  const grid: (number | null)[][] = Array(gridSize).fill(null).map(() => Array(gridSize).fill(null));
  teamClaims.forEach((index) => {
    const row = Math.floor(index / gridSize);
    const col = index % gridSize;
    if (row < gridSize && col < gridSize) {
      grid[row][col] = teamIndex;
    }
  });

  const winningLines: Array<{ type: 'row' | 'col' | 'diag'; index: number; cells: number[] }> = [];
  let bingoCount = 0;

  // Check rows
  for (let row = 0; row < gridSize; row++) {
    if (grid[row].every((cell) => cell === teamIndex)) {
      const cells: number[] = [];
      for (let col = 0; col < gridSize; col++) {
        cells.push(row * gridSize + col);
      }
      winningLines.push({ type: 'row', index: row, cells });
      bingoCount++;
    }
  }

  // Check columns
  for (let col = 0; col < gridSize; col++) {
    if (grid.map((row) => row[col]).every((cell) => cell === teamIndex)) {
      const cells: number[] = [];
      for (let row = 0; row < gridSize; row++) {
        cells.push(row * gridSize + col);
      }
      winningLines.push({ type: 'col', index: col, cells });
      bingoCount++;
    }
  }

  // Check diagonals
  let diag1 = true;
  let diag2 = true;
  const diag1Cells: number[] = [];
  const diag2Cells: number[] = [];
  
  for (let i = 0; i < gridSize; i++) {
    if (grid[i][i] !== teamIndex) diag1 = false;
    else diag1Cells.push(i * gridSize + i);
    
    if (grid[i][gridSize - 1 - i] !== teamIndex) diag2 = false;
    else diag2Cells.push(i * gridSize + (gridSize - 1 - i));
  }
  
  if (diag1) {
    winningLines.push({ type: 'diag', index: 0, cells: diag1Cells });
    bingoCount++;
  }
  if (diag2) {
    winningLines.push({ type: 'diag', index: 1, cells: diag2Cells });
    bingoCount++;
  }

  return {
    hasWon: bingoCount >= requiredBingos,
    winningLines: bingoCount >= requiredBingos ? winningLines : undefined,
  };
}

