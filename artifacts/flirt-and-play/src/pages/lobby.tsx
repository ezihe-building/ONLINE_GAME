import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/lib/auth";
import { Layout } from "@/components/layout";
import { useListRooms, useCreateRoom, useJoinRoom, getListRoomsQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Users, ArrowRight } from "lucide-react";
import { format } from "date-fns";

export default function Lobby() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { data: rooms, isLoading: isRoomsLoading } = useListRooms({ query: { enabled: !!user } });
  const createRoom = useCreateRoom();
  const joinRoom = useJoinRoom();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [createName, setCreateName] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  const [joinCode, setJoinCode] = useState("");
  const [joinOpen, setJoinOpen] = useState(false);

  useEffect(() => {
    if (!isAuthLoading && !user) {
      setLocation("/login");
    }
  }, [user, isAuthLoading, setLocation]);

  const handleCreateRoom = () => {
    if (!createName.trim()) return;
    createRoom.mutate({ data: { name: createName } }, {
      onSuccess: (room) => {
        toast({ title: "Room created" });
        queryClient.invalidateQueries({ queryKey: getListRoomsQueryKey() });
        setCreateOpen(false);
        setCreateName("");
        setLocation(`/rooms/${room.id}`);
      },
      onError: (err) => toast({ title: "Error", description: err.error?.error || "Could not create room", variant: "destructive" })
    });
  };

  const handleJoinRoom = () => {
    if (!joinCode.trim()) return;
    joinRoom.mutate({ data: { inviteCode: joinCode } }, {
      onSuccess: (room) => {
        toast({ title: "Joined room" });
        queryClient.invalidateQueries({ queryKey: getListRoomsQueryKey() });
        setJoinOpen(false);
        setJoinCode("");
        setLocation(`/rooms/${room.id}`);
      },
      onError: (err) => toast({ title: "Error", description: err.error?.error || "Could not join room", variant: "destructive" })
    });
  };

  if (isAuthLoading || !user) return <Layout><div className="flex-1 flex items-center justify-center">Loading...</div></Layout>;

  return (
    <Layout>
      <div className="container mx-auto p-4 md:p-8 max-w-5xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Your Rooms</h1>
            <p className="text-muted-foreground mt-2">Challenge your friends. Let the games begin.</p>
          </div>
          <div className="flex gap-3">
            <Dialog open={joinOpen} onOpenChange={setJoinOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="border-primary/50 text-primary hover:bg-primary/10">
                  Join Room
                </Button>
              </DialogTrigger>
              <DialogContent className="border-primary/20 bg-background/95 backdrop-blur">
                <DialogHeader>
                  <DialogTitle>Join a Room</DialogTitle>
                  <DialogDescription>Enter the invite code from your opponent.</DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <Input 
                    placeholder="Enter invite code" 
                    value={joinCode} 
                    onChange={e => setJoinCode(e.target.value)}
                    className="font-mono uppercase tracking-widest text-center text-lg h-12"
                  />
                </div>
                <DialogFooter>
                  <Button onClick={handleJoinRoom} disabled={joinRoom.isPending || !joinCode.trim()} className="w-full">
                    Join
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button className="shadow-[0_0_15px_-3px_rgba(236,72,153,0.4)]">
                  <Plus className="w-4 h-4 mr-2" /> Create Room
                </Button>
              </DialogTrigger>
              <DialogContent className="border-primary/20 bg-background/95 backdrop-blur">
                <DialogHeader>
                  <DialogTitle>Create New Room</DialogTitle>
                  <DialogDescription>Set up a private space to challenge someone.</DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <Input 
                    placeholder="Room Name (e.g. Late Night Games)" 
                    value={createName} 
                    onChange={e => setCreateName(e.target.value)}
                    className="h-12"
                  />
                </div>
                <DialogFooter>
                  <Button onClick={handleCreateRoom} disabled={createRoom.isPending || !createName.trim()} className="w-full">
                    Create
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {isRoomsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <Card key={i} className="animate-pulse bg-muted/50 border-0 h-48"></Card>
            ))}
          </div>
        ) : rooms && rooms.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms.map(room => (
              <Card key={room.id} className="group relative overflow-hidden border-border/50 bg-card/40 backdrop-blur hover:bg-card/60 transition-colors hover:border-primary/30 flex flex-col">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-accent opacity-50 group-hover:opacity-100 transition-opacity"></div>
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-xl truncate">{room.name}</CardTitle>
                    <span className="text-xs font-mono bg-muted px-2 py-1 rounded text-muted-foreground">{room.inviteCode}</span>
                  </div>
                  <CardDescription className="flex items-center gap-1.5 mt-1">
                    <Users className="w-3.5 h-3.5" />
                    {room.members?.length || 1} members
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  {room.recentGame ? (
                    <div className="text-sm space-y-1">
                      <p className="text-muted-foreground">Recent game:</p>
                      <p className="font-medium text-primary capitalize">{room.recentGame.gameType.replace(/-/g, ' ')}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">No games played yet</p>
                  )}
                </CardContent>
                <CardFooter>
                  <Link href={`/rooms/${room.id}`} className="w-full">
                    <Button variant="ghost" className="w-full justify-between group-hover:bg-primary/10 group-hover:text-primary">
                      Enter Room <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 border-2 border-dashed border-border/50 rounded-xl bg-card/20">
            <h3 className="text-2xl font-semibold mb-2">No rooms yet</h3>
            <p className="text-muted-foreground mb-6">Create a room or join one to start playing.</p>
            <Button onClick={() => setCreateOpen(true)}>Create your first room</Button>
          </div>
        )}
      </div>
    </Layout>
  );
}
