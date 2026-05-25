import { useEffect, useState } from "react";
import { useLocation, useParams, Link } from "wouter";
import { useAuth } from "@/lib/auth";
import { Layout } from "@/components/layout";
import { 
  useGetRoom, 
  useStartGame,
  useGetRoomHistory,
  GameInputGameType 
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Copy, Plus, Users, History, Swords, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const GAME_TYPES = [
  { id: 'tic-tac-toe', name: 'Tic Tac Toe', desc: 'Classic 3x3 battle', color: 'from-blue-500 to-cyan-400' },
  { id: 'connect-four', name: 'Connect Four', desc: 'Drop 4 in a row', color: 'from-orange-500 to-yellow-400' },
  { id: 'rock-paper-scissors', name: 'Rock Paper Scissors', desc: 'Best out of 3', color: 'from-green-500 to-emerald-400' },
  { id: 'word-duel', name: 'Word Duel', desc: 'Guess the secret word', color: 'from-purple-500 to-fuchsia-400' },
  { id: 'truth-spinner', name: 'Truth Spinner', desc: 'Spin for truth questions', color: 'from-pink-500 to-rose-400' },
] as const;

export default function Room() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { roomId } = useParams<{ roomId: string }>();
  const { toast } = useToast();
  
  const id = parseInt(roomId || '0');
  
  const { data: room, isLoading: isRoomLoading } = useGetRoom(id, { query: { enabled: !!user && !!id } });
  const { data: history } = useGetRoomHistory(id, { query: { enabled: !!user && !!id } });
  const startGame = useStartGame();

  useEffect(() => {
    if (!isAuthLoading && !user) setLocation("/login");
  }, [user, isAuthLoading, setLocation]);

  const copyInvite = () => {
    if (room?.inviteCode) {
      navigator.clipboard.writeText(room.inviteCode);
      toast({ title: "Invite code copied!" });
    }
  };

  const handleStartGame = (gameType: GameInputGameType) => {
    // Pick first opponent that isn't me
    const opponent = room?.members?.find(m => m.id !== user?.id);
    if (!opponent) {
      toast({ title: "Wait for an opponent", description: "You need someone else in the room to play.", variant: "destructive" });
      return;
    }

    startGame.mutate({ roomId: id, data: { gameType, opponentId: opponent.id } }, {
      onSuccess: (game) => {
        setLocation(`/rooms/${id}/games/${game.id}`);
      },
      onError: (err) => {
        toast({ title: "Failed to start game", description: err.error?.error || "Error", variant: "destructive" });
      }
    });
  };

  if (isAuthLoading || !user || isRoomLoading) return <Layout><div className="flex-1 flex items-center justify-center">Loading...</div></Layout>;
  if (!room) return <Layout><div className="flex-1 flex items-center justify-center">Room not found</div></Layout>;

  const activeGame = history?.find(g => g.status === 'active');
  const finishedGames = history?.filter(g => g.status === 'finished') || [];
  const opponent = room.members?.find(m => m.id !== user.id);

  return (
    <Layout>
      <div className="container mx-auto p-4 md:p-8 max-w-6xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-4xl font-bold tracking-tight">{room.name}</h1>
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                <Users className="w-3 h-3 mr-1" /> {room.members?.length || 1}/2
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground bg-card/50 p-2 px-4 rounded-lg border border-border/50 inline-flex">
              <span className="text-sm font-medium">Invite Code:</span>
              <span className="font-mono text-foreground font-bold tracking-wider">{room.inviteCode}</span>
              <Button variant="ghost" size="icon" className="h-6 w-6 ml-2" onClick={copyInvite}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {activeGame && (
            <div className="bg-primary/20 border border-primary/30 p-4 rounded-xl flex items-center gap-4 animate-pulse">
              <div>
                <p className="text-sm font-semibold text-primary">Game in progress!</p>
                <p className="text-xs text-muted-foreground capitalize">{activeGame.gameType.replace(/-/g, ' ')}</p>
              </div>
              <Button onClick={() => setLocation(`/rooms/${id}/games/${activeGame.id}`)}>
                Join Match
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Swords className="w-5 h-5 text-primary" />
                <h2 className="text-2xl font-semibold">Pick a Game</h2>
              </div>
              
              {!opponent ? (
                <div className="bg-card/40 border border-dashed border-border p-8 rounded-xl text-center space-y-3">
                  <Info className="w-8 h-8 mx-auto text-muted-foreground" />
                  <h3 className="text-lg font-medium">Waiting for opponent</h3>
                  <p className="text-muted-foreground">Share the invite code <strong>{room.inviteCode}</strong> to let someone join.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {GAME_TYPES.map(game => (
                    <Card key={game.id} className="group cursor-pointer hover:border-primary/50 transition-all overflow-hidden" onClick={() => handleStartGame(game.id as GameInputGameType)}>
                      <div className={`h-2 w-full bg-gradient-to-r ${game.color}`} />
                      <CardHeader className="p-4">
                        <CardTitle className="text-lg flex justify-between items-center group-hover:text-primary transition-colors">
                          {game.name}
                          <Plus className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </CardTitle>
                        <CardDescription>{game.desc}</CardDescription>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-muted-foreground" />
              <h2 className="text-2xl font-semibold">History</h2>
            </div>
            
            <Card className="bg-card/40 backdrop-blur border-border/50">
              <CardContent className="p-0">
                {finishedGames.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground text-sm">
                    No games played yet.
                  </div>
                ) : (
                  <div className="divide-y divide-border/50 max-h-[500px] overflow-y-auto">
                    {finishedGames.map(game => (
                      <div key={game.id} className="p-4 hover:bg-muted/20 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-semibold text-sm capitalize">{game.gameType.replace(/-/g, ' ')}</span>
                          <Link href={`/rooms/${id}/games/${game.id}/replay`}>
                            <Button variant="ghost" size="sm" className="h-6 text-xs text-primary">Replay</Button>
                          </Link>
                        </div>
                        <div className="text-xs text-muted-foreground flex justify-between">
                          <span>
                            {game.isDraw ? "Draw" : 
                             game.winnerUserId === user.id ? <span className="text-green-400 font-medium">You won</span> : 
                             <span className="text-destructive font-medium">You lost</span>}
                          </span>
                          <span>{new Date(game.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
