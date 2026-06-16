import { useGetMyStats } from "@workspace/api-client-react";
import { Loader2, Flame, Trophy, Gamepad2, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth";

interface Stats {
  gamesPlayed: number;
  gamesWon: number;
  gamesLost: number;
  winRate: number;
  currentWinStreak: number;
  longestWinStreak: number;
  currentLoginStreak: number;
  longestLoginStreak: number;
  flirtsSent: number;
  flirtsReceived: number;
  badges: { id: string; emoji: string; label: string; description: string }[];
}

export default function Streaks() {
  const { user } = useAuth();
  const { data, isLoading } = useGetMyStats();
  const stats = data as unknown as Stats | undefined;

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-background text-foreground pb-24 pt-8 px-4">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-display font-black mb-1">
            <Flame className="inline h-8 w-8 text-primary mr-2 -mt-1" />
            Streaks
          </h1>
          <p className="text-muted-foreground">Your game history & achievements</p>
        </div>

        {/* Current Streaks */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card className="bg-card border-primary/30 text-center">
            <CardContent className="pt-6 pb-4">
              <div className="text-5xl font-black text-primary mb-1">
                {stats?.currentWinStreak ?? 0}
              </div>
              <div className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">
                Win Streak
              </div>
              <div className="text-xs text-primary mt-1">🔥 Active</div>
            </CardContent>
          </Card>
          <Card className="bg-card border-secondary/30 text-center">
            <CardContent className="pt-6 pb-4">
              <div className="text-5xl font-black text-secondary mb-1">
                {stats?.currentLoginStreak ?? 0}
              </div>
              <div className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">
                Login Streak
              </div>
              <div className="text-xs text-secondary mt-1">📅 Days</div>
            </CardContent>
          </Card>
        </div>

        {/* Stats Grid */}
        <Card className="bg-card border-border mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Gamepad2 className="h-5 w-5 text-primary" /> Game Stats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-3xl font-black">{stats?.gamesPlayed ?? 0}</div>
                <div className="text-xs text-muted-foreground mt-1">Played</div>
              </div>
              <div>
                <div className="text-3xl font-black text-green-400">{stats?.gamesWon ?? 0}</div>
                <div className="text-xs text-muted-foreground mt-1">Won</div>
              </div>
              <div>
                <div className="text-3xl font-black text-red-400">{stats?.gamesLost ?? 0}</div>
                <div className="text-xs text-muted-foreground mt-1">Lost</div>
              </div>
            </div>
            <div className="mt-4 flex flex-col gap-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Win Rate</span>
                <span className="font-bold text-primary">
                  {stats?.winRate != null ? `${Math.round(stats.winRate)}%` : "—"}
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-700"
                  style={{ width: `${Math.round(stats?.winRate ?? 0)}%` }}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Best Win Streak</span>
                <span className="font-bold">⚡ {stats?.longestWinStreak ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Best Login Streak</span>
                <span className="font-bold">👑 {stats?.longestLoginStreak ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Flirts Sent</span>
                <span className="font-bold">💋 {stats?.flirtsSent ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Flirts Received</span>
                <span className="font-bold">💌 {stats?.flirtsReceived ?? 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Badges */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Trophy className="h-5 w-5 text-yellow-500" /> Badges
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!stats?.badges?.length ? (
              <div className="text-center py-8 text-muted-foreground">
                <Star className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>Play games to earn badges!</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {stats.badges.map((badge) => (
                  <div
                    key={badge.id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-background border border-border/50"
                  >
                    <span className="text-3xl">{badge.emoji}</span>
                    <div>
                      <div className="font-bold text-sm">{badge.label}</div>
                      <div className="text-xs text-muted-foreground">{badge.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
