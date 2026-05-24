import { useState, useEffect } from "react";
import { useParams, Link } from "wouter";
import { useGetGame, useListMoves, useGetMe } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Play, Pause, SkipBack, SkipForward } from "lucide-react";
import TicTacToe from "@/components/games/tic-tac-toe";
import ConnectFour from "@/components/games/connect-four";
import RockPaperScissors from "@/components/games/rock-paper-scissors";
import WordDuel from "@/components/games/word-duel";
import TruthSpinner from "@/components/games/truth-spinner";

export default function Replay() {
  const { roomId, gameId } = useParams<{ roomId: string, gameId: string }>();
  const rId = parseInt(roomId, 10);
  const gId = parseInt(gameId, 10);

  const { data: profile } = useGetMe();
  const { data: game, isLoading: isLoadingGame } = useGetGame(gId);
  const { data: moves, isLoading: isLoadingMoves } = useListMoves(gId);

  const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (game) {
      setCurrentMoveIndex(0);
    }
  }, [game]);

  useEffect(() => {
    if (!isPlaying || !moves) return;
    if (currentMoveIndex >= moves.length) {
      setIsPlaying(false);
      return;
    }
    const timer = setTimeout(() => {
      setCurrentMoveIndex(prev => prev + 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [isPlaying, currentMoveIndex, moves]);

  if (isLoadingGame || isLoadingMoves) {
    return <div className="min-h-[100dvh] flex items-center justify-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!game || !moves || !profile) {
    return <div className="min-h-[100dvh] flex items-center justify-center bg-background text-foreground">Data not found</div>;
  }

  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col">
      <header className="px-6 py-4 flex justify-between items-center border-b border-border/40 bg-card z-10 relative">
        <Link href={`/rooms/${rId}/games/${gId}`} className="text-muted-foreground hover:text-foreground flex items-center gap-2 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Game
        </Link>
        <div className="font-bold text-lg font-display">Replay</div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full p-4 flex flex-col items-center justify-center relative">
        
        <div className="w-full flex justify-center items-center mb-8 opacity-80 pointer-events-none">
          {game.gameType === 'tic-tac-toe' && <TicTacToe game={game} onMove={()=>{}} isMyTurn={false} isSpectator={true} />}
          {game.gameType === 'connect-four' && <ConnectFour game={game} onMove={()=>{}} isMyTurn={false} isSpectator={true} />}
          {game.gameType === 'rock-paper-scissors' && <RockPaperScissors game={game} onMove={()=>{}} isMyTurn={false} isSpectator={true} profileId={profile.id} />}
          {game.gameType === 'word-duel' && <WordDuel game={game} onMove={()=>{}} isMyTurn={false} isSpectator={true} profileId={profile.id} />}
          {game.gameType === 'truth-spinner' && <TruthSpinner game={game} onMove={()=>{}} isMyTurn={false} isSpectator={true} profileId={profile.id} />}
        </div>

        <div className="bg-card border border-border p-4 rounded-xl w-full max-w-md flex flex-col gap-4 shadow-xl">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Move {currentMoveIndex} / {moves.length}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={() => setCurrentMoveIndex(0)} disabled={currentMoveIndex === 0}>
                <SkipBack className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => setCurrentMoveIndex(p => Math.max(0, p - 1))} disabled={currentMoveIndex === 0}>
                <Play className="h-4 w-4 rotate-180" />
              </Button>
              <Button variant="default" size="icon" className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => setIsPlaying(!isPlaying)}>
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              <Button variant="outline" size="icon" onClick={() => setCurrentMoveIndex(p => Math.min(moves.length, p + 1))} disabled={currentMoveIndex === moves.length}>
                <Play className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => setCurrentMoveIndex(moves.length)} disabled={currentMoveIndex === moves.length}>
                <SkipForward className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-300" 
              style={{ width: `${moves.length > 0 ? (currentMoveIndex / moves.length) * 100 : 0}%` }}
            />
          </div>
          
          <div className="mt-4 max-h-40 overflow-y-auto space-y-2 text-sm">
            {moves.slice(0, currentMoveIndex).map((move) => (
              <div key={move.id} className="p-2 rounded bg-muted/50 border border-border/50">
                <span className="font-medium">
                  {move.playerUserId === game.playerXUserId ? game.playerXProfile?.username : game.playerOProfile?.username}:
                </span>
                <span className="ml-2 font-mono text-muted-foreground">{JSON.stringify(move.moveData)}</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
