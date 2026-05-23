import { useState } from "react";
import { GameSession, UserProfile, useSendFlirtMessage, useGetFlirtMessage, useRequestRematch } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Loader2, Heart, RotateCcw, ArrowRight } from "lucide-react";
import { Link, useLocation } from "wouter";

interface Props {
  game: GameSession;
  me: UserProfile;
  roomId: number;
}

export default function WinScreen({ game, me, roomId }: Props) {
  const [, setLocation] = useLocation();
  const [flirtText, setFlirtText] = useState("");
  
  const isDraw = game.isDraw;
  const isWinner = game.winnerClerkId === me.clerkId;
  const isLoser = !isDraw && !isWinner;
  
  const opponent = game.playerXClerkId === me.clerkId ? game.playerOProfile : game.playerXProfile;
  const winnerProfile = game.winnerClerkId === game.playerXClerkId ? game.playerXProfile : game.playerOProfile;

  const sendFlirt = useSendFlirtMessage();
  const requestRematch = useRequestRematch();
  
  const { data: flirtMessage, isLoading: isLoadingFlirt } = useGetFlirtMessage(game.id, {
    query: {
      queryKey: [],
      enabled: game.flirtSent === true
    }
  });

  const handleSendFlirt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!flirtText.trim()) return;
    
    sendFlirt.mutate({ gameId: game.id, data: { message: flirtText } });
  };

  const handleRematch = () => {
    requestRematch.mutate({ gameId: game.id });
  };

  return (
    <div className="w-full max-w-lg mx-auto flex flex-col items-center gap-6 animate-in fade-in zoom-in duration-500">
      
      {isDraw ? (
        <div className="text-center">
          <h2 className="text-5xl font-display font-black mb-4">It's a Draw! 🤝</h2>
          <p className="text-muted-foreground text-lg">Nobody owes a flirt... this time.</p>
        </div>
      ) : (
        <div className="text-center w-full">
          <div className="inline-flex items-center justify-center p-4 bg-primary/10 rounded-full mb-6 text-primary shadow-[0_0_40px_rgba(236,72,153,0.3)]">
            <Heart className="w-12 h-12 fill-primary" />
          </div>
          <h2 className="text-4xl md:text-5xl font-display font-black mb-4 leading-tight">
            Haha {winnerProfile?.username} won u,<br/>now u have to flirt 💋
          </h2>
          
          <div className="mt-8 w-full text-left">
            {game.flirtSent === false ? (
              isLoser ? (
                <form onSubmit={handleSendFlirt} className="space-y-4">
                  <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Pay your debt</p>
                  <Input 
                    value={flirtText}
                    onChange={(e) => setFlirtText(e.target.value)}
                    placeholder={`Type something flirty to ${opponent?.username}...`}
                    className="h-16 text-lg bg-input border-primary/30 focus-visible:ring-primary shadow-[0_0_15px_rgba(236,72,153,0.1)]"
                    autoFocus
                  />
                  <Button 
                    type="submit" 
                    className="w-full h-14 text-lg bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg"
                    disabled={!flirtText.trim() || sendFlirt.isPending}
                  >
                    {sendFlirt.isPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Send Flirt 💋"}
                  </Button>
                </form>
              ) : (
                <div className="p-6 rounded-2xl bg-card border border-border text-center">
                  <p className="text-muted-foreground animate-pulse">Waiting for {opponent?.username} to send their flirt...</p>
                </div>
              )
            ) : (
              <Card className="bg-card border-primary/30 shadow-[0_0_30px_-5px_rgba(236,72,153,0.2)] overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-secondary" />
                <CardHeader className="pb-2">
                  <CardDescription className="uppercase tracking-widest text-primary font-bold text-xs">
                    Message from {flirtMessage?.fromProfile?.username || 'Loser'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingFlirt ? (
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mx-auto" />
                  ) : (
                    <p className="text-2xl font-display italic font-medium leading-relaxed">"{flirtMessage?.message}"</p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4 w-full mt-4">
        <Button 
          onClick={handleRematch} 
          disabled={requestRematch.isPending}
          variant="outline"
          className="flex-1 h-14 text-lg border-border hover:bg-muted"
        >
          {requestRematch.isPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <><RotateCcw className="mr-2 h-5 w-5" /> Play Again</>}
        </Button>
        <Button 
          onClick={() => setLocation(`/rooms/${roomId}`)}
          className="flex-1 h-14 text-lg bg-secondary hover:bg-secondary/90 text-secondary-foreground"
        >
          <ArrowRight className="mr-2 h-5 w-5" /> Choose New Game
        </Button>
      </div>
      
    </div>
  );
}