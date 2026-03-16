'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { Star, Trophy, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

const MAX_LEVEL = 5;

// Clean, thick, premium-looking SVGs
const SHAPES = {
    circle: (color: string) => <circle cx="50" cy="50" r="46" fill={color} />,
    square: (color: string) => (
        <rect x="8" y="8" width="84" height="84" rx="22" fill={color} />
    ),
    triangle: (color: string) => (
        <polygon
            points="50,10 90,85 10,85"
            fill={color}
            strokeLinejoin="round"
        />
    ),
    star: (color: string) => (
        <polygon
            points="50,5 61,35 93,35 67,54 77,85 50,65 23,85 33,54 7,35 39,35"
            fill={color}
            strokeLinejoin="round"
        />
    ),
    hexagon: (color: string) => (
        <polygon
            points="50,5 90,25 90,75 50,95 10,75 10,25"
            fill={color}
            strokeLinejoin="round"
        />
    ),
};

type ShapeType = keyof typeof SHAPES;
const SHAPE_KEYS: ShapeType[] = [
    'circle',
    'square',
    'triangle',
    'star',
    'hexagon',
];
const COLORS = [
    '#FF6B6B',
    '#4D96FF',
    '#6BCB77',
    '#FFD93D',
    '#9D4EDD',
    '#FF9F1C',
];

interface ActiveShape {
    id: string;
    type: ShapeType;
    color: string;
    rotation: number;
    posX: number;
    posY: number;
}

