import { useState } from "react";
import { GameSession } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Props {
  game: GameSession;
  onMove: (data: any) => void;
  isMyTurn: boolean;
  isSpectator: boolean;
  profileId: number;
}

type TileStatus = "correct" | "present" | "absent" | "empty";

function getWordleResult(guess: string, target: string): TileStatus[] {
  const result: TileStatus[] = Array(5).fill("absent");
  const targetArr = target.toLowerCase().split("");
  const guessArr = guess.toLowerCase().split("");
  const used = Array(5).fill(false);

  // First pass: correct positions
  for (let i = 0; i < 5; i++) {
    if (guessArr[i] === targetArr[i]) {
      result[i] = "correct";
      used[i] = true;
    }
  }
  // Second pass: present in wrong position
  for (let i = 0; i < 5; i++) {
    if (result[i] === "correct") continue;
    const idx = targetArr.findIndex((c, j) => !used[j] && c === guessArr[i]);
    if (idx !== -1) {
      result[i] = "present";
      used[idx] = true;
    }
  }
  return result;
}

export default function WordDuel({ game, onMove, isMyTurn, isSpectator, profileId }: Props) {
  const [word, setWord] = useState("");

  const isX = game.playerXUserId === profileId;
  const state = game.state as Record<string, unknown>;

  const myWordKey = isX ? "xWord" : "oWord";
  const theirWordKey = isX ? "oWord" : "xWord";
  const myGuessesKey = isX ? "xGuesses" : "oGuesses";

  const myWord = state?.[myWordKey] as string | null;
  const theirWord = state?.[theirWordKey] as string | null;
  const myGuesses = (state?.[myGuessesKey] as string[]) ?? [];

  // Phase: "setting" until both words locked in, then "guessing"
  const xWord = state?.xWord as string | null;
  const oWord = state?.oWord as string | null;
  const phase = xWord && oWord ? "guessing" : "setting";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (word.length !== 5) return;
    if (phase === "setting" && !myWord) {
      onMove({ type: "set-word", word: word.toUpperCase() });
    } else if (phase === "guessing" && isMyTurn && !isSpectator) {
      onMove({ type: "guess", word: word.toUpperCase() });
    }
    setWord("");
  };

  const renderGuesses = () => {
    const displayGuesses: string[] = [...myGuesses];
    while (displayGuesses.length < 6) displayGuesses.push("");

    return (
      <div className="flex flex-col gap-2">
        {displayGuesses.map((g, i) => {
          const result: TileStatus[] = g && theirWord
            ? getWordleResult(g, theirWord)
            : Array(5).fill("empty");

          return (
            <div key={i} className="flex gap-2">
              {Array(5).fill("").map((_, j) => {
                const letter = g[j]?.toUpperCase() || "";
                const status = result[j];
                let bg = "bg-background border-border";
                if (status === "correct") bg = "bg-green-500 border-green-500 text-white shadow-[0_0_15px_rgba(34,197,94,0.4)]";
                else if (status === "present") bg = "bg-yellow-500 border-yellow-500 text-white";
                else if (status === "absent" && g[j]) bg = "bg-muted border-muted-foreground/50 text-muted-foreground";

                return (
                  <div key={j} className={`w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center text-xl font-bold uppercase border-2 rounded-md transition-all ${bg}`}>
                    {letter}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-sm">
      {phase === "setting" && (
        <div className="text-center w-full">
          <h3 className="text-2xl font-display font-bold mb-2">Set a Secret Word</h3>
          <p className="text-muted-foreground mb-6">Choose a 5-letter word for your opponent to guess.</p>

          {myWord ? (
            <div className="p-6 bg-card rounded-xl border border-primary/30 text-center">
              <span className="text-green-500 font-bold text-lg">Word locked in! 🔒</span>
              <p className="text-sm text-muted-foreground mt-2">Waiting for opponent to set theirs...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                value={word}
                onChange={e => setWord(e.target.value.replace(/[^a-zA-Z]/g, '').slice(0, 5))}
                placeholder="5 letters"
                className="h-12 text-center text-xl uppercase tracking-widest bg-input border-border"
                maxLength={5}
                autoFocus
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
                autoFocus
              />
              <Button type="submit" disabled={word.length !== 5} className="h-14 px-8 bg-primary hover:bg-primary/90 text-lg">
                Enter
              </Button>
            </form>
          )}

          {game.status === 'active' && !isMyTurn && !isSpectator && (
            <p className="text-muted-foreground animate-pulse text-center">Waiting for opponent's guess...</p>
          )}
        </div>
      )}
    </div>
  );
}
