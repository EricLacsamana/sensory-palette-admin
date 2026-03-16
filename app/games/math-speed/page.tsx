'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Trophy, Target } from 'lucide-react';
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
        return 1;
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
                levelShift === 'up' ? 2500 : 1500,
            );
        } else {
            if (levelShift === 'down') setFeedback('leveldown');
            else setFeedback('wrong');
            retrySfx.current?.play().catch(() => {});
            if (navigator.vibrate) navigator.vibrate([100, 100]);
            setTimeout(() => {
                if (levelShift === 'down') generate(nextLevel);
                else setFeedback('none');
            }, 1500);
        }
    };

    if (targetAnswer === null) return null;

    const getLevelTheme = () => {
        switch (level) {
            case 1:
                return {
                    bg: 'bg-blue-50',
                    text: 'text-blue-600',
                    cardBorder: 'border-blue-200',
                };
            case 2:
                return {
                    bg: 'bg-green-50',
                    text: 'text-green-600',
                    cardBorder: 'border-green-200',
                };
            case 3:
                return {
                    bg: 'bg-yellow-50',
                    text: 'text-yellow-600',
                    cardBorder: 'border-yellow-200',
                };
            case 4:
                return {
                    bg: 'bg-purple-50',
                    text: 'text-purple-600',
                    cardBorder: 'border-purple-200',
                };
            case 5:
                return {
                    bg: 'bg-orange-50',
                    text: 'text-orange-600',
                    cardBorder: 'border-orange-200',
                };
            default:
                return {
                    bg: 'bg-blue-50',
                    text: 'text-blue-600',
                    cardBorder: 'border-blue-200',
                };
        }
    };
    const theme = getLevelTheme();

    return (
        <div
            className={cn(
                'w-full h-[100dvh] flex flex-col justify-between p-4 md:p-8 overflow-hidden font-sans relative touch-none selection:bg-none transition-colors duration-1000',
                theme.bg,
            )}
        >
            <div className="flex flex-wrap justify-center items-center gap-4 shrink-0 z-20 pt-2">
                <div className="flex items-center gap-2 bg-white px-6 py-3 rounded-2xl text-lg font-black text-slate-600 uppercase tracking-widest border-4 border-slate-100 shadow-sm">
                    <Star size={24} className={theme.text} strokeWidth={3} />{' '}
                    Level {level}
                </div>
                {showMetrics && (
                    <div className="flex items-center gap-2 bg-white px-6 py-3 rounded-2xl text-lg font-black text-slate-600 border-4 border-slate-100 shadow-sm">
                        <Trophy
                            size={24}
                            className="text-emerald-500"
                            strokeWidth={3}
                        />{' '}
                        {correctCount} Stars
                    </div>
                )}
            </div>

            {/* ✨ FIX: min-h-[220px] and max-h-[40vh] guarantees the whiteboard stays massive */}
            <div className="flex-1 min-h-[220px] flex flex-col items-center justify-center w-full relative z-20 py-4">
                <AnimatePresence>
                    {feedback === 'levelup' && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 1.2 }}
                            className="absolute z-50 text-amber-500 font-black text-5xl md:text-7xl uppercase tracking-widest drop-shadow-md whitespace-nowrap text-center flex flex-col items-center bg-white/90 backdrop-blur-sm px-10 py-8 rounded-[40px] border-8 border-amber-200"
                        >
                            <Star className="w-20 h-20 mb-4 text-amber-400 fill-amber-400" />
                            LEVEL UP!
                        </motion.div>
                    )}
                </AnimatePresence>

                <motion.div
                    animate={
                        feedback === 'wrong' || feedback === 'leveldown'
                            ? { x: [-10, 10, -10, 10, 0] }
                            : feedback === 'correct'
                              ? { scale: [1, 1.05, 1], y: [0, -10, 0] }
                              : {}
                    }
                    transition={{ duration: 0.4 }}
                    className={cn(
                        'w-full max-w-2xl aspect-[5/3] md:aspect-[2/1] min-h-[200px] max-h-[40vh] rounded-[48px] border-[12px] flex items-center justify-center shadow-lg relative transition-all duration-300',
                        feedback === 'correct'
                            ? 'bg-green-100 border-green-400'
                            : feedback === 'wrong' || feedback === 'leveldown'
                              ? 'bg-orange-100 border-orange-300'
                              : `bg-white ${theme.cardBorder}`,
                    )}
                >
                    <AnimatePresence mode="wait">
                        <motion.span
                            key={equation}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ type: 'spring', bounce: 0.3 }}
                            className={cn(
                                'text-[clamp(5rem,18vmin,12rem)] font-black tracking-tighter whitespace-nowrap px-8',
                                feedback === 'correct'
                                    ? 'text-green-600'
                                    : feedback === 'wrong' ||
                                        feedback === 'leveldown'
                                      ? 'text-orange-600'
                                      : 'text-slate-800',
                            )}
                        >
                            {equation}
                        </motion.span>
                    </AnimatePresence>
                </motion.div>
            </div>

            <div className="text-center shrink-0 w-full h-[8dvh] flex items-center justify-center z-20 px-4">
                <h2
                    className={cn(
                        'text-2xl md:text-4xl font-black tracking-tight leading-tight transition-colors',
                        feedback === 'wrong'
                            ? 'text-orange-500'
                            : feedback === 'leveldown'
                              ? 'text-blue-500'
                              : feedback === 'correct'
                                ? 'text-green-500'
                                : 'text-slate-600',
                    )}
                >
                    {feedback === 'wrong'
                        ? "Let's try again! You can do it!"
                        : feedback === 'leveldown'
                          ? "Let's practice an easier one!"
                          : feedback === 'correct'
                            ? 'Great Job! 🌟'
                            : 'Tap the right answer:'}
                </h2>
            </div>

            {/* ✨ FIX: Tighter button sizing so it never steals height from the main stage */}
            <div className="w-full max-w-4xl mx-auto shrink-0 z-20 pb-4 px-4">
                <div
                    className={cn(
                        'grid gap-4 md:gap-6',
                        options.length <= 2
                            ? 'grid-cols-2'
                            : options.length === 3
                              ? 'grid-cols-3'
                              : 'grid-cols-2',
                    )}
                >
                    <AnimatePresence mode="popLayout">
                        {options.map((opt, idx) => {
                            const colors = [
                                'bg-blue-400 hover:bg-blue-300 border-blue-500 shadow-[0_8px_0_rgb(37,99,235)]',
                                'bg-emerald-400 hover:bg-emerald-300 border-emerald-500 shadow-[0_8px_0_rgb(22,163,74)]',
                                'bg-purple-400 hover:bg-purple-300 border-purple-500 shadow-[0_8px_0_rgb(147,51,234)]',
                                'bg-rose-400 hover:bg-rose-300 border-rose-500 shadow-[0_8px_0_rgb(225,29,72)]',
                            ];
                            const btnColor = colors[idx % colors.length];

                            return (
                                <motion.button
                                    key={`${opt}-${idx}`}
                                    layout
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    transition={{
                                        type: 'spring',
                                        bounce: 0.3,
                                        delay: idx * 0.05,
                                    }}
                                    whileTap={{
                                        scale: 0.95,
                                        y: 8,
                                        boxShadow: '0 0px 0 rgba(0,0,0,0)',
                                    }}
                                    onClick={(e) => handleSelect(e, opt)}
                                    className={cn(
                                        'min-h-[90px] h-[12dvh] max-h-[140px] w-full rounded-[24px] md:rounded-[32px] border-4 transition-all flex items-center justify-center relative overflow-hidden focus:outline-none',
                                        btnColor,
                                    )}
                                >
                                    <span className="relative z-10 text-white font-black text-5xl md:text-7xl drop-shadow-md">
                                        {opt}
                                    </span>
                                </motion.button>
                            );
                        })}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
