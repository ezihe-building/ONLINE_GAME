import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";

export default function Home() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (user) {
      setLocation("/lobby");
    }
  }, [user, setLocation]);

  if (isLoading) {
    return <Layout><div className="flex-1 flex items-center justify-center">Loading...</div></Layout>;
  }

  return (
    <Layout>
      <div className="flex-1 flex flex-col items-center justify-center text-center px-4 relative overflow-hidden">
        {/* Decorative background blobs */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/20 rounded-full blur-[120px] pointer-events-none opacity-50"></div>
        <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-accent/20 rounded-full blur-[100px] pointer-events-none opacity-40"></div>
        
        <div className="relative z-10 max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <div className="space-y-4">
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter leading-tight bg-gradient-to-br from-white to-white/60 bg-clip-text text-transparent drop-shadow-sm">
              Play games. <br />
              <span className="text-primary bg-none drop-shadow-[0_0_15px_rgba(236,72,153,0.5)]">Send a dare.</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground font-medium max-w-xl mx-auto leading-relaxed">
              A playful late-night competitive platform where the loser owes the winner a message.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link href="/register" className="w-full sm:w-auto">
              <Button size="lg" className="w-full h-14 text-lg px-8 rounded-full shadow-[0_0_40px_-10px_rgba(236,72,153,0.8)] hover:shadow-[0_0_60px_-10px_rgba(236,72,153,1)] transition-all bg-primary hover:bg-primary/90 text-primary-foreground">
                Start Playing
              </Button>
            </Link>
            <Link href="/login" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full h-14 text-lg px-8 rounded-full border-border/50 bg-background/50 backdrop-blur hover:bg-white/5 transition-all">
                I have an account
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}
