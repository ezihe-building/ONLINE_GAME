import { useParams, Link } from "wouter";
import { useGetGame, useGetMe, useMakeMove } from "@workspace/api-client-react";
import { Loader2, ArrowLeft, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import TicTacToe from "@/components/games/tic-tac-toe";
import ConnectFour from "@/components/games/connect-four";
import RockPaperScissors from "@/components/games/rock-paper-scissors";
import WordDuel from "@/components/games/word-duel";
import TruthSpinner from "@/components/games/truth-spinner";
import WinScreen from "@/components/games/win-screen";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function Game() {
  const { roomId, gameId } = useParams<{ roomId: string, gameId: string }>();
  const rId = parseInt(roomId, 10);
  const gId = parseInt(gameId, 10);

  const { data: profile } = useGetMe();
  const { data: game, isLoading } = useGetGame(gId, {
    query: {
      queryKey: [],
      enabled: !!gId,
      refetchInterval: (query) => ((query.state.data as any)?.status === 'active' ? 2000 : false),
    }
  });

  const makeMove = useMakeMove();

  const handleMove = (moveData: any) => {
    makeMove.mutate({ gameId: gId, data: { moveData } });
  };

  if (isLoading) {
    return <div className="min-h-[100dvh] flex items-center justify-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!game || !profile) {
    return <div className="min-h-[100dvh] flex items-center justify-center bg-background text-foreground">Game not found</div>;
  }

  const isPlayerX = game.playerXClerkId === profile.clerkId;
  const isPlayerO = game.playerOClerkId === profile.clerkId;
  const isMyTurn = game.currentTurnClerkId === profile.clerkId && game.status === 'active';
  const isSpectator = !isPlayerX && !isPlayerO;

  const opponent = isPlayerX ? game.playerOProfile : game.playerXProfile;

  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col">
      <header className="px-6 py-4 flex justify-between items-center border-b border-border/40 bg-card z-10 relative">
        <Link href={`/rooms/${rId}`} className="text-muted-foreground hover:text-foreground flex items-center gap-2 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Room
        </Link>
        
        {game.status === 'finished' && (
          <Link href={`/rooms/${rId}/games/${gId}/replay`}>
            <Button variant="outline" size="sm" className="border-primary/50 text-primary hover:bg-primary/10">
              <RotateCcw className="h-4 w-4 mr-2" /> Watch Replay
            </Button>
          </Link>
        )}
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full p-4 sm:p-6 lg:p-8 flex flex-col items-center justify-center relative pt-8">
        
        {game.status === 'finished' ? (
          <WinScreen game={game} me={profile} roomId={rId} />
        ) : (
          <>
            <div className="flex items-center justify-between w-full max-w-3xl mb-8">
              <div className={`flex flex-col items-center gap-2 transition-opacity ${!isMyTurn ? 'opacity-50' : 'opacity-100 scale-105'}`}>
                <Avatar className={`h-16 w-16 border-2 ${isMyTurn ? 'border-primary shadow-[0_0_15px_-3px_rgba(236,72,153,0.5)]' : 'border-border'}`}>
                  <AvatarImage src={profile?.avatarPath ? `/api/storage/objects${profile.avatarPath}` : undefined} />
                  <AvatarFallback>{profile?.username?.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className="font-bold text-sm">You {isPlayerX ? '(X)' : '(O)'}</span>
                {isMyTurn && <span className="text-xs text-primary font-bold animate-pulse">YOUR TURN</span>}
              </div>

              <div className="text-xl font-black text-muted-foreground italic tracking-widest px-4">VS</div>

              <div className={`flex flex-col items-center gap-2 transition-opacity ${isMyTurn ? 'opacity-50' : 'opacity-100 scale-105'}`}>
                <Avatar className={`h-16 w-16 border-2 ${!isMyTurn ? 'border-secondary shadow-[0_0_15px_-3px_rgba(139,92,246,0.5)]' : 'border-border'}`}>
                  <AvatarImage src={opponent?.avatarPath ? `/api/storage/objects${opponent.avatarPath}` : undefined} />
                  <AvatarFallback>{opponent?.username?.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className="font-bold text-sm">{opponent?.username} {!isPlayerX ? '(X)' : '(O)'}</span>
                {!isMyTurn && <span className="text-xs text-secondary font-bold animate-pulse">THEIR TURN</span>}
              </div>
            </div>

            <div className="w-full flex justify-center items-center">
              {game.gameType === 'tic-tac-toe' && <TicTacToe game={game} onMove={handleMove} isMyTurn={isMyTurn} isSpectator={isSpectator} />}
              {game.gameType === 'connect-four' && <ConnectFour game={game} onMove={handleMove} isMyTurn={isMyTurn} isSpectator={isSpectator} />}
              {game.gameType === 'rock-paper-scissors' && <RockPaperScissors game={game} onMove={handleMove} isMyTurn={isMyTurn} isSpectator={isSpectator} profileId={profile.clerkId} />}
              {game.gameType === 'word-duel' && <WordDuel game={game} onMove={handleMove} isMyTurn={isMyTurn} isSpectator={isSpectator} profileId={profile.clerkId} />}
              {game.gameType === 'truth-spinner' && <TruthSpinner game={game} onMove={handleMove} isMyTurn={isMyTurn} isSpectator={isSpectator} profileId={profile.clerkId} />}
            </div>
          </>
        )}
      </main>
    </div>
  );
}