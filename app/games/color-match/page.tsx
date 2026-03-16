'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

const SparkleIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M11.64 5.232c.184-.525.932-.525 1.117 0l1.458 4.152a1.2 1.2 0 00.838.838l4.152 1.458c.525.184.525.932 0 1.117l-4.152 1.458a1.2 1.2 0 00-.838.838l-1.458 4.152c-.184.525-.932.525-1.117 0l-1.458-4.152a1.2 1.2 0 00.838-.838l1.458-4.152z" />
    </svg>
);

const ALL_COLORS = [
    { name: 'Red', hex: '#F43F5E' },
    { name: 'Blue', hex: '#3B82F6' },
    { name: 'Green', hex: '#10B981' },
    { name: 'Yellow', hex: '#F59E0B' },
    { name: 'Orange', hex: '#F97316' },
    { name: 'Purple', hex: '#8B5CF6' },
    { name: 'Pink', hex: '#EC4899' },
    { name: 'Teal', hex: '#06B6D4' },
    { name: 'Indigo', hex: '#4F46E5' },
    { name: 'Lime', hex: '#84CC16' },
];

const MAX_LEVEL = 3;

interface AdaptiveGameProps {
    studentAge?: number;
    baseDifficulty?: 1 | 2 | 3;
}

export default function ColorMatchGame({
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
    const [target, setTarget] = useState<any>(null);
    const [options, setOptions] = useState<any[]>([]);
    const [feedback, setFeedback] = useState<
        'none' | 'wrong' | 'correct' | 'levelup' | 'leveldown'
    >('none');

    const timerRef = useRef<number>(0);
    const successSfx = useRef<HTMLAudioElement | null>(null);
    const retrySfx = useRef<HTMLAudioElement | null>(null);
    const levelUpSfx = useRef<HTMLAudioElement | null>(null);

    const generate = useCallback((currentLevel: number) => {
        const optionCount = currentLevel === 1 ? 2 : currentLevel === 2 ? 4 : 6;
        const nextTarget =
            ALL_COLORS[Math.floor(Math.random() * ALL_COLORS.length)];
        const shuffled = [...ALL_COLORS]
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

    const handleSelect = (e: React.MouseEvent, opt: any) => {
        if (feedback !== 'none') return;
        const isCorrect = opt.name === target.name;
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
            targetId: opt.name,
            isCorrect,
            responseTimeMs,
            metadata: {
                gameType: 'color_match',
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
                () => generate(nextLevel),
                levelShift === 'up' ? 2500 : 1500,
            );
        } else {
            if (levelShift === 'down') setFeedback('leveldown');
            else setFeedback('wrong');
            retrySfx.current?.play().catch(() => {});
            setTimeout(() => {
                if (levelShift === 'down') generate(nextLevel);
                else setFeedback('none');
            }, 1500);
        }
    };

    if (!target) return null;

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

            {/* ✨ FIX: min-h-[200px] guarantees the whiteboard stays massive */}
            <div className="flex-1 min-h-[200px] flex flex-col items-center justify-center w-full relative z-20 py-4">
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
                        'aspect-square min-h-[180px] max-h-[35vh] max-w-[35vh] w-auto h-full rounded-[48px] border-[12px] flex items-center justify-center relative transition-all duration-300 shadow-lg',
                        feedback === 'correct'
                            ? 'bg-green-100 border-green-400'
                            : feedback === 'wrong' || feedback === 'leveldown'
                              ? 'bg-orange-100 border-orange-300'
                              : `bg-white ${theme.cardBorder}`,
                    )}
                >
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={target.name}
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.5 }}
                            transition={{ type: 'spring', bounce: 0.4 }}
                            className="w-[60%] h-[60%] rounded-full shadow-inner border-8 border-white/50"
                            style={{ backgroundColor: target.hex }}
                        />
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
                    {feedback === 'wrong' ? (
                        "Let's try again! You can do it!"
                    ) : feedback === 'leveldown' ? (
                        "Let's practice an easier one!"
                    ) : feedback === 'correct' ? (
                        'Great Job! 🌟'
                    ) : (
                        <>
                            Find the color{' '}
                            <span className="text-indigo-500">
                                {target.name}
                            </span>
                        </>
                    )}
                </h2>
            </div>

            {/* ✨ FIX: grid-cols-3 forces maximum 2 rows so it never steals height */}
            <div className="w-full max-w-4xl mx-auto shrink-0 z-20 pb-4 px-4">
                <div
                    className={cn(
                        'grid gap-4 md:gap-6',
                        options.length <= 4 ? 'grid-cols-2' : 'grid-cols-3',
                    )}
                >
                    <AnimatePresence mode="popLayout">
                        {options.map((opt, idx) => (
                            <motion.button
                                key={opt.name}
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
                                    boxShadow: '0 0px 0 #cbd5e1',
                                }}
                                onClick={(e) => handleSelect(e, opt)}
                                className={cn(
                                    'min-h-[90px] h-[12dvh] max-h-[140px] w-full rounded-[24px] md:rounded-[32px] border-4 border-slate-200 bg-white transition-all flex flex-col items-center justify-center relative overflow-hidden focus:outline-none focus:ring-8 focus:ring-slate-300/50 group shadow-[0_8px_0_#cbd5e1] hover:border-slate-300',
                                )}
                                aria-label={`Select ${opt.name}`}
                            >
                                <div
                                    className="w-10 h-10 md:w-14 md:h-14 rounded-full mb-1 shadow-inner shrink-0 border-4 border-slate-100 group-hover:scale-110 transition-transform"
                                    style={{ backgroundColor: opt.hex }}
                                />
                                <span className="text-sm md:text-xl font-black text-slate-600 uppercase tracking-widest truncate px-1">
                                    {opt.name}
                                </span>
                            </motion.button>
                        ))}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
