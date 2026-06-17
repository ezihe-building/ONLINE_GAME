import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { RotateCcw, ArrowUp, ArrowDown, Check, Trophy } from "lucide-react";

export default function GuessNumber() {
  const [target, setTarget] = useState(0);
  const [guess, setGuess] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [maxNumber, setMaxNumber] = useState(100);
  const [history, setHistory] = useState<{ guess: number; hint: "higher" | "lower" | "correct" }[]>([]);
  const [isGameOver, setIsGameOver] = useState(false);
  const [bestScore, setBestScore] = useState<number | null>(null);
  const [streak, setStreak] = useState(0);

  const initGame = useCallback(() => {
    setTarget(Math.floor(Math.random() * maxNumber) + 1);
    setGuess("");
    setAttempts(0);
    setHistory([]);
    setIsGameOver(false);
  }, [maxNumber]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const handleGuess = () => {
    const num = parseInt(guess, 10);
    if (isNaN(num) || num < 1 || num > maxNumber) return;
    if (isGameOver) return;

    const newAttempts = attempts + 1;
    setAttempts(newAttempts);

    if (num === target) {
      setHistory((prev) => [...prev, { guess: num, hint: "correct" }]);
      setIsGameOver(true);
      setStreak((s) => s + 1);
      setBestScore((prev) => (prev === null || newAttempts < prev ? newAttempts : prev));
    } else if (num < target) {
      setHistory((prev) => [...prev, { guess: num, hint: "higher" }]);
    } else {
      setHistory((prev) => [...prev, { guess: num, hint: "lower" }]);
    }
    setGuess("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleGuess();
  };

  return (
    <div className="flex flex-col items-center gap-6 max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 text-sm">
        <div className="font-medium">Range: 1-{maxNumber}</div>
        <div className="font-medium">Attempts: {attempts}</div>
        {streak > 0 && <div className="text-primary font-medium">🔥 {streak}</div>}
        {bestScore !== null && <div className="text-yellow-500 font-medium"><Trophy className="inline h-3 w-3" /> {bestScore}</div>}
      </div>

      {/* Range selector */}
      <div className="flex gap-2">
        {[50, 100, 500, 1000].map((n) => (
          <Button
            key={n}
            variant={maxNumber === n ? "default" : "outline"}
            size="sm"
            onClick={() => setMaxNumber(n)}
            disabled={!isGameOver && attempts > 0}
          >
            1-{n}
          </Button>
        ))}
      </div>

      {/* Input */}
      <div className="flex gap-2 w-full">
        <Input
          type="number"
          min={1}
          max={maxNumber}
          placeholder={`Guess 1-${maxNumber}`}
          value={guess}
          onChange={(e) => setGuess(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isGameOver}
          className="text-center text-lg font-bold"
        />
        <Button onClick={handleGuess} disabled={isGameOver || !guess}>
          Guess
        </Button>
      </div>

      {/* Result */}
      {isGameOver && (
        <Card className="bg-green-500/10 border-green-500/30 px-6 py-3 w-full text-center">
          <div className="font-bold text-green-500 text-lg">
            <Check className="inline h-5 w-5 mr-1" /> You got it in {attempts} attempts!
          </div>
          <div className="text-sm text-muted-foreground">The number was {target}</div>
        </Card>
      )}

      {/* History */}
      {history.length > 0 && (
        <div className="w-full flex flex-col gap-2">
          <div className="text-sm font-medium text-muted-foreground">Your guesses:</div>
          <div className="flex flex-wrap gap-2">
            {history.map((h, i) => (
              <div
                key={i}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium ${
                  h.hint === "correct"
                    ? "bg-green-500/20 text-green-500"
                    : h.hint === "higher"
                    ? "bg-orange-500/20 text-orange-500"
                    : "bg-blue-500/20 text-blue-500"
                }`}
              >
                {h.hint === "correct" && <Check className="h-3 w-3" />}
                {h.hint === "higher" && <ArrowUp className="h-3 w-3" />}
                {h.hint === "lower" && <ArrowDown className="h-3 w-3" />}
                {h.guess}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Controls */}
      <Button variant="outline" onClick={initGame}>
        <RotateCcw className="h-4 w-4 mr-1" /> New Game
      </Button>
    </div>
  );
}
