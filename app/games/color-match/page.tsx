'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
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
} from 'lucide-react';

const COLORS = [
    { name: 'Red', hex: '#F43F5E' },
    { name: 'Blue', hex: '#3B82F6' },
    { name: 'Green', hex: '#10B981' },
    { name: 'Yellow', hex: '#F59E0B' },
    { name: 'Orange', hex: '#F97316' },
    { name: 'Purple', hex: '#8B5CF6' },
    { name: 'Pink', hex: '#EC4899' },
    { name: 'Teal', hex: '#06B6D4' },
];

const SHAPES = [
    { name: 'Circle', icon: Circle },
    { name: 'Square', icon: Square },
    { name: 'Triangle', icon: Triangle },
    { name: 'Heart', icon: Heart },
    { name: 'Star', icon: Star },
    { name: 'Diamond', icon: Diamond },
    { name: 'Cloud', icon: Cloud },
    { name: 'Moon', icon: Moon },
];

export default function DiscoveryGame() {
    const [score, setScore] = useState(0);
    const [telemetry, setTelemetry] = useState<any[]>([]);
    const [target, setTarget] = useState<any>(null);
    const [options, setOptions] = useState<any[]>([]);
    const [mode, setMode] = useState<'color' | 'shape'>('color');
    const [feedback, setFeedback] = useState<'none' | 'wrong' | 'correct'>(
        'none',
    );
    const [particles, setParticles] = useState<any[]>([]);

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
        generate();
    }, []);

    const generate = useCallback(() => {
        const isColor = Math.random() > 0.5;
        setMode(isColor ? 'color' : 'shape');
        const db = isColor ? COLORS : SHAPES;
        const next = db[Math.floor(Math.random() * db.length)];
        const shuffled = [...db].sort(() => Math.random() - 0.5).slice(0, 4);
        if (!shuffled.find((i) => i.name === next.name)) shuffled[0] = next;

        setTarget(next);
        setOptions(shuffled.sort(() => Math.random() - 0.5));
        setFeedback('none');
        timerRef.current = Date.now();
    }, []);

    const triggerParticles = (color: string) => {
        const newParticles = Array.from({ length: 12 }).map((_, i) => ({
            id: Math.random(),
            x: (Math.random() - 0.5) * 300,
            y: (Math.random() - 0.5) * 300,
            color,
        }));
        setParticles(newParticles);
        setTimeout(() => setParticles([]), 1000);
    };

    const handleSelect = (opt: any) => {
        if (feedback !== 'none') return;
        const isCorrect = opt.name === target.name;
        const latency = (Date.now() - timerRef.current) / 1000;

        // Record telemetry (don't care what they choose, just log it)
        const newLog = [
            ...telemetry,
            { target: target.name, choice: opt.name, isCorrect, latency },
        ];
        const newScore = isCorrect ? score + 1 : score;
        setTelemetry(newLog);
        if (isCorrect) setScore(newScore);

        // Sync to Parent
        window.parent.postMessage(
            {
                type: 'GAME_SCORE_UPDATE',
                score: newScore,
                rawTelemetry: newLog,
            },
            '*',
        );

        if (isCorrect) {
            setFeedback('correct');
            successSfx.current?.play().catch(() => {});
            triggerParticles(mode === 'color' ? target.hex : '#6366f1');
            setTimeout(generate, 1000);
        } else {
            setFeedback('wrong');
            retrySfx.current?.play().catch(() => {});
            setTimeout(() => setFeedback('none'), 600);
        }
    };

    if (!target) return null;

    return (
        <div className="w-full h-screen bg-[#fcfcfd] dark:bg-[#0a0c12] flex flex-col items-center justify-center p-8 overflow-hidden font-sans">
            {/* Target Portal */}
            <div className="relative mb-16">
                <AnimatePresence>
                    {particles.map((p) => (
                        <motion.div
                            key={p.id}
                            initial={{ x: 0, y: 0, scale: 1 }}
                            animate={{ x: p.x, y: p.y, scale: 0 }}
                            className="absolute w-3 h-3 rounded-full z-50"
                            style={{ backgroundColor: p.color }}
                        />
                    ))}
                </AnimatePresence>

                <motion.div
                    key={target.name}
                    animate={
                        feedback === 'wrong'
                            ? { x: [-8, 8, -8, 8, 0] }
                            : { scale: [1, 1.02, 1] }
                    }
                    transition={
                        feedback === 'wrong'
                            ? { duration: 0.4 }
                            : { repeat: Infinity, duration: 4 }
                    }
                    className="w-52 h-52 rounded-[64px] bg-white dark:bg-white/5 border border-slate-200/60 dark:border-white/10 shadow-xl flex items-center justify-center relative backdrop-blur-sm"
                >
                    {mode === 'color' ? (
                        <div
                            className="w-28 h-28 rounded-full shadow-inner"
                            style={{ backgroundColor: target.hex }}
                        />
                    ) : (
                        <target.icon
                            size={90}
                            strokeWidth={1}
                            className="text-slate-400 dark:text-slate-200"
                        />
                    )}

                    <AnimatePresence>
                        {feedback === 'correct' && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1.1 }}
                                className="absolute inset-0 rounded-[64px] border-4 border-emerald-400/50 bg-emerald-400/5"
                            />
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>

            <div className="text-center mb-12">
                <h2 className="text-3xl font-light text-slate-800 dark:text-slate-100 tracking-tight">
                    {feedback === 'wrong' ? (
                        'Try again...'
                    ) : (
                        <>
                            Find the{' '}
                            <span className="font-semibold">{target.name}</span>
                        </>
                    )}
                </h2>
            </div>

            {/* Discovery Options */}
            <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
                {options.map((opt) => (
                    <motion.button
                        key={opt.name}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => handleSelect(opt)}
                        className="h-16 rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white/50 dark:bg-white/5 backdrop-blur-md flex items-center justify-center text-sm font-medium text-slate-600 dark:text-slate-300 transition-colors hover:bg-white/80"
                    >
                        {mode === 'color' && (
                            <div
                                className="w-4 h-4 rounded-full mr-3"
                                style={{ backgroundColor: opt.hex }}
                            />
                        )}
                        {mode === 'shape' && (
                            <opt.icon
                                size={18}
                                className="mr-3 text-slate-400"
                            />
                        )}
                        {opt.name}
                    </motion.button>
                ))}
            </div>
        </div>
    );
}
