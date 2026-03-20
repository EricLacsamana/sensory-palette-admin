'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

// Base colors with RGB values to allow for transparent/glassy effects
const LEVEL_1_COLORS = [
    { name: 'Red', r: 244, g: 63, b: 94 },
    { name: 'Blue', r: 59, g: 130, b: 246 },
    { name: 'Green', r: 16, g: 185, b: 129 },
    { name: 'Yellow', r: 245, g: 158, b: 11 },
];

const LEVEL_2_COLORS = [
    ...LEVEL_1_COLORS,
    { name: 'Orange', r: 249, g: 115, b: 22 },
    { name: 'Purple', r: 139, g: 92, b: 246 },
    { name: 'Pink', r: 236, g: 72, b: 153 },
];

const LEVEL_3_COLORS = [
    ...LEVEL_2_COLORS,
    { name: 'Teal', r: 6, g: 182, b: 212 },
    { name: 'Indigo', r: 79, g: 70, b: 229 },
    { name: 'Lime', r: 132, g: 204, b: 22 },
];

const MAX_LEVEL = 3;

interface AdaptiveGameProps {
    studentAge?: number;
    baseDifficulty?: 1 | 2 | 3;
}

export default function ColorPopGame({
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

    const [telemetry, setTelemetry] = useState<any[]>([]);
    const [target, setTarget] = useState<any>(null);
    const [options, setOptions] = useState<any[]>([]);
    const [feedback, setFeedback] = useState<
        'none' | 'wrong' | 'correct' | 'levelup' | 'leveldown'
    >('none');

    // Track clicked bubble and round iteration to reset animations perfectly
    const [poppedBubble, setPoppedBubble] = useState<string | null>(null);
    const [roundId, setRoundId] = useState<number>(0);

    const timerRef = useRef<number>(0);
    const popSfx = useRef<HTMLAudioElement | null>(null);
    const wrongSfx = useRef<HTMLAudioElement | null>(null);
    const levelUpSfx = useRef<HTMLAudioElement | null>(null);

    const getColorsForLevel = (currentLevel: number) => {
        if (currentLevel === 1) return LEVEL_1_COLORS;
        if (currentLevel === 2) return LEVEL_2_COLORS;
        return LEVEL_3_COLORS;
    };

    const generate = useCallback((currentLevel: number) => {
        const optionCount = currentLevel === 1 ? 2 : currentLevel === 2 ? 4 : 6;
        const availableColors = getColorsForLevel(currentLevel);

        const nextTarget =
            availableColors[Math.floor(Math.random() * availableColors.length)];

        const shuffled = [...availableColors]
            .sort(() => Math.random() - 0.5)
            .slice(0, optionCount);

        if (!shuffled.find((i) => i.name === nextTarget.name))
            shuffled[0] = nextTarget;

        setTarget(nextTarget);
        setOptions(shuffled.sort(() => Math.random() - 0.5));
        setFeedback('none');
        setPoppedBubble(null);
        setRoundId((prev) => prev + 1); // Forces fresh remount of all bubbles
        timerRef.current = Date.now();
    }, []);

    useEffect(() => {
        popSfx.current = new Audio(
            'https://assets.mixkit.co/active_storage/sfx/2870/2870-preview.mp3',
        );
        popSfx.current.volume = 0.8;

        wrongSfx.current = new Audio(
            'https://assets.mixkit.co/active_storage/sfx/2955/2955-preview.mp3',
        );
        wrongSfx.current.volume = 0.4;

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
        if (feedback !== 'none') return; // Prevent clicking while animating

        const isCorrect = opt.name === target.name;
        const actionType =
            (e.nativeEvent as any).pointerType === 'touch' ? 'tap' : 'click';
        const responseTimeMs = Date.now() - timerRef.current;

        setPoppedBubble(opt.name);

        if (isCorrect) {
            if (popSfx.current) {
                popSfx.current.currentTime = 0;
                popSfx.current.play().catch(() => {});
            }
        } else {
            if (wrongSfx.current) {
                wrongSfx.current.currentTime = 0;
                wrongSfx.current.play().catch(() => {});
            }
        }

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
                gameType: 'color_pop',
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
            }
            setTimeout(
                () => generate(nextLevel),
                levelShift === 'up' ? 2500 : 1200,
            );
        } else {
            if (levelShift === 'down') setFeedback('leveldown');
            else setFeedback('wrong');

            setTimeout(() => {
                if (levelShift === 'down') generate(nextLevel);
                else {
                    setFeedback('none');
                    setPoppedBubble(null);
                }
            }, 1000);
        }
    };

    // Helper function to generate realistic, transparent bubble styles based on RGB
    const getGlassyBubbleStyle = (r: number, g: number, b: number) => ({
        background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.7) 0%, rgba(${r},${g},${b},0.1) 30%, rgba(${r},${g},${b},0.4) 80%, rgba(${r},${g},${b},0.7) 100%)`,
        boxShadow: `inset -10px -10px 25px rgba(${r},${g},${b},0.5), inset 10px 10px 25px rgba(255,255,255,0.8), 0 10px 20px rgba(0,0,0,0.1)`,
        border: `1px solid rgba(${r},${g},${b},0.4)`,
    });

    if (!target) return null;

    const getLevelTheme = () => {
        switch (level) {
            case 1:
                return { bg: 'bg-cyan-50', text: 'text-cyan-600' };
            case 2:
                return { bg: 'bg-emerald-50', text: 'text-emerald-600' };
            case 3:
                return { bg: 'bg-fuchsia-50', text: 'text-fuchsia-600' };
            default:
                return { bg: 'bg-cyan-50', text: 'text-cyan-600' };
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
                <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-6 py-3 rounded-full text-lg font-black text-slate-600 uppercase tracking-widest shadow-sm">
                    <Star size={24} className={theme.text} strokeWidth={3} />{' '}
                    Level {level}
                </div>
                {showMetrics && (
                    <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-6 py-3 rounded-full text-lg font-black text-slate-600 shadow-sm">
                        <Trophy
                            size={24}
                            className="text-emerald-500"
                            strokeWidth={3}
                        />{' '}
                        {correctCount} Pops
                    </div>
                )}
            </div>

            <div className="flex-1 min-h-[160px] flex flex-col items-center justify-center w-full relative z-20 py-2">
                <AnimatePresence>
                    {feedback === 'levelup' && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 1.2 }}
                            className="absolute z-50 text-amber-500 font-black text-5xl md:text-7xl uppercase tracking-widest drop-shadow-md whitespace-nowrap text-center flex flex-col items-center bg-white/90 backdrop-blur-sm px-10 py-8 rounded-[40px] shadow-xl border-4 border-amber-200"
                        >
                            <Star className="w-20 h-20 mb-4 text-amber-400 fill-amber-400" />
                            LEVEL UP!
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* The Big Target Bubble */}
                <motion.div
                    key={`target-bubble-${roundId}`} // Forces completely fresh animation every round
                    initial={{ scale: 0.2, opacity: 0 }}
                    animate={
                        feedback === 'wrong' || feedback === 'leveldown'
                            ? { x: [-10, 10, -10, 10, 0], scale: 1, opacity: 1 }
                            : feedback === 'correct'
                              ? { scale: [1, 1.3, 0], opacity: [1, 1, 0] } // Instant pop effect
                              : { scale: 1, opacity: 1, y: [0, -15, 0] } // Gentle float
                    }
                    transition={{
                        y: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
                        scale:
                            feedback === 'correct'
                                ? { duration: 0.2, ease: 'easeOut' }
                                : { duration: 0.4, type: 'spring' },
                        opacity:
                            feedback === 'correct'
                                ? { duration: 0.2, ease: 'easeOut' }
                                : { duration: 0.4 },
                    }}
                    className="aspect-square min-h-[140px] max-h-[25vh] md:max-h-[35vh] w-auto h-full rounded-full flex items-center justify-center relative shadow-[0_20px_40px_-10px_rgba(0,0,0,0.2)]"
                    style={getGlassyBubbleStyle(target.r, target.g, target.b)}
                >
                    {/* Glossy reflections */}
                    <div className="absolute top-[12%] left-[15%] w-[35%] h-[30%] bg-white/80 rounded-full blur-[4px] rotate-[-20deg]" />
                    <div className="absolute bottom-[15%] right-[20%] w-[15%] h-[15%] bg-white/50 rounded-full blur-[2px]" />
                </motion.div>
            </div>

            <div className="text-center shrink-0 w-full h-[8dvh] flex items-center justify-center z-20 px-4 mb-2">
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
                        'Oops! Try another one!'
                    ) : feedback === 'leveldown' ? (
                        "Let's try some easier bubbles!"
                    ) : feedback === 'correct' ? (
                        'POP! Great Job! 🫧'
                    ) : (
                        <>
                            Pop the{' '}
                            <span
                                className="underline decoration-4 underline-offset-4"
                                style={{
                                    color: `rgb(${target.r}, ${target.g}, ${target.b})`,
                                    textShadow: '0 1px 2px rgba(0,0,0,0.1)',
                                }}
                            >
                                {target.name}
                            </span>{' '}
                            bubble!
                        </>
                    )}
                </h2>
            </div>

            {/* 🔥 FIXED OVERLAPPING: Replaced flex-wrap with a strict responsive CSS Grid */}
            <div className="w-full max-w-3xl mx-auto shrink-0 z-20 pb-6 md:pb-8 px-2">
                <div
                    className={cn(
                        'grid justify-center justify-items-center gap-4 sm:gap-6 md:gap-8',
                        options.length <= 2
                            ? 'grid-cols-2'
                            : options.length <= 4
                              ? 'grid-cols-2 sm:grid-cols-4'
                              : 'grid-cols-3', // Forces a maximum of 3 columns for 6 bubbles, creating a neat 3x2 grid
                    )}
                >
                    <AnimatePresence mode="popLayout">
                        {options.map((opt, idx) => {
                            const isSelected = poppedBubble === opt.name;
                            const isCorrectOption = opt.name === target.name;
                            const isPopping = isSelected && isCorrectOption;
                            const isShaking = isSelected && !isCorrectOption;

                            return (
                                <motion.button
                                    key={`opt-${opt.name}-${roundId}`} // Re-renders cleanly every round
                                    layout
                                    initial={{ opacity: 0, scale: 0.1, y: 50 }}
                                    animate={
                                        isPopping
                                            ? {
                                                  scale: [1, 1.4, 0],
                                                  opacity: [1, 0.8, 0],
                                              } // Rapid Burst
                                            : isShaking
                                              ? {
                                                    x: [-10, 10, -10, 10, 0],
                                                    scale: 1,
                                                    opacity: 1,
                                                } // Shake on wrong guess
                                              : {
                                                    opacity: 1,
                                                    scale: 1,
                                                    y: [0, -10, 0],
                                                } // Floating normal state
                                    }
                                    exit={{ opacity: 0, scale: 0 }}
                                    transition={
                                        isPopping
                                            ? {
                                                  duration: 0.15,
                                                  ease: 'easeOut',
                                              } // Fast burst!
                                            : isShaking
                                              ? { duration: 0.4 }
                                              : {
                                                    y: {
                                                        duration: 3 + (idx % 2),
                                                        repeat: Infinity,
                                                        ease: 'easeInOut',
                                                        delay: idx * 0.2,
                                                    },
                                                    opacity: { duration: 0.3 },
                                                    scale: { duration: 0.3 },
                                                }
                                    }
                                    onClick={(e) => handleSelect(e, opt)}
                                    // Adjusted sizing specifically for mobile so 3 bubbles fit without touching
                                    className="w-20 h-20 xs:w-24 xs:h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full relative flex flex-col items-center justify-center focus:outline-none focus:ring-4 focus:ring-white/50 cursor-pointer hover:scale-105 transition-transform"
                                    style={getGlassyBubbleStyle(
                                        opt.r,
                                        opt.g,
                                        opt.b,
                                    )}
                                    aria-label={`Pop the bubble`}
                                >
                                    {/* Small Glossy Reflections inside option bubbles */}
                                    <div className="absolute top-[15%] left-[18%] w-[30%] h-[25%] bg-white/90 rounded-full blur-[2px] rotate-[-20deg] pointer-events-none" />
                                    <div className="absolute bottom-[18%] right-[22%] w-[15%] h-[15%] bg-white/60 rounded-full blur-[1px] pointer-events-none" />
                                </motion.button>
                            );
                        })}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
