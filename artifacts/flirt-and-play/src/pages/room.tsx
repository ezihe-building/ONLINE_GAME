import { useEffect, useRef, useState } from "react";
import { useLocation, useParams, Link } from "wouter";
import { useAuth } from "@/lib/auth";
import { Layout } from "@/components/layout";
import {
  useGetRoom,
  useStartGame,
  useGetRoomHistory,
  useListRoomMessages,
  useSendRoomMessage,
  getListRoomMessagesQueryKey,
  GameInputGameType,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Copy, Plus, Users, History, Swords, Info, Send, MessageCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const GAME_TYPES = [
  { id: "tic-tac-toe", name: "Tic Tac Toe", desc: "Classic 3x3 battle", color: "from-blue-500 to-cyan-400" },
  { id: "connect-four", name: "Connect Four", desc: "Drop 4 in a row", color: "from-orange-500 to-yellow-400" },
  { id: "rock-paper-scissors", name: "Rock Paper Scissors", desc: "Best out of 3", color: "from-green-500 to-emerald-400" },
  { id: "word-duel", name: "Word Duel", desc: "Guess the secret word", color: "from-purple-500 to-fuchsia-400" },
  { id: "truth-spinner", name: "Truth Spinner", desc: "Spin for truth questions", color: "from-pink-500 to-rose-400" },
] as const;

export default function Room() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { roomId } = useParams<{ roomId: string }>();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [chatInput, setChatInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  const id = parseInt(roomId || "0");

  const { data: room, isLoading: isRoomLoading } = useGetRoom(id, {
    query: { enabled: !!user && !!id },
  });

  const { data: history } = useGetRoomHistory(id, {
    query: { enabled: !!user && !!id },
  });

  const { data: messages } = useListRoomMessages(id, {
    query: {
      queryKey: getListRoomMessagesQueryKey(id),
      enabled: !!user && !!id,
      refetchInterval: 2000,
    },
  });

  const sendMessage = useSendRoomMessage({
    mutation: {
      onSuccess: (msg) => {
        queryClient.setQueryData(
          getListRoomMessagesQueryKey(id),
          (old: typeof messages) => [...(old ?? []), msg],
        );
        setChatInput("");
      },
      onError: () => {
        toast({ title: "Failed to send message", variant: "destructive" });
      },
    },
  });

  const startGame = useStartGame();

  useEffect(() => {
    if (!isAuthLoading && !user) setLocation("/login");
  }, [user, isAuthLoading, setLocation]);

  // Auto-scroll chat to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const copyInvite = () => {
    if (room?.inviteCode) {
      navigator.clipboard.writeText(room.inviteCode);
      toast({ title: "Invite code copied!" });
    }
  };

  const handleStartGame = (gameType: GameInputGameType) => {
    const opponent = room?.members?.find((m) => m.id !== user?.id);
    if (!opponent) {
      toast({
        title: "Wait for an opponent",
        description: "Share the invite code to let someone join.",
        variant: "destructive",
      });
      return;
    }
    startGame.mutate(
      { roomId: id, data: { gameType, opponentId: opponent.id } },
      {
        onSuccess: (game) => setLocation(`/rooms/${id}/games/${game.id}`),
        onError: (err: any) => {
          toast({ title: "Failed to start game", description: err?.data?.error || "Error", variant: "destructive" });
        },
      },
    );
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    const text = chatInput.trim();
    if (!text || sendMessage.isPending) return;
    sendMessage.mutate({ roomId: id, data: { message: text } });
  };

  if (isAuthLoading || !user || isRoomLoading) {
    return (
      <Layout>
        <div className="flex-1 flex items-center justify-center text-muted-foreground">Loading...</div>
      </Layout>
    );
  }
  if (!room) {
    return (
      <Layout>
        <div className="flex-1 flex items-center justify-center">Room not found</div>
      </Layout>
    );
  }

  const activeGame = history?.find((g) => g.status === "active");
  const finishedGames = history?.filter((g) => g.status === "finished") ?? [];
  const opponent = room.members?.find((m) => m.id !== user.id);

  return (
    <Layout>
      <div className="container mx-auto p-4 md:p-6 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold tracking-tight">{room.name}</h1>
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                <Users className="w-3 h-3 mr-1" /> {room.members?.length ?? 1}/2
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground bg-card/50 p-2 px-4 rounded-lg border border-border/50 inline-flex">
              <span className="text-sm font-medium">Invite Code:</span>
              <span className="font-mono text-foreground font-bold tracking-wider" data-testid="text-invite-code">
                {room.inviteCode}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 ml-1"
                onClick={copyInvite}
                data-testid="button-copy-invite"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {activeGame && (
            <div className="bg-primary/20 border border-primary/30 p-4 rounded-xl flex items-center gap-4 animate-pulse">
              <div>
                <p className="text-sm font-semibold text-primary">Game in progress!</p>
                <p className="text-xs text-muted-foreground capitalize">
                  {activeGame.gameType.replace(/-/g, " ")}
                </p>
              </div>
              <Button onClick={() => setLocation(`/rooms/${id}/games/${activeGame.id}`)}>
                Rejoin
              </Button>
            </div>
          )}
        </div>

        {/* Main 3-column grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Games picker */}
          <div className="lg:col-span-1 space-y-4">
            <div className="flex items-center gap-2">
              <Swords className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">Pick a Game</h2>
            </div>

            {!opponent ? (
              <div className="bg-card/40 border border-dashed border-border p-6 rounded-xl text-center space-y-2">
                <Info className="w-7 h-7 mx-auto text-muted-foreground" />
                <p className="font-medium text-sm">Waiting for someone to join</p>
                <p className="text-muted-foreground text-xs">
                  Share code <strong>{room.inviteCode}</strong>
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {GAME_TYPES.map((game) => (
                  <Card
                    key={game.id}
                    className="group cursor-pointer hover:border-primary/50 transition-all overflow-hidden"
                    onClick={() => handleStartGame(game.id as GameInputGameType)}
                    data-testid={`card-game-${game.id}`}
                  >
                    <div className={`h-1.5 w-full bg-gradient-to-r ${game.color}`} />
                    <CardHeader className="p-3">
                      <CardTitle className="text-sm flex justify-between items-center group-hover:text-primary transition-colors">
                        {game.name}
                        <Plus className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </CardTitle>
                      <CardDescription className="text-xs">{game.desc}</CardDescription>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}

            {/* Members */}
            <div className="pt-4">
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-4 h-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Players</h2>
              </div>
              <div className="space-y-2">
                {room.members?.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-3 p-2 rounded-lg bg-card/40 border border-border/40"
                    data-testid={`card-member-${member.id}`}
                  >
                    <Avatar className="h-8 w-8 border border-border">
                      <AvatarImage src={member.avatarPath ?? undefined} />
                      <AvatarFallback className="text-xs font-bold">
                        {member.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{member.username}</span>
                    {member.id === user.id && (
                      <Badge variant="outline" className="ml-auto text-xs border-primary/30 text-primary">You</Badge>
                    )}
                    {member.id === room.createdBy && member.id !== user.id && (
                      <Badge variant="outline" className="ml-auto text-xs">Host</Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Chat */}
          <div className="lg:col-span-1 flex flex-col">
            <div className="flex items-center gap-2 mb-3">
              <MessageCircle className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">Chat</h2>
            </div>
            <Card className="flex-1 flex flex-col bg-card/40 border-border/50 min-h-[400px]">
              <CardContent className="flex-1 flex flex-col p-0">
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[380px]">
                  {!messages || messages.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-muted-foreground text-sm text-center">
                      <div>
                        <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        <p>No messages yet.</p>
                        <p className="text-xs mt-1">Say hello!</p>
                      </div>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isMe = msg.userId === user.id;
                      return (
                        <div
                          key={msg.id}
                          className={`flex items-end gap-2 ${isMe ? "flex-row-reverse" : "flex-row"}`}
                          data-testid={`chat-message-${msg.id}`}
                        >
                          <Avatar className="h-6 w-6 flex-shrink-0 border border-border/50">
                            <AvatarImage src={msg.userProfile?.avatarPath ?? undefined} />
                            <AvatarFallback className="text-xs">
                              {msg.userProfile?.username?.charAt(0).toUpperCase() ?? "?"}
                            </AvatarFallback>
                          </Avatar>
                          <div className={`max-w-[75%] ${isMe ? "items-end" : "items-start"} flex flex-col gap-1`}>
                            {!isMe && (
                              <span className="text-xs text-muted-foreground px-1">
                                {msg.userProfile?.username}
                              </span>
                            )}
                            <div
                              className={`px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                                isMe
                                  ? "bg-primary text-primary-foreground rounded-br-sm"
                                  : "bg-muted text-foreground rounded-bl-sm"
                              }`}
                            >
                              {msg.message}
                            </div>
                            <span className="text-[10px] text-muted-foreground px-1">
                              {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Input */}
                <div className="border-t border-border/50 p-3">
                  <form onSubmit={handleSendMessage} className="flex gap-2">
                    <Input
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Send a message..."
                      className="h-9 bg-background/50 text-sm"
                      maxLength={1000}
                      data-testid="input-chat"
                    />
                    <Button
                      type="submit"
                      size="icon"
                      className="h-9 w-9 bg-primary hover:bg-primary/90 flex-shrink-0"
                      disabled={!chatInput.trim() || sendMessage.isPending}
                      data-testid="button-send-chat"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* History */}
          <div className="lg:col-span-1 space-y-4">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-muted-foreground" />
              <h2 className="text-xl font-semibold">History</h2>
            </div>
            <Card className="bg-card/40 border-border/50">
              <CardContent className="p-0">
                {finishedGames.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground text-sm">
                    No games played yet.
                  </div>
                ) : (
                  <div className="divide-y divide-border/50 max-h-[500px] overflow-y-auto">
                    {finishedGames.map((game) => (
                      <div
                        key={game.id}
                        className="p-4 hover:bg-muted/20 transition-colors"
                        data-testid={`card-game-history-${game.id}`}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-semibold text-sm capitalize">
                            {game.gameType.replace(/-/g, " ")}
                          </span>
                          <Link href={`/rooms/${id}/games/${game.id}/replay`}>
                            <Button variant="ghost" size="sm" className="h-6 text-xs text-primary p-0 px-1">
                              Replay
                            </Button>
                          </Link>
                        </div>
                        <div className="text-xs text-muted-foreground flex justify-between">
                          <span>
                            {game.isDraw ? (
                              "Draw"
                            ) : game.winnerUserId === user.id ? (
                              <span className="text-green-400 font-medium">You won</span>
                            ) : (
                              <span className="text-rose-400 font-medium">You lost</span>
                            )}
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
