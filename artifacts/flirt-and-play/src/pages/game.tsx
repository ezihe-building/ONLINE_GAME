import { useParams, Link, useLocation } from "wouter";
import { useGetGame, useMakeMove, useRequestRematch, type UserProfile } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, ArrowLeft, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import TicTacToe from "@/components/games/tic-tac-toe";
import ConnectFour from "@/components/games/connect-four";
import RockPaperScissors from "@/components/games/rock-paper-scissors";
import WordDuel from "@/components/games/word-duel";
import TruthSpinner from "@/components/games/truth-spinner";
import WinScreen from "@/components/games/win-screen";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";

export default function Game() {
  const { roomId, gameId } = useParams<{ roomId: string; gameId: string }>();
  const rId = parseInt(roomId, 10);
  const gId = parseInt(gameId, 10);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Use the auth context — already in memory, no extra API call needed
  const { user } = useAuth();

  const { data: game, isLoading } = useGetGame(gId, {
    query: {
      queryKey: ["game", gId],
      enabled: !!gId,
      refetchInterval: (query) =>
        (query.state.data as any)?.status === "active" ? 1500 : false,
    },
  });

  const makeMove = useMakeMove({
    mutation: {
      onSuccess: (updatedGame) => {
        // Immediately update cache so board reflects the move at once
        queryClient.setQueryData(["game", gId], updatedGame);
      },
      onError: (err: any) => {
        const msg = err?.data?.error || err?.message || "Move failed";
        toast({ title: "Move failed", description: msg, variant: "destructive" });
      },
    },
  });

  const requestRematch = useRequestRematch({
    mutation: {
      onSuccess: (newGame) => {
        setLocation(`/rooms/${rId}/games/${newGame.id}`);
      },
      onError: () => {
        toast({ title: "Couldn't start rematch", variant: "destructive" });
      },
    },
  });

  const handleMove = (moveData: any) => {
    if (makeMove.isPending) return;
    makeMove.mutate({ gameId: gId, data: { moveData } });
  };

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!game || !user) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background text-foreground">
        Loading game...
      </div>
    );
  }

  // Cast auth user to UserProfile (same shape)
  const profile = user as unknown as UserProfile;

  const isPlayerX = game.playerXUserId === profile.id;
  const isPlayerO = game.playerOUserId === profile.id;
  const isMyTurn =
    game.currentTurnUserId === profile.id && game.status === "active";
  const isSpectator = !isPlayerX && !isPlayerO;

  const opponent = isPlayerX ? game.playerOProfile : game.playerXProfile;

  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col">
      <header className="px-6 py-4 flex justify-between items-center border-b border-border/40 bg-card z-10 relative">
        <Link
          href={`/rooms/${rId}`}
          className="text-muted-foreground hover:text-foreground flex items-center gap-2 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Room
        </Link>

        {game.status === "finished" && (
          <Link href={`/rooms/${rId}/games/${gId}/replay`}>
            <Button
              variant="outline"
              size="sm"
              className="border-primary/50 text-primary hover:bg-primary/10"
            >
              <RotateCcw className="h-4 w-4 mr-2" /> Watch Replay
            </Button>
          </Link>
        )}
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full p-4 sm:p-6 lg:p-8 flex flex-col items-center justify-center relative pt-8">
        {game.status === "finished" ? (
          <WinScreen
            game={game}
            me={profile}
            roomId={rId}
            onRematch={() => requestRematch.mutate({ gameId: gId })}
            isRematchPending={requestRematch.isPending}
          />
        ) : (
          <>
            {/* Turn indicator bar */}
            <div className="w-full max-w-3xl mb-6 p-3 rounded-xl bg-card border border-border text-center">
              {isMyTurn ? (
                <span className="text-primary font-bold animate-pulse">
                  ✨ Your turn — make a move!
                </span>
              ) : isSpectator ? (
                <span className="text-muted-foreground">Watching as spectator</span>
              ) : (
                <span className="text-muted-foreground animate-pulse">
                  Waiting for {opponent?.username || "opponent"}...
                </span>
              )}
            </div>

            <div className="flex items-center justify-between w-full max-w-3xl mb-8">
              <div
                className={`flex flex-col items-center gap-2 transition-all ${
                  isMyTurn ? "opacity-100 scale-105" : "opacity-50"
                }`}
              >
                <Avatar
                  className={`h-16 w-16 border-2 ${
                    isMyTurn
                      ? "border-primary shadow-[0_0_15px_-3px_rgba(236,72,153,0.5)]"
                      : "border-border"
                  }`}
                >
                  <AvatarImage
                    src={
                      profile?.avatarPath
                        ? `/api/storage/objects${profile.avatarPath}`
                        : undefined
                    }
                  />
                  <AvatarFallback>
                    {profile?.username?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="font-bold text-sm">
                  You ({isPlayerX ? "X" : "O"})
                </span>
              </div>

              <div className="text-xl font-black text-muted-foreground italic tracking-widest px-4">
                VS
              </div>

              <div
                className={`flex flex-col items-center gap-2 transition-all ${
                  !isMyTurn && !isSpectator ? "opacity-100 scale-105" : "opacity-50"
                }`}
              >
                <Avatar
                  className={`h-16 w-16 border-2 ${
                    !isMyTurn && !isSpectator
                      ? "border-secondary shadow-[0_0_15px_-3px_rgba(139,92,246,0.5)]"
                      : "border-border"
                  }`}
                >
                  <AvatarImage
                    src={
                      opponent?.avatarPath
                        ? `/api/storage/objects${opponent.avatarPath}`
                        : undefined
                    }
                  />
                  <AvatarFallback>
                    {opponent?.username?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="font-bold text-sm">
                  {opponent?.username} ({isPlayerX ? "O" : "X"})
                </span>
              </div>
            </div>

            <div className="w-full flex justify-center items-center">
              {game.gameType === "tic-tac-toe" && (
                <TicTacToe
                  game={game}
                  onMove={handleMove}
                  isMyTurn={isMyTurn}
                  isSpectator={isSpectator}
                />
              )}
              {game.gameType === "connect-four" && (
                <ConnectFour
                  game={game}
                  onMove={handleMove}
                  isMyTurn={isMyTurn}
                  isSpectator={isSpectator}
                />
              )}
              {game.gameType === "rock-paper-scissors" && (
                <RockPaperScissors
                  game={game}
                  onMove={handleMove}
                  isMyTurn={isMyTurn}
                  isSpectator={isSpectator}
                  profileId={profile.id}
                />
              )}
              {game.gameType === "word-duel" && (
                <WordDuel
                  game={game}
                  onMove={handleMove}
                  isMyTurn={isMyTurn}
                  isSpectator={isSpectator}
                  profileId={profile.id}
                />
              )}
              {game.gameType === "truth-spinner" && (
                <TruthSpinner
                  game={game}
                  onMove={handleMove}
                  isMyTurn={isMyTurn}
                  isSpectator={isSpectator}
                  profileId={profile.id}
                />
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
