import { useState, useEffect } from "react";
import { GameSession } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

interface Props {
  game: GameSession;
  onMove: (data: any) => void;
  isMyTurn: boolean;
  isSpectator: boolean;
  profileId: string;
}

export default function TruthSpinner({ game, onMove, isMyTurn, isSpectator, profileId }: Props) {
  const [answer, setAnswer] = useState("");
  const [isSpinning, setIsSpinning] = useState(false);

  // state: { currentPrompt: string | null, phase: "spin" | "answer" }
  const state = game.state as Record<string, unknown>;
  const phase = (state?.phase as string) || "spin";
  const prompt = state?.currentPrompt as string | null;

  const handleSpin = () => {
    if (!isMyTurn || isSpectator || phase !== "spin") return;
    setIsSpinning(true);
    // Simulate spin delay
    setTimeout(() => {
      setIsSpinning(false);
      onMove({ type: "spin" });
    }, 1500);
  };

  const handleAnswer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!answer.trim() || !isMyTurn || isSpectator || phase !== "answer") return;
    onMove({ type: "answer", answer });
    setAnswer("");
  };

  return (
    <div className="flex flex-col items-center w-full max-w-lg text-center">
      
      {phase === "spin" && (
        <div className="flex flex-col items-center gap-8">
          <div className={`w-64 h-64 rounded-full border-[12px] border-primary/20 flex items-center justify-center relative shadow-[0_0_50px_rgba(236,72,153,0.2)] ${isSpinning ? 'animate-spin' : ''}`}>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rotate-45 bg-primary clip-triangle" />
            <div className="w-16 h-16 rounded-full bg-primary/50" />
            
            {/* Wheel segments decoration */}
            <div className="absolute inset-0 rounded-full border-4 border-primary/30 [mask-image:conic-gradient(black_45deg,transparent_45deg,transparent_90deg,black_90deg,black_135deg,transparent_135deg,transparent_180deg,black_180deg,black_225deg,transparent_225deg,transparent_270deg,black_270deg,black_315deg,transparent_315deg)]" />
          </div>
          
          <Button 
            size="lg" 
            onClick={handleSpin} 
            disabled={!isMyTurn || isSpectator || isSpinning}
            className="h-16 px-12 text-xl bg-primary hover:bg-primary/90 rounded-full shadow-[0_0_20px_-5px_rgba(236,72,153,0.5)]"
          >
            {isSpinning ? <Loader2 className="animate-spin h-6 w-6" /> : "SPIN"}
          </Button>
          {!isMyTurn && !isSpectator && <p className="text-muted-foreground animate-pulse mt-4">Waiting for them to spin...</p>}
        </div>
      )}

      {phase === "answer" && !!prompt && (
        <div className="flex flex-col items-center gap-8 w-full">
          <div className="p-8 bg-card rounded-2xl border border-primary/50 shadow-[0_0_40px_-10px_rgba(236,72,153,0.2)] w-full">
            <h3 className="text-primary font-bold tracking-widest uppercase mb-4 text-sm">Truth or Dare</h3>
            <p className="text-2xl font-display font-bold leading-relaxed">{String(prompt)}</p>
          </div>
          
          {isMyTurn && !isSpectator ? (
            <form onSubmit={handleAnswer} className="w-full flex flex-col gap-4">
              <Input 
                value={answer}
                onChange={e => setAnswer(e.target.value)}
                placeholder="Type your answer..."
                className="h-14 bg-input border-border text-lg"
                autoFocus
              />
              <Button type="submit" disabled={!answer.trim()} className="h-14 bg-primary hover:bg-primary/90 text-lg font-medium">
                Submit Answer
              </Button>
            </form>
          ) : (
            <div className="p-6 bg-muted rounded-xl w-full">
              <p className="text-muted-foreground animate-pulse">Waiting for their answer...</p>
            </div>
          )}
        </div>
      )}
      
    </div>
  );
}