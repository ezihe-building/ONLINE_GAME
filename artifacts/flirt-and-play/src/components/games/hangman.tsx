import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RotateCcw, Heart, Eye, Lightbulb } from "lucide-react";

const WORDS = [
  "FLIRT", "KISS", "LOVE", "PASSION", "DESIRE", "ROMANCE", "CRUSH",
  "SPARK", "CHARM", "SEDUCE", "TEMPT", "DARING", "BRAVE", "WILD",
  "FREE", "BOLD", "FIERY", "SWEET", "SPICY", "NAUGHTY", "CHILL",
  "ADVENTURE", "MYSTERY", "DREAM", "MAGIC", "STARDUST", "MOONLIGHT",
  "WHISPER", "SECRET", "TEASE", "TANTALIZE", "CAPTIVATE", "ENCHANT",
  "BEGUILE", "ENTICE", "ALLURE", "RADIANT", "SIZZLING", "BLAZING",
  "INTIMATE", "TENDER", "PASSIONATE", "DEVOTED", "ADORED", "CHERISH",
  "TREASURE", "PRECIOUS", "ENAMORED", "RAVISH", "THRILL", "EXCITE",
  "INTOXICATE", "MESMERIZE", "HYPNOTIZE", "TRANSCEND", "ELEVATE",
  "REVEL", "DELIGHT", "REJOICE", "CELEBRATE", "WORSHIP", "IDOLIZE",
];

const MAX_LIVES = 6;
const HINTS = [
  "🔥", "❤️", "🌶️", "🥈", "🏆", "💋",
  "✨", "🎵", "🎰", "💎", "🤔", "🎬",
];

export default function Hangman() {
  const [word, setWord] = useState("");
  const [guessedLetters, setGuessedLetters] = useState<Set<string>>(new Set());
  const [lives, setLives] = useState(MAX_LIVES);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isWon, setIsWon] = useState(false);
  const [hintUsed, setHintUsed] = useState(false);
  const [streak, setStreak] = useState(0);

  const initGame = useCallback(() => {
    setWord(WORDS[Math.floor(Math.random() * WORDS.length)]);
    setGuessedLetters(new Set());
    setLives(MAX_LIVES);
    setIsGameOver(false);
    setIsWon(false);
    setHintUsed(false);
  }, []);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const guessLetter = (letter: string) => {
    if (isGameOver || guessedLetters.has(letter)) return;
    const newGuessed = new Set(guessedLetters);
    newGuessed.add(letter);
    setGuessedLetters(newGuessed);

    if (!word.includes(letter)) {
      const newLives = lives - 1;
      setLives(newLives);
      if (newLives === 0) {
        setIsGameOver(true);
        setStreak(0);
      }
    } else {
      const allGuessed = word.split("").every((c) => newGuessed.has(c));
      if (allGuessed) {
        setIsGameOver(true);
        setIsWon(true);
        setStreak((s) => s + 1);
      }
    }
  };

  const useHint = () => {
    if (hintUsed || isGameOver) return;
    const unguessed = word.split("").filter((c) => !guessedLetters.has(c));
    if (unguessed.length > 0) {
      const letter = unguessed[Math.floor(Math.random() * unguessed.length)];
      guessLetter(letter);
      setHintUsed(true);
    }
  };

  const displayWord = word.split("").map((c) => (guessedLetters.has(c) ? c : "_")).join(" ");
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Lives */}
      <div className="flex items-center gap-2">
        {Array.from({ length: MAX_LIVES }).map((_, i) => (
          <Heart
            key={i}
            className={`h-6 w-6 transition-all ${i < lives ? "text-red-500 fill-red-500" : "text-muted-foreground"}`}
          />
        ))}
      </div>

      {/* Streak */}
      {streak > 0 && (
        <div className="text-sm font-medium text-primary">
          🔥 Win streak: {streak}
        </div>
      )}

      {/* Word Display */}
      <div className="text-4xl sm:text-5xl font-mono font-bold tracking-[0.3em] text-center">
        {displayWord}
      </div>

      {/* Game Over */}
      {isGameOver && (
        <Card className={`px-6 py-3 ${isWon ? "bg-green-500/10 border-green-500/30" : "bg-destructive/10 border-destructive/30"}`}>
          <div className={`font-bold text-lg ${isWon ? "text-green-500" : "text-destructive"}`}>
            {isWon ? "🎉 You guessed it!" : `💀 The word was: ${word}`}
          </div>
        </Card>
      )}

      {/* Keyboard */}
      <div className="flex flex-col gap-2">
        {["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"].map((row) => (
          <div key={row} className="flex justify-center gap-1">
            {row.split("").map((letter) => {
              const isGuessed = guessedLetters.has(letter);
              const isCorrect = isGuessed && word.includes(letter);
              const isWrong = isGuessed && !word.includes(letter);
              return (
                <Button
                  key={letter}
                  variant={isCorrect ? "default" : isWrong ? "destructive" : "outline"}
                  size="sm"
                  className="w-8 h-10 sm:w-10 sm:h-12 text-sm font-bold"
                  disabled={isGuessed || isGameOver}
                  onClick={() => guessLetter(letter)}
                >
                  {letter}
                </Button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex gap-3">
        <Button variant="outline" size="sm" onClick={useHint} disabled={hintUsed || isGameOver}>
          <Lightbulb className="h-4 w-4 mr-1" /> Hint
        </Button>
        <Button variant="outline" size="sm" onClick={initGame}>
          <RotateCcw className="h-4 w-4 mr-1" /> New Word
        </Button>
      </div>
    </div>
  );
}
