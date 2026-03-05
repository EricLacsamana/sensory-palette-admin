'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpCircle, ArrowDownCircle, User, Trophy, BarChart } from 'lucide-react';
import { cn } from '@/lib/utils';

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
    const [target, setTarget] = useState<any>(null);
    const [options, setOptions] = useState<any[]>([]);
    const [feedback, setFeedback] = useState<'none' | 'wrong' | 'correct' | 'levelup' | 'leveldown'>('none');

    const timerRef = useRef<number>(0);
    const successSfx = useRef<HTMLAudioElement | null>(null);
    const retrySfx = useRef<HTMLAudioElement | null>(null);

    const generate = useCallback((currentLevel: number) => {
        const optionCount = currentLevel === 1 ? 2 : currentLevel === 2 ? 4 : 6;
        const nextTarget = ALL_COLORS[Math.floor(Math.random() * ALL_COLORS.length)];
        
        const shuffled = [...ALL_COLORS]
            .sort(() => Math.random() - 0.5)
            .slice(0, optionCount);
            
        if (!shuffled.find((i) => i.name === nextTarget.name)) {
            shuffled[0] = nextTarget;
        }

        setTarget(nextTarget);
        setOptions(shuffled.sort(() => Math.random() - 0.5));
        setFeedback('none');
        timerRef.current = Date.now();
    }, []);

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

    const handleSelect = (e: React.MouseEvent, opt: any) => {
        if (feedback !== 'none') return;
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
                gameType: 'color_match',
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
                    <Trophy size={14} /> {scorePercentage}%
                </div>
            </div>

            <div className="relative mb-10 mt-10">
                <motion.div
                    key={target.name}
                    animate={
                        feedback === 'wrong' || feedback === 'leveldown' ? { x: [-8, 8, -8, 8, 0] } : { scale: [1, 1.02, 1] }
                    }
                    transition={
                        feedback === 'wrong' || feedback === 'leveldown' ? { duration: 0.4 } : { repeat: Infinity, duration: 4 }
                    }
                    className="w-48 h-48 rounded-[64px] bg-white dark:bg-white/5 border border-slate-200/60 dark:border-white/10 shadow-xl flex items-center justify-center relative"
                >
                    <div className="w-24 h-24 rounded-full shadow-inner" style={{ backgroundColor: target.hex }} />
                    <AnimatePresence>
                        {feedback === 'levelup' && (
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute -top-12 text-emerald-500 flex flex-col items-center">
                                <ArrowUpCircle size={32} className="animate-bounce" />
                                <span className="text-xs font-black uppercase tracking-widest mt-1">Level Up!</span>
                            </motion.div>
                        )}
                        {feedback === 'leveldown' && (
                            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute -top-12 text-amber-500 flex flex-col items-center">
                                <ArrowDownCircle size={32} className="animate-bounce" />
                                <span className="text-xs font-black uppercase tracking-widest mt-1">Easier</span>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>

            <div className="text-center mb-8">
                <h2 className="text-3xl font-light text-slate-800 dark:text-slate-100 tracking-tight h-10">
                    {feedback === 'wrong' ? 'Try again...' : feedback === 'leveldown' ? "Let's try an easier one!" : (
                        <>Find <span className="font-semibold">{target.name}</span></>
                    )}
                </h2>
            </div>

            <div className={cn('grid gap-4 w-full max-w-md', level === 1 ? 'grid-cols-2' : level === 2 ? 'grid-cols-2' : 'grid-cols-3')}>
                {options.map((opt) => (
                    <motion.button
                        key={opt.name}
                        whileTap={{ scale: 0.94 }}
                        onClick={(e) => handleSelect(e, opt)}
                        className="h-16 rounded-3xl border border-slate-200/80 bg-white/50 backdrop-blur-md flex items-center justify-center text-sm font-bold text-slate-600 transition-all hover:bg-white hover:shadow-md"
                    >
                        <div className="w-5 h-5 rounded-full mr-3 shadow-inner" style={{ backgroundColor: opt.hex }} />
                        {opt.name}
                    </motion.button>
                ))}
            </div>
        </div>
    );
}