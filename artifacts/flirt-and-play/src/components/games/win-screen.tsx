import { useState } from "react";
import { 
  GameSession, 
  UserProfile, 
  useSendFlirtMessage, 
  useGetFlirtMessage,
  useRequestRematch
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
import { Heart, RefreshCw, ArrowLeft, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface WinScreenProps {
  game: GameSession;
  user: UserProfile;
  roomId: number;
}

export default function WinScreen({ game, user, roomId }: WinScreenProps) {
  const { toast } = useToast();
  const isDraw = game.isDraw;
  const amIWinner = game.winnerUserId === user.id;
  const amILoser = !isDraw && !amIWinner && (game.playerXUserId === user.id || game.playerOUserId === user.id);
  const isSpectator = game.playerXUserId !== user.id && game.playerOUserId !== user.id;

  const [flirtMsg, setFlirtMsg] = useState("");
  const sendFlirt = useSendFlirtMessage();
  const requestRematch = useRequestRematch();

  const { data: flirtData } = useGetFlirtMessage(game.id, {
    query: {
      enabled: amIWinner && !game.flirtSent,
      refetchInterval: 2000
    }
  });

  const handleSendFlirt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!flirtMsg.trim() || sendFlirt.isPending) return;
    
    sendFlirt.mutate({ gameId: game.id, data: { message: flirtMsg } }, {
      onSuccess: () => {
        toast({ title: "Dare complete", description: "Message sent to the winner." });
      },
      onError: (err) => toast({ title: "Failed", description: err.error?.error, variant: "destructive" })
    });
  };

  const handleRematch = () => {
    requestRematch.mutate({ gameId: game.id }, {
      onError: (err) => toast({ title: "Failed", description: err.error?.error, variant: "destructive" })
    });
  };

  return (
    <div className="w-full max-w-lg mx-auto bg-card/60 backdrop-blur-md border border-border/50 rounded-3xl p-8 shadow-2xl flex flex-col items-center text-center animate-in zoom-in-95 duration-500">
      
      {isDraw ? (
        <div className="space-y-4 mb-8">
          <div className="text-6xl mb-4">🤝</div>
          <h2 className="text-4xl font-black text-foreground">It's a Draw!</h2>
          <p className="text-muted-foreground">Nobody wins, nobody loses. Boring.</p>
        </div>
      ) : (
        <div className="space-y-4 mb-8 w-full">
          {amIWinner ? (
            <div className="animate-in slide-in-from-bottom-4 fade-in duration-700">
              <div className="text-6xl mb-4">👑</div>
              <h2 className="text-5xl font-black bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent pb-2">
                YOU WON!
              </h2>
              <p className="text-lg font-medium text-foreground">
                To the victor go the spoils.
              </p>
            </div>
          ) : amILoser ? (
            <div>
              <div className="text-6xl mb-4">💀</div>
              <h2 className="text-4xl font-black text-muted-foreground">You Lost.</h2>
              <p className="text-lg text-primary font-medium mt-2">
                Time to pay up. You owe them a flirt.
              </p>
            </div>
          ) : (
            <div>
              <h2 className="text-4xl font-black text-foreground">{game.winnerProfile?.username} Won</h2>
            </div>
          )}
        </div>
      )}

      {/* Flirt Mechanic Section */}
      {!isDraw && !isSpectator && (
        <div className="w-full mb-8 p-6 bg-background/50 rounded-2xl border border-primary/20 relative overflow-hidden">
          {amILoser && !game.flirtSent ? (
            <form onSubmit={handleSendFlirt} className="space-y-4 relative z-10">
              <label className="text-sm font-bold text-primary flex items-center justify-center gap-2">
                <Heart className="w-4 h-4 fill-primary" /> Send your dare
              </label>
              <div className="flex gap-2">
                <Input
                  value={flirtMsg}
                  onChange={e => setFlirtMsg(e.target.value)}
                  placeholder="Be bold..."
                  className="bg-card/50 border-primary/30 h-12"
                  autoFocus
                />
                <Button type="submit" size="icon" className="h-12 w-12 shrink-0 bg-primary hover:bg-primary/90" disabled={!flirtMsg.trim() || sendFlirt.isPending}>
                  <Send className="w-5 h-5" />
                </Button>
              </div>
            </form>
          ) : amILoser && game.flirtSent ? (
            <div className="text-center space-y-2">
              <Heart className="w-8 h-8 text-primary/50 mx-auto fill-primary/20" />
              <p className="font-medium">Message sent.</p>
              <p className="text-sm text-muted-foreground">Let's hope they liked it.</p>
            </div>
          ) : amIWinner && !flirtData && !game.flirtSent ? (
            <div className="text-center space-y-4 py-4">
              <Heart className="w-10 h-10 text-primary mx-auto animate-pulse" />
              <p className="font-medium text-lg">Waiting for their message...</p>
              <p className="text-sm text-muted-foreground">They're probably overthinking it.</p>
            </div>
          ) : amIWinner && (flirtData || game.flirtSent) ? (
            <div className="text-center space-y-4 animate-in zoom-in fade-in duration-500">
              <Heart className="w-8 h-8 text-primary mx-auto fill-primary" />
              <p className="text-sm font-bold text-primary uppercase tracking-widest">Incoming Message</p>
              <div className="p-4 bg-primary/10 border border-primary/30 rounded-xl">
                <p className="text-xl font-medium italic text-foreground">
                  "{flirtData?.message || 'The message is waiting for you in chat'}"
                </p>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 w-full">
        {!isSpectator && (
          <Button onClick={handleRematch} className="flex-1 h-14 text-lg font-bold shadow-[0_0_20px_-5px_rgba(236,72,153,0.5)]" disabled={requestRematch.isPending}>
            <RefreshCw className="w-5 h-5 mr-2" /> Play Again
          </Button>
        )}
        <Link href={`/rooms/${roomId}`} className="flex-1">
          <Button variant="outline" className="w-full h-14 text-lg border-border/50 hover:bg-background/50">
            <ArrowLeft className="w-5 h-5 mr-2" /> Back to Room
          </Button>
        </Link>
      </div>
    </div>
  );
}
