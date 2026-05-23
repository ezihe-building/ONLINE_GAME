import { GameSession } from "@workspace/api-client-react";
import { HandMetal, Hand, Scissors } from "lucide-react";

interface Props {
  game: GameSession;
  onMove: (data: any) => void;
  isMyTurn: boolean;
  isSpectator: boolean;
  profileId: string;
}

export default function RockPaperScissors({ game, onMove, isMyTurn, isSpectator, profileId }: Props) {
  const choices = [
    { id: "rock", icon: HandMetal, label: "Rock" },
    { id: "paper", icon: Hand, label: "Paper" },
    { id: "scissors", icon: Scissors, label: "Scissors" }
  ];

  // state = { p1Choice, p2Choice } (might be masked if not both chosen)
  const isX = game.playerXClerkId === profileId;
  const state = game.state as Record<string, unknown>;
  const myChoice = isX ? (state?.p1Choice as string) : (state?.p2Choice as string);
  const theirChoice = isX ? (state?.p2Choice as string) : (state?.p1Choice as string);

  const handleClick = (choice: string) => {
    if (isSpectator || myChoice) return;
    onMove({ choice });
  };

  const IconMe = (myChoice ? choices.find(c => c.id === myChoice)?.icon : null) ?? null;
  const IconThem = (theirChoice ? choices.find(c => c.id === theirChoice)?.icon : null) ?? null;

  return (
    <div className="flex flex-col items-center gap-12 w-full">
      <div className="flex justify-center items-center gap-8 sm:gap-24 w-full">
        {/* Me */}
        <div className="flex flex-col items-center gap-4">
          <div className={`w-32 h-32 sm:w-48 sm:h-48 rounded-full border-4 flex items-center justify-center transition-all duration-500
            ${myChoice ? 'border-primary bg-primary/10 shadow-[0_0_30px_rgba(236,72,153,0.3)]' : 'border-border bg-card'}
          `}>
            {IconMe ? <IconMe className="w-16 h-16 text-primary" /> : <span className="text-4xl text-muted-foreground opacity-50">?</span>}

          </div>
          <span className="font-display font-bold">Your Pick</span>
        </div>

        {/* Them */}
        <div className="flex flex-col items-center gap-4">
          <div className={`w-32 h-32 sm:w-48 sm:h-48 rounded-full border-4 flex items-center justify-center transition-all duration-500
            ${theirChoice ? 'border-secondary bg-secondary/10 shadow-[0_0_30px_rgba(139,92,246,0.3)]' : 'border-border bg-card'}
          `}>
            {(IconThem && game.status === 'finished') ? <IconThem className="w-16 h-16 text-secondary" /> : <span className="text-4xl text-muted-foreground opacity-50">?</span>}
          </div>
          <span className="font-display font-bold">Their Pick</span>
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
      
      {myChoice && game.status === 'active' && !theirChoice && (
        <div className="text-muted-foreground font-medium animate-pulse">Waiting for opponent...</div>
      )}
    </div>
  );
}