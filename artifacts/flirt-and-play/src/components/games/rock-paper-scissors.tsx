import { GameSession } from "@workspace/api-client-react";
import { HandMetal, Hand, Scissors } from "lucide-react";

interface Props {
  game: GameSession;
  onMove: (data: any) => void;
  isMyTurn: boolean;
  isSpectator: boolean;
  profileId: number;
}

export default function RockPaperScissors({ game, onMove, isMyTurn, isSpectator, profileId }: Props) {
  const choices = [
    { id: "rock", icon: HandMetal, label: "Rock" },
    { id: "paper", icon: Hand, label: "Paper" },
    { id: "scissors", icon: Scissors, label: "Scissors" }
  ];

  const isX = game.playerXUserId === profileId;
  const state = game.state as Record<string, unknown>;
  const picks = (state?.picks ?? {}) as Record<string, string>;
  const scores = (state?.scores ?? { x: 0, o: 0 }) as { x: number; o: number };
  const round = (state?.round ?? 1) as number;
  const maxRounds = (state?.maxRounds ?? 3) as number;

  const myChoice = isX ? picks.x : picks.o;
  const theirChoice = isX ? picks.o : picks.x;

  const handleClick = (choice: string) => {
    if (isSpectator || myChoice || !isMyTurn) return;
    onMove({ choice });
  };

  const IconMe = myChoice ? (choices.find(c => c.id === myChoice)?.icon ?? null) : null;
  const IconThem = theirChoice ? (choices.find(c => c.id === theirChoice)?.icon ?? null) : null;

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-2xl">
      <div className="flex items-center gap-4 text-sm text-muted-foreground font-medium">
        <span className="text-primary font-bold">{isX ? scores.x : scores.o} pts</span>
        <span>Round {round} / {maxRounds}</span>
        <span className="text-secondary font-bold">{isX ? scores.o : scores.x} pts</span>
      </div>

      <div className="flex justify-center items-center gap-8 sm:gap-24 w-full">
        <div className="flex flex-col items-center gap-4">
          <div className={`w-32 h-32 sm:w-48 sm:h-48 rounded-full border-4 flex items-center justify-center transition-all duration-500
            ${myChoice ? 'border-primary bg-primary/10 shadow-[0_0_30px_rgba(236,72,153,0.3)]' : 'border-border bg-card'}
          `}>
            {IconMe ? <IconMe className="w-16 h-16 text-primary" /> : <span className="text-4xl text-muted-foreground opacity-50">?</span>}
          </div>
          <span className="font-display font-bold">Your Pick</span>
          {myChoice && game.status === 'active' && <span className="text-xs text-primary font-bold uppercase">{myChoice}</span>}
        </div>

        <div className="flex flex-col items-center gap-2 text-muted-foreground font-black text-2xl tracking-widest">VS</div>

        <div className="flex flex-col items-center gap-4">
          <div className={`w-32 h-32 sm:w-48 sm:h-48 rounded-full border-4 flex items-center justify-center transition-all duration-500
            ${theirChoice ? 'border-secondary bg-secondary/10 shadow-[0_0_30px_rgba(139,92,246,0.3)]' : 'border-border bg-card'}
          `}>
            {(IconThem && (game.status === 'finished' || (picks.x && picks.o)))
              ? <IconThem className="w-16 h-16 text-secondary" />
              : <span className="text-4xl text-muted-foreground opacity-50">?</span>}
          </div>
          <span className="font-display font-bold">Their Pick</span>
          {theirChoice && game.status === 'active' && (picks.x && picks.o) && <span className="text-xs text-secondary font-bold uppercase">{theirChoice}</span>}
        </div>
      </div>

      {!myChoice && !isSpectator && game.status === 'active' && (
        <div className="flex gap-4 p-4 bg-card rounded-2xl border border-border shadow-xl">
          {choices.map(c => (
            <button
              key={c.id}
              onClick={() => handleClick(c.id)}
              className="flex flex-col items-center gap-2 p-4 w-24 rounded-xl bg-background border border-border hover:border-primary hover:bg-primary/5 transition-all hover:scale-105"
            >
              <c.icon className="w-8 h-8 text-foreground" />
              <span className="text-xs font-bold uppercase tracking-wider">{c.label}</span>
            </button>
          ))}
        </div>
      )}

      {myChoice && game.status === 'active' && !picks.o && !picks.x && (
        <div className="text-muted-foreground font-medium animate-pulse">Waiting for opponent...</div>
      )}

      {myChoice && game.status === 'active' && !(picks.x && picks.o) && (
        <div className="text-muted-foreground font-medium animate-pulse">Waiting for opponent to pick...</div>
      )}
    </div>
  );
}
