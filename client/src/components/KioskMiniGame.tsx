import { useState, useEffect, useRef, useCallback } from "react";
import { Trophy, Zap, Target, RotateCcw } from "lucide-react";

type GameState = "idle" | "countdown" | "playing" | "gameover";

interface GameTarget {
  id: number;
  x: number; // percent
  y: number; // percent
  size: number; // px
  emoji: string;
  points: number;
  born: number; // timestamp
  lifespan: number; // ms before it disappears
}

const TARGET_EMOJIS = ["🥋", "🥊", "⭐", "🎯", "🔥", "🏆", "💥", "🌟"];
const GAME_DURATION = 20; // seconds

function randomBetween(a: number, b: number) {
  return a + Math.random() * (b - a);
}

function spawnTarget(id: number): GameTarget {
  const size = Math.random() < 0.2 ? 56 : Math.random() < 0.5 ? 72 : 88;
  const points = size <= 56 ? 30 : size <= 72 ? 20 : 10;
  const lifespan = size <= 56 ? 1200 : size <= 72 ? 1600 : 2200;
  return {
    id,
    x: randomBetween(5, 85),
    y: randomBetween(5, 85),
    size,
    emoji: TARGET_EMOJIS[Math.floor(Math.random() * TARGET_EMOJIS.length)],
    points,
    born: Date.now(),
    lifespan,
  };
}

interface PopEffect {
  id: number;
  x: number;
  y: number;
  points: number;
}

