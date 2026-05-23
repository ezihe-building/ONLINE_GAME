import { GameSession } from "@workspace/api-client-react";

interface Props {
  game: GameSession;
  onMove: (data: any) => void;
  isMyTurn: boolean;
  isSpectator: boolean;
}

export default function TicTacToe({ game, onMove, isMyTurn, isSpectator }: Props) {
  const board = (game.state?.board as string[]) || Array(9).fill(null);

  const handleClick = (index: number) => {
    if (!isMyTurn || isSpectator || board[index] !== null) return;
    onMove({ cell: index });
  };

  return (
    <div className="flex flex-col items-center">
      <div className="grid grid-cols-3 gap-2 sm:gap-4 p-4 sm:p-6 bg-card rounded-2xl border border-border shadow-[0_0_50px_-15px_rgba(236,72,153,0.15)]">
        {board.map((cell, i) => (
          <div 
            key={i}
            onClick={() => handleClick(i)}
            className={`w-20 h-20 sm:w-28 sm:h-28 flex items-center justify-center text-4xl sm:text-6xl font-black rounded-xl cursor-pointer transition-all duration-300
              ${cell === null && isMyTurn && !isSpectator ? 'hover:bg-muted bg-background border border-border cursor-pointer hover:border-primary/50' : 'bg-background border border-border'}
              ${cell === 'X' ? 'text-primary shadow-[inset_0_0_20px_rgba(236,72,153,0.1)]' : ''}
              ${cell === 'O' ? 'text-secondary shadow-[inset_0_0_20px_rgba(139,92,246,0.1)]' : ''}
              ${!isMyTurn || isSpectator || cell !== null ? 'cursor-default' : ''}
            `}
          >
            {cell}
          </div>
        ))}
      </div>
    </div>
  );
}