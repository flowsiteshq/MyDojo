import { useState, useEffect, useRef } from "react";
import { RotateCcw, Trophy, Zap } from "lucide-react";

interface Props {
  onGameOver: (score: number) => void;
  onBack: () => void;
  highScore: number;
}

type GameState = "idle" | "countdown" | "waiting" | "flash" | "result" | "gameover";

const ROUNDS = 8;
const POSITIONS = [
  { x: 20, y: 25 }, { x: 50, y: 20 }, { x: 80, y: 25 },
  { x: 15, y: 55 }, { x: 50, y: 55 }, { x: 85, y: 55 },
  { x: 25, y: 80 }, { x: 75, y: 80 },
];

function getReactionScore(ms: number): number {
  if (ms < 150) return 100;
  if (ms < 200) return 90;
  if (ms < 250) return 80;
  if (ms < 300) return 70;
  if (ms < 400) return 55;
  if (ms < 500) return 40;
  if (ms < 700) return 25;
  return 10;
}

function getRating(ms: number): { label: string; color: string } {
  if (ms < 150) return { label: "LIGHTNING! ⚡", color: "#fbbf24" };
  if (ms < 200) return { label: "INCREDIBLE! 🔥", color: "#f97316" };
  if (ms < 250) return { label: "GREAT! 💥", color: "#22c55e" };
  if (ms < 350) return { label: "GOOD! 👊", color: "#3b82f6" };
  if (ms < 500) return { label: "OK 😐", color: "#94a3b8" };
  return { label: "TOO SLOW 🐢", color: "#ef4444" };
}

