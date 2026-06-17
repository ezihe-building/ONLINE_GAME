import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Timer, RotateCcw, Trophy } from "lucide-react";

const EMOJIS = [
  "🔥", "❤️", "🌶️", "🥈", "🏆", "💋",
  "✨", "🎵", "🎰", "💎", "🤔", "🎬",
  "🤗", "👏", "💕", "🍯", "🎉", "👍"
];

interface CardState {
  emoji: string;
  isFlipped: boolean;
  isMatched: boolean;
  id: number;
}

export default function MemoryMatch() {
  const [cards, setCards] = useState<CardState[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [time, setTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [pairs, setPairs] = useState(6);

  const initGame = useCallback(() => {
    const selectedEmojis = EMOJIS.slice(0, pairs);
    const deck = [...selectedEmojis, ...selectedEmojis]
      .map((emoji, index) => ({ emoji, isFlipped: false, isMatched: false, id: index }))
      .sort(() => Math.random() - 0.5);
    setCards(deck);
    setFlippedCards([]);
    setMoves(0);
    setTime(0);
    setIsPlaying(false);
    setIsGameOver(false);
  }, [pairs]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  useEffect(() => {
    if (!isPlaying || isGameOver) return;
    const timer = setInterval(() => setTime((t) => t + 1), 1000);
    return () => clearInterval(timer);
  }, [isPlaying, isGameOver]);

  useEffect(() => {
    if (flippedCards.length === 2) {
      const [a, b] = flippedCards;
      setMoves((m) => m + 1);
      if (cards[a].emoji === cards[b].emoji) {
        setTimeout(() => {
          setCards((prev) =>
            prev.map((c, i) => (i === a || i === b ? { ...c, isMatched: true } : c))
          );
          setFlippedCards([]);
        }, 500);
      } else {
        setTimeout(() => {
          setCards((prev) =>
            prev.map((c, i) => (i === a || i === b ? { ...c, isFlipped: false } : c))
          );
          setFlippedCards([]);
        }, 1000);
      }
    }
  }, [flippedCards, cards]);

  useEffect(() => {
    if (cards.length > 0 && cards.every((c) => c.isMatched)) {
      setIsGameOver(true);
      setIsPlaying(false);
    }
  }, [cards]);

  const handleCardClick = (index: number) => {
    if (!isPlaying) setIsPlaying(true);
    if (flippedCards.length >= 2 || cards[index].isFlipped || cards[index].isMatched) return;
    setCards((prev) => prev.map((c, i) => (i === index ? { ...c, isFlipped: true } : c)));
    setFlippedCards((prev) => [...prev, index]);
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <Timer className="h-4 w-4 text-primary" />
          <span className="font-mono">{formatTime(time)}</span>
        </div>
        <div className="font-medium">Moves: {moves}</div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Pairs:</span>
          <select
            className="bg-background border rounded px-2 py-1 text-xs"
            value={pairs}
            onChange={(e) => setPairs(Number(e.target.value))}
            disabled={isPlaying}
          >
            {[3, 4, 5, 6, 8, 9].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
        <Button variant="outline" size="sm" onClick={initGame}>
          <RotateCcw className="h-4 w-4 mr-1" /> New Game
        </Button>
      </div>

      {isGameOver && (
        <Card className="bg-primary/10 border-primary/30">
          <CardContent className="flex items-center gap-3 py-3 px-6">
            <Trophy className="h-6 w-6 text-primary" />
            <div>
              <div className="font-bold">You matched them all!</div>
              <div className="text-sm text-muted-foreground">{moves} moves in {formatTime(time)}</div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className={`grid gap-2 sm:gap-3 ${pairs <= 4 ? "grid-cols-3" : pairs <= 6 ? "grid-cols-4" : "grid-cols-6"}`}>
        {cards.map((card, i) => (
          <div
            key={card.id}
            onClick={() => handleCardClick(i)}
            className={`w-16 h-16 sm:w-20 sm:h-20 rounded-xl flex items-center justify-center text-3xl cursor-pointer transition-all duration-300 select-none
              ${card.isMatched ? "bg-green-500/20 border-green-500/40" : "bg-card border border-border"}
              ${card.isFlipped ? "rotate-0 scale-100" : "rotate-y-180"}
            `}
            style={{
              transform: card.isFlipped || card.isMatched ? "rotateY(0deg)" : "rotateY(180deg)",
            }}
          >
            <span className={card.isFlipped || card.isMatched ? "opacity-100" : "opacity-0"}>
              {card.isFlipped || card.isMatched ? card.emoji : "?"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
