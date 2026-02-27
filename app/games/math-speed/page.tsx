'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

// 📊 Strict JSON Object structure per tap for Math
interface MathClickLog {
    equation: string;
    tappedAnswer: number;
    isCorrect: boolean;
    durationSeconds: number;
    timestamp: string;
}

export default function MathSpeedGame() {
    const [score, setScore] = useState(0);
    const [streak, setStreak] = useState(0);
    const [equation, setEquation] = useState('2 + 2');
    const [targetAnswer, setTargetAnswer] = useState(4);
    const [options, setOptions] = useState<number[]>([]);
    const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
    const [vh, setVh] = useState('100vh');
    const [particles, setParticles] = useState<
        { id: number; x: number; y: number; color: string }[]
    >([]);

    // --- TELEMETRY ARRAY ---
    const [clickHistory, setClickHistory] = useState<MathClickLog[]>([]);
    const timerRef = useRef(Date.now());

    const correctSound = useRef<HTMLAudioElement | null>(null);
    const wrongSound = useRef<HTMLAudioElement | null>(null);

    // 1. Setup viewport and audio
    useEffect(() => {
        const updateHeight = () => setVh(`${window.innerHeight}px`);
        updateHeight();
        window.addEventListener('resize', updateHeight);

        correctSound.current = new Audio(
            'https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3',
        );
        wrongSound.current = new Audio(
            'https://assets.mixkit.co/active_storage/sfx/2003/2003-preview.mp3',
        );

        generateLevel();
        return () => window.removeEventListener('resize', updateHeight);
    }, []);

    // 2. Broadcast Telemetry Array to Redux Parent
    useEffect(() => {
        // Sends the complete array of objects every time it updates
        window.parent.postMessage(
            {
                type: 'GAME_SCORE_UPDATE',
                score: score,
                telemetry: clickHistory,
            },
            '*',
        );
    }, [score, clickHistory]);

    const generateLevel = useCallback(() => {
        const operators = ['+', '-', 'x'];
        const op = operators[Math.floor(Math.random() * operators.length)];
        let num1, num2, answer;

        if (op === '+') {
            num1 = Math.floor(Math.random() * 20) + 1;
            num2 = Math.floor(Math.random() * 20) + 1;
            answer = num1 + num2;
        } else if (op === '-') {
            num1 = Math.floor(Math.random() * 20) + 10;
            num2 = Math.floor(Math.random() * 10) + 1;
            answer = num1 - num2;
        } else {
            num1 = Math.floor(Math.random() * 10) + 1;
            num2 = Math.floor(Math.random() * 10) + 1;
            answer = num1 * num2;
        }

        setEquation(`${num1} ${op} ${num2}`);
        setTargetAnswer(answer);

        const distractors = new Set<number>();
        while (distractors.size < 2) {
            const offset = Math.floor(Math.random() * 5) + 1;
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
        setFeedback(null);
        timerRef.current = Date.now();
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

    const handleSelect = (selectedOption: number) => {
        if (feedback !== null) return;

        const isCorrect = selectedOption === targetAnswer;
        const duration = (Date.now() - timerRef.current) / 1000;

        // 📝 CREATE THE JSON OBJECT FOR THIS TAP
        const tapData: MathClickLog = {
            equation: equation,
            tappedAnswer: selectedOption,
            isCorrect: isCorrect,
            durationSeconds: parseFloat(duration.toFixed(2)),
            timestamp: new Date().toISOString(),
        };

        // Push to array
        setClickHistory((prev) => [...prev, tapData]);

        if (isCorrect) {
            correctSound.current?.play().catch(() => {});
            if (navigator.vibrate) navigator.vibrate([20, 40]);
            triggerExplosion();
            setScore((p) => p + 15);
            setStreak((p) => p + 1);
            setFeedback('correct');
            setTimeout(generateLevel, 1000);
        } else {
            wrongSound.current?.play().catch(() => {});
            if (navigator.vibrate) navigator.vibrate([100, 100]);
            setStreak(0);
            setFeedback('wrong');
            setTimeout(() => setFeedback(null), 1000);
        }
    };

    return (
        <div
            style={{ height: vh }}
            className="w-full bg-[#02040a] flex flex-col items-center p-3 sm:p-6 overflow-hidden relative selection:bg-none touch-none"
        >
            <div className="absolute inset-0 pointer-events-none z-0 flex items-start justify-center">
                <div className="w-[150%] h-[50%] bg-blue-600/10 blur-[100px] rounded-full" />
            </div>

            <header className="shrink-0 w-full max-w-4xl flex justify-between px-5 py-3 sm:py-4 bg-white/[0.03] backdrop-blur-xl rounded-[20px] sm:rounded-[32px] border border-white/10 z-20 shadow-lg">
                <div className="flex flex-col">
                    <span className="text-[9px] sm:text-[10px] font-black text-blue-400 uppercase tracking-widest mb-0.5">
                        STREAK
                    </span>
                    <span className="text-xl sm:text-3xl font-black text-white italic leading-none">
                        {streak} 🔥
                    </span>
                </div>
                <div className="flex flex-col text-right">
                    <span className="text-[9px] sm:text-[10px] font-black text-blue-400 uppercase tracking-widest mb-0.5">
                        POINTS
                    </span>
                    <span className="text-xl sm:text-3xl font-black text-white tabular-nums leading-none tracking-tighter">
                        {score}
                    </span>
                </div>
            </header>

            <main className="flex-1 min-h-0 flex flex-col items-center justify-center w-full relative z-10 py-2">
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-30">
                    <AnimatePresence>
                        {particles.map((p) => (
                            <motion.div
                                key={p.id}
                                initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
                                animate={{
                                    x: p.x,
                                    y: p.y,
                                    scale: 0,
                                    opacity: 0,
                                }}
                                transition={{ duration: 0.6, ease: 'easeOut' }}
                                className="absolute w-3 h-3 sm:w-4 sm:h-4 rounded-full shadow-[0_0_10px]"
                                style={{
                                    backgroundColor: p.color,
                                    boxShadow: `0 0 15px ${p.color}`,
                                }}
                            />
                        ))}
                    </AnimatePresence>
                </div>

                <div className="relative shrink min-h-[120px] flex items-center justify-center w-[85vw] max-w-[360px] max-h-[30vh] aspect-[4/3]">
                    <motion.div
                        animate={{ opacity: [0.3, 0.5, 0.3] }}
                        transition={{ repeat: Infinity, duration: 3 }}
                        className="absolute inset-0 rounded-[40px] blur-2xl bg-blue-500/30"
                    />
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={equation}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 1.1, opacity: 0 }}
                            className="absolute inset-0 rounded-[32px] sm:rounded-[48px] bg-slate-900/80 border-2 border-white/10 flex items-center justify-center shadow-2xl backdrop-blur-md"
                        >
                            <span className="text-[40px] sm:text-[60px] md:text-[80px] font-black text-white tracking-tighter drop-shadow-md whitespace-nowrap px-4">
                                {equation}
                            </span>
                        </motion.div>
                    </AnimatePresence>
                </div>

                <AnimatePresence>
                    {feedback && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none"
                        >
                            <h1
                                className={cn(
                                    'font-black text-[12vw] sm:text-[8vh] italic uppercase leading-none drop-shadow-2xl',
                                    feedback === 'correct'
                                        ? 'text-blue-400'
                                        : 'text-rose-500',
                                )}
                            >
                                {feedback === 'correct' ? 'CORRECT!' : 'AGAIN'}
                            </h1>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="mt-4 sm:mt-8 text-center shrink-0">
                    <p className="text-blue-400 font-black text-[9px] uppercase tracking-[0.4em] mb-1">
                        Calculate
                    </p>
                    <h3 className="text-xl sm:text-3xl md:text-4xl font-black text-white uppercase italic tracking-tighter">
                        Select{' '}
                        <span className="underline decoration-2 underline-offset-4 text-blue-400">
                            Answer
                        </span>
                    </h3>
                </div>
            </main>

            <footer className="shrink-0 w-full max-w-3xl flex justify-center gap-4 sm:gap-10 pb-4 sm:pb-8 pt-2 z-20">
                {options.map((opt, idx) => (
                    <motion.button
                        key={idx}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.85 }}
                        onClick={() => handleSelect(opt)}
                        className="flex flex-col items-center gap-2 group relative"
                    >
                        <div className="w-[20vw] h-[20vw] min-w-[64px] min-h-[64px] max-w-[120px] max-h-[120px] rounded-full border-[3px] border-white/10 group-hover:border-blue-400/50 transition-all shadow-xl flex items-center justify-center relative overflow-hidden bg-slate-800">
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <span className="relative z-10 text-white font-black text-3xl sm:text-4xl md:text-5xl tracking-tighter">
                                {opt}
                            </span>
                        </div>
                    </motion.button>
                ))}
            </footer>
        </div>
    );
}
