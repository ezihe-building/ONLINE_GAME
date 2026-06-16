import { useState } from "react";
import { GameSession } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// ── 300+ Truth Questions by category ───────────────────────────────────────
const QUESTIONS_BY_CATEGORY: Record<string, string[]> = {
  funny: [
    "What's the most embarrassing thing you've done for someone you liked?",
    "What's your most ridiculous hidden talent?",
    "Have you ever sent a text to the wrong person and regretted it instantly?",
    "What's the weirdest thing you've ever eaten?",
    "Have you ever faked being sick to get out of something?",
    "What's your most embarrassing nickname?",
    "Have you ever walked into a glass door?",
    "What's the most embarrassing thing you've worn in public?",
    "Have you ever laughed so hard you peed a little?",
    "What's the silliest thing you've ever cried about?",
    "Have you ever waved back at someone who wasn't waving at you?",
    "What's the most embarrassing thing your parents have done in front of your friends?",
    "Have you ever called someone by the wrong name on a date?",
    "What's the most awkward thing you've said in a meeting?",
    "Have you ever been caught picking your nose?",
    "What's the most embarrassing thing you've done at a party?",
    "Have you ever tried to impress someone and failed spectacularly?",
    "What's the most ridiculous lie you've ever told?",
    "Have you ever been caught singing in the shower?",
    "What's the most embarrassing thing you've searched on Google?",
    "Have you ever accidentally liked an old photo while stalking someone?",
    "What's the most awkward date you've ever been on?",
    "Have you ever pretended to understand something and had no clue?",
    "What's the most embarrassing thing you've done while drunk?",
    "Have you ever been caught talking to yourself?",
  ],
  romantic: [
    "What's your biggest romantic red flag?",
    "What's the cheesiest pick-up line you've ever used or received?",
    "What's something you've never told anyone you find attractive?",
    "What would your ideal first date look like?",
    "Have you ever been in love? How many times?",
    "What's your most romantic fantasy?",
    "What's the most romantic thing someone has done for you?",
    "What's your biggest turn-on?",
    "What's the most flirty thing you've ever done?",
    "Have you ever written a love letter?",
    "What's your idea of a perfect date night?",
    "What's the most romantic song you secretly love?",
    "Have you ever had a crush on a friend's partner?",
    "What's the most romantic gift you've ever received?",
    "What's your love language?",
    "Have you ever been on a blind date?",
    "What's the most romantic place you've ever been?",
    "Have you ever been in love with someone who didn't love you back?",
    "What's your idea of the perfect partner?",
    "What's the most romantic thing you've ever done?",
    "Have you ever cried over a breakup?",
    "What's the most romantic movie you've ever watched?",
    "Have you ever been in a long-distance relationship?",
    "What's the most romantic surprise you've ever planned?",
    "What's your ultimate romantic dream?",
  ],
  deep: [
    "What's something you've never told anyone about yourself?",
    "What's your biggest fear?",
    "What's the hardest thing you've ever had to do?",
    "What's your biggest regret?",
    "What's something you wish you could change about your past?",
    "What's the most important lesson you've learned in life?",
    "What's something you're deeply proud of?",
    "What's your biggest insecurity?",
    "What's the most painful thing you've ever experienced?",
    "What's something you believe in that others might think is strange?",
    "What's the most meaningful thing someone has ever said to you?",
    "What's something you want to accomplish before you die?",
    "What's the most difficult decision you've ever had to make?",
    "What's something you wish people knew about you?",
    "What's your biggest dream?",
    "What's the most vulnerable thing you've ever done?",
    "What's something you're still working on improving about yourself?",
    "What's the most courageous thing you've ever done?",
    "What's a secret you thought you'd take to the grave?",
    "What's the most impactful experience of your life?",
    "What's your definition of happiness?",
    "What's something you've been through that made you stronger?",
    "What's the most valuable thing you've lost?",
    "What's your deepest desire?",
    "What's the most meaningful relationship in your life?",
  ],
  embarrassing: [
    "What's your most embarrassing childhood memory?",
    "What's the most embarrassing thing you've done at school?",
    "Have you ever been caught in a lie?",
    "What's the most embarrassing thing your parents know about you?",
    "What's the most embarrassing thing you've posted online?",
    "Have you ever been caught doing something you shouldn't have?",
    "What's the most embarrassing thing you've done in front of your crush?",
    "Have you ever had an embarrassing wardrobe malfunction?",
    "What's the most embarrassing thing you've said to your boss?",
    "Have you ever been embarrassed by your family in public?",
    "What's the most embarrassing thing you've done on a video call?",
    "Have you ever been caught in a compromising situation?",
    "What's the most embarrassing thing you've done while nervous?",
    "Have you ever accidentally revealed a secret?",
    "What's the most embarrassing thing you've done on a date?",
    "Have you ever been embarrassed by a pet?",
    "What's the most embarrassing thing you've done in a bathroom?",
    "Have you ever been embarrassed by your laugh?",
    "What's the most embarrassing thing you've done while trying to be cool?",
    "Have you ever been embarrassed by your dance moves?",
    "What's the most embarrassing thing you've done at a family gathering?",
    "Have you ever been embarrassed by your voice?",
    "What's the most embarrassing thing you've done while shopping?",
    "Have you ever been embarrassed by your cooking?",
    "What's the most embarrassing thing you've done while exercising?",
  ],
  friendship: [
    "What's the most annoying thing your best friend does?",
    "Have you ever been jealous of a friend?",
    "What's a secret you've kept from your best friend?",
    "Have you ever lied to a friend to avoid hanging out?",
    "What's the most hurtful thing a friend has said to you?",
    "Have you ever stolen something from a friend?",
    "What's the most embarrassing thing you've done with your friends?",
    "Have you ever had a crush on a friend's sibling?",
    "What's the most annoying habit of your friends?",
    "Have you ever betrayed a friend's trust?",
    "What's the most ridiculous thing you've done with your friends?",
    "Have you ever been ghosted by a friend?",
    "What's the most embarrassing thing your friends know about you?",
    "Have you ever ditched a friend for someone else?",
    "What's the most trouble you've gotten into with your friends?",
    "Have you ever had a falling out with a best friend?",
    "What's the most annoying thing your friends do in group chats?",
    "Have you ever been the third wheel?",
    "What's the most embarrassing thing you've done at a friend's house?",
    "Have you ever been secretly glad when plans got canceled?",
    "What's the most annoying thing about your friend group?",
    "Have you ever pretended to like a friend's partner?",
    "What's the most embarrassing thing you've done while trying to fit in?",
    "Have you ever had a friend who was a bad influence?",
    "What's the most ridiculous thing you've done to impress your friends?",
  ],
  crush: [
    "What's the most embarrassing thing you've done around your crush?",
    "Have you ever stalked your crush on social media?",
    "What's the most obvious thing you've done to get your crush's attention?",
    "Have you ever sent a text to your crush and instantly regretted it?",
    "What's the most awkward thing you've said to your crush?",
    "Have you ever pretended to like something just because your crush likes it?",
    "What's the most embarrassing thing you've done to impress your crush?",
    "Have you ever had a crush on someone who was dating your friend?",
    "What's the most embarrassing thing your crush has seen you do?",
    "Have you ever been rejected by a crush?",
    "What's the most embarrassing thing you've done to get noticed?",
    "Have you ever written something about your crush and had them find it?",
    "What's the most awkward thing you've done when you saw your crush?",
    "Have you ever pretended to be someone else to impress your crush?",
    "What's the most embarrassing thing you've done while trying to flirt?",
    "Have you ever had a crush on a teacher?",
    "What's the most embarrassing thing you've done in front of your crush's friends?",
    "Have you ever been caught staring at your crush?",
    "What's the most embarrassing thing you've done after your crush rejected you?",
    "Have you ever had a crush on two people at the same time?",
    "What's the most embarrassing thing you've done to make your crush jealous?",
    "Have you ever had a crush on someone you shouldn't have?",
    "What's the most embarrassing thing you've done while trying to be mysterious?",
    "Have you ever had a crush on someone you met online?",
    "What's the most embarrassing thing you've done to get your crush's number?",
  ],
  "late-night": [
    "What's the most dangerous thing you've done at night?",
    "Have you ever had a late-night conversation that changed your life?",
    "What's the most reckless thing you've done after midnight?",
    "Have you ever had a late-night encounter that was terrifying?",
    "What's the most vulnerable thing you've shared late at night?",
    "Have you ever had a late-night confession?",
    "What's the most embarrassing thing you've done while sleep-deprived?",
    "Have you ever had a late-night conversation you regretted?",
    "What's the most intimate thing you've shared late at night?",
    "Have you ever had a late-night conversation that made you cry?",
    "What's the most honest thing you've said late at night?",
    "Have you ever had a late-night thought that scared you?",
    "What's the most embarrassing thing you've done while sleepwalking?",
    "Have you ever had a late-night conversation that made you fall for someone?",
    "What's the most dangerous place you've been at night?",
    "Have you ever had a late-night realization that changed everything?",
    "What's the most embarrassing thing you've done while drunk at night?",
    "Have you ever had a late-night conversation that made you laugh until you cried?",
    "What's the most vulnerable thing you've felt at 3 AM?",
    "Have you ever had a late-night conversation that made you question everything?",
    "What's the most embarrassing thing you've done while watching someone sleep?",
    "Have you ever had a late-night conversation that made you feel truly seen?",
    "What's the most dangerous thing you've said late at night?",
    "Have you ever had a late-night conversation that made you want to disappear?",
    "What's the most honest thing you've admitted to yourself at night?",
  ],
  personal: [
    "What's something about yourself that you're deeply insecure about?",
    "What's the most personal thing you've ever shared with someone?",
    "What's a secret that you keep even from your closest friends?",
    "What's the most personal thing you've ever written?",
    "What's something you wish your parents understood about you?",
    "What's the most personal thing you've ever Googled?",
    "What's a part of yourself that you don't show to anyone?",
    "What's the most personal thing you've ever said in a fight?",
    "What's something you wish you could tell your younger self?",
    "What's the most personal thing you've ever done to cope?",
    "What's a secret that you thought would ruin you if it got out?",
    "What's the most personal thing you've ever said to a stranger?",
    "What's something you wish your partner knew about you?",
    "What's the most personal thing you've ever shared on social media?",
    "What's a part of your past that you wish you could erase?",
    "What's the most personal thing you've ever done out of desperation?",
    "What's something you wish you could tell your future self?",
    "What's the most personal thing you've ever said in a letter?",
    "What's a secret that you keep even from your therapist?",
    "What's the most personal thing you've ever done to protect someone?",
    "What's something you wish you could tell your best friend?",
    "What's the most personal thing you've ever done to heal?",
    "What's a part of yourself that you're still learning to accept?",
    "What's the most personal thing you've ever said to yourself?",
    "What's something you wish you could tell the world?",
  ],
  "spicy-respectful": [
    "What's your most unusual turn-on?",
    "What's the most adventurous thing you've done in a relationship?",
    "What's your most seductive move?",
    "What's the most daring thing you've done on a date?",
    "What's your most secret fantasy?",
    "What's the most flirtatious thing you've ever said?",
    "What's your most irresistible quality?",
    "What's the most daring thing you've done to get someone's attention?",
    "What's your most captivating physical feature?",
    "What's the most seductive thing you've ever worn?",
    "What's your most daring romantic gesture?",
    "What's the most flirtatious thing you've ever done in public?",
    "What's your most irresistible scent?",
    "What's the most daring thing you've done to express your feelings?",
    "What's your most captivating smile?",
    "What's the most seductive thing you've ever said without words?",
    "What's your most daring compliment?",
    "What's the most flirtatious thing you've ever done while dancing?",
    "What's your most irresistible laugh?",
    "What's the most daring thing you've done to make someone blush?",
    "What's your most captivating eye contact?",
    "What's the most seductive thing you've ever done with your voice?",
    "What's your most daring romantic confession?",
    "What's the most flirtatious thing you've ever done while texting?",
    "What's your most irresistible touch?",
  ],
};