export default function ShapeSorterGame({
    studentAge,
    baseDifficulty,
}: {
    studentAge?: number;
    baseDifficulty?: number;
}) {
    const searchParams = useSearchParams();
    const [isAdaptive, setIsAdaptive] = useState(
        () => searchParams.get('adaptive') !== 'false',
    );
    const [showMetrics, setShowMetrics] = useState(
        () => searchParams.get('enableLearnerControls') === 'true',
    );

    const initialLevel =
        parseInt(searchParams.get('level') || '0', 10) || baseDifficulty || 1;

    const [level, setLevel] = useState<number>(initialLevel);
    const [streak, setStreak] = useState(0);
    const [fails, setFails] = useState(0);
    const [correctCount, setCorrectCount] = useState(0);
    const [totalCount, setTotalCount] = useState(0);

    // FIX: Restored the missing telemetry state!
    const [telemetry, setTelemetry] = useState<any[]>([]);

    const [feedback, setFeedback] = useState<
        'none' | 'wrong' | 'correct' | 'levelup' | 'leveldown'
    >('none');

    const [activeShapes, setActiveShapes] = useState<ActiveShape[]>([]);
    const [placedShapes, setPlacedShapes] = useState<string[]>([]);
    const timerRef = useRef<number>(0);

    const successSfx = useRef<HTMLAudioElement | null>(null);
    const retrySfx = useRef<HTMLAudioElement | null>(null);
    const levelUpSfx = useRef<HTMLAudioElement | null>(null);
    const popSfx = useRef<HTMLAudioElement | null>(null);

    const generateRound = useCallback((currentLevel: number) => {
        const count = Math.min(currentLevel + 1, SHAPE_KEYS.length);
        const selectedTypes = [...SHAPE_KEYS]
            .sort(() => Math.random() - 0.5)
            .slice(0, count);
        const selectedColors = [...COLORS]
            .sort(() => Math.random() - 0.5)
            .slice(0, count);

        const zones = [
            { x: 20, y: 30 },
            { x: 80, y: 30 },
            { x: 50, y: 60 },
            { x: 25, y: 80 },
            { x: 75, y: 80 },
        ].sort(() => Math.random() - 0.5);

        const newShapes: ActiveShape[] = selectedTypes.map((type, i) => {
            const zone = zones[i] || { x: 50, y: 50 };
            return {
                id: `shape-${Date.now()}-${i}`,
                type,
                color: selectedColors[i],
                rotation: Math.random() * 60 - 30,
                posX: zone.x + (Math.random() * 10 - 5),
                posY: zone.y + (Math.random() * 10 - 5),
            };
        });

        setActiveShapes(newShapes);
        setPlacedShapes([]);
        setFeedback('none');
        timerRef.current = Date.now();
    }, []);

    useEffect(() => {
        successSfx.current = new Audio(
            'https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3',
        );
        retrySfx.current = new Audio(
            'https://assets.mixkit.co/active_storage/sfx/2003/2003-preview.mp3',
        );
        levelUpSfx.current = new Audio(
            'https://cdnjs.cloudflare.com/ajax/libs/ion-sound/3.0.7/sounds/bell_ring.mp3',
        );
        popSfx.current = new Audio(
            'https://cdnjs.cloudflare.com/ajax/libs/ion-sound/3.0.7/sounds/pop_cork.mp3',
        );
        generateRound(initialLevel);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleDragEnd = (
        e: any,
        info: PanInfo,
        draggedShape: ActiveShape,
    ) => {
        const shapeId = draggedShape.id;
        const shapeName = draggedShape.type;

        if (placedShapes.includes(shapeId) || feedback !== 'none') return;

        const draggingEl = document.getElementById(`drag-${shapeId}`);
        if (draggingEl) draggingEl.style.pointerEvents = 'none';
        const dropTarget = document.elementFromPoint(
            info.point.x,
            info.point.y,
        );
        if (draggingEl) draggingEl.style.pointerEvents = 'auto';

        const holeEl = dropTarget?.closest('[data-hole-id]');
        const holeId = holeEl?.getAttribute('data-hole-id');

        const holeShapeName = holeId
            ? activeShapes.find((s) => s.id === holeId)?.type || 'none'
            : 'none';

        if (!holeId && !holeEl) return;

        const isCorrect = holeId === shapeId;
        let nextLevel = level;
        let levelShift: 'up' | 'down' | 'none' = 'none';

        if (isCorrect) {
            popSfx.current?.play().catch(() => {});
            const newPlaced = [...placedShapes, shapeId];
            setPlacedShapes(newPlaced);

            if (newPlaced.length === activeShapes.length) {
                if (isAdaptive) {
                    setFails(0);
                    if (streak + 1 >= 3 && level < MAX_LEVEL) {
                        nextLevel = level + 1;
                        setStreak(0);
                        levelShift = 'up';
                    } else setStreak(streak + 1);
                } else setStreak(streak + 1);

                if (levelShift === 'up') {
                    setFeedback('levelup');
                    levelUpSfx.current?.play().catch(() => {});
                } else {
                    setFeedback('correct');
                    successSfx.current?.play().catch(() => {});
                }

                if (navigator.vibrate) navigator.vibrate([20, 40]);
                setTimeout(
                    () => {
                        if (levelShift !== 'none') setLevel(nextLevel);
                        generateRound(nextLevel);
                    },
                    levelShift === 'up' ? 1800 : 1000,
                );
            } else {
                timerRef.current = Date.now();
            }
        } else {
            retrySfx.current?.play().catch(() => {});
            if (navigator.vibrate) navigator.vibrate([100, 100]);

            if (isAdaptive) {
                setStreak(0);
                if (fails + 1 >= 2 && level > 1) {
                    nextLevel = level - 1;
                    setFails(0);
                    levelShift = 'down';
                    setFeedback('leveldown');
                } else {
                    setFails(fails + 1);
                    setFeedback('wrong');
                }
            } else {
                setFails(fails + 1);
                setStreak(0);
                setFeedback('wrong');
            }

            setTimeout(() => {
                if (levelShift === 'down') {
                    setLevel(nextLevel);
                    generateRound(nextLevel);
                } else {
                    setFeedback('none');
                    timerRef.current = Date.now();
                }
            }, 1000);
        }

        // --- STANDARD TELEMETRY LOGGING ---
        const newTotal = totalCount + 1;
        const newCorrect = isCorrect ? correctCount + 1 : correctCount;
        const newAccuracy = Math.round((newCorrect / newTotal) * 100);

        setTotalCount(newTotal);
        if (isCorrect) setCorrectCount(newCorrect);

        const logEntry = {
            timestamp: new Date().toISOString(),
            action: 'drag_drop',
            targetId: shapeName,
            isCorrect,
            responseTimeMs: Date.now() - timerRef.current,
            metadata: {
                gameType: 'shape_sorter',
                currentLevel: level,
                shapeDragged: shapeName,
                expectedTarget: holeShapeName,
                levelShift: levelShift !== 'none' ? levelShift : undefined,
                adaptiveMode: isAdaptive,
            },
        };

        setTelemetry((prev) => {
            const updated = [...prev, logEntry];
            window.parent.postMessage(
                {
                    type: 'GAME_SCORE_UPDATE',
                    score: newCorrect,
                    rounds: newTotal,
                    accuracy: newAccuracy,
                    rawTelemetry: updated,
                },
                '*',
            );
            return updated;
        });
    };

    return (
        <div className="w-full h-[100dvh] bg-[#F4F5F7] flex flex-col p-4 md:p-8 overflow-hidden touch-none font-sans relative">
            <div className="flex justify-center items-center gap-4 shrink-0 z-20 pt-2">
                <div className="flex items-center gap-2 bg-white px-6 py-3 rounded-full text-lg font-black text-slate-700 shadow-sm border border-slate-100 uppercase tracking-widest transition-all">
                    <Star size={24} className="text-amber-400 fill-amber-400" />{' '}
                    Level {level}
                </div>
                {showMetrics && (
                    <div className="flex items-center gap-2 bg-white px-6 py-3 rounded-full text-lg font-black text-slate-700 shadow-sm border border-slate-100 uppercase tracking-widest">
                        <Trophy
                            size={24}
                            className="text-emerald-400 fill-emerald-400"
                        />{' '}
                        {correctCount} Stars
                    </div>
                )}
            </div>

            <AnimatePresence>
                {feedback === 'levelup' && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none"
                    >
                        <div className="bg-white px-16 py-10 rounded-3xl border border-slate-100 text-center shadow-2xl flex flex-col items-center">
                            <Sparkles className="w-20 h-20 text-emerald-400 mb-4 animate-spin-slow" />
                            <h1 className="text-5xl md:text-7xl font-black text-slate-800 uppercase tracking-widest">
                                Level Up!
                            </h1>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* BOARD */}
            <motion.div
                animate={
                    feedback === 'wrong' || feedback === 'leveldown'
                        ? { x: [-10, 10, -10, 10, 0] }
                        : feedback === 'correct'
                          ? { scale: [1, 1.02, 1], y: [0, -5, 0] }
                          : {}
                }
                transition={{ duration: 0.4 }}
                className={cn(
                    'w-full max-w-5xl mx-auto flex flex-wrap items-center justify-center gap-6 md:gap-12 min-h-[35vh] bg-white mt-6 rounded-[3rem] shadow-[0_10px_20px_rgba(0,0,0,0.05)] border p-8 relative z-10 transition-colors duration-300',
                    feedback === 'wrong'
                        ? 'border-rose-200 bg-rose-50/50'
                        : 'border-slate-100',
                )}
            >
                {activeShapes.map((shape) => (
                    <div
                        key={`hole-${shape.id}`}
                        data-hole-id={shape.id}
                        className="w-28 h-28 md:w-36 md:h-36 flex items-center justify-center relative rounded-full"
                    >
                        <div
                            className={cn(
                                'absolute inset-0 rounded-full transition-all duration-300',
                                placedShapes.includes(shape.id)
                                    ? 'bg-transparent shadow-none'
                                    : 'bg-[#F4F5F7] shadow-[inset_0px_8px_16px_rgba(0,0,0,0.1)]',
                            )}
                        />

                        <svg
                            viewBox="0 0 100 100"
                            className={cn(
                                'w-[85%] h-[85%] transition-all duration-300 relative z-10',
                                placedShapes.includes(shape.id)
                                    ? 'opacity-100 scale-100 drop-shadow-[0_4px_4px_rgba(0,0,0,0.1)]'
                                    : 'opacity-10 scale-95',
                            )}
                        >
                            {placedShapes.includes(shape.id)
                                ? SHAPES[shape.type](shape.color)
                                : SHAPES[shape.type]('#000000')}
                        </svg>

                        <AnimatePresence>
                            {placedShapes.includes(shape.id) && (
                                <motion.div
                                    initial={{ scale: 0.8, opacity: 1 }}
                                    animate={{ scale: 1.3, opacity: 0 }}
                                    transition={{ duration: 0.4 }}
                                    className="absolute inset-0 border-4 border-emerald-400 rounded-full pointer-events-none z-20"
                                />
                            )}
                        </AnimatePresence>
                    </div>
                ))}
            </motion.div>

            {/* SCATTERED TOYS */}
            <div className="flex-1 w-full max-w-5xl mx-auto relative z-30 mt-4 pointer-events-none">
                <AnimatePresence>
                    {activeShapes.map(
                        (shape) =>
                            !placedShapes.includes(shape.id) && (
                                <motion.div
                                    id={`drag-${shape.id}`}
                                    key={`drag-${shape.id}`}
                                    drag
                                    dragSnapToOrigin
                                    whileDrag={{
                                        scale: 1.25,
                                        zIndex: 100,
                                        rotate: 0,
                                        filter: 'drop-shadow(0px 25px 25px rgba(0,0,0,0.25)) drop-shadow(0px 10px 0px rgba(0,0,0,0.1))',
                                    }}
                                    onDragEnd={(e, info) =>
                                        handleDragEnd(e, info, shape)
                                    }
                                    initial={{
                                        opacity: 0,
                                        scale: 0,
                                        rotate: shape.rotation,
                                        x: '-50%',
                                        y: '-50%',
                                    }}
                                    animate={{
                                        opacity: 1,
                                        scale: 1,
                                        rotate: shape.rotation,
                                        x: '-50%',
                                        y: '-50%',
                                    }}
                                    exit={{ opacity: 0, scale: 0 }}
                                    transition={{ type: 'spring', bounce: 0.4 }}
                                    className="absolute w-28 h-28 md:w-36 md:h-36 cursor-grab active:cursor-grabbing touch-none pointer-events-auto"
                                    style={{
                                        left: `${shape.posX}%`,
                                        top: `${shape.posY}%`,
                                        filter: 'drop-shadow(0px 8px 0px rgba(0,0,0,0.15)) drop-shadow(0px 10px 10px rgba(0,0,0,0.15))',
                                    }}
                                >
                                    <svg
                                        viewBox="0 0 100 100"
                                        className="w-full h-full pointer-events-none"
                                    >
                                        {SHAPES[shape.type](shape.color)}
                                    </svg>
                                </motion.div>
                            ),
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
