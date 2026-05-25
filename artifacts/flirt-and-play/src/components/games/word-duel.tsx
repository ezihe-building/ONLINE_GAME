import { useState } from "react";
import { GameSession } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface WordDuelProps {
  game: GameSession;
  onMove: (move: any) => void;
  isMyTurn: boolean;
  isSpectator: boolean;
  profileId: number;
}

export default function WordDuel({ game, onMove, isMyTurn, isSpectator, profileId }: WordDuelProps) {
  const [wordInput, setWordInput] = useState("");
  const boardState = game.boardState as { 
    phase: 'setting'|'guessing', 
    secretWord?: string, 
    guesses: { word: string, result: ('correct'|'present'|'absent')[] }[], 
    currentGuesserUserId: number 
  } | undefined;

  const phase = boardState?.phase || 'setting';
  const guesses = boardState?.guesses || [];
  
  const isGuesser = boardState?.currentGuesserUserId === profileId;
  const isSetter = !isGuesser && !isSpectator;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isMyTurn || isSpectator) return;
    if (wordInput.length !== 5) return;
    
    if (phase === 'setting') {
      onMove({ secretWord: wordInput.toUpperCase() });
    } else {
      onMove({ guess: wordInput.toUpperCase() });
    }
    setWordInput("");
  };

  if (phase === 'setting') {
    return (
      <div className="w-full max-w-md mx-auto bg-card/40 backdrop-blur border border-border/50 rounded-2xl p-8 shadow-xl text-center">
        {isSetter && isMyTurn ? (
          <>
            <h3 className="text-2xl font-bold mb-2">Set the Secret Word</h3>
            <p className="text-muted-foreground mb-6">Must be exactly 5 letters.</p>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <Input
                value={wordInput}
                onChange={e => setWordInput(e.target.value.replace(/[^A-Za-z]/g, '').slice(0, 5).toUpperCase())}
                placeholder="XXXXX"
                className="text-center text-4xl tracking-[1em] font-mono h-16 uppercase font-bold"
                maxLength={5}
              />
              <Button type="submit" disabled={wordInput.length !== 5} size="lg">
                Confirm Word
              </Button>
            </form>
          </>
        ) : (
          <div className="py-12 animate-pulse">
            <h3 className="text-xl font-medium text-primary">Waiting for opponent to set word...</h3>
          </div>
        )}
      </div>
    );
  }

  // Guessing Phase
  return (
    <div className="w-full max-w-sm mx-auto flex flex-col gap-4">
      {isSetter && (
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 text-center mb-2">
          <span className="text-sm text-muted-foreground">Your secret word:</span>
          <span className="ml-2 font-mono font-bold tracking-widest text-primary">{boardState?.secretWord}</span>
        </div>
      )}

      <div className="grid grid-rows-6 gap-2 w-full">
        {Array(6).fill(0).map((_, i) => {
          const guess = guesses[i];
          const isCurrentRow = i === guesses.length;
          
          return (
            <div key={i} className="grid grid-cols-5 gap-2 w-full">
              {Array(5).fill(0).map((_, j) => {
                const char = guess ? guess.word[j] : (isCurrentRow && isGuesser && wordInput[j] ? wordInput[j] : "");
                const res = guess ? guess.result[j] : null;
                
                return (
                  <div 
                    key={j} 
                    className={cn(
                      "aspect-square flex items-center justify-center text-2xl font-bold font-mono border-2 transition-all duration-500",
                      guess ? (
                        res === 'correct' ? "bg-green-500 border-green-500 text-white" :
                        res === 'present' ? "bg-yellow-500 border-yellow-500 text-white" :
                        "bg-muted border-muted text-muted-foreground"
                      ) : (
                        char ? "border-primary/50 text-foreground scale-[1.02]" : "border-border/50 text-transparent"
                      )
                    )}
                  >
                    {char}
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>

      {isGuesser && isMyTurn && (
        <form onSubmit={handleSubmit} className="mt-6 flex gap-2">
          <Input
            value={wordInput}
            onChange={e => setWordInput(e.target.value.replace(/[^A-Za-z]/g, '').slice(0, 5).toUpperCase())}
            placeholder="Type guess..."
            className="text-center font-mono uppercase tracking-[0.5em] text-lg h-12"
            maxLength={5}
            autoFocus
          />
          <Button type="submit" disabled={wordInput.length !== 5} className="h-12 px-8">
            Guess
          </Button>
        </form>
      )}
    </div>
  );
}
