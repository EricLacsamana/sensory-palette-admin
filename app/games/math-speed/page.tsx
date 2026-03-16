'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Trophy, BarChart, Target, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

const SparkleIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M11.64 5.232c.184-.525.932-.525 1.117 0l1.458 4.152a1.2 1.2 0 00.838.838l4.152 1.458c.525.184.525.932 0 1.117l-4.152 1.458a1.2 1.2 0 00-.838.838l-1.458 4.152c-.184.525-.932.525-1.117 0l-1.458-4.152a1.2 1.2 0 00.838-.838l1.458-4.152z" />
    </svg>
);

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
    const [isAdaptive, setIsAdaptive] = useState(
        () => searchParams.get('adaptive') !== 'false',
    );
    const [showMetrics, setShowMetrics] = useState(
        () => searchParams.get('enableLearnerControls') === 'true',
    );

    const getStartingLevel = () => {
        const urlLevel = parseInt(searchParams.get('level') || '0', 10);
        if (urlLevel > 0 && urlLevel <= MAX_LEVEL) return urlLevel;
        if (baseDifficulty) return baseDifficulty;
        return 1; // ✨ STRICTLY LEVEL 1
    };

    const [level, setLevel] = useState<number>(getStartingLevel());
    const [streak, setStreak] = useState(0);
    const [fails, setFails] = useState(0);

    const [correctCount, setCorrectCount] = useState(0);
    const [totalCount, setTotalCount] = useState(0);
    const accuracy =
        totalCount === 0 ? 0 : Math.round((correctCount / totalCount) * 100);

    const [telemetry, setTelemetry] = useState<any[]>([]);
    const [equation, setEquation] = useState('');
    const [targetAnswer, setTargetAnswer] = useState<number | null>(null);
    const [options, setOptions] = useState<number[]>([]);
    const [feedback, setFeedback] = useState<
        'none' | 'wrong' | 'correct' | 'levelup' | 'leveldown'
    >('none');

    const timerRef = useRef<number>(0);
    const successSfx = useRef<HTMLAudioElement | null>(null);
    const retrySfx = useRef<HTMLAudioElement | null>(null);
    const levelUpSfx = useRef<HTMLAudioElement | null>(null);

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
            const distractor =
                Math.random() > 0.5 ? answer + offset : answer - offset;
            if (distractor !== answer && distractor >= 0)
                distractors.add(distractor);
        }

        setOptions(
            [answer, ...Array.from(distractors)].sort(
                () => Math.random() - 0.5,
            ),
        );
        setFeedback('none');
        timerRef.current = Date.now();
    }, []);

    useEffect(() => {
        successSfx.current = new Audio(
            'https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3',
        );
        retrySfx.current = new Audio(
            'https://assets.mixkit.co/active_storage/sfx/2003/2003-preview.mp3',
        );
        levelUpSfx.current = new Audio(
            'https://cdnjs.cloudflare.com/ajax/libs/ion-sound/3.0.7/sounds/bell_ring.mp3',
        );
        generate(level);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const handleSync = (event: MessageEvent) => {
            if (event.data?.type === 'SYNC_STATE') {
                if (event.data.payload.isAdaptive !== undefined)
                    setIsAdaptive(event.data.payload.isAdaptive);
                if (event.data.payload.enableLearnerControls !== undefined)
                    setShowMetrics(event.data.payload.enableLearnerControls);
            }
        };
        window.addEventListener('message', handleSync);
        return () => window.removeEventListener('message', handleSync);
    }, []);

    const handleSelect = (e: React.MouseEvent, opt: number) => {
        if (feedback !== 'none' || targetAnswer === null) return;
        const isCorrect = opt === targetAnswer;
        const actionType =
            (e.nativeEvent as any).pointerType === 'touch' ? 'tap' : 'click';
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
                } else setStreak(newStreak);
            } else {
                setStreak(0);
                const newFails = fails + 1;
                if (newFails >= 2 && level > 1) {
                    nextLevel = level - 1;
                    setLevel(nextLevel);
                    setFails(0);
                    levelShift = 'down';
                } else setFails(newFails);
            }
        } else {
            if (isCorrect) {
                setStreak(streak + 1);
                setFails(0);
            } else {
                setFails(fails + 1);
                setStreak(0);
            }
        }

        const newTotal = totalCount + 1;
        const newCorrect = isCorrect ? correctCount + 1 : correctCount;
        const newAccuracy = Math.round((newCorrect / newTotal) * 100);

        setTotalCount(newTotal);
        if (isCorrect) setCorrectCount(newCorrect);

        const logEntry = {
            timestamp: new Date().toISOString(),
            action: actionType,
            targetId: String(opt),
            isCorrect,
            responseTimeMs,
            metadata: {
                gameType: 'math_speed',
                currentLevel: level,
                expectedTarget: String(targetAnswer),
                equation,
                levelShift: levelShift !== 'none' ? levelShift : undefined,
                adaptiveMode: isAdaptive,
            },
        };

        const newLog = [...telemetry, logEntry];
        setTelemetry(newLog);

        window.parent.postMessage(
            {
                type: 'GAME_SCORE_UPDATE',
                score: newCorrect,
                rounds: newTotal,
                accuracy: newAccuracy,
                rawTelemetry: newLog,
            },
            '*',
        );

        if (isCorrect) {
            if (levelShift === 'up') {
                setFeedback('levelup');
                levelUpSfx.current?.play().catch(() => {});
            } else {
                setFeedback('correct');
                successSfx.current?.play().catch(() => {});
            }
            if (navigator.vibrate) navigator.vibrate([20, 40]);
            setTimeout(
                () => generate(nextLevel),
                levelShift === 'up' ? 2500 : 1200,
            );
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

    const FloatingSparkles = () => {
        const sparkleProps = [
            { top: '-10%', left: '5%', size: 40, delay: 0 },
            { top: '15%', left: '-15%', size: 28, delay: 0.2 },
            { top: '45%', left: '105%', size: 35, delay: 0.3 },
            { top: '85%', left: '90%', size: 45, delay: 0.25 },
        ];
        return (
            <div className="absolute inset-0 pointer-events-none z-20">
                {sparkleProps.map((s, i) => (
                    <motion.div
                        key={i}
                        className="absolute text-blue-400 drop-shadow-sm"
                        style={{
                            top: s.top,
                            left: s.left,
                            width: s.size,
                            height: s.size,
                        }}
                        initial={{ scale: 0, opacity: 0, rotate: 0 }}
                        animate={{
                            scale: [0, 1.2, 0],
                            opacity: [0, 1, 0],
                            rotate: 180,
                        }}
                        transition={{
                            duration: 1.5,
                            delay: s.delay,
                            repeat: Infinity,
                        }}
                    >
                        <SparkleIcon className="w-full h-full" />
                    </motion.div>
                ))}
            </div>
        );
    };

    return (
        <div className="w-full h-[100dvh] bg-[#02040a] flex flex-col justify-between p-4 overflow-hidden font-sans relative touch-none selection:bg-none">
            <div className="absolute inset-0 pointer-events-none z-0 flex items-start justify-center">
                <div className="w-[150%] h-[50%] bg-blue-600/10 blur-[100px] rounded-full" />
            </div>

            <motion.div
                animate={{ opacity: feedback === 'wrong' ? 1 : 0 }}
                className="absolute inset-0 bg-rose-500/20 pointer-events-none z-0 transition-opacity duration-300"
            />

            <div className="flex flex-wrap justify-center items-center gap-2 shrink-0 z-20 pt-2">
                {studentAge && (
                    <div className="flex items-center gap-1.5 bg-white/5 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-bold text-slate-300 uppercase tracking-widest border border-white/10 shadow-sm">
                        <User size={14} /> Age {studentAge}
                    </div>
                )}
                <div className="flex items-center gap-1.5 bg-blue-500/10 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-bold text-blue-400 uppercase tracking-widest border border-blue-500/20 shadow-sm">
                    <BarChart size={14} /> Lvl {level}
                </div>
                {showMetrics && (
                    <>
                        <div className="flex items-center gap-1.5 bg-emerald-500/10 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-bold text-emerald-400 uppercase tracking-widest border border-emerald-500/20 shadow-sm">
                            <Trophy size={14} /> Score {correctCount}
                        </div>
                        <div className="flex items-center gap-1.5 bg-purple-500/10 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-bold text-purple-400 uppercase tracking-widest border border-purple-500/20 shadow-sm">
                            <Activity size={14} /> Rounds {totalCount}
                        </div>
                        <div className="flex items-center gap-1.5 bg-amber-500/10 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-bold text-amber-400 uppercase tracking-widest border border-amber-500/20 shadow-sm">
                            <Target size={14} /> {accuracy}%
                        </div>
                    </>
                )}
            </div>

            <div className="flex-1 min-h-0 flex flex-col items-center justify-center w-full relative z-10 py-6">
                <AnimatePresence>
                    {feedback === 'levelup' && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
                            animate={{ opacity: 1, scale: 1.2, rotate: 0 }}
                            exit={{ opacity: 0, scale: 2 }}
                            className="absolute z-50 text-blue-400 font-black text-[12vmin] uppercase tracking-widest drop-shadow-[0_0_30px_rgba(96,165,250,0.8)] whitespace-nowrap text-center flex flex-col items-center"
                        >
                            <SparkleIcon className="w-16 h-16 mb-2 animate-spin-slow" />
                            LEVEL UP!
                        </motion.div>
                    )}
                </AnimatePresence>

                <motion.div
                    animate={
                        feedback === 'wrong' || feedback === 'leveldown'
                            ? { x: [-15, 15, -15, 15, 0] }
                            : feedback === 'correct'
                              ? { scale: [1, 1.05, 1] }
                              : {}
                    }
                    transition={{ duration: 0.4 }}
                    className={cn(
                        'w-full max-w-lg aspect-[2/1] max-h-full rounded-[clamp(24px,6vmin,48px)] bg-slate-900/80 border-[3px] flex items-center justify-center shadow-2xl backdrop-blur-md relative transition-colors duration-500',
                        feedback === 'correct'
                            ? 'border-blue-400 shadow-[0_0_80px_rgba(96,165,250,0.5)]'
                            : 'border-white/10',
                    )}
                >
                    <AnimatePresence mode="wait">
                        <motion.span
                            key={equation}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{ duration: 0.2 }}
                            className="text-[clamp(4rem,18vmin,8rem)] font-black text-white tracking-tighter drop-shadow-md whitespace-nowrap px-4"
                        >
                            {equation}
                        </motion.span>
                    </AnimatePresence>
                </motion.div>
            </div>

            <div className="text-center shrink-0 w-full h-[8dvh] flex items-center justify-center z-10 px-4">
                <h2
                    className={cn(
                        'text-[clamp(1.5rem,5vmin,2.5rem)] font-light tracking-tight leading-tight transition-colors',
                        feedback === 'wrong' || feedback === 'leveldown'
                            ? 'text-rose-500 font-bold'
                            : feedback === 'correct'
                              ? 'text-emerald-500 font-bold'
                              : 'text-slate-300',
                    )}
                >
                    {feedback === 'wrong' ? (
                        'Try again!'
                    ) : feedback === 'leveldown' ? (
                        "Let's try an easier one!"
                    ) : feedback === 'correct' ? (
                        'Great Job!'
                    ) : (
                        <>
                            Calculate the{' '}
                            <span className="font-semibold text-white">
                                Answer
                            </span>
                        </>
                    )}
                </h2>
            </div>

            <div className="w-full max-w-3xl mx-auto shrink-0 z-20 pb-4 px-4">
                <div
                    className={cn(
                        'grid gap-3',
                        options.length <= 2
                            ? 'grid-cols-2'
                            : options.length === 3
                              ? 'grid-cols-3'
                              : 'grid-cols-2 md:grid-cols-4',
                    )}
                >
                    <AnimatePresence mode="popLayout">
                        {options.map((opt, idx) => (
                            <motion.button
                                key={`${opt}-${idx}`}
                                layout
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                transition={{ duration: 0.3 }}
                                whileTap={{ scale: 0.94 }}
                                onClick={(e) => handleSelect(e, opt)}
                                className="min-h-[80px] h-[12dvh] max-h-[120px] w-full rounded-[clamp(16px,4vmin,32px)] border-[2px] border-white/10 hover:border-blue-400/50 transition-all shadow-xl flex items-center justify-center relative overflow-hidden bg-slate-800 backdrop-blur-sm group"
                            >
                                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                                <span className="relative z-10 text-white font-black text-[clamp(2.5rem,8vmin,5rem)] tracking-tighter">
                                    {opt}
                                </span>
                            </motion.button>
                        ))}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
