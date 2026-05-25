import { useEffect, useState } from "react";
import { useParams, useLocation, Link } from "wouter";
import { useAuth } from "@/lib/auth";
import { Layout } from "@/components/layout";
import { 
  useGetGame, 
  useMakeMove,
  getGetGameQueryKey
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";

// Placeholder components - we'll implement these fully next
import TicTacToe from "@/components/games/tic-tac-toe";
import ConnectFour from "@/components/games/connect-four";
import RockPaperScissors from "@/components/games/rock-paper-scissors";
import WordDuel from "@/components/games/word-duel";
import TruthSpinner from "@/components/games/truth-spinner";
import WinScreen from "@/components/games/win-screen";

export default function Game() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { roomId, gameId } = useParams<{ roomId: string, gameId: string }>();
  
  const rId = parseInt(roomId || '0');
  const gId = parseInt(gameId || '0');
  
  const { data: game, isLoading: isGameLoading } = useGetGame(gId, { 
    query: { 
      enabled: !!user && !!gId,
      refetchInterval: (query) => query.state.data?.status === 'active' ? 1500 : false
    } 
  });
  
  const makeMove = useMakeMove();

  useEffect(() => {
    if (!isAuthLoading && !user) setLocation("/login");
  }, [user, isAuthLoading, setLocation]);

  if (isAuthLoading || !user || isGameLoading) return <Layout><div className="flex-1 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div></Layout>;
  if (!game) return <Layout><div className="flex-1 flex items-center justify-center">Game not found</div></Layout>;

  const isMyTurn = game.status === 'active' && game.currentTurnUserId === user.id;
  const isSpectator = game.playerXUserId !== user.id && game.playerOUserId !== user.id;
  
  const handleMove = (moveData: any) => {
    if (!isMyTurn || isSpectator || game.status !== 'active') return;
    makeMove.mutate({ gameId: gId, data: { moveData } });
  };

  const opponent = game.playerXUserId === user.id ? game.playerOProfile : game.playerXProfile;

  return (
    <Layout>
      <div className="flex-1 flex flex-col relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-accent to-primary animate-pulse opacity-50"></div>
        
        {/* Header */}
        <div className="p-4 border-b border-border/50 bg-background/50 backdrop-blur flex justify-between items-center z-10 sticky top-0">
          <Link href={`/rooms/${rId}`}>
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Room
            </Button>
          </Link>
          
          <div className="flex items-center gap-4 text-sm font-medium">
            <div className={`px-3 py-1 rounded-full ${game.playerXUserId === user.id ? 'bg-primary/20 text-primary border border-primary/30' : 'text-muted-foreground'}`}>
              {game.playerXProfile?.username} {game.playerXUserId === user.id && '(You)'}
            </div>
            <div className="text-xl font-black italic opacity-50">VS</div>
            <div className={`px-3 py-1 rounded-full ${game.playerOUserId === user.id ? 'bg-primary/20 text-primary border border-primary/30' : 'text-muted-foreground'}`}>
              {game.playerOProfile?.username} {game.playerOUserId === user.id && '(You)'}
            </div>
          </div>
          
          <div className="w-[100px] text-right">
            {game.status === 'active' && !isSpectator && (
              <span className={`text-xs uppercase tracking-wider font-bold ${isMyTurn ? 'text-green-400 animate-pulse' : 'text-muted-foreground'}`}>
                {isMyTurn ? "Your Turn" : "Waiting..."}
              </span>
            )}
          </div>
        </div>

        {/* Game Area */}
        <div className="flex-1 flex flex-col items-center justify-center p-4 relative overflow-hidden">
          {game.status === 'finished' ? (
            <WinScreen game={game} user={user} roomId={rId} />
          ) : (
            <div className="w-full max-w-3xl animate-in zoom-in-95 duration-500">
              {game.gameType === 'tic-tac-toe' && <TicTacToe game={game} onMove={handleMove} isMyTurn={isMyTurn} isSpectator={isSpectator} />}
              {game.gameType === 'connect-four' && <ConnectFour game={game} onMove={handleMove} isMyTurn={isMyTurn} isSpectator={isSpectator} />}
              {game.gameType === 'rock-paper-scissors' && <RockPaperScissors game={game} onMove={handleMove} isMyTurn={isMyTurn} isSpectator={isSpectator} />}
              {game.gameType === 'word-duel' && <WordDuel game={game} onMove={handleMove} isMyTurn={isMyTurn} isSpectator={isSpectator} profileId={user.id} />}
              {game.gameType === 'truth-spinner' && <TruthSpinner game={game} onMove={handleMove} isMyTurn={isMyTurn} isSpectator={isSpectator} profileId={user.id} />}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
