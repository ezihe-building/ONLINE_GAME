import { GameSession } from "@workspace/api-client-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

// ── 60+ Fun Dares ───────────────────────────────────────────────────────────
const DARES = [
  "Send a voice note singing your favorite song.",
  "Do 10 jumping jacks right now.",
  "Send a funny face selfie.",
  "Tell me your best joke.",
  "Send a video of you dancing for 10 seconds.",
  "Text your best friend 'I love you' randomly.",
  "Do your best impression of a celebrity.",
  "Send a photo of your current view.",
  "Tell me your most embarrassing nickname.",
  "Send a voice note of you laughing.",
  "Do a 30-second handstand (or try).",
  "Send a funny meme you saved today.",
  "Tell me your favorite childhood memory.",
  "Send a video of you trying to whistle.",
  "Text your sibling something sweet.",
  "Do your best animal impression.",
  "Send a photo of your favorite food.",
  "Tell me your biggest pet peeve.",
  "Send a voice note of you beatboxing.",
  "Write a funny haiku about your day.",
  "Send a photo of your desk setup.",
  "Tell me your most irrational fear.",
  "Send a video of you doing a silly dance.",
  "Text your mom 'I appreciate you'.",
  "Do your best movie quote impression.",
  "Send a photo of your favorite outfit.",
  "Tell me your secret talent.",
  "Send a voice note of you yawning.",
  "Write a funny 2-sentence story.",
  "Send a photo of your favorite mug.",
  "Send a voice note of your most embarrassing moment.",
  "Tell me your worst pickup line.",
  "Send a screenshot of your most recent search history.",
  "Tell me your biggest regret.",
  "Send a photo of your unmade bed.",
  "Tell me your most embarrassing crush story.",
  "Send a voice note of your worst singing attempt.",
  "Tell me your most awkward date.",
  "Send a photo of your messy room.",
  "Tell me your most embarrassing lie.",
  "Send a voice note of you crying (fake it).",
  "Tell me your most embarrassing childhood story.",
  "Send a photo of your worst outfit.",
  "Tell me your most embarrassing text mistake.",
  "Send a voice note of your worst impression.",
  "Tell me your most embarrassing social media post.",
  "Send a photo of your fridge contents.",
  "Tell me your most embarrassing drunk story.",
  "Send a voice note of your worst joke.",
  "Tell me your most embarrassing work story.",
  "Send a photo of your browser tabs.",
  "Tell me your most embarrassing family story.",
  "Send a voice note of your worst laugh.",
  "Tell me your most embarrassing school story.",
  "Send a photo of your trash can.",
  "Tell me your most embarrassing secret.",
  "Send a voice note of your worst scream.",
  "Tell me your most embarrassing travel story.",
  "Send a photo of your wallet contents.",
  "Tell me your most embarrassing party story.",
  "Send a voice note of your worst attempt at being cool.",
  "Tell me your most embarrassing gym story.",
  "Send a photo of your shoe collection.",
  "Tell me your most embarrassing cooking fail.",
  "Send a voice note of your worst attempt at a foreign accent.",
  "Tell me your most embarrassing driving story.",
  "Send a photo of your most worn-out clothing item.",
  "Tell me your most embarrassing shopping story.",
  "Send a voice note of your worst attempt at being mysterious.",
  "Tell me your most embarrassing phone call.",
  "Send a photo of your nightstand.",
  "Tell me your most embarrassing video call moment.",
  "Send a voice note of your worst attempt at being romantic.",
  "Tell me your most embarrassing compliment you received.",
  "Send a photo of your snack stash.",
  "Tell me your most embarrassing compliment you gave.",
  "Send a voice note of your worst attempt at being funny.",
  "Tell me your most embarrassing moment in public.",
  "Send a photo of your bathroom counter.",
  "Tell me your most embarrassing moment with a stranger.",
  "Send a voice note of your worst attempt at being serious.",
  "Tell me your most embarrassing moment with a celebrity.",
  "Send a photo of your car (or inside it).",
  "Tell me your most embarrassing moment with a crush.",
  "Send a voice note of your worst attempt at being clever.",
  "Tell me your most embarrassing moment with a teacher.",
  "Send a photo of your favorite pair of socks.",
  "Tell me your most embarrassing moment with a boss.",
  "Send a voice note of your worst attempt at being charming.",
  "Tell me your most embarrassing moment with a doctor.",
  "Send a photo of your toothbrush.",
  "Tell me your most embarrassing moment with a pet.",
];

