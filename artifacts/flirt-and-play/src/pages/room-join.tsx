import { useState } from "react";
import { useLocation, Link, useParams } from "wouter";
import { useGetRoomByCode, useJoinRoom } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Loader2, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function RoomJoin() {
  const [, setLocation] = useLocation();
  const [code, setCode] = useState("");
  const { toast } = useToast();
  
  const { data: room, isError, isLoading: isChecking } = useGetRoomByCode(code.toUpperCase(), {
    query: {
      queryKey: [],
      enabled: code.length === 6,
      retry: false,
    }
  });

  const joinRoom = useJoinRoom();

  const handleJoin = () => {
    if (!room) return;
    
    joinRoom.mutate({ roomId: room.id }, {
      onSuccess: () => {
        setLocation(`/rooms/${room.id}`);
      },
      onError: (err) => {
        toast({
          title: "Failed to join room",
          description: err.message || "An error occurred",
          variant: "destructive"
        });
      }
    });
  };

  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col items-center justify-center p-4">
      <Link href="/lobby" className="absolute top-6 left-6 text-muted-foreground hover:text-foreground flex items-center gap-2 transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to Lobby
      </Link>
      
      <Card className="w-full max-w-md bg-card border-border shadow-2xl">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-3xl font-display font-bold">Join Room</CardTitle>
          <CardDescription className="text-base">
            Enter the 6-character invite code from your friend.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6 pt-6">
          <div className="relative">
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 6))}
              placeholder="e.g. A1B2C3"
              className="h-16 text-center text-2xl font-mono tracking-[0.5em] uppercase bg-input border-border focus-visible:ring-primary uppercase"
              maxLength={6}
            />
            {isChecking && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            )}
          </div>
          
          {isError && code.length === 6 && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-md text-center">
              Room not found. Check the code and try again.
            </div>
          )}
          
          {room && (
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-sm text-muted-foreground">Room found</span>
                <span className="font-medium text-foreground">Created by {room.creatorProfile?.username}</span>
              </div>
              <Button 
                onClick={handleJoin} 
                disabled={joinRoom.isPending}
                className="bg-primary hover:bg-primary/90"
              >
                {joinRoom.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Join"}
              </Button>
            </div>
          )}
          
          {!room && (
            <Button 
              size="lg" 
              className="w-full h-14 text-lg bg-primary hover:bg-primary/90 text-primary-foreground opacity-50"
              disabled
            >
              Enter valid code
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}