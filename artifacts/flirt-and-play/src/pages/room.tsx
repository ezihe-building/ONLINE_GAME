import { useState, useEffect } from "react";
import { useLocation, useParams, Link } from "wouter";
import { useGetRoom, useGetMe, useListGameTypes, useCreateGame, useListRoomGames } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Copy, Check, ArrowLeft, Loader2, Play, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Room() {
  const { roomId } = useParams<{ roomId: string }>();
  const id = parseInt(roomId, 10);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const { data: room, isLoading: isLoadingRoom } = useGetRoom(id, {
    query: {
      queryKey: [],
      enabled: !!id,
      refetchInterval: 2000,
    }
  });

  const { data: profile } = useGetMe();
  const { data: gameTypes } = useListGameTypes();
  
  const { data: games } = useListRoomGames(id, {
    query: {
      queryKey: [],
      enabled: !!id,
      refetchInterval: 2000,
    }
  });

  const createGame = useCreateGame();

  const gamesList = Array.isArray(games) ? games : [];

  useEffect(() => {
    if (gamesList.length > 0) {
      const activeGame = gamesList.find(g => g.status === 'active');
      if (activeGame) {
        setLocation(`/rooms/${id}/games/${activeGame.id}`);
      }
    }
  }, [gamesList, id, setLocation]);

  const copyCode = () => {
    if (room?.code) {
      navigator.clipboard.writeText(room.code);
      setCopied(true);
      toast({ title: "Code copied to clipboard!" });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleStartGame = (gameType: string) => {
    createGame.mutate({ roomId: id, data: { gameType: gameType as any } }, {
      onSuccess: (game) => {
        setLocation(`/rooms/${id}/games/${game.id}`);
      },
      onError: (err) => {
        toast({ title: "Failed to start game", description: err.message, variant: "destructive" });
      }
    });
  };

  if (isLoadingRoom) {
    return <div className="min-h-[100dvh] flex items-center justify-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!room) {
    return <div className="min-h-[100dvh] flex items-center justify-center bg-background text-foreground">Room not found</div>;
  }

  const isCreator = room.creatorUserId === profile?.id;
  const opponent = isCreator ? room.guestProfile : room.creatorProfile;
  const me = isCreator ? room.creatorProfile : room.guestProfile;
  const isWaiting = room.status === 'waiting';

  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col">
      <header className="px-6 py-4 flex justify-between items-center border-b border-border/40 bg-card">
        <Link href="/lobby" className="text-muted-foreground hover:text-foreground flex items-center gap-2 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <div className="px-3 py-1 rounded-full bg-muted text-sm font-mono tracking-widest text-muted-foreground">
          {room.code}
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full p-4 sm:p-6 lg:p-8 flex flex-col gap-8 items-center pt-12">
        
        <div className="flex items-center justify-center w-full max-w-2xl gap-4 sm:gap-12 mb-8">
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <Avatar className="h-20 w-20 sm:h-24 sm:w-24 border-4 border-primary shadow-[0_0_20px_-5px_rgba(236,72,153,0.5)]">
                <AvatarImage src={me?.avatarPath ? `/api/storage/objects${me.avatarPath}` : undefined} />
                <AvatarFallback className="bg-primary/20 text-primary text-2xl">{me?.username?.charAt(0).toUpperCase() || '?'}</AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-2 -translate-x-1/2 left-1/2 px-2 py-0.5 bg-background border border-primary text-xs rounded-full text-primary font-bold">YOU</div>
            </div>
            <span className="font-display text-lg font-bold">{me?.username || 'You'}</span>
          </div>

          <div className="text-2xl font-black text-muted-foreground italic tracking-widest px-4">VS</div>

          <div className="flex flex-col items-center gap-3">
            {isWaiting ? (
              <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full border-4 border-dashed border-muted bg-card flex items-center justify-center animate-pulse">
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
            ) : (
              <div className="relative">
                <Avatar className="h-20 w-20 sm:h-24 sm:w-24 border-4 border-secondary shadow-[0_0_20px_-5px_rgba(139,92,246,0.5)]">
                  <AvatarImage src={opponent?.avatarPath ? `/api/storage/objects${opponent.avatarPath}` : undefined} />
                  <AvatarFallback className="bg-secondary/20 text-secondary text-2xl">{opponent?.username?.charAt(0).toUpperCase() || '?'}</AvatarFallback>
                </Avatar>
              </div>
            )}
            <span className="font-display text-lg font-bold text-muted-foreground">
              {isWaiting ? 'Waiting...' : opponent?.username}
            </span>
          </div>
        </div>

        {isWaiting ? (
          <Card className="w-full max-w-md bg-card border-primary/20 shadow-[0_0_30px_-10px_rgba(236,72,153,0.1)] text-center">
            <CardHeader>
              <CardTitle className="font-display text-2xl">Invite your friend</CardTitle>
              <CardDescription>Share this code so they can join the parlor.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="h-20 bg-input rounded-xl border border-border flex items-center justify-center text-4xl font-mono tracking-[0.5em] font-bold">
                {room.code}
              </div>
              <Button onClick={copyCode} variant="outline" className="w-full h-12 text-lg border-primary/50 text-primary hover:bg-primary/10">
                {copied ? <Check className="mr-2 h-5 w-5" /> : <Copy className="mr-2 h-5 w-5" />}
                {copied ? "Copied!" : "Copy Code"}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="w-full">
            <h2 className="text-2xl font-display font-bold mb-6 text-center">Choose a Game</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {gameTypes?.map(game => (
                <Card key={game.key} className="bg-card border-border/50 hover:border-primary/50 transition-colors group">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-xl font-display group-hover:text-primary transition-colors">{game.name}</CardTitle>
                    <CardDescription>{game.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      className="w-full bg-muted text-foreground hover:bg-primary hover:text-primary-foreground transition-all"
                      onClick={() => handleStartGame(game.key)}
                      disabled={createGame.isPending}
                    >
                      <Play className="h-4 w-4 mr-2" /> Play Now
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {gamesList.filter(g => g.status === 'finished').length > 0 && (
              <div className="mt-12">
                <h3 className="text-xl font-display font-bold mb-4 text-muted-foreground">Previous Matches</h3>
                <div className="flex flex-col gap-2">
                  {gamesList.filter(g => g.status === 'finished').map(game => (
                    <div key={game.id} className="p-4 rounded-xl bg-card border border-border/50 flex justify-between items-center">
                      <div>
                        <span className="font-medium text-foreground">{gameTypes?.find(t => t.key === game.gameType)?.name || game.gameType}</span>
                        <span className="text-sm text-muted-foreground ml-2">
                          {game.isDraw ? 'Draw' : game.winnerUserId === profile?.id ? 'You won' : 'You lost'}
                        </span>
                      </div>
                      <Link href={`/rooms/${id}/games/${game.id}`}>
                        <Button variant="ghost" size="sm">View</Button>
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}
