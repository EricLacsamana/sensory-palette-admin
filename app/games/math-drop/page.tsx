'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { Star, Trophy, ArrowUpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const MAX_LEVEL = 5;

const BLOCK_COLORS = [
    'bg-rose-500 border-rose-600',
    'bg-blue-500 border-blue-600',
    'bg-emerald-500 border-emerald-600',
    'bg-amber-500 border-amber-600',
    'bg-purple-500 border-purple-600',
];

interface OptionBlock {
    value: number;
    rotation: number;
    posX: number;
    posY: number;
    colorClass: string;
}

export default function MathDropGame({
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
    const [telemetry, setTelemetry] = useState<any[]>([]);
    const [feedback, setFeedback] = useState<
        'none' | 'wrong' | 'correct' | 'levelup' | 'leveldown'
    >('none');

    const [equationParts, setEquationParts] = useState<string[]>([]);
    const [targetAnswer, setTargetAnswer] = useState<number | null>(null);
    const [options, setOptions] = useState<OptionBlock[]>([]);
    const [isSolved, setIsSolved] = useState(false);

    const timerRef = useRef<number>(0);

    const successSfx = useRef<HTMLAudioElement | null>(null);
    const retrySfx = useRef<HTMLAudioElement | null>(null);
    const levelUpSfx = useRef<HTMLAudioElement | null>(null);
    const popSfx = useRef<HTMLAudioElement | null>(null);

    const generateRound = useCallback((currentLevel: number) => {
        let num1 = 0,
            num2 = 0,
            answer = 0,
            op = '+';

        if (currentLevel === 1) {
            num1 = Math.floor(Math.random() * 5) + 1;
            num2 = Math.random() > 0.5 ? 1 : 0;
            answer = num1 + num2;
        } else if (currentLevel === 2) {
            num1 = Math.floor(Math.random() * 5) + 1;
            num2 = Math.floor(Math.random() * 5) + 1;
            answer = num1 + num2;
        } else if (currentLevel === 3) {
            op = ['+', '-'][Math.floor(Math.random() * 2)];
            if (op === '+') {
                num1 = Math.floor(Math.random() * 8) + 3;
                num2 = Math.floor(Math.random() * 5) + 1;
            } else {
                num1 = Math.floor(Math.random() * 8) + 3;
                num2 = Math.floor(Math.random() * 2) + 1;
            }
            answer = op === '+' ? num1 + num2 : num1 - num2;
        } else if (currentLevel === 4) {
            op = ['+', '-'][Math.floor(Math.random() * 2)];
            if (op === '+') {
                num1 = Math.floor(Math.random() * 10) + 5;
                num2 = Math.floor(Math.random() * 6) + 1;
            } else {
                num1 = Math.floor(Math.random() * 10) + 6;
                num2 = Math.floor(Math.random() * 5) + 1;
            }
            answer = op === '+' ? num1 + num2 : num1 - num2;
        } else {
            op = ['+', '-'][Math.floor(Math.random() * 2)];
            if (op === '+') {
                num1 = Math.floor(Math.random() * 10) + 10;
                num2 = Math.floor(Math.random() * 9) + 1;
            } else {
                num1 = Math.floor(Math.random() * 10) + 10;
                num2 = Math.floor(Math.random() * 9) + 1;
            }
            answer = op === '+' ? num1 + num2 : num1 - num2;
        }

        setEquationParts([num1.toString(), op, num2.toString(), '=']);
        setTargetAnswer(answer);
        setIsSolved(false);

        const optionCount = currentLevel <= 2 ? 3 : 4;
        const distractors = new Set<number>();
        while (distractors.size < optionCount - 1) {
            const offset = Math.floor(Math.random() * 4) + 1;
            const distractor =
                Math.random() > 0.5 ? answer + offset : answer - offset;
            if (distractor !== answer && distractor >= 0)
                distractors.add(distractor);
        }

        const rawValues = [answer, ...Array.from(distractors)].sort(
            () => Math.random() - 0.5,
        );

        const zones = [
            { x: 25, y: 35 },
            { x: 75, y: 35 },
            { x: 50, y: 70 },
            { x: 20, y: 80 },
            { x: 80, y: 80 },
        ].sort(() => Math.random() - 0.5);

        setOptions(
            rawValues.map((val, i) => {
                const zone = zones[i] || { x: 50, y: 50 };
                return {
                    value: val,
                    rotation: Math.random() * 40 - 20,
                    posX: zone.x + (Math.random() * 10 - 5),
                    posY: zone.y + (Math.random() * 10 - 5),
                    colorClass: BLOCK_COLORS[i % BLOCK_COLORS.length],
                };
            }),
        );

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

    const handleDragEnd = (e: any, info: PanInfo, value: number) => {
        if (isSolved || feedback !== 'none') return;

        const draggingEl = document.getElementById(`drag-num-${value}`);
        if (draggingEl) draggingEl.style.pointerEvents = 'none';

        const dropTarget = document.elementFromPoint(
            info.point.x,
            info.point.y,
        );
        if (draggingEl) draggingEl.style.pointerEvents = 'auto';

        const dropZone = dropTarget?.closest('[data-dropzone="true"]');
        if (!dropZone) return;

        const isCorrect = value === targetAnswer;
        let nextLevel = level;
        let levelShift: 'up' | 'down' | 'none' = 'none';

        if (isCorrect) {
            setIsSolved(true);
            popSfx.current?.play().catch(() => {});

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

        const newTotal = totalCount + 1;
        const newCorrect = isCorrect ? correctCount + 1 : correctCount;
        const newAccuracy = Math.round((newCorrect / newTotal) * 100);

        setTotalCount(newTotal);
        if (isCorrect) setCorrectCount(newCorrect);

        const logEntry = {
            timestamp: new Date().toISOString(),
            action: 'drag_drop',
            targetId: String(value),
            isCorrect,
            responseTimeMs: Date.now() - timerRef.current,
            metadata: {
                gameType: 'math_drag_drop',
                currentLevel: level,
                numberDragged: String(value),
                expectedAnswer: String(targetAnswer),
                equation: equationParts.join(' '),
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
        <div className="w-full h-[100dvh] bg-[#E0F2FE] flex flex-col p-4 md:p-8 overflow-hidden touch-none font-sans relative">
            <div className="flex justify-center items-center gap-4 shrink-0 z-20 pt-2">
                <div className="flex items-center gap-2 bg-white px-6 py-3 rounded-full text-lg font-black text-sky-600 shadow-sm uppercase tracking-widest transition-all">
                    <Star size={24} className="text-amber-400 fill-amber-400" />{' '}
                    Level {level}
                </div>
                {showMetrics && (
                    <div className="flex items-center gap-2 bg-white px-6 py-3 rounded-full text-lg font-black text-emerald-500 shadow-sm uppercase tracking-widest">
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
                        className="absolute inset-0 flex flex-col items-center justify-center z-50 pointer-events-none"
                    >
                        <div className="bg-white px-16 py-10 rounded-3xl text-center shadow-2xl flex flex-col items-center">
                            <ArrowUpCircle
                                size={80}
                                className="text-sky-500 mb-4 animate-bounce"
                            />
                            <h1 className="text-5xl md:text-7xl font-black text-slate-800 uppercase tracking-widest">
                                Level Up!
                            </h1>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* EQUATION BOARD */}
            <div className="w-full flex items-center justify-center relative z-10 mt-4 h-[35vh]">
                <motion.div
                    animate={
                        feedback === 'wrong' || feedback === 'leveldown'
                            ? { x: [-10, 10, -10, 10, 0] }
                            : feedback === 'correct'
                              ? { scale: [1, 1.05, 1], y: [0, -5, 0] }
                              : {}
                    }
                    // FIX: Replaced spring with a standard duration to allow keyframe arrays to work!
                    transition={{ duration: 0.4, ease: 'easeInOut' }}
                    className={cn(
                        'bg-white px-8 py-10 md:px-16 md:py-16 rounded-[2.5rem] shadow-sm border border-slate-100 flex items-center gap-4 md:gap-8 flex-wrap justify-center transition-colors duration-300',
                        feedback === 'correct'
                            ? 'border-emerald-300 ring-4 ring-emerald-100'
                            : feedback === 'wrong'
                              ? 'border-rose-300 ring-4 ring-rose-100'
                              : '',
                    )}
                >
                    {equationParts.map((part, i) => (
                        <span
                            key={i}
                            className="text-[4rem] md:text-[6.5rem] font-black text-slate-700 tracking-tighter"
                        >
                            {part}
                        </span>
                    ))}

                    <div
                        data-dropzone="true"
                        className={cn(
                            'w-[5.5rem] h-[7rem] md:w-[7.5rem] md:h-[9rem] rounded-2xl border-[4px] flex items-center justify-center transition-all duration-300',
                            isSolved
                                ? 'border-transparent bg-transparent'
                                : 'border-slate-200 border-dashed bg-slate-50',
                            feedback === 'correct' && 'border-transparent',
                        )}
                    >
                        {isSolved && (
                            <motion.span
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring' }}
                                className="text-[5.5rem] md:text-[8rem] font-black text-emerald-500"
                            >
                                {targetAnswer}
                            </motion.span>
                        )}
                    </div>
                </motion.div>
            </div>

            {/* SCATTERED TOY BLOCKS */}
            <div className="flex-1 w-full max-w-4xl mx-auto relative z-30 pointer-events-none">
                <AnimatePresence>
                    {!isSolved &&
                        options.map((opt) => (
                            <motion.div
                                id={`drag-num-${opt.value}`}
                                key={`drag-num-${opt.value}`}
                                drag
                                dragSnapToOrigin
                                whileDrag={{
                                    scale: 1.25,
                                    zIndex: 100,
                                    rotate: 0,
                                    boxShadow: '0px 25px 30px rgba(0,0,0,0.2)',
                                }}
                                onDragEnd={(e, info) =>
                                    handleDragEnd(e, info, opt.value)
                                }
                                initial={{
                                    opacity: 0,
                                    scale: 0,
                                    rotate: opt.rotation,
                                    x: '-50%',
                                    y: '-50%',
                                }}
                                animate={{
                                    opacity: 1,
                                    scale: 1,
                                    rotate: opt.rotation,
                                    x: '-50%',
                                    y: '-50%',
                                }}
                                exit={{ opacity: 0, scale: 0 }}
                                transition={{ type: 'spring', bounce: 0.4 }}
                                className={cn(
                                    'absolute w-[6rem] h-[7.5rem] md:w-[8rem] md:h-[10rem] rounded-2xl flex items-center justify-center cursor-grab active:cursor-grabbing border-b-[8px] border-r-[2px] border-l-[2px] border-t-[2px] touch-none pointer-events-auto',
                                    opt.colorClass,
                                )}
                                style={{
                                    left: `${opt.posX}%`,
                                    top: `${opt.posY}%`,
                                    boxShadow: '0px 10px 15px rgba(0,0,0,0.15)',
                                }}
                            >
                                <span className="text-[4rem] md:text-[5.5rem] font-black text-white pointer-events-none drop-shadow-sm">
                                    {opt.value}
                                </span>
                            </motion.div>
                        ))}
                </AnimatePresence>
            </div>
        </div>
    );
}
