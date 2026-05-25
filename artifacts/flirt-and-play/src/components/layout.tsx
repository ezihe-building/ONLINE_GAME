import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useLogout } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, refetch } = useAuth();
  const logout = useLogout();
  const [, setLocation] = useLocation();

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => {
        refetch();
        setLocation("/");
      },
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/30">
      <header className="border-b border-border/50 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href={user ? "/lobby" : "/"} className="font-bold text-xl tracking-tight bg-gradient-to-br from-primary to-accent bg-clip-text text-transparent">
            Flirt & Play
          </Link>
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <span className="text-sm font-medium text-muted-foreground hidden sm:inline-block">
                  Playing as <strong className="text-foreground">{user.username}</strong>
                </span>
                <Button variant="ghost" size="sm" onClick={handleLogout} className="hover:bg-primary/10 hover:text-primary transition-colors">
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                  Login
                </Link>
                <Link href="/register" className="text-sm font-medium bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20">
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </header>
      <main className="flex-1 flex flex-col relative">
        {children}
      </main>
    </div>
  );
}
