'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Trophy, Heart, Zap, Sparkles, Play } from 'lucide-react';
import { cn } from '@/lib/utils';

const MAX_LEVEL = 5;

export default function RobotPulseGame({
    studentAge,
    baseDifficulty,
}: {
    studentAge?: number;
    baseDifficulty?: number;
}) {
    const searchParams = useSearchParams();

    const [hasMounted, setHasMounted] = useState(false);
    const [gameStarted, setGameStarted] = useState(false);
    const [isAdaptive] = useState(
        () => searchParams.get('adaptive') !== 'false',
    );

    const [level, setLevel] = useState<number>(1);
    const [streak, setStreak] = useState(0);
    const [correctCount, setCorrectCount] = useState(0);
    const [totalCount, setTotalCount] = useState(0);
    const [telemetry, setTelemetry] = useState<any[]>([]);

    const [gameState, setGameState] = useState<
        'idle' | 'playing' | 'input' | 'win'
    >('idle');
    const [feedback, setFeedback] = useState<'none' | 'levelup'>('none');
    const [targetPattern, setTargetPattern] = useState<number[]>([]);
    const [userTaps, setUserTaps] = useState<number>(0);

    const timerRef = useRef<number>(0);
    const successSfx = useRef<HTMLAudioElement | null>(null);
    const pulseSfx = useRef<HTMLAudioElement | null>(null);

    const generateRound = useCallback((currentLevel: number) => {
        const numPulses = Math.min(currentLevel + 1, 6);
        setTargetPattern(
            Array.from({ length: numPulses }, () =>
                Math.random() > 0.6 ? 400 : 150,
            ),
        );
        setUserTaps(0);
        setGameState('idle');
        setFeedback('none');
        timerRef.current = Date.now();
    }, []);

    useEffect(() => {
        setHasMounted(true);
        const startLevel =
            parseInt(searchParams.get('level') || '0', 10) ||
            baseDifficulty ||
            1;
        setLevel(startLevel);
        successSfx.current = new Audio(
            'https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3',
        );
        pulseSfx.current = new Audio(
            'https://cdnjs.cloudflare.com/ajax/libs/ion-sound/3.0.7/sounds/button_tiny.mp3',
        );
    }, [baseDifficulty, searchParams]);

    const playPattern = async () => {
        if (gameState !== 'idle') return;
        setGameState('playing');
        for (const duration of targetPattern) {
            if (navigator.vibrate) navigator.vibrate(duration);
            pulseSfx.current?.play().catch(() => {});
            await new Promise((r) => setTimeout(r, duration + 400));
        }
        setGameState('input');
    };

    const handleTap = () => {
        if (gameState !== 'input') return;

        if (navigator.vibrate) navigator.vibrate(80);

        // FIX: Check if the ref exists before assignment
        if (pulseSfx.current) {
            pulseSfx.current.currentTime = 0;
            pulseSfx.current.play().catch(() => {});
        }

        const nextTaps = userTaps + 1;
        setUserTaps(nextTaps);

        if (nextTaps === targetPattern.length) {
            handleWin();
        }
    };

    const handleWin = () => {
        setGameState('win');
        successSfx.current?.play().catch(() => {});

        let nextLevel = level;
        let levelShift: 'up' | 'down' | 'none' = 'none';

        if (isAdaptive) {
            if (streak + 1 >= 3 && level < MAX_LEVEL) {
                nextLevel = level + 1;
                setStreak(0);
                levelShift = 'up';
            } else setStreak((s) => s + 1);
        }

        const newTotal = totalCount + 1;
        const newCorrect = correctCount + 1;
        setTotalCount(newTotal);
        setCorrectCount(newCorrect);

        const logEntry = {
            timestamp: new Date().toISOString(),
            action: 'rhythm_match',
            targetId: `lvl_${level}`,
            isCorrect: true,
            responseTimeMs: Date.now() - timerRef.current,
            metadata: {
                gameType: 'robot_pulse',
                pulses: targetPattern.length,
                levelShift: levelShift !== 'none' ? levelShift : undefined,
            },
        };

        setTelemetry((prev) => {
            const updated = [...prev, logEntry];
            window.parent.postMessage(
                {
                    type: 'GAME_SCORE_UPDATE',
                    score: newCorrect,
                    rounds: newTotal,
                    accuracy: 100,
                    rawTelemetry: updated,
                },
                '*',
            );
            return updated;
        });

        setTimeout(() => {
            if (levelShift === 'up') {
                setFeedback('levelup');
                setLevel(nextLevel);
            }
            generateRound(nextLevel);
        }, 2000);
    };

    if (!hasMounted) return null;

    return (
        <div className="w-full h-screen bg-[#1A1A2E] flex flex-col p-4 overflow-hidden touch-none font-sans text-white">
            <div className="flex justify-between items-center z-20 px-4 pt-2">
                <div className="bg-white/10 px-5 py-2 rounded-2xl font-black text-blue-400 border border-white/20">
                    LVL {level}
                </div>
                <div className="bg-white/10 px-5 py-2 rounded-2xl font-black text-emerald-400 border border-white/20">
                    {correctCount} Fixed
                </div>
            </div>

            <AnimatePresence>
                {!gameStarted && (
                    <div className="absolute inset-0 z-50 bg-slate-900/95 flex items-center justify-center">
                        <button
                            onClick={() => {
                                setGameStarted(true);
                                generateRound(level);
                            }}
                            className="bg-blue-600 px-12 py-8 rounded-[3rem] shadow-[0_12px_0_darkblue] font-black text-2xl uppercase tracking-widest text-white"
                        >
                            Start Robot
                        </button>
                    </div>
                )}
            </AnimatePresence>

            <div className="flex-1 flex flex-col items-center justify-center">
                <motion.div
                    animate={
                        gameState === 'playing' ? { scale: [1, 1.1, 1] } : {}
                    }
                    className="w-48 h-64 bg-slate-300 rounded-[3rem] border-b-[12px] border-slate-400 relative flex flex-col items-center p-6 shadow-2xl"
                >
                    <div className="flex gap-8 mt-8">
                        <div className="w-6 h-6 bg-slate-800 rounded-full" />
                        <div className="w-6 h-6 bg-slate-800 rounded-full" />
                    </div>
                    <div className="mt-12 w-24 h-24 rounded-full bg-slate-400/30 flex items-center justify-center">
                        <Heart
                            className={cn(
                                'w-16 h-16',
                                gameState === 'playing'
                                    ? 'text-blue-500 fill-blue-500'
                                    : gameState === 'input'
                                      ? 'text-rose-500 fill-rose-500 animate-pulse'
                                      : 'text-slate-500',
                            )}
                        />
                    </div>
                </motion.div>

                <div className="h-40 flex items-center justify-center mt-10">
                    {gameState === 'idle' && (
                        <button
                            onClick={playPattern}
                            className="bg-blue-600 px-10 py-5 rounded-2xl font-black text-white uppercase tracking-widest shadow-lg"
                        >
                            Feel the Pulse
                        </button>
                    )}
                    {gameState === 'input' && (
                        <button
                            onPointerDown={handleTap}
                            className="w-24 h-24 bg-rose-500 rounded-full border-b-8 border-rose-700 active:translate-y-2 active:border-b-0 shadow-xl"
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
