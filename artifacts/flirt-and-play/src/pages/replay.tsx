import { useGetGame } from "@workspace/api-client-react";
import { useParams, Link } from "wouter";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function Replay() {
  const { roomId, gameId } = useParams<{ roomId: string, gameId: string }>();
  const gId = parseInt(gameId || '0');
  const rId = parseInt(roomId || '0');
  
  const { data: game, isLoading } = useGetGame(gId, { query: { enabled: !!gId } });

  if (isLoading) return <Layout><div className="flex-1 flex items-center justify-center">Loading...</div></Layout>;
  if (!game) return <Layout><div className="flex-1 flex items-center justify-center">Game not found</div></Layout>;

  return (
    <Layout>
      <div className="container mx-auto p-4 max-w-3xl">
        <Link href={`/rooms/${rId}`}>
          <Button variant="ghost" className="mb-6"><ArrowLeft className="w-4 h-4 mr-2"/> Back to Room</Button>
        </Link>
        
        <h1 className="text-3xl font-bold mb-8">Game Summary: {game.gameType.replace(/-/g, ' ')}</h1>
        
        <Card className="bg-card/50 border-border/50 backdrop-blur">
          <CardContent className="p-8 space-y-6 text-center">
            <div className="flex justify-center items-center gap-8 text-xl">
              <div className="flex flex-col items-center">
                <span className="font-bold text-2xl">{game.playerXProfile?.username}</span>
                <span className="text-muted-foreground text-sm">Player 1</span>
              </div>
              <div className="text-3xl font-black italic opacity-30">VS</div>
              <div className="flex flex-col items-center">
                <span className="font-bold text-2xl">{game.playerOProfile?.username}</span>
                <span className="text-muted-foreground text-sm">Player 2</span>
              </div>
            </div>
            
            <div className="py-8 border-y border-border/50">
              <h2 className="text-2xl font-semibold mb-2">Result</h2>
              {game.isDraw ? (
                <span className="text-yellow-500 font-bold">It was a Draw!</span>
              ) : (
                <span className="text-primary font-bold text-3xl">
                  {game.winnerProfile?.username} won!
                </span>
              )}
            </div>
            
            <div className="text-sm text-muted-foreground">
              Played on {new Date(game.createdAt).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
