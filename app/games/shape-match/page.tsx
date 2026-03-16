'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Circle,
    Square,
    Triangle,
    Heart,
    Star,
    Diamond,
    Cloud,
    Moon,
    Hexagon,
    Octagon,
    ArrowUpCircle,
    ArrowDownCircle,
    User,
    Trophy,
    BarChart,
    Target,
    Activity,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const SparkleIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M11.64 5.232c.184-.525.932-.525 1.117 0l1.458 4.152a1.2 1.2 0 00.838.838l4.152 1.458c.525.184.525.932 0 1.117l-4.152 1.458a1.2 1.2 0 00-.838.838l-1.458 4.152c-.184.525-.932.525-1.117 0l-1.458-4.152a1.2 1.2 0 00.838-.838l1.458-4.152z" />
    </svg>
);

const ALL_SHAPES = [
    { name: 'Circle', icon: Circle },
    { name: 'Square', icon: Square },
    { name: 'Triangle', icon: Triangle },
    { name: 'Heart', icon: Heart },
    { name: 'Star', icon: Star },
    { name: 'Diamond', icon: Diamond },
    { name: 'Cloud', icon: Cloud },
    { name: 'Moon', icon: Moon },
    { name: 'Hexagon', icon: Hexagon },
    { name: 'Octagon', icon: Octagon },
];

const MAX_LEVEL = 3;

interface AdaptiveGameProps {
    studentAge?: number;
    baseDifficulty?: 1 | 2 | 3;
}

