import { useState, useEffect, useRef } from "react";
import { RotateCcw, Trophy } from "lucide-react";

interface Props {
  onGameOver: (score: number) => void;
  onBack: () => void;
  highScore: number;
}

const MOVES = [
  { id: "jab",       label: "JAB",       emoji: "👊", color: "#ef4444", glow: "rgba(239,68,68,0.6)" },
  { id: "cross",     label: "CROSS",     emoji: "🤜", color: "#f97316", glow: "rgba(249,115,22,0.6)" },
  { id: "hook",      label: "HOOK",      emoji: "🥊", color: "#fbbf24", glow: "rgba(251,191,36,0.6)" },
  { id: "kick",      label: "KICK",      emoji: "🦵", color: "#22c55e", glow: "rgba(34,197,94,0.6)" },
];

type GameState = "idle" | "showing" | "input" | "correct" | "wrong" | "levelup" | "gameover";

export default function GameComboRush({ onGameOver, onBack, highScore }: Props) {
  const [gameState, setGameState] = useState<GameState>("idle");
  const [sequence, setSequence] = useState<string[]>([]);
  const [playerInput, setPlayerInput] = useState<string[]>([]);
  const [showingIndex, setShowingIndex] = useState(-1);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [finalScore, setFinalScore] = useState(0);
  const [activeBtn, setActiveBtn] = useState<string | null>(null);
  const showTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showSequence = (seq: string[]) => {
    setGameState("showing");
    setShowingIndex(-1);
    let i = 0;
    const showNext = () => {
      if (i >= seq.length) {
        setTimeout(() => {
          setShowingIndex(-1);
          setGameState("input");
        }, 400);
        return;
      }
      setShowingIndex(i);
      i++;
      showTimer.current = setTimeout(showNext, 700);
    };
    showTimer.current = setTimeout(showNext, 500);
  };

  const startGame = () => {
    const firstSeq = [MOVES[Math.floor(Math.random() * MOVES.length)].id];
    setSequence(firstSeq);
    setPlayerInput([]);
    setScore(0);
    setLevel(1);
    showSequence(firstSeq);
  };

  const handleMove = (moveId: string) => {
    if (gameState !== "input") return;
    setActiveBtn(moveId);
    setTimeout(() => setActiveBtn(null), 200);

    const newInput = [...playerInput, moveId];
    setPlayerInput(newInput);
    const idx = newInput.length - 1;

    if (moveId !== sequence[idx]) {
      // Wrong
      setFinalScore(score);
      setGameState("wrong");
      setTimeout(() => {
        setGameState("gameover");
        onGameOver(score);
      }, 1500);
      return;
    }

    if (newInput.length === sequence.length) {
      // Correct full sequence
      const pts = sequence.length * 10 + Math.floor(sequence.length / 3) * 5;
      const newScore = score + pts;
      setScore(newScore);
      setPlayerInput([]);
      setGameState("correct");

      setTimeout(() => {
        const nextLevel = level + 1;
        setLevel(nextLevel);
        // Add one more move to the sequence
        const nextSeq = [...sequence, MOVES[Math.floor(Math.random() * MOVES.length)].id];
        setSequence(nextSeq);
        if (nextLevel % 3 === 0) {
          setGameState("levelup");
          setTimeout(() => showSequence(nextSeq), 1200);
        } else {
          showSequence(nextSeq);
        }
      }, 800);
    }
  };

  const currentShowMove = showingIndex >= 0 && showingIndex < sequence.length
    ? MOVES.find(m => m.id === sequence[showingIndex])
    : null;

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden select-none"
      style={{ background: "radial-gradient(ellipse at center, #001a0a 0%, #000a05 100%)" }}>
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
          <div className="text-white font-black text-2xl">{level}</div>
          <div className="text-white/40 text-xs uppercase tracking-widest">Level</div>
        </div>
      </div>

      {/* Sequence dots */}
      {(gameState === "showing" || gameState === "input") && (
        <div className="relative z-20 flex justify-center gap-2 py-2">
          {sequence.map((moveId, i) => {
            const move = MOVES.find(m => m.id === moveId)!;
            const isShown = i <= showingIndex;
            const isInputted = i < playerInput.length;
            return (
              <div key={i} className="w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all duration-200"
                style={{
                  background: isInputted ? move.color : isShown ? `${move.color}60` : "rgba(255,255,255,0.1)",
                  border: `2px solid ${isShown || isInputted ? move.color : "rgba(255,255,255,0.15)"}`,
                  boxShadow: isShown || isInputted ? `0 0 10px ${move.glow}` : "none",
                }}>
                {(isShown || isInputted) ? move.emoji : "·"}
              </div>
            );
          })}
        </div>
      )}

      {/* Main area */}
      <div className="relative flex-1 z-10 flex flex-col items-center justify-between py-4 px-4">
        {/* Idle */}
        {gameState === "idle" && (
          <div className="flex-1 flex flex-col items-center justify-center gap-6">
            <div className="text-center">
              <div className="text-8xl mb-4">🥊</div>
              <h2 className="text-white font-black text-4xl uppercase tracking-wider mb-2">Combo Rush</h2>
              <p className="text-white/60 text-lg">Watch the combo, repeat it!</p>
              <p className="text-white/40 text-sm mt-1">Combos get longer each round</p>
            </div>
            {highScore > 0 && (
              <div className="flex items-center gap-2 text-yellow-400">
                <Trophy className="w-5 h-5" />
                <span className="font-bold">Best: {highScore}</span>
              </div>
            )}
            <button onClick={startGame}
              className="px-10 py-4 rounded-2xl font-black text-white text-xl uppercase tracking-wider transition-all active:scale-95"
              style={{ background: "linear-gradient(135deg, #15803d, #22c55e)", boxShadow: "0 0 30px rgba(34,197,94,0.5)" }}>
              Play Now
            </button>
          </div>
        )}

        {/* Showing sequence */}
        {gameState === "showing" && (
          <div className="flex-1 flex flex-col items-center justify-center gap-6">
            <p className="text-white/50 text-sm uppercase tracking-widest">Watch the combo...</p>
            {currentShowMove ? (
              <div className="flex flex-col items-center gap-3 animate-pulse">
                <div className="w-32 h-32 rounded-full flex items-center justify-center text-6xl"
                  style={{
                    background: `${currentShowMove.color}30`,
                    border: `3px solid ${currentShowMove.color}`,
                    boxShadow: `0 0 40px ${currentShowMove.glow}`,
                  }}>
                  {currentShowMove.emoji}
                </div>
                <p className="font-black text-2xl text-white tracking-widest">{currentShowMove.label}</p>
              </div>
            ) : (
              <div className="w-32 h-32 rounded-full flex items-center justify-center"
                style={{ background: "rgba(255,255,255,0.05)", border: "3px solid rgba(255,255,255,0.1)" }} />
            )}
          </div>
        )}

        {/* Correct */}
        {gameState === "correct" && (
          <div className="flex-1 flex flex-col items-center justify-center gap-3">
            <div className="text-7xl animate-bounce">✅</div>
            <p className="text-green-400 font-black text-3xl uppercase">Perfect!</p>
            <p className="text-white/60">+{sequence.length * 10} pts</p>
          </div>
        )}

        {/* Level up */}
        {gameState === "levelup" && (
          <div className="flex-1 flex flex-col items-center justify-center gap-3">
            <div className="text-7xl animate-bounce">🔥</div>
            <p className="text-yellow-400 font-black text-3xl uppercase">Level {level}!</p>
            <p className="text-white/60">Combo gets longer...</p>
          </div>
        )}

        {/* Wrong */}
        {gameState === "wrong" && (
          <div className="flex-1 flex flex-col items-center justify-center gap-3">
            <div className="text-7xl">❌</div>
            <p className="text-red-400 font-black text-3xl uppercase">Wrong Move!</p>
            <p className="text-white/60">Final score: {finalScore}</p>
          </div>
        )}

        {/* Game Over */}
        {gameState === "gameover" && (
          <div className="flex-1 flex flex-col items-center justify-center gap-6">
            <div className="text-center">
              <p className="text-white/60 text-sm uppercase tracking-widest mb-1">Game Over</p>
              <p className="text-white font-black text-6xl">{finalScore}</p>
              <p className="text-white/40 text-sm mt-1">reached level {level}</p>
              {finalScore >= highScore && finalScore > 0 && (
                <p className="text-yellow-400 font-black text-lg mt-2 animate-pulse">🏆 NEW HIGH SCORE!</p>
              )}
            </div>
            <div className="flex gap-4">
              <button onClick={startGame}
                className="flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-white uppercase tracking-wider transition-all active:scale-95"
                style={{ background: "linear-gradient(135deg, #15803d, #22c55e)" }}>
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

        {/* Input buttons */}
        {gameState === "input" && (
          <div className="w-full max-w-sm">
            <p className="text-center text-white/50 text-sm uppercase tracking-widest mb-4">Your turn! Repeat the combo</p>
            <div className="grid grid-cols-2 gap-3">
              {MOVES.map(move => (
                <button key={move.id} onClick={() => handleMove(move.id)}
                  className="py-5 rounded-2xl flex flex-col items-center gap-2 transition-all active:scale-90 font-black text-white text-lg uppercase tracking-wider"
                  style={{
                    background: activeBtn === move.id ? move.color : `${move.color}20`,
                    border: `2px solid ${move.color}`,
                    boxShadow: activeBtn === move.id ? `0 0 25px ${move.glow}` : "none",
                  }}>
                  <span className="text-3xl">{move.emoji}</span>
                  {move.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
