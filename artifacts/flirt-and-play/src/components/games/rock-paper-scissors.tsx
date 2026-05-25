import { GameSession } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Hand, Scroll, Scissors } from "lucide-react";

interface RockPaperScissorsProps {
  game: GameSession;
  onMove: (move: any) => void;
  isMyTurn: boolean;
  isSpectator: boolean;
}

export default function RockPaperScissors({ game, onMove, isMyTurn, isSpectator }: RockPaperScissorsProps) {
  const boardState = game.boardState as { 
    rounds: { X?: 'rock'|'paper'|'scissors', O?: 'rock'|'paper'|'scissors', winner?: 'X'|'O'|'draw' }[], 
    currentRound: number 
  } | undefined;

  const rounds = boardState?.rounds || [];
  const currentRoundIndex = boardState?.currentRound || 0;
  
  const choices = [
    { id: 'rock', icon: Hand, label: 'Rock', color: 'text-orange-500' },
    { id: 'paper', icon: Scroll, label: 'Paper', color: 'text-blue-500' },
    { id: 'scissors', icon: Scissors, label: 'Scissors', color: 'text-pink-500' }
  ];

  const handleChoice = (choice: string) => {
    if (!isMyTurn || isSpectator) return;
    onMove({ choice });
  };

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-md mx-auto">
      <div className="flex justify-between w-full mb-4">
        {Array(3).fill(0).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            <span className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Round {i + 1}</span>
            <div className={cn(
              "w-12 h-12 rounded-full border-2 flex items-center justify-center font-bold",
              i < currentRoundIndex ? (
                rounds[i]?.winner === 'draw' ? "border-yellow-500 text-yellow-500" :
                (rounds[i]?.winner === 'X' && game.playerXUserId === game.currentTurnUserId) || (rounds[i]?.winner === 'O' && game.playerOUserId === game.currentTurnUserId) ? "border-green-500 text-green-500" : "border-red-500 text-red-500"
              ) : i === currentRoundIndex ? "border-primary text-primary animate-pulse" : "border-border/50 text-muted-foreground"
            )}>
              {i < currentRoundIndex ? (
                rounds[i]?.winner === 'draw' ? '-' :
                rounds[i]?.winner === 'X' ? 'P1' : 'P2'
              ) : i + 1}
            </div>
          </div>
        ))}
      </div>

      <div className="w-full bg-card/40 backdrop-blur border border-border/50 rounded-2xl p-8 flex flex-col items-center gap-6 shadow-[0_0_50px_rgba(0,0,0,0.3)]">
        <h3 className="text-xl font-medium mb-4">Make your choice</h3>
        <div className="flex justify-center gap-4 sm:gap-6 w-full">
          {choices.map(choice => {
            const Icon = choice.icon;
            return (
              <button
                key={choice.id}
                onClick={() => handleChoice(choice.id)}
                disabled={!isMyTurn || isSpectator}
                className={cn(
                  "flex flex-col items-center gap-4 p-6 rounded-xl border-2 transition-all duration-300 w-28 sm:w-32",
                  !isMyTurn || isSpectator 
                    ? "border-border/30 bg-background/50 opacity-50 cursor-not-allowed" 
                    : "border-border bg-background hover:border-primary hover:bg-primary/5 hover:scale-105 cursor-pointer shadow-lg"
                )}
              >
                <Icon className={cn("w-12 h-12", isMyTurn && !isSpectator ? choice.color : "text-muted-foreground")} />
                <span className="font-semibold text-sm">{choice.label}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  );
}
