import { useState, useEffect, useRef } from "react";
import { RotateCcw, Trophy } from "lucide-react";

interface Props {
  onGameOver: (score: number) => void;
  onBack: () => void;
  highScore: number;
}

const BELTS = [
  { id: "white",   label: "White",   color: "#f8fafc", text: "#1e293b", emoji: "🥋" },
  { id: "yellow",  label: "Yellow",  color: "#fbbf24", text: "#1e293b", emoji: "⭐" },
  { id: "orange",  label: "Orange",  color: "#f97316", text: "#fff",    emoji: "🔥" },
  { id: "green",   label: "Green",   color: "#22c55e", text: "#fff",    emoji: "🌿" },
  { id: "blue",    label: "Blue",    color: "#3b82f6", text: "#fff",    emoji: "💧" },
  { id: "purple",  label: "Purple",  color: "#a855f7", text: "#fff",    emoji: "💜" },
  { id: "red",     label: "Red",     color: "#ef4444", text: "#fff",    emoji: "❤️" },
  { id: "brown",   label: "Brown",   color: "#92400e", text: "#fff",    emoji: "🤎" },
  { id: "black",   label: "Black",   color: "#1e293b", text: "#fff",    emoji: "🖤" },
];

interface Card {
  id: number;
  beltId: string;
  flipped: boolean;
  matched: boolean;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const LEVELS = [
  { pairs: 4, label: "Beginner" },
  { pairs: 6, label: "Intermediate" },
  { pairs: 8, label: "Advanced" },
];

export default function GameBeltMemory({ onGameOver, onBack, highScore }: Props) {
  const [gameState, setGameState] = useState<"idle" | "playing" | "levelup" | "gameover">("idle");
  const [level, setLevel] = useState(0);
  const [cards, setCards] = useState<Card[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [moves, setMoves] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [matchCount, setMatchCount] = useState(0);
  const [finalScore, setFinalScore] = useState(0);
  const lockRef = useRef(false);

  const buildCards = (lvl: number) => {
    const { pairs } = LEVELS[lvl];
    const belts = shuffle(BELTS).slice(0, pairs);
    const doubled = shuffle([...belts, ...belts].map((b, i) => ({
      id: i, beltId: b.id, flipped: false, matched: false,
    })));
    return doubled;
  };

  const startGame = () => {
    const lvl = 0;
    setLevel(lvl);
    setScore(0);
    setMoves(0);
    setMatchCount(0);
    setTimeLeft(60);
    setSelected([]);
    setCards(buildCards(lvl));
    lockRef.current = false;
    setGameState("playing");
  };

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

  const handleCardTap = (cardId: number) => {
    if (lockRef.current || gameState !== "playing") return;
    const card = cards.find(c => c.id === cardId);
    if (!card || card.flipped || card.matched) return;
    if (selected.includes(cardId)) return;

    const newSelected = [...selected, cardId];
    setCards(prev => prev.map(c => c.id === cardId ? { ...c, flipped: true } : c));

    if (newSelected.length === 1) {
      setSelected(newSelected);
      return;
    }

    // Two cards selected
    setSelected([]);
    setMoves(m => m + 1);
    lockRef.current = true;

    const [firstId, secondId] = newSelected;
    const first = cards.find(c => c.id === firstId)!;
    const second = card;

    if (first.beltId === second.beltId) {
      // Match!
      const pts = Math.max(10, 30 - moves * 2) + timeLeft;
      setScore(s => s + pts);
      const newMatchCount = matchCount + 1;
      setMatchCount(newMatchCount);
      setCards(prev => prev.map(c =>
        c.id === firstId || c.id === secondId ? { ...c, matched: true, flipped: true } : c
      ));
      lockRef.current = false;

      // Check level complete
      if (newMatchCount >= LEVELS[level].pairs) {
        if (level < LEVELS.length - 1) {
          setTimeout(() => {
            const nextLvl = level + 1;
            setLevel(nextLvl);
            setMatchCount(0);
            setSelected([]);
            setCards(buildCards(nextLvl));
            setTimeLeft(t => Math.min(t + 20, 90));
            setGameState("levelup");
            setTimeout(() => setGameState("playing"), 1500);
          }, 600);
        } else {
          setTimeout(() => {
            setFinalScore(score + pts);
            setGameState("gameover");
            onGameOver(score + pts);
          }, 800);
        }
      }
    } else {
      // No match
      setTimeout(() => {
        setCards(prev => prev.map(c =>
          c.id === firstId || c.id === secondId ? { ...c, flipped: false } : c
        ));
        lockRef.current = false;
      }, 900);
    }
  };

  const { pairs } = LEVELS[Math.min(level, LEVELS.length - 1)];
  const cols = pairs <= 4 ? 4 : pairs <= 6 ? 4 : 4;
  const timerPct = (timeLeft / 60) * 100;
  const timerColor = timeLeft <= 10 ? "#ef4444" : timeLeft <= 20 ? "#f97316" : "#22c55e";

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden select-none"
      style={{ background: "radial-gradient(ellipse at center, #0a001a 0%, #050010 100%)" }}>
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
            style={{ width: `${timerPct}%`, background: timerColor }} />
        </div>
      )}