export function KioskMiniGame() {
  const [gameState, setGameState] = useState<GameState>("idle");
  const [countdown, setCountdown] = useState(3);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [score, setScore] = useState(0);
  const [targets, setTargets] = useState<GameTarget[]>([]);
  const [pops, setPops] = useState<PopEffect[]>([]);
  const [highScore, setHighScore] = useState(() => {
    try { return parseInt(localStorage.getItem("kioskHighScore") || "0"); } catch { return 0; }
  });
  const [combo, setCombo] = useState(0);
  const [lastTapTime, setLastTapTime] = useState(0);

  const nextIdRef = useRef(1);
  const spawnIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const cleanupIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const gameTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  // ── Cleanup on unmount ─────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (spawnIntervalRef.current) clearInterval(spawnIntervalRef.current);
      if (cleanupIntervalRef.current) clearInterval(cleanupIntervalRef.current);
      if (gameTimerRef.current) clearInterval(gameTimerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  // ── Start countdown ────────────────────────────────────────────────────────
  const startGame = useCallback(() => {
    setGameState("countdown");
    setCountdown(3);
    let c = 3;
    countdownRef.current = setInterval(() => {
      c--;
      setCountdown(c);
      if (c <= 0) {
        clearInterval(countdownRef.current!);
        countdownRef.current = null;
        beginPlay();
      }
    }, 1000);
  }, []); // eslint-disable-line

  const beginPlay = useCallback(() => {
    setGameState("playing");
    setScore(0);
    setCombo(0);
    setTargets([]);
    setPops([]);
    setTimeLeft(GAME_DURATION);

    // Spawn targets
    spawnIntervalRef.current = setInterval(() => {
      setTargets((prev) => {
        const id = nextIdRef.current++;
        return [...prev, spawnTarget(id)];
      });
    }, 700);

    // Clean up expired targets
    cleanupIntervalRef.current = setInterval(() => {
      const now = Date.now();
      setTargets((prev) => prev.filter((t) => now - t.born < t.lifespan));
    }, 100);

    // Game countdown
    let t = GAME_DURATION;
    gameTimerRef.current = setInterval(() => {
      t--;
      setTimeLeft(t);
      if (t <= 0) {
        clearInterval(gameTimerRef.current!);
        clearInterval(spawnIntervalRef.current!);
        clearInterval(cleanupIntervalRef.current!);
        gameTimerRef.current = null;
        spawnIntervalRef.current = null;
        cleanupIntervalRef.current = null;
        setTargets([]);
        setGameState("gameover");
      }
    }, 1000);
  }, []);

  // ── Tap a target ───────────────────────────────────────────────────────────
  const handleTap = useCallback((target: GameTarget, e: React.PointerEvent) => {
    e.stopPropagation();
    const now = Date.now();
    const isCombo = now - lastTapTime < 600;
    const newCombo = isCombo ? combo + 1 : 1;
    setCombo(newCombo);
    setLastTapTime(now);

    const multiplier = newCombo >= 5 ? 3 : newCombo >= 3 ? 2 : 1;
    const earned = target.points * multiplier;

    setScore((s) => {
      const next = s + earned;
      setHighScore((h) => {
        if (next > h) {
          try { localStorage.setItem("kioskHighScore", String(next)); } catch {}
          return next;
        }
        return h;
      });
      return next;
    });

    // Pop effect at tap position
    const rect = (e.currentTarget as HTMLElement).closest(".game-area")!.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * 100;
    const py = ((e.clientY - rect.top) / rect.height) * 100;
    const popId = nextIdRef.current++;
    setPops((prev) => [...prev, { id: popId, x: px, y: py, points: earned }]);
    setTimeout(() => setPops((prev) => prev.filter((p) => p.id !== popId)), 700);

    // Remove tapped target
    setTargets((prev) => prev.filter((t) => t.id !== target.id));
  }, [combo, lastTapTime]);

  const resetGame = () => {
    setGameState("idle");
    setScore(0);
    setCombo(0);
    setTargets([]);
    setPops([]);
    setTimeLeft(GAME_DURATION);
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div
      className="relative w-full rounded-3xl overflow-hidden select-none"
      style={{
        background: "linear-gradient(135deg, #0a0a0a 0%, #1a0000 50%, #0a0a0a 100%)",
        border: "2px solid rgba(225,6,0,0.5)",
        boxShadow: "0 0 40px rgba(225,6,0,0.3), inset 0 0 30px rgba(225,6,0,0.05)",
        minHeight: 320,
      }}
    >
      {/* Header bar */}
      <div className="flex items-center justify-between px-5 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-[#E10600]" />
          <span className="text-white font-black text-sm uppercase tracking-widest">Target Blitz</span>
        </div>
        <div className="flex items-center gap-4">
          {gameState === "playing" && (
            <>
              {combo >= 3 && (
                <span className="text-yellow-400 font-black text-sm animate-pulse">
                  {combo}x COMBO! 🔥
                </span>
              )}
              <div className="flex items-center gap-1 bg-white/10 rounded-full px-3 py-1">
                <Zap className="w-4 h-4 text-yellow-400" />
                <span className="text-white font-black text-sm">{score}</span>
              </div>
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center font-black text-lg"
                style={{
                  background: timeLeft <= 5
                    ? "linear-gradient(135deg,#E10600,#ff4500)"
                    : "rgba(255,255,255,0.1)",
                  color: timeLeft <= 5 ? "white" : "rgba(255,255,255,0.8)",
                  boxShadow: timeLeft <= 5 ? "0 0 20px rgba(225,6,0,0.8)" : "none",
                  animation: timeLeft <= 5 ? "pulse 0.5s infinite" : "none",
                }}
              >
                {timeLeft}
              </div>
            </>
          )}
          {gameState !== "playing" && (
            <div className="flex items-center gap-1 bg-white/10 rounded-full px-3 py-1">
              <Trophy className="w-4 h-4 text-yellow-400" />
              <span className="text-yellow-400 font-black text-sm">{highScore}</span>
            </div>
          )}
        </div>
      </div>

      {/* Game area */}
      <div
        className="game-area relative w-full"
        style={{ height: 240 }}
      >
        {/* ── IDLE STATE ── */}
        {gameState === "idle" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
            <div className="text-center">
              <p className="text-white/50 text-xs uppercase tracking-widest mb-1">While you wait</p>
              <p className="text-white font-black text-2xl">Tap the targets as fast as you can!</p>
              <p className="text-white/40 text-sm mt-1">Beat the high score: <span className="text-yellow-400 font-bold">{highScore}</span></p>
            </div>
            <button
              onClick={startGame}
              className="px-10 py-4 rounded-2xl font-black text-xl text-white uppercase tracking-wider transition-all active:scale-95"
              style={{
                background: "linear-gradient(135deg,#E10600,#ff4500)",
                boxShadow: "0 0 40px rgba(225,6,0,0.7)",
              }}
            >
              🥋 Play Now
            </button>
          </div>
        )}

        {/* ── COUNTDOWN ── */}
        {gameState === "countdown" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div
              className="w-28 h-28 rounded-full flex items-center justify-center font-black text-7xl text-white"
              style={{
                background: "radial-gradient(circle, rgba(225,6,0,0.4) 0%, transparent 70%)",
                boxShadow: "0 0 60px rgba(225,6,0,0.8)",
                animation: "ping 0.9s cubic-bezier(0,0,0.2,1) infinite",
              }}
            >
              {countdown > 0 ? countdown : "GO!"}
            </div>
          </div>
        )}

        {/* ── PLAYING ── */}
        {gameState === "playing" && (
          <>
            {targets.map((target) => {
              const age = Date.now() - target.born;
              const progress = Math.min(age / target.lifespan, 1);
              const opacity = progress > 0.75 ? 1 - (progress - 0.75) * 4 : 1;
              return (
                <button
                  key={target.id}
                  onPointerDown={(e) => handleTap(target, e)}
                  className="absolute flex items-center justify-center rounded-full transition-transform active:scale-75"
                  style={{
                    left: `${target.x}%`,
                    top: `${target.y}%`,
                    width: target.size,
                    height: target.size,
                    fontSize: target.size * 0.5,
                    opacity,
                    background: target.points >= 30
                      ? "radial-gradient(circle, rgba(255,215,0,0.3) 0%, rgba(255,140,0,0.15) 100%)"
                      : target.points >= 20
                      ? "radial-gradient(circle, rgba(225,6,0,0.3) 0%, rgba(180,0,0,0.15) 100%)"
                      : "radial-gradient(circle, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 100%)",
                    border: target.points >= 30
                      ? "2px solid rgba(255,215,0,0.8)"
                      : target.points >= 20
                      ? "2px solid rgba(225,6,0,0.8)"
                      : "2px solid rgba(255,255,255,0.3)",
                    boxShadow: target.points >= 30
                      ? "0 0 20px rgba(255,215,0,0.6)"
                      : target.points >= 20
                      ? "0 0 20px rgba(225,6,0,0.6)"
                      : "0 0 10px rgba(255,255,255,0.2)",
                    transform: `translate(-50%, -50%) scale(${1 - progress * 0.2})`,
                    touchAction: "none",
                    cursor: "pointer",
                    zIndex: 10,
                  }}
                >
                  {target.emoji}
                </button>
              );
            })}

            {/* Pop effects */}
            {pops.map((pop) => (
              <div
                key={pop.id}
                className="absolute pointer-events-none font-black text-yellow-300 text-lg"
                style={{
                  left: `${pop.x}%`,
                  top: `${pop.y}%`,
                  transform: "translate(-50%, -50%)",
                  animation: "popFloat 0.7s ease-out forwards",
                  zIndex: 20,
                  textShadow: "0 0 10px rgba(255,215,0,0.8)",
                }}
              >
                +{pop.points}
              </div>
            ))}
          </>
        )}

        {/* ── GAME OVER ── */}
        {gameState === "gameover" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <div className="text-center">
              <p className="text-white/60 text-sm uppercase tracking-widest">Time's Up!</p>
              <p className="text-white font-black text-4xl mt-1">{score} pts</p>
              {score >= highScore && score > 0 && (
                <p className="text-yellow-400 font-black text-sm mt-1 animate-pulse">🏆 NEW HIGH SCORE!</p>
              )}
              {score < highScore && (
                <p className="text-white/40 text-xs mt-1">Best: {highScore}</p>
              )}
            </div>
            <button
              onClick={resetGame}
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white text-sm uppercase tracking-wider transition-all active:scale-95"
              style={{
                background: "rgba(255,255,255,0.1)",
                border: "1px solid rgba(255,255,255,0.2)",
              }}
            >
              <RotateCcw className="w-4 h-4" />
              Play Again
            </button>
          </div>
        )}
      </div>

      {/* Inline keyframes */}
      <style>{`
        @keyframes popFloat {
          0%   { opacity: 1; transform: translate(-50%, -50%); }
          100% { opacity: 0; transform: translate(-50%, -120%); }
        }
      `}</style>
    </div>
  );
}