export default function GameReactionStrike({ onGameOver, onBack, highScore }: Props) {
  const [gameState, setGameState] = useState<GameState>("idle");
  const [countdown, setCountdown] = useState(3);
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [flashPos, setFlashPos] = useState<{ x: number; y: number } | null>(null);
  const [flashStart, setFlashStart] = useState(0);
  const [lastReaction, setLastReaction] = useState<{ ms: number; pts: number } | null>(null);
  const [reactionTimes, setReactionTimes] = useState<number[]>([]);
  const [tooEarly, setTooEarly] = useState(false);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const waitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Countdown
  useEffect(() => {
    if (gameState !== "countdown") return;
    if (countdown === 0) { setTimeout(() => startRound(), 500); return; }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [gameState, countdown]);

  const startRound = () => {
    setTooEarly(false);
    setLastReaction(null);
    setFlashPos(null);
    setGameState("waiting");
    const delay = 1500 + Math.random() * 2500;
    waitTimer.current = setTimeout(() => {
      const pos = POSITIONS[Math.floor(Math.random() * POSITIONS.length)];
      setFlashPos(pos);
      setFlashStart(Date.now());
      setGameState("flash");
      // Auto-miss after 1.5s
      flashTimer.current = setTimeout(() => {
        handleMiss();
      }, 1500);
    }, delay);
  };

  const handleMiss = () => {
    if (flashTimer.current) clearTimeout(flashTimer.current);
    setLastReaction({ ms: 9999, pts: 0 });
    setGameState("result");
    setTimeout(() => nextRound(), 1200);
  };

  const handleTap = () => {
    if (gameState === "waiting") {
      if (waitTimer.current) clearTimeout(waitTimer.current);
      setTooEarly(true);
      setGameState("result");
      setTimeout(() => { setTooEarly(false); startRound(); }, 1200);
      return;
    }
    if (gameState !== "flash") return;
    if (flashTimer.current) clearTimeout(flashTimer.current);
    const ms = Date.now() - flashStart;
    const pts = getReactionScore(ms);
    setScore(s => s + pts);
    setLastReaction({ ms, pts });
    setReactionTimes(prev => [...prev, ms]);
    setFlashPos(null);
    setGameState("result");
    setTimeout(() => nextRound(), 1200);
  };

  const nextRound = () => {
    const nextRoundNum = round + 1;
    setRound(nextRoundNum);
    if (nextRoundNum >= ROUNDS) {
      setGameState("gameover");
      onGameOver(score + (lastReaction?.pts ?? 0));
    } else {
      startRound();
    }
  };

  const startGame = () => {
    setScore(0);
    setRound(0);
    setReactionTimes([]);
    setFlashPos(null);
    setLastReaction(null);
    setTooEarly(false);
    setCountdown(3);
    setGameState("countdown");
  };

  const avgReaction = reactionTimes.length > 0
    ? Math.round(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length)
    : 0;

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden select-none"
      style={{ background: "radial-gradient(ellipse at center, #000a1a 0%, #000510 100%)" }}
      onPointerDown={handleTap}>
      {/* Header */}
      <div className="relative z-20 flex items-center justify-between px-6 pt-4 pb-2" style={{ pointerEvents: "none" }}>
        <button onClick={e => { e.stopPropagation(); onBack(); }}
          className="text-white/50 hover:text-white text-sm uppercase tracking-wider transition-colors"
          style={{ pointerEvents: "all" }}>
          ← Back
        </button>
        <div className="text-center">
          <div className="text-white font-black text-2xl">{score}</div>
          <div className="text-white/40 text-xs uppercase tracking-widest">Score</div>
        </div>
        <div className="text-right">
          <div className="text-white font-black text-2xl">{round}/{ROUNDS}</div>
          <div className="text-white/40 text-xs uppercase tracking-widest">Round</div>
        </div>
      </div>

      {/* Round progress */}
      <div className="relative z-20 mx-6 flex gap-1" style={{ pointerEvents: "none" }}>
        {Array.from({ length: ROUNDS }).map((_, i) => (
          <div key={i} className="flex-1 h-1.5 rounded-full transition-all duration-300"
            style={{ background: i < round ? "#3b82f6" : "rgba(255,255,255,0.1)" }} />
        ))}
      </div>

      {/* Game area */}
      <div className="relative flex-1 z-10">
        {/* Idle */}
        {gameState === "idle" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-6" style={{ pointerEvents: "none" }}>
            <div className="text-center">
              <div className="text-8xl mb-4">⚡</div>
              <h2 className="text-white font-black text-4xl uppercase tracking-wider mb-2">Reaction Strike</h2>
              <p className="text-white/60 text-lg">Tap the flash as fast as you can!</p>
              <p className="text-white/40 text-sm mt-1">{ROUNDS} rounds — don't tap too early!</p>
            </div>
            {highScore > 0 && (
              <div className="flex items-center gap-2 text-yellow-400">
                <Trophy className="w-5 h-5" />
                <span className="font-bold">Best: {highScore}</span>
              </div>
            )}
            <button onClick={e => { e.stopPropagation(); startGame(); }}
              className="px-10 py-4 rounded-2xl font-black text-white text-xl uppercase tracking-wider transition-all active:scale-95"
              style={{ background: "linear-gradient(135deg, #1d4ed8, #3b82f6)", boxShadow: "0 0 30px rgba(59,130,246,0.5)", pointerEvents: "all" }}>
              Play Now
            </button>
          </div>
        )}

        {/* Countdown */}
        {gameState === "countdown" && (
          <div className="absolute inset-0 flex items-center justify-center" style={{ pointerEvents: "none" }}>
            <div className="font-black text-9xl text-white"
              style={{ textShadow: "0 0 60px rgba(59,130,246,0.8)" }}>
              {countdown > 0 ? countdown : "GO!"}
            </div>
          </div>
        )}

        {/* Waiting */}
        {gameState === "waiting" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4" style={{ pointerEvents: "none" }}>
            <div className="w-24 h-24 rounded-full flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.05)", border: "2px solid rgba(255,255,255,0.1)" }}>
              <Zap className="w-12 h-12 text-white/20" />
            </div>
            <p className="text-white/40 text-lg uppercase tracking-widest">Wait for it...</p>
          </div>
        )}

        {/* Flash target */}
        {gameState === "flash" && flashPos && (
          <div className="absolute inset-0" style={{ pointerEvents: "none" }}>
            <div className="absolute flex items-center justify-center"
              style={{
                left: `${flashPos.x}%`, top: `${flashPos.y}%`,
                transform: "translate(-50%, -50%)",
                width: 120, height: 120,
                borderRadius: "50%",
                background: "radial-gradient(circle, rgba(59,130,246,0.6) 0%, rgba(29,78,216,0.3) 60%, transparent 100%)",
                border: "3px solid rgba(59,130,246,0.9)",
                boxShadow: "0 0 40px rgba(59,130,246,0.8), 0 0 80px rgba(59,130,246,0.4)",
                animation: "flashPulse 0.3s ease-out",
              }}>
              <Zap className="w-14 h-14 text-blue-300" />
            </div>
          </div>
        )}

        {/* Result overlay */}
        {gameState === "result" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3" style={{ pointerEvents: "none" }}>
            {tooEarly ? (
              <>
                <div className="text-5xl">😬</div>
                <p className="text-red-400 font-black text-2xl uppercase">Too Early!</p>
                <p className="text-white/40 text-sm">Wait for the flash</p>
              </>
            ) : lastReaction && lastReaction.ms < 9000 ? (
              <>
                <p className="font-black text-3xl" style={{ color: getRating(lastReaction.ms).color }}>
                  {getRating(lastReaction.ms).label}
                </p>
                <p className="text-white font-bold text-xl">{lastReaction.ms}ms</p>
                <p className="text-yellow-400 font-bold">+{lastReaction.pts} pts</p>
              </>
            ) : (
              <>
                <div className="text-5xl">💨</div>
                <p className="text-white/60 font-black text-2xl uppercase">Missed!</p>
              </>
            )}
          </div>
        )}

        {/* Game Over */}
        {gameState === "gameover" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-6" style={{ pointerEvents: "none" }}>
            <div className="text-center">
              <p className="text-white/60 text-sm uppercase tracking-widest mb-1">Game Over</p>
              <p className="text-white font-black text-6xl">{score}</p>
              <p className="text-white/40 text-sm mt-1">points</p>
              {avgReaction > 0 && (
                <p className="text-blue-400 text-sm mt-2">Avg reaction: {avgReaction}ms</p>
              )}
              {score >= highScore && score > 0 && (
                <p className="text-yellow-400 font-black text-lg mt-2 animate-pulse">🏆 NEW HIGH SCORE!</p>
              )}
            </div>
            <div className="flex gap-4" style={{ pointerEvents: "all" }}>
              <button onClick={e => { e.stopPropagation(); startGame(); }}
                className="flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-white uppercase tracking-wider transition-all active:scale-95"
                style={{ background: "linear-gradient(135deg, #1d4ed8, #3b82f6)" }}>
                <RotateCcw className="w-4 h-4" /> Play Again
              </button>
              <button onClick={e => { e.stopPropagation(); onBack(); }}
                className="px-8 py-3 rounded-xl font-bold text-white/70 uppercase tracking-wider transition-all active:scale-95"
                style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)" }}>
                Games
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes flashPulse {
          0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
          100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