export default function ShapeMatchGame({
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
    const [target, setTarget] = useState<any>(null);
    const [options, setOptions] = useState<any[]>([]);
    const [feedback, setFeedback] = useState<
        'none' | 'wrong' | 'correct' | 'levelup' | 'leveldown'
    >('none');

    const timerRef = useRef(Date.now());
    const successSfx = useRef<HTMLAudioElement | null>(null);
    const retrySfx = useRef<HTMLAudioElement | null>(null);
    const levelUpSfx = useRef<HTMLAudioElement | null>(null);

    const generate = useCallback((currentLevel: number) => {
        const optionCount = currentLevel === 1 ? 2 : currentLevel === 2 ? 4 : 6;
        const shapePool =
            currentLevel === 1 ? ALL_SHAPES.slice(0, 4) : ALL_SHAPES;
        const nextTarget =
            shapePool[Math.floor(Math.random() * shapePool.length)];
        const shuffled = [...shapePool]
            .sort(() => Math.random() - 0.5)
            .slice(0, optionCount);
        if (!shuffled.find((i) => i.name === nextTarget.name))
            shuffled[0] = nextTarget;

        setTarget(nextTarget);
        setOptions(shuffled.sort(() => Math.random() - 0.5));
        setFeedback('none');
        timerRef.current = Date.now();
    }, []);

    useEffect(() => {
        successSfx.current = new Audio(
            'https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3',
        );
        retrySfx.current = new Audio(
            'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3',
        );
        levelUpSfx.current = new Audio(
            'https://cdnjs.cloudflare.com/ajax/libs/ion-sound/3.0.7/sounds/bell_ring.mp3',
        );
        generate(level);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const handleLiveMessage = (event: MessageEvent) => {
            if (event.data?.type === 'SYNC_STATE') {
                if (event.data.payload.isAdaptive !== undefined)
                    setIsAdaptive(event.data.payload.isAdaptive);
                if (event.data.payload.enableLearnerControls !== undefined)
                    setShowMetrics(event.data.payload.enableLearnerControls);
            }
        };
        window.addEventListener('message', handleLiveMessage);
        return () => window.removeEventListener('message', handleLiveMessage);
    }, []);

    const handleSelect = (e: React.MouseEvent, opt: any) => {
        if (feedback !== 'none') return;
        const isCorrect = opt.name === target.name;
        const actionType =
            (e.nativeEvent as any).pointerType === 'touch' ? 'tap' : 'click';
        const responseTimeMs = Date.now() - timerRef.current;

        let newLevel = level;
        let levelShift = 'none';

        if (isAdaptive) {
            if (isCorrect) {
                setFails(0);
                const newStreak = streak + 1;
                setStreak(newStreak);
                if (newStreak >= 3 && level < 3) {
                    newLevel = level + 1;
                    setLevel(newLevel);
                    setStreak(0);
                    levelShift = 'up';
                }
            } else {
                setStreak(0);
                const newFails = fails + 1;
                setFails(newFails);
                if (newFails >= 2 && level > 1) {
                    newLevel = level - 1;
                    setLevel(newLevel);
                    setFails(0);
                    levelShift = 'down';
                }
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
            targetId: opt.name,
            isCorrect,
            responseTimeMs,
            metadata: {
                gameType: 'shape_match',
                currentLevel: level,
                expectedTarget: target.name,
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
            setTimeout(
                () => generate(newLevel),
                levelShift === 'up' ? 2500 : 1200,
            );
        } else {
            if (levelShift === 'down') setFeedback('leveldown');
            else setFeedback('wrong');
            retrySfx.current?.play().catch(() => {});
            setTimeout(() => {
                if (levelShift === 'down') generate(newLevel);
                else setFeedback('none');
            }, 1000);
        }
    };

    if (!target) return null;

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
                        className="absolute text-emerald-400 drop-shadow-sm"
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
        <div className="w-full h-[100dvh] bg-[#fcfcfd] dark:bg-[#0a0c12] flex flex-col justify-between p-4 overflow-hidden font-sans relative touch-none selection:bg-none">
            <motion.div
                animate={{ opacity: feedback === 'wrong' ? 1 : 0 }}
                className="absolute inset-0 bg-rose-500/20 pointer-events-none z-0 transition-opacity duration-300"
            />

            <div className="flex flex-wrap justify-center items-center gap-2 shrink-0 z-20 h-[8dvh]">
                {studentAge && (
                    <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-white/10 px-3 py-1.5 rounded-full text-xs font-bold text-slate-500 uppercase tracking-widest shadow-sm">
                        <User size={14} /> Age {studentAge}
                    </div>
                )}
                <div className="flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1.5 rounded-full text-xs font-bold text-indigo-600 uppercase tracking-widest shadow-sm border border-indigo-100">
                    <BarChart size={14} /> Lvl {level}
                </div>
                {showMetrics && (
                    <>
                        <div className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1.5 rounded-full text-xs font-bold text-emerald-600 uppercase tracking-widest shadow-sm border border-emerald-100">
                            <Trophy size={14} /> Score {correctCount}
                        </div>
                        <div className="flex items-center gap-1.5 bg-purple-50 dark:bg-purple-900/30 px-3 py-1.5 rounded-full text-xs font-bold text-purple-600 uppercase tracking-widest shadow-sm border border-purple-100">
                            <Activity size={14} /> Rounds {totalCount}
                        </div>
                        <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-900/30 px-3 py-1.5 rounded-full text-xs font-bold text-amber-600 uppercase tracking-widest shadow-sm border border-amber-100">
                            <Target size={14} /> {accuracy}%
                        </div>
                    </>
                )}
            </div>

            <div className="flex-1 min-h-0 flex flex-col items-center justify-center w-full relative z-10 p-4">
                <AnimatePresence>
                    {feedback === 'levelup' && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
                            animate={{ opacity: 1, scale: 1.2, rotate: 0 }}
                            exit={{ opacity: 0, scale: 2 }}
                            className="absolute z-50 text-emerald-500 font-black text-[12vmin] uppercase tracking-widest drop-shadow-[0_0_30px_rgba(16,185,129,0.8)] whitespace-nowrap text-center flex flex-col items-center"
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
                              ? { scale: [1, 1.1, 1] }
                              : {}
                    }
                    transition={{ duration: 0.4 }}
                    className={cn(
                        'aspect-square max-h-full max-w-full w-auto h-full min-w-[120px] rounded-[25%] bg-white dark:bg-white/5 border shadow-xl flex items-center justify-center relative transition-colors duration-500',
                        feedback === 'correct'
                            ? 'border-emerald-400 shadow-[0_0_80px_rgba(52,211,153,0.5)]'
                            : 'border-slate-200 dark:border-white/10',
                    )}
                >
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={target.name}
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.5 }}
                            transition={{ duration: 0.3 }}
                            className="w-full h-full flex items-center justify-center text-indigo-500"
                        >
                            <target.icon
                                className="w-[50%] h-[50%] drop-shadow-sm"
                                strokeWidth={1.5}
                            />
                        </motion.div>
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
                              : 'text-slate-800 dark:text-slate-100',
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
                            Find the{' '}
                            <span className="font-semibold text-indigo-500">
                                {target.name}
                            </span>
                        </>
                    )}
                </h2>
            </div>

            <div className="w-full max-w-3xl mx-auto shrink-0 z-20 pb-4 px-4">
                <div
                    className={cn(
                        'grid gap-3',
                        options.length <= 4
                            ? 'grid-cols-2'
                            : 'grid-cols-2 md:grid-cols-3',
                    )}
                >
                    <AnimatePresence mode="popLayout">
                        {options.map((opt) => (
                            <motion.button
                                key={opt.name}
                                layout
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                transition={{ duration: 0.3 }}
                                whileTap={{ scale: 0.94 }}
                                onClick={(e) => handleSelect(e, opt)}
                                className="min-h-[80px] h-[12dvh] max-h-[100px] w-full rounded-[24px] border-[2px] border-slate-200 dark:border-white/10 bg-white/50 dark:bg-white/5 backdrop-blur-md flex flex-col items-center justify-center text-[clamp(0.8rem,2.5vmin,1.2rem)] font-bold uppercase tracking-wider text-slate-500 transition-all hover:bg-white hover:text-indigo-600 hover:shadow-md hover:border-indigo-300"
                            >
                                <opt.icon
                                    className="w-[clamp(1.5rem,5vmin,2.5rem)] h-[clamp(1.5rem,5vmin,2.5rem)] mb-1 shrink-0"
                                    strokeWidth={1.5}
                                />
                                <span className="truncate">{opt.name}</span>
                            </motion.button>
                        ))}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
