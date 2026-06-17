import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RotateCcw, Check, Eye } from "lucide-react";

const WORD_SETS = [
  ["FLIRT", "PLAY", "LOVE", "KISS", "DATE", "CUTE", "HUG", "FUN"],
  ["DREAM", "MAGIC", "STAR", "LIGHT", "HEART", "SOUL", "HOPE", "JOY"],
  ["DARING", "BRAVE", "WILD", "FREE", "BOLD", "ROAR", "RISE", "WIN"],
  ["SASSY", "SPICY", "SWEET", "NAUGHTY", "CHILL", "VIBE", "MOOD", "GLOW"],
  ["PASSION", "DESIRE", "CRUSH", "SPARK", "FLAME", "HEAT", "RUSH", "THRILL"],
];

const GRID_SIZE = 10;

interface Cell {
  char: string;
  isHighlighted: boolean;
  isFound: boolean;
  row: number;
  col: number;
}

export default function WordSearch() {
  const [grid, setGrid] = useState<Cell[][]>([]);
  const [words, setWords] = useState<string[]>([]);
  const [foundWords, setFoundWords] = useState<string[]>([]);
  const [selectedCells, setSelectedCells] = useState<{row: number; col: number}[]>([]);
  const [isSelecting, setIsSelecting] = useState(false);
  const [showWords, setShowWords] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);

  const generateGrid = useCallback(() => {
    const wordSet = WORD_SETS[Math.floor(Math.random() * WORD_SETS.length)];
    const newGrid: Cell[][] = Array.from({ length: GRID_SIZE }, (_, r) =>
      Array.from({ length: GRID_SIZE }, (_, c) => ({
        char: String.fromCharCode(65 + Math.floor(Math.random() * 26)),
        isHighlighted: false,
        isFound: false,
        row: r,
        col: c,
      }))
    );

    // Place words
    const placedWords: string[] = [];
    for (const word of wordSet) {
      let placed = false;
      let attempts = 0;
      while (!placed && attempts < 50) {
        attempts++;
        const dir = Math.random() < 0.5 ? "horizontal" : "vertical";
        const row = Math.floor(Math.random() * (dir === "horizontal" ? GRID_SIZE : GRID_SIZE - word.length + 1));
        const col = Math.floor(Math.random() * (dir === "vertical" ? GRID_SIZE : GRID_SIZE - word.length + 1));

        let canPlace = true;
        for (let i = 0; i < word.length; i++) {
          const r = dir === "horizontal" ? row : row + i;
          const c = dir === "horizontal" ? col + i : col;
          if (newGrid[r][c].char !== word[i] && newGrid[r][c].char !== String.fromCharCode(65 + Math.floor(Math.random() * 26))) {
            canPlace = false;
            break;
          }
        }

        if (canPlace) {
          for (let i = 0; i < word.length; i++) {
            const r = dir === "horizontal" ? row : row + i;
            const c = dir === "horizontal" ? col + i : col;
            newGrid[r][c].char = word[i];
          }
          placedWords.push(word);
          placed = true;
        }
      }
    }

    setGrid(newGrid);
    setWords(placedWords);
    setFoundWords([]);
    setSelectedCells([]);
    setIsGameOver(false);
  }, []);

  useEffect(() => {
    generateGrid();
  }, [generateGrid]);

  useEffect(() => {
    if (words.length > 0 && foundWords.length === words.length) {
      setIsGameOver(true);
    }
  }, [foundWords, words]);

  const handleCellDown = (row: number, col: number) => {
    setIsSelecting(true);
    setSelectedCells([{ row, col }]);
  };

  const handleCellEnter = (row: number, col: number) => {
    if (!isSelecting) return;
    const start = selectedCells[0];
    if (!start) return;

    const dr = row - start.row;
    const dc = col - start.col;
    const dist = Math.max(Math.abs(dr), Math.abs(dc));
    if (dist === 0) return;

    const stepR = Math.sign(dr);
    const stepC = Math.sign(dc);

    const newSelection: { row: number; col: number }[] = [];
    for (let i = 0; i <= dist; i++) {
      const r = start.row + stepR * i;
      const c = start.col + stepC * i;
      if (r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE) {
        newSelection.push({ row: r, col: c });
      }
    }
    setSelectedCells(newSelection);
  };

  const handleCellUp = () => {
    if (!isSelecting) return;
    setIsSelecting(false);

    const selectedWord = selectedCells.map((c) => grid[c.row][c.col].char).join("");
    const reversedWord = selectedCells.map((c) => grid[c.row][c.col].char).reverse().join("");

    const word = words.find((w) => !foundWords.includes(w) && (w === selectedWord || w === reversedWord));
    if (word) {
      setFoundWords((prev) => [...prev, word]);
      setGrid((prev) =>
        prev.map((row) =>
          row.map((cell) => {
            const isSelected = selectedCells.some((s) => s.row === cell.row && s.col === cell.col);
            return isSelected ? { ...cell, isFound: true } : cell;
          })
        )
      );
    }
    setSelectedCells([]);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-4">
        <div className="text-sm font-medium">
          Found: {foundWords.length}/{words.length}
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowWords(!showWords)}>
          <Eye className="h-4 w-4 mr-1" /> {showWords ? "Hide" : "Show"} Words
        </Button>
        <Button variant="outline" size="sm" onClick={generateGrid}>
          <RotateCcw className="h-4 w-4 mr-1" /> New Grid
        </Button>
      </div>

      {showWords && (
        <div className="flex flex-wrap gap-2 justify-center">
          {words.map((word) => (
            <span
              key={word}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                foundWords.includes(word)
                  ? "bg-green-500/20 text-green-500 line-through"
                  : "bg-muted text-foreground"
              }`}
            >
              {foundWords.includes(word) && <Check className="inline h-3 w-3 mr-1" />}
              {word}
            </span>
          ))}
        </div>
      )}

      {isGameOver && (
        <Card className="bg-green-500/10 border-green-500/30 px-4 py-2">
          <div className="font-bold text-green-500">You found all words!</div>
        </Card>
      )}

      <div
        ref={gridRef}
        className="grid grid-cols-10 gap-1 select-none touch-none"
        onMouseUp={handleCellUp}
        onMouseLeave={handleCellUp}
        onTouchEnd={handleCellUp}
      >
        {grid.map((row, r) =>
          row.map((cell, c) => {
            const isSelected = selectedCells.some((s) => s.row === r && s.col === c);
            return (
              <div
                key={`${r}-${c}`}
                className={`w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-sm font-bold rounded-lg cursor-pointer transition-all
                  ${cell.isFound ? "bg-green-500/20 text-green-500" : ""}
                  ${isSelected ? "bg-primary text-primary-foreground" : "bg-card border border-border"}
                `}
                onMouseDown={() => handleCellDown(r, c)}
                onMouseEnter={() => handleCellEnter(r, c)}
                onTouchStart={() => handleCellDown(r, c)}
              >
                {cell.char}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
