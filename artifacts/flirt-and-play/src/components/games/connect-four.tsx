import { GameSession } from "@workspace/api-client-react";

interface Props {
  game: GameSession;
  onMove: (data: any) => void;
  isMyTurn: boolean;
  isSpectator: boolean;
}

export default function ConnectFour({ game, onMove, isMyTurn, isSpectator }: Props) {
  const board = (game.state?.board as (string | null)[][]) ||
    Array.from({ length: 6 }, () => Array(7).fill(null));

  const handleClick = (colIndex: number) => {
    if (!isMyTurn || isSpectator) return;
    if (board[0]?.[colIndex] !== null) return;
    onMove({ column: colIndex });
  };

  return (
    <div className="flex flex-col items-center">
      <div className="p-4 sm:p-6 bg-card rounded-2xl border border-border shadow-[0_0_50px_-15px_rgba(139,92,246,0.15)]">
        <div className="flex gap-2">
          {Array(7).fill(null).map((_, colIndex) => (
            <div
              key={colIndex}
              className={`flex flex-col gap-2 rounded-lg p-1 transition-colors ${isMyTurn && !isSpectator && board[0]?.[colIndex] === null ? 'cursor-pointer hover:bg-white/5' : ''}`}
              onClick={() => handleClick(colIndex)}
            >
              {board.map((row, rowIndex) => {
                const cell = row[colIndex];
                return (
                  <div
                    key={rowIndex}
                    className={`w-10 h-10 sm:w-14 sm:h-14 rounded-full border-4 transition-all duration-300
                      ${cell === null ? 'border-border bg-background shadow-inner' : ''}
                      ${cell === 'x' ? 'border-primary bg-primary shadow-[0_0_15px_rgba(236,72,153,0.5)]' : ''}
                      ${cell === 'o' ? 'border-secondary bg-secondary shadow-[0_0_15px_rgba(139,92,246,0.5)]' : ''}
                    `}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
