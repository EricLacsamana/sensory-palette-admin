'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpCircle, ArrowDownCircle, User, Trophy, BarChart } from 'lucide-react';
import { cn } from '@/lib/utils';

const MAX_LEVEL = 5;

interface AdaptiveGameProps {
    studentAge?: number;
    baseDifficulty?: 1 | 2 | 3 | 4 | 5;
}

export default function MathSpeedGame({
    studentAge,
    baseDifficulty,
}: AdaptiveGameProps) {
    const searchParams = useSearchParams();
    const [isAdaptive, setIsAdaptive] = useState(searchParams.get('adaptive') !== 'false');

    const getStartingLevel = () => {
        const urlLevel = parseInt(searchParams.get('level') || '0', 10);
        if (urlLevel > 0 && urlLevel <= MAX_LEVEL) return urlLevel;
        if (baseDifficulty) return baseDifficulty;
        if (studentAge) {
            if (studentAge <= 5) return 1;
            if (studentAge <= 7) return 2;
            if (studentAge <= 9) return 3;
            if (studentAge <= 11) return 4;
            return 5;
        }
        return 1;
    };

    const [level, setLevel] = useState<number>(getStartingLevel());
    const [streak, setStreak] = useState(0);
    const [fails, setFails] = useState(0);

    const [correctCount, setCorrectCount] = useState(0);
    const [totalCount, setTotalCount] = useState(0);
    const scorePercentage = totalCount === 0 ? 0 : Math.round((correctCount / totalCount) * 100);

    const [telemetry, setTelemetry] = useState<any[]>([]);
    const [equation, setEquation] = useState('');
    const [targetAnswer, setTargetAnswer] = useState<number | null>(null);
    const [options, setOptions] = useState<number[]>([]);
    const [feedback, setFeedback] = useState<'none' | 'wrong' | 'correct' | 'levelup' | 'leveldown'>('none');
    const [particles, setParticles] = useState<{ id: number; x: number; y: number; color: string }[]>([]);

    const timerRef = useRef<number>(0);
    const successSfx = useRef<HTMLAudioElement | null>(null);
    const retrySfx = useRef<HTMLAudioElement | null>(null);

    const generate = useCallback((currentLevel: number) => {
        let num1 = 0;
        let num2 = 0;
        let answer = 0;
        let op = '+';

        if (currentLevel === 1) {
            op = '+';
            num1 = Math.floor(Math.random() * 5) + 1;
            num2 = Math.random() > 0.5 ? 1 : 0;
            answer = num1 + num2;
        } else if (currentLevel === 2) {
            op = '+';
            num1 = Math.floor(Math.random() * 5) + 1;
            num2 = Math.floor(Math.random() * 5) + 1;
            answer = num1 + num2;
        } else if (currentLevel === 3) {
            const operators = ['+', '-'];
            op = operators[Math.floor(Math.random() * operators.length)];
            if (op === '+') {
                num1 = Math.floor(Math.random() * 8) + 3;
                num2 = Math.floor(Math.random() * 5) + 1;
                answer = num1 + num2;
            } else {
                num1 = Math.floor(Math.random() * 8) + 3;
                num2 = Math.floor(Math.random() * 2) + 1;
                answer = num1 - num2;
            }
        } else if (currentLevel === 4) {
            const operators = ['+', '-'];
            op = operators[Math.floor(Math.random() * operators.length)];
            if (op === '+') {
                num1 = Math.floor(Math.random() * 10) + 5;
                num2 = Math.floor(Math.random() * 6) + 1;
                answer = num1 + num2;
            } else {
                num1 = Math.floor(Math.random() * 10) + 6;
                num2 = Math.floor(Math.random() * 5) + 1;
                answer = num1 - num2;
            }
        } else {
            const operators = ['+', '-'];
            op = operators[Math.floor(Math.random() * operators.length)];
            if (op === '+') {
                num1 = Math.floor(Math.random() * 10) + 10;
                num2 = Math.floor(Math.random() * 9) + 1;
                answer = num1 + num2;
            } else {
                num1 = Math.floor(Math.random() * 10) + 10;
                num2 = Math.floor(Math.random() * 9) + 1;
                answer = num1 - num2;
            }
        }

        setEquation(`${num1} ${op} ${num2}`);
        setTargetAnswer(answer);

        const optionCount = currentLevel <= 2 ? 2 : currentLevel <= 4 ? 3 : 4;
        const distractors = new Set<number>();

        while (distractors.size < optionCount - 1) {
            const offset = Math.floor(Math.random() * 3) + 1;
            const distractor: number = Math.random() > 0.5 ? answer + offset : answer - offset;
            if (distractor !== answer && distractor >= 0) distractors.add(distractor);
        }

        setOptions([answer, ...Array.from(distractors)].sort(() => Math.random() - 0.5));
        setFeedback('none');
        timerRef.current = Date.now();
    }, []);

    useEffect(() => {
        successSfx.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3');
        retrySfx.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2003/2003-preview.mp3');
        generate(level);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // SYNC STATE WITH SHELL
    useEffect(() => {
        const handleSync = (event: MessageEvent) => {
            if (event.data?.type === 'SYNC_STATE') {
                if (event.data.payload.isAdaptive !== undefined) setIsAdaptive(event.data.payload.isAdaptive);
                if (event.data.payload.level !== undefined) setLevel(event.data.payload.level);
            }
        };
        window.addEventListener('message', handleSync);
        return () => window.removeEventListener('message', handleSync);
    }, []);

    const triggerExplosion = () => {
        const newParticles = Array.from({ length: 20 }).map((_, i) => ({
            id: Date.now() + i,
            x: (Math.random() - 0.5) * 400,
            y: (Math.random() - 0.5) * 400,
            color: '#60A5FA',
        }));
        setParticles(newParticles);
        setTimeout(() => setParticles([]), 800);
    };

    const handleSelect = (e: React.MouseEvent, opt: number) => {
        if (feedback !== 'none' || targetAnswer === null) return;

        const isCorrect = opt === targetAnswer;
        const nativeEvent = e.nativeEvent as any;
        const actionType = nativeEvent.pointerType === 'touch' ? 'tap' : 'click';
        const responseTimeMs = Date.now() - timerRef.current;

        let nextLevel = level;
        let levelShift: 'up' | 'down' | 'none' = 'none';

        if (isAdaptive) {
            if (isCorrect) {
                setFails(0);
                const newStreak = streak + 1;
                if (newStreak >= 3 && level < MAX_LEVEL) {
                    nextLevel = level + 1;
                    setLevel(nextLevel);
                    setStreak(0);
                    levelShift = 'up';
                } else {
                    setStreak(newStreak);
                }
            } else {
                setStreak(0);
                const newFails = fails + 1;
                if (newFails >= 2 && level > 1) {
                    nextLevel = level - 1;
                    setLevel(nextLevel);
                    setFails(0);
                    levelShift = 'down';
                } else {
                    setFails(newFails);
                }
            }
        } else {
            if (isCorrect) { setStreak(streak + 1); setFails(0); } 
            else { setFails(fails + 1); setStreak(0); }
        }

        const newTotal = totalCount + 1;
        const newCorrect = isCorrect ? correctCount + 1 : correctCount;
        const newScorePercentage = Math.round((newCorrect / newTotal) * 100);

        setTotalCount(newTotal);
        if (isCorrect) setCorrectCount(newCorrect);

        const logEntry = {
            timestamp: new Date().toISOString(),
            action: actionType,
            targetId: String(opt),
            isCorrect: isCorrect,
            responseTimeMs: responseTimeMs,
            metadata: {
                gameType: 'math_speed',
                currentLevel: level,
                expectedTarget: String(targetAnswer),
                equation: equation,
                levelShift: levelShift !== 'none' ? levelShift : undefined,
                adaptiveMode: isAdaptive,
            },
        };

        const newLog = [...telemetry, logEntry];
        setTelemetry(newLog);

        window.parent.postMessage({
            type: 'GAME_SCORE_UPDATE',
            score: newScorePercentage,
            rawTelemetry: newLog,
        }, '*');

        if (isCorrect) {
            triggerExplosion();
            if (levelShift === 'up') setFeedback('levelup');
            else setFeedback('correct');
            successSfx.current?.play().catch(() => {});
            if (navigator.vibrate) navigator.vibrate([20, 40]);
            setTimeout(() => generate(nextLevel), 1200);
        } else {
            if (levelShift === 'down') setFeedback('leveldown');
            else setFeedback('wrong');
            retrySfx.current?.play().catch(() => {});
            if (navigator.vibrate) navigator.vibrate([100, 100]);
            setTimeout(() => {
                if (levelShift === 'down') generate(nextLevel);
                else setFeedback('none');
            }, 1000);
        }
    };

    if (targetAnswer === null) return null;

    return (
        <div className="w-full h-screen bg-[#02040a] flex flex-col items-center p-3 sm:p-6 overflow-hidden relative selection:bg-none touch-none font-sans">
            <div className="absolute inset-0 pointer-events-none z-0 flex items-start justify-center">
                <div className="w-[150%] h-[50%] bg-blue-600/10 blur-[100px] rounded-full" />
            </div>

            <div className="absolute top-4 sm:top-6 left-0 right-0 flex justify-center gap-3 sm:gap-6 px-4 z-20">
                {studentAge && (
                    <div className="flex items-center gap-2 bg-white/5 backdrop-blur-md px-3 sm:px-4 py-2 rounded-full text-[10px] sm:text-xs font-bold text-slate-300 uppercase tracking-widest border border-white/10">
                        <User size={14} /> Age {studentAge}
                    </div>
                )}
                <div className="flex items-center gap-2 bg-blue-500/10 backdrop-blur-md px-3 sm:px-4 py-2 rounded-full text-[10px] sm:text-xs font-bold text-blue-400 uppercase tracking-widest border border-blue-500/20">
                    <BarChart size={14} /> Level {level}
                </div>
                <div className="flex items-center gap-2 bg-emerald-500/10 backdrop-blur-md px-3 sm:px-4 py-2 rounded-full text-[10px] sm:text-xs font-bold text-emerald-400 uppercase tracking-widest border border-emerald-500/20">
                    <Trophy size={14} /> {scorePercentage}%
                </div>
            </div>

            <main className="flex-1 min-h-0 flex flex-col items-center justify-center w-full relative z-10 py-2 mt-12">
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-30">
                    <AnimatePresence>
                        {particles.map((p) => (
                            <motion.div
                                key={p.id}
                                initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
                                animate={{ x: p.x, y: p.y, scale: 0, opacity: 0 }}
                                transition={{ duration: 0.6, ease: 'easeOut' }}
                                className="absolute w-3 h-3 sm:w-4 sm:h-4 rounded-full shadow-[0_0_10px]"
                                style={{ backgroundColor: p.color, boxShadow: `0 0 15px ${p.color}` }}
                            />
                        ))}
                    </AnimatePresence>
                </div>

                <div className="relative shrink min-h-[120px] flex items-center justify-center w-[85vw] max-w-[360px] max-h-[30vh] aspect-[4/3] mb-6">
                    <motion.div animate={{ opacity: [0.3, 0.5, 0.3] }} transition={{ repeat: Infinity, duration: 3 }} className="absolute inset-0 rounded-[40px] blur-2xl bg-blue-500/30" />
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={equation}
                            animate={feedback === 'wrong' || feedback === 'leveldown' ? { x: [-8, 8, -8, 8, 0] } : { scale: [1, 1.02, 1] }}
                            transition={feedback === 'wrong' || feedback === 'leveldown' ? { duration: 0.4 } : { repeat: Infinity, duration: 4 }}
                            className="absolute inset-0 rounded-[32px] sm:rounded-[48px] bg-slate-900/80 border-2 border-white/10 flex items-center justify-center shadow-2xl backdrop-blur-md"
                        >
                            <span className="text-[40px] sm:text-[60px] md:text-[80px] font-black text-white tracking-tighter drop-shadow-md whitespace-nowrap px-4">
                                {equation}
                            </span>
                            <AnimatePresence>
                                {feedback === 'levelup' && (
                                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute -top-14 text-emerald-400 flex flex-col items-center">
                                        <ArrowUpCircle size={36} className="animate-bounce" />
                                        <span className="text-xs font-black uppercase tracking-widest mt-1 bg-slate-900/80 px-3 py-1 rounded-full">Level Up!</span>
                                    </motion.div>
                                )}
                                {feedback === 'leveldown' && (
                                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute -top-14 text-rose-400 flex flex-col items-center">
                                        <ArrowDownCircle size={36} className="animate-bounce" />
                                        <span className="text-xs font-black uppercase tracking-widest mt-1 bg-slate-900/80 px-3 py-1 rounded-full">Easier</span>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    </AnimatePresence>
                </div>

                <div className="text-center shrink-0 min-h-[40px] mb-4">
                    <h2 className={cn('text-xl sm:text-2xl font-light tracking-tight transition-colors', feedback === 'wrong' || feedback === 'leveldown' ? 'text-rose-400' : 'text-slate-300')}>
                        {feedback === 'wrong' ? 'Try again...' : feedback === 'leveldown' ? "Let's try an easier one!" : (
                            <>Calculate the <span className="font-semibold text-white">Answer</span></>
                        )}
                    </h2>
                </div>
            </main>

            <footer className="shrink-0 w-full max-w-3xl flex justify-center pb-8 pt-2 z-20">
                <div className={cn('grid gap-4 w-full max-w-md', options.length === 2 ? 'grid-cols-2' : options.length === 3 ? 'grid-cols-3' : 'grid-cols-2')}>
                    {options.map((opt, idx) => (
                        <motion.button key={`${opt}-${idx}`} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.94 }} onClick={(e) => handleSelect(e, opt)} className="flex flex-col items-center gap-2 group relative w-full">
                            <div className="w-full aspect-square min-h-[80px] rounded-3xl sm:rounded-[32px] border-2 border-white/10 group-hover:border-blue-400/50 transition-all shadow-xl flex items-center justify-center relative overflow-hidden bg-slate-800 backdrop-blur-sm">
                                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                                <span className="relative z-10 text-white font-black text-3xl sm:text-4xl md:text-5xl tracking-tighter">{opt}</span>
                            </div>
                        </motion.button>
                    ))}
                </div>
            </footer>
        </div>
    );
}