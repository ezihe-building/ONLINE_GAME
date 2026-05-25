import { GameSession } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";

interface TicTacToeProps {
  game: GameSession;
  onMove: (move: any) => void;
  isMyTurn: boolean;
  isSpectator: boolean;
}

export default function TicTacToe({ game, onMove, isMyTurn, isSpectator }: TicTacToeProps) {
  const boardState = game.boardState as { board: (string | null)[] } | undefined;
  const board = boardState?.board || Array(9).fill(null);
  
  // Calculate winning line if finished
  let winningIndices: number[] = [];
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
  ];
  if (game.status === 'finished' && !game.isDraw) {
    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        winningIndices = [a, b, c];
        break;
      }
    }
  }

  const handleCellClick = (index: number) => {
    if (!isMyTurn || isSpectator || board[index]) return;
    onMove({ cell: index });
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="grid grid-cols-3 gap-3 bg-card/30 p-4 rounded-xl border border-border/50 shadow-2xl backdrop-blur">
        {board.map((cell, idx) => (
          <button
            key={idx}
            onClick={() => handleCellClick(idx)}
            disabled={!isMyTurn || isSpectator || cell !== null}
            className={cn(
              "w-24 h-24 sm:w-32 sm:h-32 rounded-lg text-6xl flex items-center justify-center transition-all duration-300",
              "bg-background/80 border border-border/50",
              !cell && isMyTurn && "hover:bg-primary/10 hover:border-primary/50 cursor-pointer",
              cell === 'X' && "text-primary shadow-[inset_0_0_20px_rgba(236,72,153,0.2)]",
              cell === 'O' && "text-accent shadow-[inset_0_0_20px_rgba(217,70,239,0.2)]",
              winningIndices.includes(idx) && "bg-green-500/20 border-green-500 text-green-400 scale-105 z-10 shadow-[0_0_30px_rgba(74,222,128,0.3)]"
            )}
          >
            {cell && <span className="animate-in zoom-in spin-in-12 duration-300">{cell}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}
