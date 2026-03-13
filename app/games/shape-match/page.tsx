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
} from 'lucide-react';
import { cn } from '@/lib/utils';

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
        searchParams.get('adaptive') !== 'false',
    );

    const getStartingLevel = () => {
        if (baseDifficulty) return baseDifficulty;
        if (studentAge) {
            if (studentAge <= 4) return 1;
            if (studentAge <= 7) return 2;
            return 3;
        }
        return 1;
    };

    const [level, setLevel] = useState<number>(getStartingLevel());
    const [streak, setStreak] = useState(0);
    const [fails, setFails] = useState(0);

    const [score, setScore] = useState(0);
    const [telemetry, setTelemetry] = useState<any[]>([]);
    const [target, setTarget] = useState<any>(null);
    const [options, setOptions] = useState<any[]>([]);
    const [feedback, setFeedback] = useState<
        'none' | 'wrong' | 'correct' | 'levelup' | 'leveldown'
    >('none');

    const timerRef = useRef(Date.now());
    const successSfx = useRef<HTMLAudioElement | null>(null);
    const retrySfx = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        successSfx.current = new Audio(
            'https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3',
        );
        retrySfx.current = new Audio(
            'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3',
        );
        generate(level);
    }, []);

    useEffect(() => {
        const handleLiveMessage = (event: MessageEvent) => {
            if (event.data?.type === 'TOGGLE_ADAPTIVE')
                setIsAdaptive(event.data.value);
        };
        window.addEventListener('message', handleLiveMessage);
        return () => window.removeEventListener('message', handleLiveMessage);
    }, []);

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

    const handleSelect = (e: React.MouseEvent, opt: any) => {
        if (feedback !== 'none') return;
        const isCorrect = opt.name === target.name;

        const nativeEvent = e.nativeEvent as any;
        const actionType =
            nativeEvent.pointerType === 'touch' ? 'tap' : 'click';
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

        const logEntry = {
            timestamp: new Date().toISOString(),
            action: actionType,
            targetId: opt.name,
            isCorrect: isCorrect,
            responseTimeMs: responseTimeMs,
            metadata: {
                gameType: 'shape_match',
                currentLevel: level,
                expectedTarget: target.name,
                levelShift: levelShift !== 'none' ? levelShift : undefined,
                adaptiveMode: isAdaptive,
            },
        };

        const newLog = [...telemetry, logEntry];
        const newScore = isCorrect ? score + 1 : score;
        setTelemetry(newLog);
        if (isCorrect) setScore(newScore);

        window.parent.postMessage(
            {
                type: 'GAME_SCORE_UPDATE',
                score: newScore,
                rawTelemetry: newLog,
            },
            '*',
        );

        if (isCorrect) {
            if (levelShift === 'up') setFeedback('levelup');
            else setFeedback('correct');
            successSfx.current?.play().catch(() => {});
            setTimeout(() => generate(newLevel), 1200);
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

    return (
        <div className="w-full h-screen bg-[#fcfcfd] dark:bg-[#0a0c12] flex flex-col items-center justify-center p-8 overflow-hidden font-sans">
            <div className="absolute top-6 left-0 right-0 flex justify-center gap-6 px-8 opacity-80">
                {studentAge && (
                    <div className="flex items-center gap-2 bg-slate-100 dark:bg-white/10 px-4 py-2 rounded-full text-xs font-bold text-slate-500 uppercase tracking-widest">
                        <User size={14} /> Age {studentAge}
                    </div>
                )}
                <div className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-900/30 px-4 py-2 rounded-full text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
                    <BarChart size={14} /> Level {level}
                </div>
                <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/30 px-4 py-2 rounded-full text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                    <Trophy size={14} /> Score {score}
                </div>
            </div>

            <div className="relative mb-10 mt-10">
                <motion.div
                    key={target.name}
                    animate={
                        feedback === 'wrong' || feedback === 'leveldown'
                            ? { x: [-8, 8, -8, 8, 0] }
                            : { scale: [1, 1.02, 1] }
                    }
                    transition={
                        feedback === 'wrong' || feedback === 'leveldown'
                            ? { duration: 0.4 }
                            : { repeat: Infinity, duration: 4 }
                    }
                    className="w-48 h-48 rounded-[64px] bg-white dark:bg-white/5 border border-slate-200/60 dark:border-white/10 shadow-xl flex items-center justify-center relative"
                >
                    <target.icon
                        size={90}
                        strokeWidth={1.5}
                        className="text-indigo-500"
                    />
                    <AnimatePresence>
                        {feedback === 'levelup' && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="absolute -top-12 text-emerald-500 flex flex-col items-center"
                            >
                                <ArrowUpCircle
                                    size={32}
                                    className="animate-bounce"
                                />
                                <span className="text-xs font-black uppercase tracking-widest mt-1">
                                    Level Up!
                                </span>
                            </motion.div>
                        )}
                        {feedback === 'leveldown' && (
                            <motion.div
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="absolute -top-12 text-amber-500 flex flex-col items-center"
                            >
                                <ArrowDownCircle
                                    size={32}
                                    className="animate-bounce"
                                />
                                <span className="text-xs font-black uppercase tracking-widest mt-1">
                                    Easier
                                </span>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>

            <div className="text-center mb-8">
                <h2 className="text-3xl font-light text-slate-800 dark:text-slate-100 tracking-tight h-10">
                    {feedback === 'wrong' ? (
                        'Try again...'
                    ) : feedback === 'leveldown' ? (
                        "Let's try an easier one!"
                    ) : (
                        <>
                            Find the{' '}
                            <span className="font-semibold">{target.name}</span>
                        </>
                    )}
                </h2>
            </div>

            <div
                className={cn(
                    'grid gap-4 w-full max-w-md',
                    level === 1
                        ? 'grid-cols-2'
                        : level === 2
                          ? 'grid-cols-2'
                          : 'grid-cols-3',
                )}
            >
                {options.map((opt) => (
                    <motion.button
                        key={opt.name}
                        whileTap={{ scale: 0.94 }}
                        onClick={(e) => handleSelect(e, opt)}
                        className="h-20 rounded-3xl border border-slate-200/80 bg-white/50 flex flex-col items-center justify-center text-[11px] font-bold uppercase tracking-wider text-slate-500 transition-all hover:bg-white hover:text-indigo-600 hover:shadow-md"
                    >
                        <opt.icon size={24} className="mb-1.5" />
                        {opt.name}
                    </motion.button>
                ))}
            </div>
        </div>
    );
}
