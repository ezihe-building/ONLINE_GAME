import { useGetMyStats, useListMyRooms, useGetMe } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, LogIn, Trophy, Heart, Gamepad2, Settings, LogOut } from "lucide-react";
import { useClerk } from "@clerk/react";

export default function Lobby() {
  const { data: stats, isLoading: isLoadingStats } = useGetMyStats();
  const { data: rooms, isLoading: isLoadingRooms } = useListMyRooms();
  const { data: profile, isLoading: isLoadingProfile } = useGetMe();
  const { signOut } = useClerk();

  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col">
      <header className="px-6 py-4 flex justify-between items-center border-b border-border/40 bg-card">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white font-bold font-display">F</div>
          <span className="font-display font-bold text-xl tracking-tight hidden sm:inline-block">Flirt & Play</span>
        </div>
        
        <div className="flex items-center gap-4">
          <Link href="/profile">
            <Button variant="ghost" size="icon" className="rounded-full">
              <Settings className="h-5 w-5" />
            </Button>
          </Link>
          <Button variant="ghost" size="icon" onClick={() => signOut()} className="rounded-full">
            <LogOut className="h-5 w-5" />
          </Button>
          {isLoadingProfile ? (
            <Skeleton className="h-10 w-10 rounded-full" />
          ) : (
            <Avatar className="h-10 w-10 border border-border">
              <AvatarImage src={profile?.avatarPath ? `/api/storage/objects${profile.avatarPath}` : undefined} />
              <AvatarFallback className="bg-primary/20 text-primary">{profile?.username?.charAt(0).toUpperCase() || '?'}</AvatarFallback>
            </Avatar>
          )}
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full p-4 sm:p-6 lg:p-8 flex flex-col gap-8">
        
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-card border-border/50 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Trophy className="h-16 w-16" />
            </div>
            <CardHeader className="pb-2">
              <CardDescription>Win Rate</CardDescription>
              <CardTitle className="text-4xl font-display font-bold">
                {isLoadingStats ? <Skeleton className="h-10 w-16" /> : 
                  stats?.gamesPlayed ? Math.round((stats.wins / stats.gamesPlayed) * 100) + '%' : '0%'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground flex gap-2">
                <span className="text-green-500 font-medium">{stats?.wins || 0} W</span>
                <span>/</span>
                <span className="text-destructive font-medium">{stats?.losses || 0} L</span>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card border-border/50 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 text-primary group-hover:opacity-20 transition-opacity">
              <Heart className="h-16 w-16" />
            </div>
            <CardHeader className="pb-2">
              <CardDescription>Flirts Sent</CardDescription>
              <CardTitle className="text-4xl font-display font-bold text-primary">
                {isLoadingStats ? <Skeleton className="h-10 w-12" /> : stats?.flirtsSent || 0}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                Daring moves
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border/50 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 text-secondary group-hover:opacity-20 transition-opacity">
              <Gamepad2 className="h-16 w-16" />
            </div>
            <CardHeader className="pb-2">
              <CardDescription>Games Played</CardDescription>
              <CardTitle className="text-4xl font-display font-bold text-secondary">
                {isLoadingStats ? <Skeleton className="h-10 w-12" /> : stats?.gamesPlayed || 0}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                Total matches
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="flex flex-col sm:flex-row gap-4">
          <Link href="/rooms/new" className="flex-1">
            <Button size="lg" className="w-full h-16 text-lg font-medium bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl">
              <Plus className="mr-2 h-5 w-5" /> Create Room
            </Button>
          </Link>
          <Link href="/rooms/join" className="flex-1">
            <Button size="lg" variant="outline" className="w-full h-16 text-lg font-medium border-border hover:bg-muted rounded-xl">
              <LogIn className="mr-2 h-5 w-5" /> Join via Code
            </Button>
          </Link>
        </section>

        <section className="flex-1 flex flex-col">
          <h2 className="text-2xl font-display font-bold mb-4 flex items-center gap-2">
            Active Rooms <span className="text-sm font-sans font-normal px-2 py-0.5 bg-muted rounded-full text-muted-foreground">{rooms?.length || 0}</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {isLoadingRooms ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="bg-card border-border/50">
                  <CardHeader>
                    <Skeleton className="h-6 w-32 mb-2" />
                    <Skeleton className="h-4 w-24" />
                  </CardHeader>
                </Card>
              ))
            ) : rooms?.length === 0 ? (
              <div className="col-span-full py-12 flex flex-col items-center justify-center text-center border-2 border-dashed border-border/50 rounded-xl bg-card/50">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Gamepad2 className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-1">No active rooms</h3>
                <p className="text-sm text-muted-foreground max-w-sm mb-4">
                  Create a new room and share the code with a friend to start playing.
                </p>
              </div>
            ) : (
              rooms?.map((room) => {
                const isCreator = room.creatorClerkId === profile?.clerkId;
                const opponent = isCreator ? room.guestProfile : room.creatorProfile;
                
                return (
                  <Link key={room.id} href={`/rooms/${room.id}`}>
                    <Card className="bg-card border-border/50 hover:border-primary/50 transition-colors cursor-pointer group">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-lg font-display">
                          {opponent ? `vs ${opponent.username}` : "Waiting for player..."}
                        </CardTitle>
                        <div className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                          {room.status}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <CardDescription>Code: <span className="font-mono text-foreground tracking-wider">{room.code}</span></CardDescription>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })
            )}
          </div>
        </section>
      </main>
    </div>
  );
}