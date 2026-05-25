import { GameSession } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";

interface ConnectFourProps {
  game: GameSession;
  onMove: (move: any) => void;
  isMyTurn: boolean;
  isSpectator: boolean;
}

export default function ConnectFour({ game, onMove, isMyTurn, isSpectator }: ConnectFourProps) {
  const boardState = game.boardState as { board: (string | null)[][] } | undefined;
  
  // Default empty 6x7 board
  const board = boardState?.board || Array(6).fill(null).map(() => Array(7).fill(null));
  
  const handleColClick = (colIdx: number) => {
    if (!isMyTurn || isSpectator) return;
    // Check if column is full (top row)
    if (board[0][colIdx] !== null) return;
    onMove({ col: colIdx });
  };

  return (
    <div className="flex flex-col items-center">
      <div className="bg-blue-900/40 p-4 sm:p-6 rounded-xl border-4 border-blue-600/50 shadow-[0_0_40px_rgba(37,99,235,0.3)]">
        <div className="flex gap-2 mb-2 px-2">
          {/* Column hover indicators */}
          {Array(7).fill(0).map((_, i) => (
            <div key={i} className="flex-1 flex justify-center h-4">
              {isMyTurn && !isSpectator && board[0][i] === null && (
                <div className="w-4 h-4 rounded-full bg-primary/50 animate-bounce" />
              )}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-2 sm:gap-3 bg-blue-800/60 p-3 rounded-lg">
          {board.map((row, rowIdx) => (
            row.map((cell, colIdx) => (
              <button
                key={`${rowIdx}-${colIdx}`}
                onClick={() => handleColClick(colIdx)}
                disabled={!isMyTurn || isSpectator}
                className="w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-background shadow-inner flex items-center justify-center overflow-hidden cursor-pointer disabled:cursor-default"
              >
                {cell === 'X' && (
                  <div className="w-full h-full bg-red-500 rounded-full shadow-[inset_0_-5px_15px_rgba(0,0,0,0.5)] animate-in slide-in-from-top-full duration-500" />
                )}
                {cell === 'O' && (
                  <div className="w-full h-full bg-yellow-400 rounded-full shadow-[inset_0_-5px_15px_rgba(0,0,0,0.5)] animate-in slide-in-from-top-full duration-500" />
                )}
              </button>
            ))
          ))}
        </div>
      </div>
    </div>
  );
}
