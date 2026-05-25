import { useState } from "react";
import { GameSession } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface TruthSpinnerProps {
  game: GameSession;
  onMove: (move: any) => void;
  isMyTurn: boolean;
  isSpectator: boolean;
  profileId: number;
}

export default function TruthSpinner({ game, onMove, isMyTurn, isSpectator, profileId }: TruthSpinnerProps) {
  const [answerInput, setAnswerInput] = useState("");
  const [spinning, setSpinning] = useState(false);
  
  const boardState = game.boardState as { 
    questions: string[], 
    currentQuestionIndex: number, 
    scores: { X: number, O: number }, 
    answers: { userId: number, question: string, answer: string, points: number }[] 
  } | undefined;

  const currentQIndex = boardState?.currentQuestionIndex || 0;
  const questions = boardState?.questions || [];
  const currentQuestion = questions[currentQIndex];
  
  const hasSpun = !!currentQuestion;

  const handleSpin = () => {
    if (!isMyTurn || isSpectator) return;
    setSpinning(true);
    setTimeout(() => {
      onMove({ action: 'spin' });
      setSpinning(false);
    }, 1500); // Fake spin duration
  };

  const handleAnswerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isMyTurn || isSpectator || !answerInput.trim()) return;
    onMove({ action: 'answer', answer: answerInput.trim() });
    setAnswerInput("");
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-8">
      {/* Scores */}
      <div className="flex justify-between items-center bg-card/40 backdrop-blur p-4 rounded-xl border border-border/50">
        <div className="text-center">
          <div className="text-xs text-muted-foreground uppercase font-bold">P1 Score</div>
          <div className="text-2xl font-black text-primary">{boardState?.scores.X || 0}</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-muted-foreground uppercase font-bold">P2 Score</div>
          <div className="text-2xl font-black text-accent">{boardState?.scores.O || 0}</div>
        </div>
      </div>

      <div className="bg-card/40 backdrop-blur border border-border/50 rounded-3xl p-8 flex flex-col items-center justify-center min-h-[300px] text-center shadow-2xl relative overflow-hidden">
        {spinning && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
            <div className="w-32 h-32 rounded-full border-4 border-t-primary border-r-accent border-b-primary border-l-accent animate-spin" />
          </div>
        )}

        {!hasSpun ? (
          <div className="space-y-6">
            <div className="w-48 h-48 rounded-full border-8 border-primary/20 flex items-center justify-center mx-auto shadow-[0_0_50px_rgba(236,72,153,0.2)]">
              <Button 
                size="lg" 
                className="w-32 h-32 rounded-full text-2xl font-black bg-primary hover:bg-primary/90 text-white shadow-lg transition-transform active:scale-95"
                onClick={handleSpin}
                disabled={!isMyTurn || isSpectator}
              >
                SPIN
              </Button>
            </div>
            {!isMyTurn && <p className="text-muted-foreground font-medium animate-pulse">Waiting for opponent to spin...</p>}
          </div>
        ) : (
          <div className="space-y-6 w-full animate-in fade-in zoom-in duration-500">
            <h3 className="text-2xl font-bold leading-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {currentQuestion}
            </h3>
            
            {isMyTurn && !isSpectator ? (
              <form onSubmit={handleAnswerSubmit} className="space-y-4">
                <Input
                  value={answerInput}
                  onChange={e => setAnswerInput(e.target.value)}
                  placeholder="Type your honest truth..."
                  className="h-12 bg-background/50 border-primary/30 focus-visible:ring-primary"
                  autoFocus
                />
                <Button type="submit" className="w-full h-12 text-lg" disabled={!answerInput.trim()}>
                  Submit Truth
                </Button>
              </form>
            ) : (
              <div className="p-6 bg-background/30 rounded-xl border border-border/50 border-dashed">
                <p className="text-muted-foreground">Opponent is typing their answer...</p>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Recent Answers */}
      {boardState?.answers && boardState.answers.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Previous Truths</h4>
          <div className="space-y-2">
            {boardState.answers.slice(-3).reverse().map((ans, i) => (
              <div key={i} className="bg-card/30 p-3 rounded-lg border border-border/30 text-sm flex flex-col gap-1">
                <span className="text-xs text-muted-foreground italic">"{ans.question}"</span>
                <div className="flex justify-between items-end">
                  <span className="font-medium text-foreground">{ans.answer}</span>
                  <span className="text-xs font-bold text-green-500">+{ans.points}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
