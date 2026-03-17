import { useState } from "react";
import { quizQuestions, programResults, QuizQuestion, ProgramResult } from "@/data/program-quiz";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, RefreshCw, CheckCircle, User, Users, Baby, Zap, Shield, Smile, Bus } from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

const iconMap: Record<string, any> = {
  User, Users, Baby, Zap, Shield, Smile, Bus
};

export function ProgramFinder() {
  const [currentQuestionId, setCurrentQuestionId] = useState<string>("q1");
  const [result, setResult] = useState<ProgramResult | null>(null);
  const [history, setHistory] = useState<string[]>([]);

  const currentQuestion = quizQuestions.find(q => q.id === currentQuestionId);

  const handleOptionClick = (nextQuestionId?: string, resultId?: string) => {
    if (resultId) {
      setResult(programResults[resultId]);
    } else if (nextQuestionId) {
      setHistory([...history, currentQuestionId]);
      setCurrentQuestionId(nextQuestionId);
    }
  };

  const resetQuiz = () => {
    setCurrentQuestionId("q1");
    setResult(null);
    setHistory([]);
  };

  return (
    <section className="py-24 bg-zinc-900 text-white relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px]" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-primary font-bold tracking-widest uppercase mb-2">Not Sure Where to Start?</h2>
            <h3 className="text-4xl md:text-5xl font-heading font-bold text-white">FIND YOUR PERFECT PROGRAM</h3>
          </div>

          <div className="bg-zinc-800/50 backdrop-blur-md border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl min-h-[400px] flex flex-col items-center justify-center relative overflow-hidden">
            {/* Progress Bar */}
            {!result && (
              <div className="w-full max-w-xs mx-auto mb-8">
                <div className="flex justify-between text-xs text-gray-400 mb-2 uppercase tracking-wider font-bold">
                  <span>Step {history.length + 1}</span>
                  <span>Final Step</span>
                </div>
                <div className="h-2 bg-zinc-700 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-primary"
                    initial={{ width: 0 }}
                    animate={{ width: `${((history.length + 1) / 3) * 100}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>
            )}

            <AnimatePresence mode="wait">
              {!result && currentQuestion ? (
                <motion.div
                  key={currentQuestion.id}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.3 }}
                  className="w-full max-w-2xl"
                >
                  <h4 className="text-3xl font-bold mb-2 text-center">{currentQuestion.text}</h4>
                  <p className="text-gray-400 text-center mb-10 text-lg">{currentQuestion.subtext}</p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {currentQuestion.options.map((option) => {
                      const Icon = option.icon ? iconMap[option.icon] : null;
                      return (
                        <button
                          key={option.id}
                          onClick={() => handleOptionClick(option.nextQuestionId, option.resultId)}
                          className="group flex flex-col items-center justify-center p-8 md:p-6 bg-zinc-700/50 hover:bg-primary hover:text-white border border-white/5 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg text-center h-full min-h-[160px] md:min-h-[auto]"
                        >
                          {Icon && <Icon className="w-12 h-12 md:w-10 md:h-10 mb-4 text-primary group-hover:text-white transition-colors" />}
                          <span className="font-bold text-xl md:text-lg">{option.label}</span>
                        </button>
                      );
                    })}
                  </div>
                  
                  {history.length > 0 && (
                    <button 
                      onClick={() => {
                        const prev = history[history.length - 1];
                        setHistory(history.slice(0, -1));
                        setCurrentQuestionId(prev);
                      }}
                      className="mt-8 text-sm text-gray-500 hover:text-white underline mx-auto block"
                    >
                      Back to previous step
                    </button>
                  )}
                </motion.div>
              ) : result ? (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  className="w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-center"
                >
                  <div className="order-2 md:order-1">
                    <div className="inline-flex items-center gap-2 bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm font-bold mb-4">
                      <CheckCircle className="w-4 h-4" /> Recommended For You
                    </div>
                    <h4 className="text-4xl font-heading font-bold mb-4 text-white">{result.name}</h4>
                    <p className="text-gray-300 text-lg mb-6 leading-relaxed">
                      {result.description}
                    </p>
                    
                    <div className="mb-8">
                      <h5 className="font-bold text-white mb-3">Key Benefits:</h5>
                      <ul className="space-y-2">
                        {result.benefits.map((benefit, i) => (
                          <li key={i} className="flex items-center gap-2 text-gray-300">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                            {benefit}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4">
                      <Link href={result.link}>
                        <Button className="bg-primary hover:bg-primary/90 text-white text-lg px-8 py-6 h-auto font-heading uppercase tracking-wider w-full sm:w-auto">
                          View Program
                        </Button>
                      </Link>
                      <Button 
                        variant="outline" 
                        onClick={resetQuiz}
                        className="border-white/20 text-gray-300 hover:bg-white/10 hover:text-white w-full sm:w-auto"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" /> Start Over
                      </Button>
                    </div>
                  </div>

                  <div className="order-1 md:order-2 relative h-[300px] md:h-[400px] rounded-2xl overflow-hidden shadow-2xl border border-white/10 group">
                    <img 
                      src={result.image} 
                      alt={result.name} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