function getRandomDare(): string {
  return DARES[Math.floor(Math.random() * DARES.length)];
}

interface Props {
  session: GameSession;
  playerRole: string;
  onMove: (move: string) => void;
  onReset: () => void;
}

type Choice = "rock" | "paper" | "scissors";

const CHOICES: Choice[] = ["rock", "paper", "scissors"];

const EMOJIS: Record<Choice, string> = {
  rock: "🤚",
  paper: "✂️",
  scissors: "✂️",
};

const WIN_MAP: Record<Choice, Choice> = {
  rock: "scissors",
  paper: "rock",
  scissors: "paper",
};

export default function RockPaperScissors({ session, playerRole, onMove, onReset }: Props) {
  const [playerChoice, setPlayerChoice] = useState<Choice | null>(null);
  const [opponentChoice, setOpponentChoice] = useState<Choice | null>(null);
  const [showDare, setShowDare] = useState(false);
  const [dare, setDare] = useState("");
  const [dareForPlayer, setDareForPlayer] = useState(false);
  const [roundResult, setRoundResult] = useState<string>("");
  const [playerScore, setPlayerScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [roundCount, setRoundCount] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameWinner, setGameWinner] = useState<string>("");
  const [showGameOverDare, setShowGameOverDare] = useState(false);
  const [gameOverDare, setGameOverDare] = useState("");

  const isPlayer1 = playerRole === "X";
  const myMoves = isPlayer1 ? session.moves?.player1 : session.moves?.player2;
  const oppMoves = isPlayer1 ? session.moves?.player2 : session.moves?.player1;
  const myLastMove = myMoves?.[myMoves.length - 1] ?? null;
  const oppLastMove = oppMoves?.[oppMoves.length - 1] ?? null;

  const isMyTurn =
    (isPlayer1 && (myMoves?.length ?? 0) <= (oppMoves?.length ?? 0)) ||
    (!isPlayer1 && (oppMoves?.length ?? 0) <= (myMoves?.length ?? 0));

  const currentRound = Math.max(myMoves?.length ?? 0, oppMoves?.length ?? 0);

  useEffect(() => {
    if (myLastMove && oppLastMove) {
      const my = myLastMove as Choice;
      const opp = oppLastMove as Choice;
      setPlayerChoice(my);
      setOpponentChoice(opp);
      setRoundCount(currentRound);

      if (my === opp) {
        setRoundResult("draw");
      } else if (WIN_MAP[my] === opp) {
        setRoundResult("win");
        setPlayerScore(s => s + 1);
      } else {
        setRoundResult("lose");
        setOpponentScore(s => s + 1);
      }

      // Show dare for loser
      const dareText = getRandomDare();
      setDare(dareText);
      if (WIN_MAP[my] === opp) {
        setDareForPlayer(false);
      } else if (WIN_MAP[opp] === my) {
        setDareForPlayer(true);
      } else {
        setDareForPlayer(false);
      }
      setShowDare(true);
    }
  }, [myLastMove, oppLastMove]);

  useEffect(() => {
    if (session.status === "finished" && session.winnerUserId && !gameOver) {
      setGameOver(true);
      const iWon = session.winnerUserId === (isPlayer1 ? session.player1UserId : session.player2UserId);
      setGameWinner(iWon ? "You won!" : "You lost!");
      setGameOverDare(getRandomDare());
      setShowGameOverDare(true);
    }
  }, [session.status, session.winnerUserId]);

  const handleChoice = (choice: Choice) => {
    if (!isMyTurn) return;
    onMove(choice);
  };

  const handlePlayAgain = () => {
    setPlayerChoice(null);
    setOpponentChoice(null);
    setShowDare(false);
    setDare("");
    setRoundResult("");
    setPlayerScore(0);
    setOpponentScore(0);
    setRoundCount(0);
    setGameOver(false);
    setGameWinner("");
    setShowGameOverDare(false);
    setGameOverDare("");
    onReset();
  };

  const getResultColor = () => {
    if (roundResult === "win") return "text-green-500";
    if (roundResult === "lose") return "text-red-500";
    return "text-yellow-500";
  };

  const getResultText = () => {
    if (roundResult === "win") return "You Win!";
    if (roundResult === "lose") return "You Lose!";
    if (roundResult === "draw") return "Draw!";
    return "";
  };

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-md mx-auto">
      {/* Scoreboard */}
      <div className="flex items-center justify-between w-full bg-card rounded-xl p-4 border shadow-sm">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">You</p>
          <p className="text-3xl font-bold text-primary">{playerScore}</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Round</p>
          <p className="text-2xl font-semibold">{roundCount}/3</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Opponent</p>
          <p className="text-3xl font-bold text-destructive">{opponentScore}</p>
        </div>
      </div>

      {/* Turn indicator */}
      <p className="text-sm text-muted-foreground">
        {isMyTurn ? "Your turn!" : "Waiting for opponent..."}
      </p>

      {/* Choices */}
      <div className="flex gap-4 justify-center">
        {CHOICES.map((choice) => (
          <button
            key={choice}
            onClick={() => handleChoice(choice)}
            disabled={!isMyTurn || gameOver}
            className={cn(
              "w-24 h-24 rounded-2xl border-2 flex flex-col items-center justify-center gap-1 transition-all",
              "hover:scale-105 active:scale-95",
              playerChoice === choice
                ? "border-primary bg-primary/10"
                : "border-border bg-card hover:border-primary/50",
              (!isMyTurn || gameOver) && "opacity-50 cursor-not-allowed hover:scale-100"
            )}
          >
            <span className="text-4xl">
              {choice === "rock" && "🤚"}
              {choice === "paper" && "✋"}
              {choice === "scissors" && "✂️"}
            </span>
            <span className="text-xs capitalize font-medium">{choice}</span>
          </button>
        ))}
      </div>

      {/* Round result display */}
      {playerChoice && opponentChoice && (
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">You</p>
              <span className="text-5xl">
                {playerChoice === "rock" && "🤚"}
                {playerChoice === "paper" && "✋"}
                {playerChoice === "scissors" && "✂️"}
              </span>
            </div>
            <span className="text-2xl text-muted-foreground">VS</span>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Opponent</p>
              <span className="text-5xl">
                {opponentChoice === "rock" && "🤚"}
                {opponentChoice === "paper" && "✋"}
                {opponentChoice === "scissors" && "✂️"}
              </span>
            </div>
          </div>
          {roundResult && (
            <p className={cn("text-2xl font-bold", getResultColor())}>
              {getResultText()}
            </p>
          )}
        </div>
      )}

      {/* Round Dare Dialog */}
      <Dialog open={showDare} onOpenChange={setShowDare}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">
              {roundResult === "win" ? "Opponent's Dare" : roundResult === "lose" ? "Your Dare" : "Draw - No Dare"}
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-4">
            <p className="text-lg font-medium text-primary mb-4">{dare}</p>
            <Button onClick={() => setShowDare(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Game Over Dialog */}
      <Dialog open={showGameOverDare} onOpenChange={setShowGameOverDare}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl">
              {gameWinner}
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-4">
            <p className="text-muted-foreground mb-2">
              Final Score: {playerScore} - {opponentScore}
            </p>
            <p className="text-lg font-medium text-primary mb-4">
              {gameOverDare}
            </p>
            <Button onClick={handlePlayAgain}>Play Again</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
