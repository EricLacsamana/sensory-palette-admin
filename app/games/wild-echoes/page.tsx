'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    User,
    Trophy,
    BarChart,
    Volume2,
    Target,
    Activity,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const SparkleIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M11.64 5.232c.184-.525.932-.525 1.117 0l1.458 4.152a1.2 1.2 0 00.838.838l4.152 1.458c.525.184.525.932 0 1.117l-4.152 1.458a1.2 1.2 0 00-.838.838l-1.458 4.152c-.184.525-.932.525-1.117 0l-1.458-4.152a1.2 1.2 0 00.838-.838l1.458-4.152z" />
    </svg>
);

const ALL_ANIMALS = [
    { name: 'Dog', emoji: '🐶', sound: '/sounds/dog.wav' },
    { name: 'Cat', emoji: '🐱', sound: '/sounds/cat.wav' },
    { name: 'Cow', emoji: '🐮', sound: '/sounds/cow.wav' },
    { name: 'Sheep', emoji: '🐑', sound: '/sounds/sheep.wav' },
    { name: 'Horse', emoji: '🐴', sound: '/sounds/horse.wav' },
    { name: 'Lion', emoji: '🦁', sound: '/sounds/lion.wav' },
    { name: 'Monkey', emoji: '🐵', sound: '/sounds/monkey.wav' },
    { name: 'Rooster', emoji: '🐓', sound: '/sounds/rooster.wav' },
];

const MAX_LEVEL = 3;

interface Animal {
    name: string;
    emoji: string;
    sound: string;
}
interface AdaptiveGameProps {
    studentAge?: number;
    baseDifficulty?: 1 | 2 | 3;
}

export default function AnimalSoundGame({
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
    const [target, setTarget] = useState<Animal | null>(null);
    const [options, setOptions] = useState<Animal[]>([]);
    const [feedback, setFeedback] = useState<
        'none' | 'wrong' | 'correct' | 'levelup' | 'leveldown'
    >('none');
    const [isPlaying, setIsPlaying] = useState(false);

    const timerRef = useRef<number>(0);
    const successSfx = useRef<HTMLAudioElement | null>(null);
    const retrySfx = useRef<HTMLAudioElement | null>(null);
    const levelUpSfx = useRef<HTMLAudioElement | null>(null);
    const animalAudioRef = useRef<HTMLAudioElement | null>(null);

    const playAnimalSound = useCallback(() => {
        if (animalAudioRef.current) {
            setIsPlaying(true);
            animalAudioRef.current.currentTime = 0;
            animalAudioRef.current.play().catch(() => setIsPlaying(false));
            animalAudioRef.current.onended = () => setIsPlaying(false);
        }
    }, []);

    const generate = useCallback(
        (currentLevel: number) => {
            const optionCount =
                currentLevel === 1 ? 2 : currentLevel === 2 ? 4 : 6;
            const nextTarget =
                ALL_ANIMALS[Math.floor(Math.random() * ALL_ANIMALS.length)];
            const shuffled = [...ALL_ANIMALS]
                .sort(() => Math.random() - 0.5)
                .slice(0, optionCount);
            if (!shuffled.find((i) => i.name === nextTarget.name)) {
                shuffled[0] = nextTarget;
            }

            setTarget(nextTarget);
            setOptions(shuffled.sort(() => Math.random() - 0.5));
            setFeedback('none');

            if (animalAudioRef.current) animalAudioRef.current.pause();
            animalAudioRef.current = new Audio(nextTarget.sound);
            setTimeout(() => playAnimalSound(), 500);
            timerRef.current = Date.now();
        },
        [playAnimalSound],
    );

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

    const handleSelect = (e: React.MouseEvent, opt: Animal) => {
        if (feedback !== 'none' || !target) return;

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
                gameType: 'animal_sound',
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
                levelShift === 'up' ? 2500 : 1200,
            );
        } else {
            if (levelShift === 'down') setFeedback('leveldown');
            else setFeedback('wrong');
            retrySfx.current?.play().catch(() => {});
            setTimeout(() => {
                if (levelShift === 'down') generate(nextLevel);
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

            <div className="flex flex-wrap justify-center items-center gap-2 shrink-0 z-20 pt-2">
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

                <motion.button
                    onClick={playAnimalSound}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    animate={
                        feedback === 'wrong' || feedback === 'leveldown'
                            ? { x: [-15, 15, -15, 15, 0] }
                            : feedback === 'correct'
                              ? { scale: [1, 1.1, 1] }
                              : { scale: isPlaying ? [1, 1.1, 1] : 1 }
                    }
                    transition={{ duration: 0.4 }}
                    className={cn(
                        'aspect-square max-h-full max-w-full w-auto h-full min-w-[120px] rounded-[25%] bg-indigo-500 dark:bg-indigo-600 border-[3px] flex flex-col items-center justify-center relative cursor-pointer transition-colors duration-500',
                        feedback === 'correct'
                            ? 'border-emerald-400 bg-emerald-500 shadow-[0_0_80px_rgba(52,211,153,0.5)]'
                            : 'border-indigo-400 dark:border-indigo-500 shadow-xl',
                    )}
                >
                    <Volume2 className="text-white mb-2 w-16 h-16 sm:w-24 sm:h-24" />
                    <span className="text-white font-bold tracking-widest uppercase text-xs sm:text-sm">
                        {isPlaying ? 'Playing...' : 'Listen'}
                    </span>
                </motion.button>
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
                            Which animal makes this{' '}
                            <span className="font-semibold text-indigo-500">
                                sound
                            </span>
                            ?
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
                                className="min-h-[80px] h-[12dvh] max-h-[100px] w-full rounded-[24px] border-[2px] border-slate-200 dark:border-white/10 bg-white/80 dark:bg-white/5 backdrop-blur-md flex flex-col items-center justify-center transition-all hover:bg-white hover:border-indigo-300 hover:shadow-md group overflow-hidden"
                            >
                                <span className="text-5xl sm:text-6xl leading-none mb-1 drop-shadow-md group-hover:scale-110 transition-transform">
                                    {opt.emoji}
                                </span>
                                <span className="text-sm font-black text-slate-700 dark:text-slate-200 tracking-tight uppercase">
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
