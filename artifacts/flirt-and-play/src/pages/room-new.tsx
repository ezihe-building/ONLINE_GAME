import { useState } from "react";
import { useLocation } from "wouter";
import { useCreateRoom } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { ArrowLeft, Copy, Check, Loader2 } from "lucide-react";
import { Link } from "wouter";

export default function RoomNew() {
  const [, setLocation] = useLocation();
  const createRoom = useCreateRoom();
  const [copied, setCopied] = useState(false);

  const handleCreate = () => {
    createRoom.mutate(undefined, {
      onSuccess: (room) => {
        // Room created, redirect to room lobby
        // but wait a beat if we want to show the code here first.
        // Actually, requirement says "instantly gets a code, shows it to share"
        // so we stay here until they click 'Go to Room' or we just show it in the room lobby?
        // Better: redirect to room lobby which shows the code while waiting.
        setLocation(`/rooms/${room.id}`);
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
          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary mx-auto mb-4">
            <span className="text-2xl">💋</span>
          </div>
          <CardTitle className="text-3xl font-display font-bold">Create Room</CardTitle>
          <CardDescription className="text-base">
            Start a new private parlor and invite a friend.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6 pt-6">
          <Button 
            size="lg" 
            className="w-full h-14 text-lg bg-primary hover:bg-primary/90 text-primary-foreground"
            onClick={handleCreate}
            disabled={createRoom.isPending}
          >
            {createRoom.isPending ? (
              <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Creating...</>
            ) : (
              "Generate Invite Code"
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}