import { useState } from "react";
import { GameSession } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Props {
  game: GameSession;
  onMove: (data: any) => void;
  isMyTurn: boolean;
  isSpectator: boolean;
  profileId: string;
}

export default function WordDuel({ game, onMove, isMyTurn, isSpectator, profileId }: Props) {
  const [word, setWord] = useState("");
  
  const isX = game.playerXClerkId === profileId;
  const state = game.state as Record<string, unknown>;
  
  // State might contain: { phase: "setting" | "guessing", p1WordSet, p2WordSet, p1Guesses: [], p2Guesses: [] }
  const phase = (state?.phase as string) || "setting";
  const myWordSet = isX ? state?.p1WordSet : state?.p2WordSet;
  const myGuesses = ((isX ? state?.p1Guesses : state?.p2Guesses) as Array<{ word: string; result: string[] }>) || [];
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (word.length !== 5) return;
    
    if (phase === "setting" && !myWordSet) {
      onMove({ type: "set-word", word: word.toUpperCase() });
    } else if (phase === "guessing" && isMyTurn) {
      onMove({ type: "guess", word: word.toUpperCase() });
    }
    setWord("");
  };

  const renderGuesses = () => {
    // Fill up to 6 guesses
    const displayGuesses = [...myGuesses];
    while (displayGuesses.length < 6) {
      displayGuesses.push({ word: "", result: [] }); // result array of "correct" | "present" | "absent"
    }

    return (
      <div className="flex flex-col gap-2">
        {displayGuesses.map((g, i) => (
          <div key={i} className="flex gap-2">
            {Array(5).fill("").map((_, j) => {
              const letter = g.word[j] || "";
              const status = g.result?.[j];
              
              let bg = "bg-background border-border";
              if (status === "correct") bg = "bg-green-500 border-green-500 text-white shadow-[0_0_15px_rgba(34,197,94,0.5)]";
              else if (status === "present") bg = "bg-yellow-500 border-yellow-500 text-white";
              else if (status === "absent") bg = "bg-muted border-muted-foreground text-muted-foreground";
              
              return (
                <div key={j} className={`w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center text-2xl font-bold uppercase border-2 rounded-md ${bg}`}>
                  {letter}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-sm">
      {phase === "setting" && (
        <div className="text-center w-full">
          <h3 className="text-2xl font-display font-bold mb-2">Set a Secret Word</h3>
          <p className="text-muted-foreground mb-6">Choose a 5-letter word for your opponent to guess.</p>
          
          {myWordSet ? (
            <div className="p-6 bg-card rounded-xl border border-border text-center">
              <span className="text-green-500 font-medium">Word locked in!</span>
              <p className="text-sm text-muted-foreground mt-2">Waiting for opponent...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input 
                value={word} 
                onChange={e => setWord(e.target.value.replace(/[^a-zA-Z]/g, '').slice(0, 5))}
                placeholder="5 letters" 
                className="h-12 text-center text-xl uppercase tracking-widest bg-input border-border"
                maxLength={5}
              />
              <Button type="submit" disabled={word.length !== 5 || isSpectator} className="h-12 bg-primary hover:bg-primary/90">
                Lock
              </Button>
            </form>
          )}
        </div>
      )}

      {phase === "guessing" && (
        <div className="flex flex-col items-center gap-6 w-full">
          <h3 className="text-xl font-display font-bold text-center">Guess their word</h3>
          
          <div className="p-4 bg-card rounded-2xl border border-border shadow-xl">
            {renderGuesses()}
          </div>
          
          {game.status === 'active' && isMyTurn && !isSpectator && (
            <form onSubmit={handleSubmit} className="flex gap-2 w-full">
              <Input 
                value={word} 
                onChange={e => setWord(e.target.value.replace(/[^a-zA-Z]/g, '').slice(0, 5))}
                placeholder="GUESS" 
                className="h-14 text-center text-2xl uppercase tracking-widest bg-input border-border font-bold"
                maxLength={5}
              />
              <Button type="submit" disabled={word.length !== 5} className="h-14 px-8 bg-primary hover:bg-primary/90 text-lg">
                Enter
              </Button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}