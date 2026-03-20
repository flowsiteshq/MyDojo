import { useState, useEffect, useRef, useCallback } from "react";
import { RotateCcw, Trophy } from "lucide-react";

interface Target {
  id: number;
  x: number;
  y: number;
  size: number;
  emoji: string;
  points: number;
  born: number;
  lifespan: number;
}

interface Pop {
  id: number;
  x: number;
  y: number;
  points: number;
}

interface Props {
  onGameOver: (score: number) => void;
  onBack: () => void;
  highScore: number;
}

const EMOJIS = ["🥋", "🥊", "⭐", "🔥", "💥", "🏆", "🎯", "⚡"];
const GAME_DURATION = 30;

export default function GameTargetBlitz({ onGameOver, onBack, highScore }: Props) {
  const [gameState, setGameState] = useState<"idle" | "countdown" | "playing" | "gameover">("idle");
  const [countdown, setCountdown] = useState(3);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [targets, setTargets] = useState<Target[]>([]);
  const [pops, setPops] = useState<Pop[]>([]);
  const [combo, setCombo] = useState(0);
  const [finalScore, setFinalScore] = useState(0);
  const nextId = useRef(0);
  const comboTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const spawnTarget = useCallback(() => {
    const isGold = Math.random() < 0.1;
    const isRed = !isGold && Math.random() < 0.2;
    const size = isGold ? 70 : isRed ? 80 : 90 + Math.random() * 30;
    const points = isGold ? 30 : isRed ? 20 : 10;
    const lifespan = isGold ? 1200 : isRed ? 1800 : 2500;
    setTargets(prev => [...prev.slice(-7), {
      id: nextId.current++,
      x: 5 + Math.random() * 85,
      y: 10 + Math.random() * 75,
      size,
      emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
      points,
      born: Date.now(),
      lifespan,
    }]);
  }, []);

  // Countdown
  useEffect(() => {
    if (gameState !== "countdown") return;
    if (countdown === 0) {
      setTimeout(() => setGameState("playing"), 500);
      return;
    }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [gameState, countdown]);

  // Timer
  useEffect(() => {
    if (gameState !== "playing") return;
    if (timeLeft <= 0) {
      setFinalScore(score);
      setGameState("gameover");
      onGameOver(score);
      return;
    }
    const t = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    return () => clearTimeout(t);
  }, [gameState, timeLeft, score, onGameOver]);

  // Spawn targets
  useEffect(() => {
    if (gameState !== "playing") return;
    const interval = Math.max(400, 900 - (GAME_DURATION - timeLeft) * 15);
    const t = setTimeout(spawnTarget, interval);
    return () => clearTimeout(t);
  }, [gameState, timeLeft, spawnTarget]);

  // Expire targets
  useEffect(() => {
    if (gameState !== "playing") return;
    const t = setInterval(() => {
      const now = Date.now();
      setTargets(prev => prev.filter(tgt => now - tgt.born < tgt.lifespan));
    }, 100);
    return () => clearInterval(t);
  }, [gameState]);

  const handleTap = (target: Target, e: React.PointerEvent) => {
    e.stopPropagation();
    if (gameState !== "playing") return;
    setTargets(prev => prev.filter(t => t.id !== target.id));
    const newCombo = combo + 1;
    setCombo(newCombo);
    const multiplier = newCombo >= 5 ? 2 : newCombo >= 3 ? 1.5 : 1;
    const earned = Math.round(target.points * multiplier);
    setScore(s => s + earned);
    setPops(prev => [...prev, { id: Date.now(), x: target.x, y: target.y, points: earned }]);
    setTimeout(() => setPops(prev => prev.filter(p => p.id !== Date.now())), 700);
    if (comboTimer.current) clearTimeout(comboTimer.current);
    comboTimer.current = setTimeout(() => setCombo(0), 1500);
  };

  const startGame = () => {
    setScore(0);
    setTimeLeft(GAME_DURATION);
    setTargets([]);
    setPops([]);
    setCombo(0);
    setCountdown(3);
    setGameState("countdown");
  };

  const timerPct = (timeLeft / GAME_DURATION) * 100;
  const timerColor = timeLeft <= 5 ? "#ef4444" : timeLeft <= 10 ? "#f97316" : "#22c55e";

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden select-none"
      style={{ background: "radial-gradient(ellipse at center, #1a0a00 0%, #0a0000 100%)" }}>
      {/* Header */}
      <div className="relative z-20 flex items-center justify-between px-6 pt-4 pb-2">
        <button onClick={onBack} className="text-white/50 hover:text-white text-sm uppercase tracking-wider transition-colors">
          ← Back
        </button>
        <div className="text-center">
          <div className="text-white font-black text-2xl">{score}</div>
          <div className="text-white/40 text-xs uppercase tracking-widest">Score</div>
        </div>
        <div className="text-right">
          <div className="font-black text-2xl" style={{ color: timerColor }}>{timeLeft}s</div>
          <div className="text-white/40 text-xs uppercase tracking-widest">Time</div>
        </div>
      </div>

      {/* Timer bar */}
      {gameState === "playing" && (
        <div className="relative z-20 mx-6 h-1.5 rounded-full bg-white/10 overflow-hidden">
          <div className="h-full rounded-full transition-all duration-1000"
            style={{ width: `${timerPct}%`, background: timerColor, boxShadow: `0 0 8px ${timerColor}` }} />
        </div>
      )}

      {/* Combo indicator */}
      {combo >= 3 && gameState === "playing" && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 text-center pointer-events-none">
          <div className="font-black text-yellow-400 text-xl animate-pulse"
            style={{ textShadow: "0 0 20px rgba(255,215,0,0.8)" }}>
            {combo >= 5 ? "🔥 2x COMBO!" : "⚡ 1.5x COMBO!"}
          </div>
        </div>
      )}

      {/* Game area */}
      <div className="relative flex-1 z-10">
        {/* Idle */}
        {gameState === "idle" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-6">
            <div className="text-center">
              <div className="text-8xl mb-4">🎯</div>
              <h2 className="text-white font-black text-4xl uppercase tracking-wider mb-2">Target Blitz</h2>
              <p className="text-white/60 text-lg">Tap targets before they vanish!</p>
              <p className="text-white/40 text-sm mt-1">Build combos for bonus points</p>
            </div>
            {highScore > 0 && (
              <div className="flex items-center gap-2 text-yellow-400">
                <Trophy className="w-5 h-5" />
                <span className="font-bold">Best: {highScore}</span>
              </div>
            )}
            <button onClick={startGame}
              className="px-10 py-4 rounded-2xl font-black text-white text-xl uppercase tracking-wider transition-all active:scale-95"
              style={{ background: "linear-gradient(135deg, #e10600, #ff4400)", boxShadow: "0 0 30px rgba(225,6,0,0.5)" }}>
              Play Now
            </button>
          </div>
        )}

        {/* Countdown */}
        {gameState === "countdown" && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="font-black text-9xl text-white"
              style={{ textShadow: "0 0 60px rgba(225,6,0,0.8)", animation: "pulse 0.9s ease-in-out infinite" }}>
              {countdown > 0 ? countdown : "GO!"}
            </div>
          </div>
        )}

        {/* Playing */}
        {gameState === "playing" && (
          <>
            {targets.map(target => {
              const age = Date.now() - target.born;
              const progress = Math.min(age / target.lifespan, 1);
              const opacity = progress > 0.75 ? 1 - (progress - 0.75) * 4 : 1;
              return (
                <button key={target.id} onPointerDown={e => handleTap(target, e)}
                  className="absolute flex items-center justify-center rounded-full active:scale-75 transition-transform"
                  style={{
                    left: `${target.x}%`, top: `${target.y}%`,
                    width: target.size, height: target.size,
                    fontSize: target.size * 0.5, opacity,
                    transform: `translate(-50%, -50%) scale(${1 - progress * 0.2})`,
                    background: target.points >= 30
                      ? "radial-gradient(circle, rgba(255,215,0,0.35) 0%, rgba(255,140,0,0.15) 100%)"
                      : target.points >= 20
                      ? "radial-gradient(circle, rgba(225,6,0,0.35) 0%, rgba(180,0,0,0.15) 100%)"
                      : "radial-gradient(circle, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.05) 100%)",
                    border: target.points >= 30 ? "2px solid rgba(255,215,0,0.8)"
                      : target.points >= 20 ? "2px solid rgba(225,6,0,0.8)"
                      : "2px solid rgba(255,255,255,0.3)",
                    boxShadow: target.points >= 30 ? "0 0 25px rgba(255,215,0,0.6)"
                      : target.points >= 20 ? "0 0 25px rgba(225,6,0,0.6)"
                      : "0 0 12px rgba(255,255,255,0.2)",
                    touchAction: "none", cursor: "pointer", zIndex: 10,
                  }}>
                  {target.emoji}
                </button>
              );
            })}
            {pops.map(pop => (
              <div key={pop.id} className="absolute pointer-events-none font-black text-yellow-300 text-xl"
                style={{ left: `${pop.x}%`, top: `${pop.y}%`, transform: "translate(-50%, -50%)",
                  animation: "popFloat 0.7s ease-out forwards", zIndex: 20,
                  textShadow: "0 0 10px rgba(255,215,0,0.8)" }}>
                +{pop.points}
              </div>
            ))}
          </>
        )}

        {/* Game Over */}
        {gameState === "gameover" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-6">
            <div className="text-center">
              <p className="text-white/60 text-sm uppercase tracking-widest mb-1">Time's Up!</p>
              <p className="text-white font-black text-6xl">{finalScore}</p>
              <p className="text-white/40 text-sm mt-1">points</p>
              {finalScore >= highScore && finalScore > 0 && (
                <p className="text-yellow-400 font-black text-lg mt-2 animate-pulse">🏆 NEW HIGH SCORE!</p>
              )}
            </div>
            <div className="flex gap-4">
              <button onClick={startGame}
                className="flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-white uppercase tracking-wider transition-all active:scale-95"
                style={{ background: "linear-gradient(135deg, #e10600, #ff4400)" }}>
                <RotateCcw className="w-4 h-4" /> Play Again
              </button>
              <button onClick={onBack}
                className="px-8 py-3 rounded-xl font-bold text-white/70 uppercase tracking-wider transition-all active:scale-95"
                style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)" }}>
                Games
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes popFloat {
          0% { opacity: 1; transform: translate(-50%, -50%); }
          100% { opacity: 0; transform: translate(-50%, -180%); }
        }
      `}</style>
    </div>
  );
}
