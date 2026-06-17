import { Switch, Route, useLocation, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Lobby from "@/pages/lobby";
import RoomNew from "@/pages/room-new";
import RoomJoin from "@/pages/room-join";
import Room from "@/pages/room";
import Profile from "@/pages/profile";
import Game from "@/pages/game";
import Replay from "@/pages/replay";
import Login from "@/pages/login";
import Register from "@/pages/register";

const queryClient = new QueryClient();
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function HomeRedirect() {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (user) return <Redirect to="/lobby" />;
  return <Home />;
}

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (!user) return <Redirect to="/login" />;
  return <Component />;
}

function AppRoutes() {
  return (
    <Switch>
      <Route path="/" component={HomeRedirect} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/lobby"><ProtectedRoute component={Lobby} /></Route>
      <Route path="/profile"><ProtectedRoute component={Profile} /></Route>
      <Route path="/rooms/new"><ProtectedRoute component={RoomNew} /></Route>
      <Route path="/rooms/join"><ProtectedRoute component={RoomJoin} /></Route>
      <Route path="/rooms/:roomId"><ProtectedRoute component={Room} /></Route>
      <Route path="/rooms/:roomId/games/:gameId"><ProtectedRoute component={Game} /></Route>
      <Route path="/rooms/:roomId/games/:gameId/replay"><ProtectedRoute component={Replay} /></Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <AppRoutes />
            <Toaster />
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </WouterRouter>
  );
}

export default App;
