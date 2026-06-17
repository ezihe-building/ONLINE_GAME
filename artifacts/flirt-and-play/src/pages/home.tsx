import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col relative overflow-hidden">
      {/* Abstract background blobs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-[120px] mix-blend-screen" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-secondary/20 rounded-full blur-[120px] mix-blend-screen" />
      </div>

      <header className="px-6 py-6 flex justify-between items-center relative z-10 border-b border-border/40 bg-background/50 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white font-bold font-display">F</div>
          <span className="font-display font-bold text-xl tracking-tight">Flirt & Play</span>
        </div>
        <div className="flex gap-4">
          <Link href="/login">
            <Button variant="ghost" className="text-muted-foreground hover:text-foreground">Log in</Button>
          </Link>
          <Link href="/register">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 font-medium">Get started</Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 relative z-10 py-20">
        <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-black tracking-tight max-w-4xl mx-auto leading-[1.1] mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">
          Intimate games for <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">close friends</span>.
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
          A private parlor for late-night energy. Play classic games with a daring twist. Loser owes a flirt.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link href="/register">
            <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 text-lg px-8 h-14 rounded-full font-medium shadow-[0_0_40px_-10px_rgba(236,72,153,0.5)] transition-all hover:shadow-[0_0_60px_-10px_rgba(236,72,153,0.6)] hover:scale-105">
              Create your parlor
            </Button>
          </Link>
        </div>
      </main>

      <footer className="py-8 text-center text-sm text-muted-foreground border-t border-border/40 bg-background/50 backdrop-blur-md relative z-10">
        <p>&copy; {new Date().getFullYear()} Flirt & Play. For mature audiences.</p>
      </footer>
    </div>
  );
}