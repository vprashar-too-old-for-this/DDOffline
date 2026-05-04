/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TransparentSprite } from './components/TransparentSprite';
import { 
  Shield, 
  Swords, 
  FlaskConical, 
  User, 
  ChevronRight, 
  RotateCcw, 
  Trophy, 
  Skull,
  Flame,
  Star,
  Info,
  Zap,
  Target
} from 'lucide-react';
import { GameState, Subject, Question } from './types';
import { generateQuestion } from './services/questionService';

const INITIAL_PLAYER_HEALTH = 100;
const INITIAL_DRAGON_HEALTH = 500;

const AVATARS = [
  { id: 'wizard', name: 'Wizard', icon: '/WizardSprite.png', uiIcon: <Zap className="w-6 h-6" /> },
  { id: 'knight', name: 'Knight', icon: '/Knight.png', uiIcon: <Shield className="w-6 h-6" /> },
  { id: 'archer', name: 'Archer', icon: '/Archer.png', uiIcon: <Target className="w-6 h-6" /> },
];

export default function App() {
  const [gameState, setGameState] = useState<GameState>({
    playerName: '',
    playerAvatar: '/WizardSprite.png',
    difficulty: 5,
    playerHealth: INITIAL_PLAYER_HEALTH,
    playerMaxHealth: INITIAL_PLAYER_HEALTH,
    dragonHealth: INITIAL_DRAGON_HEALTH,
    dragonMaxHealth: INITIAL_DRAGON_HEALTH,
    attackPower: 10,
    currentTurn: 1,
    phase: 'INIT',
    level: 1,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  useEffect(() => {
    if (gameState.lastActionResult) {
      const timer = setTimeout(() => {
        setGameState(prev => ({ ...prev, lastActionResult: undefined }));
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [gameState.lastActionResult]);

  // Sound effects would go here, using visual feedback instead

  const getInstructionText = () => {
    switch(gameState.phase) {
      case 'POWER_UP':
      case 'START':
        return "CHOOSE A SUBJECT TO EMPOWER YOUR AVATAR AND PREPARE AN ACTION!";
      case 'PLAYER_ATTACK':
        return "ARCANE ENERGY CONCENTRATED! READY YOUR STRIKE AGAINST THE BEAST!";
      case 'DRAGON_ATTACK':
        return "DANGER! THE DRAGON IS CHARGING ITS BREATH! WEAVE A GRAMMAR DEFENCE!";
      case 'QUESTION':
        return "WISDOM IS YOUR ONLY SHIELD. SELECT THE CORRECT ANSWER TO SUCCEED!";
      case 'VICTORY':
        return "DRAGON VANQUISHED! THE KINGDOM IS SAFE... FOR NOW.";
      case 'DEFEAT':
        return "THE HERO HAS FALLEN. THE KINGDOM IS IN PERIL.";
      default:
        return "THE BATTLE CONTINUES...";
    }
  };

  const handleStartGame = (name: string, difficulty: number, avatarUrl: string) => {
    setGameState(prev => ({
      ...prev,
      playerName: name,
      playerAvatar: avatarUrl,
      difficulty,
      phase: 'START'
    }));
  };

  const startPowerUp = async (subject: Subject) => {
    setIsLoading(true);
    const q = await generateQuestion(subject, gameState.difficulty);
    setGameState(prev => ({
      ...prev,
      activeQuestion: q,
      phase: 'QUESTION'
    }));
    setIsLoading(false);
  };

  const handleAnswer = (option: string) => {
    if (showAnswer) return;
    
    const correct = option === gameState.activeQuestion?.correctAnswer;
    setSelectedOption(option);
    setIsCorrect(correct);
    setShowAnswer(true);

    setTimeout(() => {
      applyQuestionResult(correct);
    }, 2000);
  };

  const applyQuestionResult = (correct: boolean) => {
    setGameState(prev => {
      const q = prev.activeQuestion!;
      let nextPhase: GameState['phase'] = 'PLAYER_ATTACK';
      let updates: Partial<GameState> = {};

      if (q.subject === Subject.MATH) {
        if (correct) {
          updates.attackPower = prev.attackPower + (prev.difficulty * 5);
          updates.lastActionResult = `Critical Knowledge! Attack increased to ${updates.attackPower}!`;
        } else {
          updates.lastActionResult = "Calculation error. Minimal power surge.";
        }
      } else if (q.subject === Subject.SCIENCE) {
        if (correct) {
          const heal = prev.difficulty * 10;
          updates.playerHealth = Math.min(prev.playerMaxHealth, prev.playerHealth + heal);
          updates.lastActionResult = `Alchemy Successful! Restored ${heal} health.`;
        } else {
          updates.lastActionResult = "The potion bubbled and vanished...";
        }
      } else if (q.subject === Subject.ENGLISH) {
        const baseDamage = 15 + (prev.level * 5);
        const damage = correct ? 0 : baseDamage;
        const newHealth = Math.max(0, prev.playerHealth - damage);
        
        updates.playerHealth = newHealth;
        updates.currentTurn = prev.currentTurn + 1;
        
        if (correct) {
          updates.lastActionResult = "Spell of Protection woven! The dragon's flames missed you entirely!";
        } else {
          updates.lastActionResult = `Grammar fail. The dragon strikes for ${damage} damage!`;
        }
        
        nextPhase = newHealth <= 0 ? 'DEFEAT' : 'POWER_UP';
      }

      return { ...prev, ...updates, phase: nextPhase, activeQuestion: undefined };
    });
    
    setShowAnswer(false);
    setSelectedOption(null);
  };

  const playerAttack = () => {
    setGameState(prev => {
      const damage = prev.attackPower;
      const newDragonHealth = Math.max(0, prev.dragonHealth - damage);
      
      if (newDragonHealth <= 0) {
        return { 
          ...prev, 
          dragonHealth: 0, 
          phase: 'VICTORY',
          lastActionResult: `VICTORY! The dragon was defeated with a ${damage} damage blow!`
        };
      }

      return {
        ...prev,
        dragonHealth: newDragonHealth,
        phase: 'DRAGON_ATTACK',
        lastActionResult: `You dealt ${damage} damage to the dragon!`
      };
    });
  };

  const startDefend = async () => {
    setIsLoading(true);
    const q = await generateQuestion(Subject.ENGLISH, gameState.difficulty);
    setGameState(prev => ({
      ...prev,
      activeQuestion: q,
      phase: 'QUESTION'
    }));
    setIsLoading(false);
  };

  const nextLevel = () => {
    setGameState(prev => ({
      ...prev,
      level: prev.level + 1,
      difficulty: Math.min(12, prev.difficulty + 1),
      dragonMaxHealth: prev.dragonMaxHealth + 200,
      dragonHealth: prev.dragonMaxHealth + 200,
      playerHealth: prev.playerMaxHealth,
      phase: 'START',
      lastActionResult: `Seasoned by battle, you face a mightier dragon!`
    }));
  };

  const restart = () => {
    setGameState({
      playerName: '',
      playerAvatar: '/WizardSprite.png',
      difficulty: 5,
      playerHealth: INITIAL_PLAYER_HEALTH,
      playerMaxHealth: INITIAL_PLAYER_HEALTH,
      dragonHealth: INITIAL_DRAGON_HEALTH,
      dragonMaxHealth: INITIAL_DRAGON_HEALTH,
      attackPower: 10,
      currentTurn: 1,
      phase: 'INIT',
      level: 1,
    });
  };

  // Rendering logic
  return (
    <div className="min-h-screen bg-sky-pattern text-slate-900 font-sans selection:bg-cyan-500/30 overflow-hidden relative">
      {/* Cartoon Background Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Clouds */}
        <motion.div 
          animate={{ x: [-200, 1400] }} 
          transition={{ duration: 70, repeat: Infinity, ease: "linear" }}
          className="absolute top-10 left-0 opacity-40 text-7xl filter blur-[1px]"
        >☁️</motion.div>
        <motion.div 
          animate={{ x: [1400, -200] }} 
          transition={{ duration: 90, repeat: Infinity, ease: "linear" }}
          className="absolute top-32 right-0 opacity-25 text-9xl filter blur-[2px]"
        >☁️</motion.div>
        <motion.div 
          animate={{ x: [-150, 1300] }} 
          transition={{ duration: 110, repeat: Infinity, ease: "linear", delay: 20 }}
          className="absolute top-64 left-1/4 opacity-30 text-8xl"
        >☁️</motion.div>
        <motion.div 
          animate={{ x: [1500, -300] }} 
          transition={{ duration: 85, repeat: Infinity, ease: "linear", delay: 10 }}
          className="absolute top-16 right-1/3 opacity-20 text-6xl filter blur-[1px]"
        >☁️</motion.div>
        <motion.div 
          animate={{ x: [-300, 1600] }} 
          transition={{ duration: 150, repeat: Infinity, ease: "linear" }}
          className="absolute top-80 left-0 opacity-15 text-[180px] filter blur-[4px]"
        >☁️</motion.div>
        
        {/* Sun */}
        <div className="absolute top-10 right-10 w-24 h-24 bg-yellow-400 rounded-full shadow-[0_0_50px_rgba(250,204,21,0.5)] border-4 border-yellow-500" />
      </div>

      <main className="container mx-auto h-screen max-w-5xl flex flex-col p-4 relative z-10">
        <AnimatePresence mode="wait">
          {gameState.phase === 'INIT' && (
            <SetupScreen onStart={handleStartGame} />
          )}

          {gameState.phase !== 'INIT' && (
            <div className="flex-1 flex flex-col gap-2">
              {/* Top HUD & Combat View Container */}
              <div className="flex-1 relative flex flex-col">
                {/* Top HUD Overlaid */}
                <div className="absolute top-2 left-0 right-0 z-50 pointer-events-none px-2">
                  <Header gameState={gameState} />
                </div>

                {/* Combat View - Expanded to fill entire area */}
                <div className="flex-1 relative cartoon-panel overflow-hidden bg-gradient-to-b from-sky-400 to-sky-200">
                  <CombatStage gameState={gameState} />
                  
                  {/* Action Feedback Overlay */}
                  {gameState.lastActionResult && gameState.phase !== 'QUESTION' && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.5, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 1.5 }}
                      key={gameState.lastActionResult}
                      className="absolute bottom-10 left-1/2 -translate-x-1/2 z-40 pointer-events-none"
                    >
                      <div className="bg-white border-4 border-amber-900 px-8 py-3 rounded-2xl text-amber-900 font-black text-lg shadow-xl uppercase italic tracking-tighter">
                        {gameState.lastActionResult}
                      </div>
                    </motion.div>
                  )}

                  {/* Introduction Overlay */}
                  {gameState.phase === 'START' && (
                    <div className="absolute inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6 text-center">
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        className="cartoon-panel bg-white p-10 max-w-lg shadow-[8px_8px_0px_0px_rgba(120,66,18,1)] border-4 border-amber-900"
                      >
                        <h2 className="text-4xl font-black tracking-tight text-amber-900 mb-4 uppercase italic leading-none">The Terror of Bloodwing!</h2>
                        <div className="mb-8 space-y-4">
                          <p className="text-amber-800 font-bold text-lg">Your kingdom is under siege by the great green beast!</p>
                          <p className="text-slate-600 font-medium">To survive, you must empower your guardian through ancient knowledge. Channel Maths to attack, Science to heal, and master English to weave shields of protection.</p>
                        </div>
                        <button 
                          onClick={() => setGameState(prev => ({ ...prev, phase: 'POWER_UP' }))}
                          className="cartoon-button cartoon-button-primary text-2xl px-12 py-5 scale-110 flex items-center gap-3 animate-pulse mx-auto"
                        >
                          TO ARMS! <ChevronRight className="w-8 h-8 stroke-[3]" />
                        </button>
                      </motion.div>
                    </div>
                  )}

                  {/* Question Overlay */}
                  {gameState.phase === 'QUESTION' && gameState.activeQuestion && (
                    <div className="absolute inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-6">
                      <div className="w-full max-w-2xl">
                        <QuestionPanel 
                          question={gameState.activeQuestion}
                          onAnswer={handleAnswer}
                          showAnswer={showAnswer}
                          selectedOption={selectedOption}
                          isCorrect={isCorrect}
                        />
                      </div>
                    </div>
                  )}

                  {/* Victory/Defeat Overlays */}
                  {(gameState.phase === 'VICTORY' || gameState.phase === 'DEFEAT') && (
                    <div className="absolute inset-0 z-50 bg-slate-900/80 backdrop-blur-xl flex items-center justify-center p-6 text-center">
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="cartoon-panel bg-white p-12 max-w-md shadow-[10px_10px_0px_0px_rgba(30,41,59,1)] border-4 border-slate-900"
                      >
                        {gameState.phase === 'VICTORY' ? (
                          <>
                            <div className="w-32 h-32 bg-yellow-400 border-4 border-amber-900 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[4px_4px_0px_0px_rgba(120,66,18,1)]">
                              <Trophy className="w-16 h-16 text-white drop-shadow-lg" />
                            </div>
                            <h2 className="text-5xl font-black italic text-amber-900 mb-2">VICTORY!</h2>
                            <p className="text-xl text-amber-800 font-bold mb-8 uppercase tracking-widest">Dragon Vanquished</p>
                            <button 
                              onClick={nextLevel}
                              className="cartoon-button cartoon-button-primary text-xl px-12 py-4 w-full"
                            >
                              FACE NEXT CHALLENGE
                            </button>
                          </>
                        ) : (
                          <>
                            <div className="w-32 h-32 bg-slate-200 border-4 border-slate-900 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[4px_4px_0px_0px_rgba(30,41,59,1)]">
                              <Skull className="w-16 h-16 text-slate-900 drop-shadow-lg" />
                            </div>
                            <h2 className="text-5xl font-black italic text-slate-900 mb-2">FALLEN...</h2>
                            <p className="text-xl text-slate-600 font-bold mb-8 uppercase tracking-widest">The Kingdom Burns</p>
                            <button 
                              onClick={restart}
                              className="cartoon-button bg-slate-700 hover:bg-slate-600 text-white border-slate-900 text-xl px-12 py-4 w-full"
                            >
                              TRY ONCE MORE
                            </button>
                          </>
                        )}
                      </motion.div>
                    </div>
                  )}
                </div>
              </div>

              {/* Interaction Panel - Strictly for Action Buttons */}
              <div className="h-[180px] cartoon-panel p-5 flex flex-col gap-4 relative overflow-hidden mt-2">
                <div className="absolute top-0 left-0 w-full h-2 bg-amber-900/10" />
                
                <div className="flex items-center gap-4 px-2">
                  <div className="h-px flex-1 bg-amber-900/10" />
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-900/70 italic whitespace-nowrap">
                    {getInstructionText()}
                  </p>
                  <div className="h-px flex-1 bg-amber-900/10" />
                </div>

                {isLoading ? (
                  <div className="flex-1 flex flex-col items-center justify-center gap-3">
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <RotateCcw className="w-8 h-8 text-indigo-500" />
                    </motion.div>
                    <p className="text-xs font-black text-indigo-600 uppercase tracking-widest animate-pulse">
                      Consulting Ancient Tomes...
                    </p>
                  </div>
                ) : (
                  <div className="flex-1">
                    {/* Player Turn Actions */}
                    {(gameState.phase === 'POWER_UP' || gameState.phase === 'START') && (
                      <div className="grid grid-cols-2 h-full gap-4">
                        <ActionButton 
                          icon={<Swords className="w-10 h-10 text-red-600" />}
                          title="MATH MAGIC"
                          subject={Subject.MATH}
                          description="Sharpen your focus and weapon power!"
                          onClick={() => startPowerUp(Subject.MATH)}
                          colorClass="bg-red-50 border-red-900"
                        />
                        <ActionButton 
                          icon={<FlaskConical className="w-10 h-10 text-emerald-600" />}
                          title="SCIENCE LAB"
                          subject={Subject.SCIENCE}
                          description="Brew potions to restore your vitality!"
                          onClick={() => startPowerUp(Subject.SCIENCE)}
                          colorClass="bg-emerald-50 border-emerald-900"
                        />
                      </div>
                    )}

                    {/* Attack Confirm Actions */}
                    {gameState.phase === 'PLAYER_ATTACK' && (
                      <div className="flex items-center justify-center h-full">
                        <button 
                          onClick={playerAttack}
                          className="cartoon-button cartoon-button-danger text-2xl px-16 py-6 scale-110 flex items-center gap-4 animate-bounce"
                        >
                          <Swords className="w-10 h-10 stroke-[3]" /> STRIKE FOR {gameState.attackPower}!
                        </button>
                      </div>
                    )}

                    {/* Dragon Turn Actions (Defend) */}
                    {gameState.phase === 'DRAGON_ATTACK' && (
                      <div className="grid grid-cols-1 h-full">
                        <ActionButton 
                          icon={<Shield className="w-10 h-10 text-blue-600" />}
                          title="ENGLISH DEFENCE"
                          subject={Subject.ENGLISH}
                          description="Master grammar to weave protective shields against the dragon's breath!"
                          onClick={startDefend}
                          colorClass="bg-blue-50 border-blue-900"
                        />
                      </div>
                    )}

                    {/* Shared waiting state between actions */}
                    {gameState.phase === 'QUESTION' && (
                      <div className="flex h-full items-center justify-center gap-4 text-amber-900/40 font-black italic uppercase tracking-widest text-2xl">
                        <Star className="w-8 h-8 animate-spin" />
                        Awaiting Result...
                        <Star className="w-8 h-8 animate-spin-reverse" />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </AnimatePresence>

        <div className="mt-auto py-2 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-900/40 italic">
            Designed by Aanya Prashar
          </p>
        </div>
      </main>

      <style>{`
        .glass {
          background: rgba(15, 23, 42, 0.7);
          backdrop-filter: blur(12px);
        }
        .neon-border {
          box-shadow: 0 0 15px rgba(34, 211, 238, 0.1);
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(71, 85, 105, 0.5);
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}

function SetupScreen({ onStart }: { onStart: (name: string, difficulty: number, avatarUrl: string) => void }) {
  const [name, setName] = useState('');
  const [diff, setDiff] = useState(5);
  const [avatarId, setAvatarId] = useState('wizard');
  const [customAvatar, setCustomAvatar] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCustomAvatar(reader.result as string);
        setAvatarId('custom');
      };
      reader.readAsDataURL(file);
    }
  };

  const currentAvatarUrl = avatarId === 'custom' 
    ? customAvatar! 
    : AVATARS.find(a => a.id === avatarId)?.icon || '/WizardSprite.png';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex-1 flex items-center justify-center p-4"
    >
      <div className="cartoon-panel p-8 w-full max-w-lg flex flex-col gap-6 relative bg-white">
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-24 h-24 bg-cyan-400 border-4 border-amber-900 rounded-full flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(120,66,18,1)] z-10 overflow-hidden">
          {avatarId === 'custom' && customAvatar ? (
            <img src={customAvatar} className="w-full h-full object-cover" alt="Custom Avatar" />
          ) : (
            <Shield className="w-12 h-12 text-amber-900 stroke-[3]" />
          )}
        </div>
        
        <div className="text-center mt-6">
          <h1 className="text-4xl font-black tracking-tight uppercase italic text-amber-900">Dragon Defence</h1>
          <p className="text-amber-800 font-bold tracking-widest text-sm mt-1">HEROIC KINGDOM QUEST</p>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase font-black text-amber-900 mb-2 opacity-60">Guardian Name</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your Legend..."
                  className="w-full bg-amber-50 border-4 border-amber-900 p-3 rounded-2xl focus:outline-none focus:ring-4 focus:ring-cyan-200 transition-all font-bold placeholder:text-amber-900/20 text-sm"
                />
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-[10px] uppercase font-black text-amber-900 opacity-60">Challenge Level</label>
                  <span className="bg-amber-900 text-white px-2 py-0.5 rounded-full text-[10px] font-bold">YEAR {diff}</span>
                </div>
                <input 
                  type="range" 
                  min="1" 
                  max="12" 
                  value={diff}
                  onChange={(e) => setDiff(parseInt(e.target.value))}
                  className="w-full h-2 bg-amber-200 rounded-full appearance-none cursor-pointer accent-cyan-500 border-2 border-amber-900"
                />
                <div className="flex justify-between mt-2 text-[10px] text-amber-900/60 font-black">
                  <span>INITIATE</span>
                  <span>VETERAN</span>
                  <span>HERO</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <label className="block text-[10px] uppercase font-black text-amber-900 mb-2 opacity-60">Hero Avatar</label>
              <div className="grid grid-cols-2 gap-2">
                {AVATARS.map((av) => (
                  <button
                    key={av.id}
                    onClick={() => setAvatarId(av.id)}
                    className={`
                      relative p-3 rounded-2xl border-4 transition-all flex flex-col items-center gap-1 group
                      ${avatarId === av.id 
                        ? 'bg-cyan-50 border-cyan-500 scale-[1.05]' 
                        : 'bg-amber-50 border-amber-900/10 grayscale opacity-70 hover:opacity-100 hover:grayscale-0'
                      }
                    `}
                  >
                    <div className={`p-2 rounded-xl border-2 ${avatarId === av.id ? 'bg-cyan-500 text-white border-cyan-600' : 'bg-white text-amber-900 border-amber-900/20 group-hover:border-amber-900'}`}>
                      {av.uiIcon}
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-tighter">{av.name}</span>
                    {avatarId === av.id && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-cyan-600 rounded-full flex items-center justify-center">
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-2 h-2 bg-white rounded-full" />
                      </div>
                    )}
                  </button>
                ))}
                
                {/* Custom Avatar Upload */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className={`
                    relative p-3 rounded-2xl border-4 border-dashed transition-all flex flex-col items-center justify-center gap-1 group
                    ${avatarId === 'custom' 
                      ? 'bg-cyan-50 border-cyan-500 scale-[1.05]' 
                      : 'bg-amber-50 border-amber-900/10 opacity-70 hover:opacity-100'
                    }
                  `}
                >
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleFileUpload} 
                  />
                  <div className={`p-2 rounded-xl border-2 ${avatarId === 'custom' ? 'bg-cyan-500 text-white border-cyan-600' : 'bg-white text-amber-900 border-amber-900/20 group-hover:border-amber-900'}`}>
                    <User className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-tighter">Upload</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <button 
          onClick={() => name && onStart(name, diff, currentAvatarUrl)}
          disabled={!name}
          className="cartoon-button cartoon-button-primary text-xl disabled:opacity-50 disabled:grayscale mt-2 py-4"
        >
          START ADVENTURE!
        </button>
      </div>
    </motion.div>
  );
}

function Header({ gameState }: { gameState: GameState }) {
  return (
    <div className="flex justify-between items-start pointer-events-none">
      <div className="cartoon-panel p-3 bg-white flex items-center gap-4 min-w-[240px] shadow-[4px_4px_0px_0px_rgba(120,66,18,1)] border-2 pointer-events-auto">
        <div className="w-16 h-16 bg-cyan-100 border-4 border-amber-900 rounded-2xl flex items-center justify-center overflow-hidden">
          <img 
            src={gameState.playerAvatar} 
            className="w-full h-full object-cover" 
            alt="Hero Avatar" 
          />
        </div>
          <div>
            <span className="text-lg font-black uppercase text-amber-900 tracking-tight leading-none block mb-1">{gameState.playerName || 'Hero'}</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="bg-cyan-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-tighter">YEAR {gameState.difficulty}</span>
            </div>
          </div>
          <div className="h-4 w-44 bg-amber-100 mt-2 rounded-full border-2 border-amber-900 overflow-hidden relative">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${(gameState.playerHealth / gameState.playerMaxHealth) * 100}%` }}
              className="h-full bg-emerald-400"
            />
            <div className="absolute inset-0 flex items-center justify-center mix-blend-overlay">
               <span className="text-[10px] font-black">{gameState.playerHealth} / {gameState.playerMaxHealth}</span>
            </div>
          </div>
        </div>

      <div className="flex flex-col items-end gap-2 pointer-events-auto">
        <div className="cartoon-panel p-3 bg-white border-2 border-red-900 flex items-center gap-4 shadow-[4px_4px_0px_0px_rgba(127,29,29,1)]">
           <div className="text-right">
            <span className="text-[10px] uppercase text-red-900 font-black block leading-none mb-1">Dragon Threat</span>
            <span className="text-lg font-black text-red-600 italic tracking-tighter">BLOODWING</span>
          </div>
          <div className="h-10 w-3 bg-red-100 rounded-lg border-2 border-red-900 overflow-hidden">
             <motion.div 
              initial={{ height: 0 }}
              animate={{ height: `${(gameState.dragonHealth / gameState.dragonMaxHealth) * 100}%` }}
              className="w-full bg-red-500 absolute bottom-0"
              style={{ position: 'relative' }}
            />
          </div>
        </div>
        <div className="flex gap-2">
          <StatBadge icon={<Swords className="w-4 h-4" />} label="ATK" value={gameState.attackPower} color="text-red-700 font-black" />

        </div>
      </div>
    </div>
  );
}

function StatBadge({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: number, color: string }) {
  return (
    <div className="bg-white border-2 border-amber-900 px-3 py-1 rounded-xl shadow-[2px_2px_0px_0px_rgba(120,66,18,1)] flex items-center gap-2">
      <span className={color.split(' ')[0]}>{icon}</span>
      <span className={`text-xs font-black uppercase tracking-tighter ${color}`}>{label}: {value}</span>
    </div>
  );
}

function CombatStage({ gameState }: { gameState: GameState }) {
  return (
    <div className="absolute inset-0 flex flex-col justify-end items-center pb-0 overflow-hidden">
      {/* Background Clouds within play area */}
      <div className="absolute inset-x-0 top-0 h-2/3 pointer-events-none opacity-40">
        <motion.div 
          animate={{ x: [-100, 1000] }} 
          transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
          className="absolute top-[10%] left-0 text-7xl"
        >☁️</motion.div>
        <motion.div 
          animate={{ x: [1000, -100] }} 
          transition={{ duration: 55, repeat: Infinity, ease: "linear", delay: -20 }}
          className="absolute top-[25%] right-0 text-8xl scale-flip"
        >☁️</motion.div>
        <motion.div 
          animate={{ x: [-150, 1200] }} 
          transition={{ duration: 65, repeat: Infinity, ease: "linear", delay: -10 }}
          className="absolute top-[40%] left-[-50px] text-6xl opacity-50"
        >☁️</motion.div>
      </div>

      {/* Horizon / Ground */}
      <div className="absolute bottom-0 w-full h-1/4 bg-ground-pattern border-t-8 border-emerald-700 shadow-[inset_0_20px_40px_rgba(0,0,0,0.1)]">
        {/* Grass details */}
        <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'linear-gradient(45deg, #064e3b 25%, transparent 25%)', backgroundSize: '40px 40px' }} />
      </div>
      
      {/* Castle - Positioned on the left as the target of defence */}
      <div className="absolute bottom-[5%] left-0 w-[484px] h-[352px] flex flex-col items-center justify-end pointer-events-none z-10 -translate-x-12">
        <TransparentSprite 
          src="/Castle.png" 
          alt="Castle" 
          className="w-full h-full object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.3)] opacity-90"
        />
      </div>

      <div className="relative w-full h-full flex flex-col justify-between items-end px-8 pt-4 pb-32">
        {/* Dragon Shadow on the ground */}
        <motion.div 
          animate={{ 
            y: [0, 0, 0],
            x: [0, -25, 0],
            scaleX: [0.5, 0.7, 0.5],
            opacity: [0.1, 0.2, 0.1]
          }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-8 right-12 w-80 h-16 bg-black/40 blur-2xl rounded-[100%] z-0 pointer-events-none"
        />

        {/* Dragon - Idle floating motion only */}
        <motion.div 
          initial={{ x: 0, y: -40, rotate: -10 }}
          animate={{ 
            y: [-40, -80, -40],
            x: [0, -25, 0],
            rotate: [-10, -15, -10]
          }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="relative z-30 flex flex-col items-center mr-12"
        >
          <div className="relative">
            <div className="w-[360px] h-[360px] flex items-center justify-center">
               {gameState.dragonHealth > 0 ? (
                 <TransparentSprite 
                   src="/Dragon.png" 
                   alt="Dragon"
                   className="w-full h-full object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
                 />
               ) : (
                 <div className="text-[150px]">💀</div>
               )}
            </div>
            
            {/* Health status is monitored by the game logic, not shown directly above dragon anymore */}
          </div>
        </motion.div>

        {/* Player Shadow */}
        <motion.div 
          animate={{ 
            scale: [0.6, 0.8, 0.6],
            opacity: [0.15, 0.25, 0.15]
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-4 left-32 w-32 h-6 bg-black/40 blur-xl rounded-[100%] z-0 pointer-events-none"
        />

        {/* Player - standing in front of the castle */}
        <div className="absolute bottom-6 left-32 z-40">
          <motion.div 
             animate={{
                y: [0, -6, 0],
             }}
             transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
             className="relative flex flex-col items-center"
          >
            {/* Legend says a true wizard needs a magical aura */}
            <motion.div 
              animate={{ 
                scale: [1, 1.2, 1], 
                opacity: [0.1, 0.3, 0.1]
              }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="absolute inset-[-32px] border-4 rounded-full z-0 blur-md border-indigo-400 bg-indigo-400/10"
            />

            <div className="relative z-10 group">
              {gameState.playerHealth > 0 ? (
                <div className="w-44 h-44 relative flex items-center justify-center rounded-full overflow-hidden bg-neutral-100/10 border-4 border-indigo-400/30 shadow-[0_0_40px_rgba(129,140,248,0.4)]">
                  {/* The circular container hides square edges of the checkerboard */}
                  {gameState.playerAvatar.startsWith('data:') ? (
                    <img 
                      src={gameState.playerAvatar} 
                      alt="Hero"
                      className="w-full h-full object-contain scale-[0.9] relative z-10" 
                    />
                  ) : (
                    <TransparentSprite 
                      src={gameState.playerAvatar} 
                      alt="Hero"
                      className="w-full h-full object-contain scale-[1.3] relative z-10" 
                    />
                  )}
                  {/* Magic pulse behind wizard inside the bubble */}
                  <div className="absolute inset-0 bg-gradient-to-t from-indigo-500/20 to-transparent" />
                </div>
              ) : (
                <div className="text-9xl">⚰️</div>
              )}
            </div>
            
            {/* Player Base Info */}
            <div className="mt-2 bg-amber-900 text-white px-6 py-2 rounded-xl font-black text-sm border-2 border-white shadow-xl uppercase italic">
              {gameState.playerName || 'Defender'}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function ActionButton({ icon, title, subject, description, onClick, colorClass }: { 
  icon: React.ReactNode, 
  title: string, 
  subject: Subject, 
  description: string, 
  onClick: () => void,
  colorClass: string
}) {
  return (
    <button 
      onClick={onClick}
      className={`cartoon-button group flex gap-3 text-left p-3 h-[70px] ${colorClass}`}
    >
      <div className="flex-shrink-0 pt-0.5 transition-transform group-hover:scale-110 group-hover:rotate-6">
        {icon}
      </div>
      <div>
        <h3 className="font-black text-lg italic leading-none mb-1 uppercase tracking-tight">{title}</h3>
        <p className="text-xs font-bold text-amber-900/60 leading-tight pr-2">{description}</p>
      </div>
    </button>
  );
}

function QuestionPanel({ question, onAnswer, showAnswer, selectedOption, isCorrect }: { 
  question: Question, 
  onAnswer: (opt: string) => void,
  showAnswer: boolean,
  selectedOption: string | null,
  isCorrect: boolean
}) {
  const getSubjectColor = () => {
    switch(question.subject) {
      case Subject.MATH: return 'text-red-700';
      case Subject.SCIENCE: return 'text-emerald-700';
      case Subject.ENGLISH: return 'text-blue-700';
      default: return 'text-amber-900';
    }
  };

  const getSubjectBorder = () => {
    switch(question.subject) {
      case Subject.MATH: return 'border-red-900 shadow-[6px_6px_0px_0px_rgba(127,29,29,1)]';
      case Subject.SCIENCE: return 'border-emerald-900 shadow-[6px_6px_0px_0px_rgba(6,78,59,1)]';
      case Subject.ENGLISH: return 'border-blue-900 shadow-[6px_6px_0px_0px_rgba(30,58,138,1)]';
      default: return 'border-amber-900 shadow-[6px_6px_0px_0px_rgba(120,66,18,1)]';
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className={`cartoon-panel bg-white p-8 md:p-10 flex flex-col gap-5 border-4 ${getSubjectBorder()}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full animate-pulse ${
            question.subject === Subject.MATH ? 'bg-red-500' : 
            question.subject === Subject.SCIENCE ? 'bg-emerald-500' : 'bg-blue-500'
          }`} />
          <span className={`text-sm font-black uppercase tracking-[0.2em] ${getSubjectColor()}`}>
            {question.subject} MISSION
          </span>
        </div>
        <div className="text-[10px] font-black text-amber-900/40 uppercase tracking-widest bg-amber-50 px-2 py-1 rounded border border-amber-900/10">
          Rank: Intermediate
        </div>
      </div>
      
      <div className="space-y-2">
        <h3 className="text-3xl font-black text-amber-900 leading-[1.1] italic">
          {question.text}
        </h3>
        <div className="h-1.5 w-24 bg-amber-100 rounded-full" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
        {question.options.map((option, idx) => {
          const isSelected = selectedOption === option;
          const isRight = showAnswer && option === question.correctAnswer;
          const isWrong = showAnswer && isSelected && !isCorrect;

          return (
            <button
              key={idx}
              onClick={() => !showAnswer && onAnswer(option)}
              disabled={showAnswer}
              className={`
                cartoon-button py-4 px-5 text-sm font-black text-left flex items-center gap-4 min-h-[70px]
                ${showAnswer ? 'cursor-default transition-none !shadow-[2px_2px_0px_0px_rgba(120,66,18,1)] !translate-x-[2px] !translate-y-[2px]' : ''}
                ${isRight ? 'cartoon-button-success scale-[1.02]' : ''}
                ${isWrong ? 'cartoon-button-danger scale-[0.98]' : ''}
                ${!isRight && !isWrong ? 'bg-white text-amber-900 hover:bg-amber-50' : ''}
                ${isSelected && !showAnswer ? 'ring-4 ring-amber-200' : ''}
              `}
            >
              <div className={`
                w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center text-lg font-black border-4 border-amber-900
                ${isRight ? 'bg-emerald-600 text-white' : isWrong ? 'bg-red-600 text-white' : 'bg-amber-100 text-amber-900 group-hover:bg-amber-200'}
              `}>
                {String.fromCharCode(65 + idx)}
              </div>
              <span className="leading-tight">{option}</span>
            </button>
          );
        })}
      </div>

      {showAnswer && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="overflow-hidden"
        >
          <div className="flex items-start gap-4 p-5 bg-amber-50 rounded-2xl border-4 border-amber-900/10 mt-2">
            <div className="w-10 h-10 rounded-full bg-amber-200 flex items-center justify-center flex-shrink-0 border-2 border-amber-900/20">
              <Info className="w-6 h-6 text-amber-800" />
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest">Ancient Wisdom</p>
              <p className="text-sm text-amber-900 font-bold leading-relaxed">
                {question.explanation}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