// Flatten all questions into one array for random selection
const ALL_QUESTIONS = Object.values(QUESTIONS_BY_CATEGORY).flat();

function getRandomQuestions(count: number): string[] {
  const shuffled = [...ALL_QUESTIONS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

interface TruthSpinnerProps {
  game: GameSession;
  onMove: (move: any) => void;
  isMyTurn: boolean;
  isSpectator: boolean;
  profileId: number;
}

export default function TruthSpinner({ game, onMove, isMyTurn, isSpectator, profileId }: TruthSpinnerProps) {
  const [answerInput, setAnswerInput] = useState("");
  const [spinning, setSpinning] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const boardState = game.boardState as {
    questions: string[];
    currentQuestionIndex: number;
    scores: { X: number; O: number };
    answers: { userId: number; question: string; answer: string; points: number }[];
    category?: string;
  } | undefined;

  const currentQIndex = boardState?.currentQuestionIndex || 0;
  const questions = boardState?.questions || [];
  const currentQuestion = questions[currentQIndex];

  const hasSpun = !!currentQuestion;

  const handleSpin = () => {
    if (!isMyTurn || isSpectator) return;
    setSpinning(true);
    // Choose a random category
    const categories = Object.keys(QUESTIONS_BY_CATEGORY);
    const randomCategory = categories[Math.floor(Math.random() * categories.length)];
    setSelectedCategory(randomCategory);
    setTimeout(() => {
      onMove({ action: "spin", category: randomCategory });
      setSpinning(false);
    }, 1500);
  };

  const handleAnswerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isMyTurn || isSpectator || !answerInput.trim()) return;
    onMove({ action: "answer", answer: answerInput.trim() });
    setAnswerInput("");
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-8">
      {/* Scores */}
      <div className="flex justify-between items-center bg-card/40 backdrop-blur p-4 rounded-xl border border-border/50">
        <div className="text-center">
          <div className="text-xs text-muted-foreground uppercase font-bold">P1 Score</div>
          <div className="text-2xl font-black text-primary">{boardState?.scores.X || 0}</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-muted-foreground uppercase font-bold">P2 Score</div>
          <div className="text-2xl font-black text-accent">{boardState?.scores.O || 0}</div>
        </div>
      </div>

      {/* Category badge */}
      {selectedCategory && hasSpun && (
        <div className="text-center">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-primary/20 text-primary border border-primary/30">
            {selectedCategory}
          </span>
        </div>
      )}

      <div className="bg-card/40 backdrop-blur border border-border/50 rounded-3xl p-8 flex flex-col items-center justify-center min-h-[300px] text-center shadow-2xl relative overflow-hidden">
        {spinning && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
            <div className="w-32 h-32 rounded-full border-4 border-t-primary border-r-accent border-b-primary border-l-accent animate-spin" />
          </div>
        )}

        {!hasSpun ? (
          <div className="space-y-6">
            <div className="w-48 h-48 rounded-full border-8 border-primary/20 flex items-center justify-center mx-auto shadow-[0_0_50px_rgba(236,72,153,0.2)]">
              <Button
                size="lg"
                className="w-32 h-32 rounded-full text-2xl font-black bg-primary hover:bg-primary/90 text-white shadow-lg transition-transform active:scale-95"
                onClick={handleSpin}
                disabled={!isMyTurn || isSpectator}
              >
                SPIN
              </Button>
            </div>
            {!isMyTurn && <p className="text-muted-foreground font-medium animate-pulse">Waiting for opponent to spin...</p>}
          </div>
        ) : (
          <div className="space-y-6 w-full animate-in fade-in zoom-in duration-500">
            <h3 className="text-2xl font-bold leading-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {currentQuestion}
            </h3>

            {isMyTurn && !isSpectator ? (
              <form onSubmit={handleAnswerSubmit} className="space-y-4">
                <Input
                  value={answerInput}
                  onChange={(e) => setAnswerInput(e.target.value)}
                  placeholder="Type your honest truth..."
                  className="h-12 bg-background/50 border-primary/30 focus-visible:ring-primary"
                  autoFocus
                />
                <Button type="submit" className="w-full h-12 text-lg" disabled={!answerInput.trim()}>
                  Submit Truth
                </Button>
              </form>
            ) : (
              <div className="p-6 bg-background/30 rounded-xl border border-border/50 border-dashed">
                <p className="text-muted-foreground">Opponent is typing their answer...</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Recent Answers */}
      {boardState?.answers && boardState.answers.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Previous Truths</h4>
          <div className="space-y-2">
            {boardState.answers.slice(-3).reverse().map((ans, i) => (
              <div key={i} className="bg-card/30 p-3 rounded-lg border border-border/30 text-sm flex flex-col gap-1">
                <span className="text-xs text-muted-foreground italic">&quot;{ans.question}&quot;</span>
                <div className="flex justify-between items-end">
                  <span className="font-medium text-foreground">{ans.answer}</span>
                  <span className="text-xs font-bold text-green-500">+{ans.points}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