      {/* Level indicator */}
      {gameState === "playing" && (
        <div className="relative z-20 text-center py-1">
          <span className="text-white/40 text-xs uppercase tracking-widest">
            {LEVELS[level].label} · {matchCount}/{pairs} matched
          </span>
        </div>
      )}

      {/* Game area */}
      <div className="relative flex-1 z-10 flex items-center justify-center px-4">
        {/* Idle */}
        {gameState === "idle" && (
          <div className="flex flex-col items-center gap-6">
            <div className="text-center">
              <div className="text-8xl mb-4">🥋</div>
              <h2 className="text-white font-black text-4xl uppercase tracking-wider mb-2">Belt Memory</h2>
              <p className="text-white/60 text-lg">Match the martial arts belts!</p>
              <p className="text-white/40 text-sm mt-1">3 levels of difficulty</p>
            </div>
            {highScore > 0 && (
              <div className="flex items-center gap-2 text-yellow-400">
                <Trophy className="w-5 h-5" />
                <span className="font-bold">Best: {highScore}</span>
              </div>
            )}
            <button onClick={startGame}
              className="px-10 py-4 rounded-2xl font-black text-white text-xl uppercase tracking-wider transition-all active:scale-95"
              style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)", boxShadow: "0 0 30px rgba(168,85,247,0.5)" }}>
              Play Now
            </button>
          </div>
        )}

        {/* Level up */}
        {gameState === "levelup" && (
          <div className="flex flex-col items-center gap-4">
            <div className="text-7xl animate-bounce">🎉</div>
            <p className="text-yellow-400 font-black text-3xl uppercase">Level Up!</p>
            <p className="text-white/60">{LEVELS[level].label}</p>
          </div>
        )}

        {/* Playing */}
        {gameState === "playing" && (
          <div className={`grid gap-3 w-full max-w-lg`}
            style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
            {cards.map(card => {
              const belt = BELTS.find(b => b.id === card.beltId)!;
              return (
                <button key={card.id} onClick={() => handleCardTap(card.id)}
                  className="aspect-square rounded-xl transition-all duration-300 active:scale-95 flex flex-col items-center justify-center gap-1"
                  style={{
                    background: card.flipped || card.matched
                      ? belt.color
                      : "rgba(255,255,255,0.08)",
                    border: card.matched
                      ? `2px solid ${belt.color}`
                      : card.flipped
                      ? `2px solid rgba(255,255,255,0.5)`
                      : "2px solid rgba(255,255,255,0.1)",
                    boxShadow: card.matched ? `0 0 20px ${belt.color}60` : "none",
                    opacity: card.matched ? 0.7 : 1,
                    transform: card.flipped || card.matched ? "rotateY(0deg)" : "rotateY(180deg)",
                  }}>
                  {(card.flipped || card.matched) ? (
                    <>
                      <span className="text-2xl">{belt.emoji}</span>
                      <span className="text-xs font-bold" style={{ color: belt.text }}>{belt.label}</span>
                    </>
                  ) : (
                    <span className="text-2xl">❓</span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Game Over */}
        {gameState === "gameover" && (
          <div className="flex flex-col items-center gap-6">
            <div className="text-center">
              <p className="text-white/60 text-sm uppercase tracking-widest mb-1">
                {timeLeft <= 0 ? "Time's Up!" : "Complete!"}
              </p>
              <p className="text-white font-black text-6xl">{finalScore}</p>
              <p className="text-white/40 text-sm mt-1">points · {moves} moves</p>
              {finalScore >= highScore && finalScore > 0 && (
                <p className="text-yellow-400 font-black text-lg mt-2 animate-pulse">🏆 NEW HIGH SCORE!</p>
              )}
            </div>
            <div className="flex gap-4">
              <button onClick={startGame}
                className="flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-white uppercase tracking-wider transition-all active:scale-95"
                style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)" }}>
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
    </div>
  );
}
