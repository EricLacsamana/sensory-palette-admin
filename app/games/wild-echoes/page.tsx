'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpCircle, ArrowDownCircle, User, Trophy, BarChart, Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';

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
    const [isAdaptive, setIsAdaptive] = useState(searchParams.get('adaptive') !== 'false');

    const getStartingLevel = () => {
        const urlLevel = parseInt(searchParams.get('level') || '0', 10);
        if (urlLevel > 0 && urlLevel <= MAX_LEVEL) return urlLevel;
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

    const [correctCount, setCorrectCount] = useState(0);
    const [totalCount, setTotalCount] = useState(0);
    const scorePercentage = totalCount === 0 ? 0 : Math.round((correctCount / totalCount) * 100);
    const [telemetry, setTelemetry] = useState<any[]>([]);

    const [target, setTarget] = useState<Animal | null>(null);
    const [options, setOptions] = useState<Animal[]>([]);
    const [feedback, setFeedback] = useState<'none' | 'wrong' | 'correct' | 'levelup' | 'leveldown'>('none');
    const [isPlaying, setIsPlaying] = useState(false);

    const timerRef = useRef<number>(0);
    const successSfx = useRef<HTMLAudioElement | null>(null);
    const retrySfx = useRef<HTMLAudioElement | null>(null);
    const animalAudioRef = useRef<HTMLAudioElement | null>(null);

    const playAnimalSound = useCallback(() => {
        if (animalAudioRef.current) {
            setIsPlaying(true);
            animalAudioRef.current.currentTime = 0;
            animalAudioRef.current.play().catch(() => setIsPlaying(false));
            animalAudioRef.current.onended = () => setIsPlaying(false);
        }
    }, []);

    const generate = useCallback((currentLevel: number) => {
        const optionCount = currentLevel === 1 ? 2 : currentLevel === 2 ? 4 : 6;
        const nextTarget = ALL_ANIMALS[Math.floor(Math.random() * ALL_ANIMALS.length)];

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
    }, [playAnimalSound]);

    useEffect(() => {
        successSfx.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
        retrySfx.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
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

    const handleSelect = (e: React.MouseEvent, opt: Animal) => {
        if (feedback !== 'none' || !target) return;

        const isCorrect = opt.name === target.name;
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
            targetId: opt.name,
            isCorrect: isCorrect,
            responseTimeMs: responseTimeMs,
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

        window.parent.postMessage({
            type: 'GAME_SCORE_UPDATE',
            score: newScorePercentage,
            rawTelemetry: newLog,
        }, '*');

        if (isCorrect) {
            if (levelShift === 'up') setFeedback('levelup');
            else setFeedback('correct');
            successSfx.current?.play().catch(() => {});
            setTimeout(() => generate(nextLevel), 1200);
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

    return (
        <div className="w-full h-screen bg-[#fcfcfd] dark:bg-[#0a0c12] flex flex-col items-center justify-center p-4 sm:p-8 overflow-hidden font-sans relative">
            <div className="absolute top-4 sm:top-6 left-0 right-0 flex justify-center gap-3 sm:gap-6 px-4 sm:px-8 opacity-80 z-10">
                {studentAge && (
                    <div className="flex items-center gap-2 bg-slate-100 dark:bg-white/10 px-3 sm:px-4 py-2 rounded-full text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest">
                        <User size={14} /> Age {studentAge}
                    </div>
                )}
                <div className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-900/30 px-3 sm:px-4 py-2 rounded-full text-[10px] sm:text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
                    <BarChart size={14} /> Level {level}
                </div>
                <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/30 px-3 sm:px-4 py-2 rounded-full text-[10px] sm:text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                    <Trophy size={14} /> {scorePercentage}%
                </div>
            </div>

            <div className="relative mb-6 sm:mb-10 mt-12 sm:mt-10">
                <motion.button
                    key={target.name}
                    onClick={playAnimalSound}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    animate={
                        feedback === 'wrong' || feedback === 'leveldown' ? { x: [-8, 8, -8, 8, 0] } : { scale: isPlaying ? [1, 1.1, 1] : 1 }
                    }
                    transition={
                        feedback === 'wrong' || feedback === 'leveldown' ? { duration: 0.4 } : { repeat: isPlaying ? Infinity : 0, duration: 1 }
                    }
                    className="w-36 h-36 sm:w-48 sm:h-48 rounded-[48px] sm:rounded-[64px] bg-indigo-500 dark:bg-indigo-600 border-4 border-indigo-400 dark:border-indigo-500 shadow-[0_0_30px_rgba(99,102,241,0.4)] flex flex-col items-center justify-center relative cursor-pointer z-20"
                >
                    <Volume2 size={48} className="text-white mb-2 sm:w-16 sm:h-16" />
                    <span className="text-indigo-100 font-bold tracking-widest uppercase text-[10px] sm:text-sm">
                        {isPlaying ? 'Playing...' : 'Tap to Listen'}
                    </span>
                    <AnimatePresence>
                        {feedback === 'levelup' && (
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute -top-12 text-emerald-500 flex flex-col items-center pointer-events-none">
                                <ArrowUpCircle size={32} className="animate-bounce" />
                                <span className="text-xs font-black uppercase tracking-widest mt-1 bg-[#fcfcfd] dark:bg-[#0a0c12] px-2 py-1 rounded-full shadow-sm">Level Up!</span>
                            </motion.div>
                        )}
                        {feedback === 'leveldown' && (
                            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute -top-12 text-amber-500 flex flex-col items-center pointer-events-none">
                                <ArrowDownCircle size={32} className="animate-bounce" />
                                <span className="text-xs font-black uppercase tracking-widest mt-1 bg-[#fcfcfd] dark:bg-[#0a0c12] px-2 py-1 rounded-full shadow-sm">Easier</span>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.button>
            </div>

            <div className="text-center mb-6 sm:mb-8 z-10">
                <h2 className="text-xl sm:text-3xl font-light text-slate-800 dark:text-slate-100 tracking-tight h-8 sm:h-10">
                    {feedback === 'wrong' ? <span className="text-rose-500">Try again...</span> : feedback === 'leveldown' ? <span className="text-amber-500">Let's try an easier one!</span> : (
                        <>Which animal makes this <span className="font-semibold text-indigo-500">sound</span>?</>
                    )}
                </h2>
            </div>

            <div className={cn('grid gap-3 sm:gap-5 w-full max-w-2xl z-10 pb-4', level === 1 ? 'grid-cols-2 max-w-md' : level === 2 ? 'grid-cols-2 max-w-md' : 'grid-cols-2 md:grid-cols-3')}>
                {options.map((opt) => (
                    <motion.button
                        key={opt.name}
                        whileTap={{ scale: 0.94 }}
                        onClick={(e) => handleSelect(e, opt)}
                        className="flex flex-col items-center justify-center aspect-square rounded-[32px] sm:rounded-[40px] border-2 border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-white/5 backdrop-blur-md transition-all hover:bg-white dark:hover:bg-white/10 hover:shadow-xl shadow-sm group"
                    >
                        <span className="text-[4rem] sm:text-[5rem] md:text-[6rem] leading-none mb-2 drop-shadow-md group-hover:scale-110 transition-transform">
                            {opt.emoji}
                        </span>
                        <span className="text-lg sm:text-2xl font-black text-slate-700 dark:text-slate-200 tracking-tight">
                            {opt.name}
                        </span>
                    </motion.button>
                ))}
            </div>
        </div>
    );
}