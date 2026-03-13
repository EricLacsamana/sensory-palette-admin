'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Mic,
    BarChart,
    Trophy,
    User,
    ArrowUpCircle,
    ArrowDownCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// --- CUSTOM SVG SPARKLE ---
const SparkleIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M11.64 5.232c.184-.525.932-.525 1.117 0l1.458 4.152a1.2 1.2 0 00.838.838l4.152 1.458c.525.184.525.932 0 1.117l-4.152 1.458a1.2 1.2 0 00-.838.838l-1.458 4.152c-.184.525-.932.525-1.117 0l-1.458-4.152a1.2 1.2 0 00-.838-.838l-4.152-1.458c-.525-.184-.525-.932 0-1.117l4.152-1.458a1.2 1.2 0 00.838-.838l1.458-4.152z" />
    </svg>
);

// --- NEW DATA: OPPOSITES ---
const ALL_OPPOSITES = [
    {
        prompt: 'Day',
        promptEmoji: '☀️',
        answer: 'Night',
        answerEmoji: '🌙',
        level: 1,
        soundsLike: ['nite', 'knight'],
        almostLike: ['ni'],
    },
    {
        prompt: 'Happy',
        promptEmoji: '😊',
        answer: 'Sad',
        answerEmoji: '😢',
        level: 1,
        soundsLike: ['sat', 'bad'],
        almostLike: ['sa'],
    },
    {
        prompt: 'Big',
        promptEmoji: '🐘',
        answer: 'Small',
        answerEmoji: '🐜',
        level: 1,
        soundsLike: ['smol', 'fall', 'mall'],
        almostLike: ['sma'],
    },
    {
        prompt: 'Hot',
        promptEmoji: '🔥',
        answer: 'Cold',
        answerEmoji: '🧊',
        level: 1,
        soundsLike: ['hold', 'gold', 'coal', 'called'],
        almostLike: ['co'],
    },
    {
        prompt: 'Up',
        promptEmoji: '⬆️',
        answer: 'Down',
        answerEmoji: '⬇️',
        level: 1,
        soundsLike: ['town', 'frown', 'hound'],
        almostLike: ['dow'],
    },

    {
        prompt: 'Fast',
        promptEmoji: '🐆',
        answer: 'Slow',
        answerEmoji: '🐢',
        level: 2,
        soundsLike: ['flow', 'snow', 'low'],
        almostLike: ['slo'],
    },
    {
        prompt: 'Open',
        promptEmoji: '📖',
        answer: 'Closed',
        answerEmoji: '📕',
        level: 2,
        soundsLike: ['close', 'clothes'],
        almostLike: ['clo'],
    },
    {
        prompt: 'Wet',
        promptEmoji: '💧',
        answer: 'Dry',
        answerEmoji: '🏜️',
        level: 2,
        soundsLike: ['try', 'die', 'cry'],
        almostLike: ['dr'],
    },
    {
        prompt: 'Loud',
        promptEmoji: '📢',
        answer: 'Quiet',
        answerEmoji: '🤫',
        level: 2,
        soundsLike: ['kwiet', 'diet', 'white'],
        almostLike: ['qui'],
    },

    {
        prompt: 'Heavy',
        promptEmoji: '🪨',
        answer: 'Light',
        answerEmoji: '🪶',
        level: 3,
        soundsLike: ['lite', 'right', 'white', 'night'],
        almostLike: ['li'],
    },
    {
        prompt: 'Clean',
        promptEmoji: '✨',
        answer: 'Dirty',
        answerEmoji: '🗑️',
        level: 3,
        soundsLike: ['durty', 'thirty', 'birdie'],
        almostLike: ['dir'],
    },
    {
        prompt: 'Full',
        promptEmoji: '🈵',
        answer: 'Empty',
        answerEmoji: '🫙',
        level: 3,
        soundsLike: ['emty', 'MT', 'empty'],
        almostLike: ['emp'],
    },

    {
        prompt: 'Asleep',
        promptEmoji: '😴',
        answer: 'Awake',
        answerEmoji: '😳',
        level: 4,
        soundsLike: ['a wake', 'wait', 'lake'],
        almostLike: ['awa'],
    },
    {
        prompt: 'Float',
        promptEmoji: '🎈',
        answer: 'Sink',
        answerEmoji: '⚓',
        level: 4,
        soundsLike: ['sync', 'think', 'pink'],
        almostLike: ['sin'],
    },
    {
        prompt: 'Rough',
        promptEmoji: '🥥',
        answer: 'Smooth',
        answerEmoji: '🎱',
        level: 4,
        soundsLike: ['smoov', 'smuth', 'move'],
        almostLike: ['smoo'],
    },

    {
        prompt: 'Push',
        promptEmoji: '🖐️',
        answer: 'Pull',
        answerEmoji: '🪢',
        level: 5,
        soundsLike: ['pool', 'pole', 'bull'],
        almostLike: ['pu'],
    },
    {
        prompt: 'Over',
        promptEmoji: '🌉',
        answer: 'Under',
        answerEmoji: '🚇',
        level: 5,
        soundsLike: ['hunder', 'wonder', 'thunder'],
        almostLike: ['und'],
    },
    {
        prompt: 'Inside',
        promptEmoji: '🏠',
        answer: 'Outside',
        answerEmoji: '🏕️',
        level: 5,
        soundsLike: ['out side', 'out'],
        almostLike: ['out'],
    },
];

const MAX_LEVEL = 5;

const getRandomWord = (currentLevel: number) => {
    const pool = ALL_OPPOSITES.filter((w) => w.level === currentLevel);
    const finalPool =
        pool.length > 0 ? pool : ALL_OPPOSITES.filter((w) => w.level === 1);
    return finalPool[Math.floor(Math.random() * finalPool.length)];
};

export default function OppositesGame({
    studentAge,
    baseDifficulty,
}: {
    studentAge?: number;
    baseDifficulty?: 1 | 2 | 3 | 4 | 5;
}) {
    const searchParams = useSearchParams();

    // --- INITIAL STATE ---
    const [isAdaptive, setIsAdaptive] = useState(
        () => searchParams.get('adaptive') !== 'false',
    );

    const getStartingLevel = () => {
        const urlLevel = parseInt(searchParams.get('level') || '0', 10);
        if (urlLevel > 0 && urlLevel <= MAX_LEVEL) return urlLevel;
        if (baseDifficulty) return baseDifficulty;
        return studentAge && studentAge <= 4 ? 1 : 2;
    };

    const initialLevel = getStartingLevel();

    // --- STATE ---
    const [level, setLevel] = useState<number>(initialLevel);
    const [target, setTarget] = useState<any>(() =>
        getRandomWord(initialLevel),
    );
    const [feedback, setFeedback] = useState<
        | 'none'
        | 'wrong'
        | 'correct'
        | 'timeout'
        | 'almost'
        | 'levelup'
        | 'leveldown'
        | 'preparing'
    >('preparing');
    const [prepTimer, setPrepTimer] = useState(3);
    const [correctCount, setCorrectCount] = useState(0);
    const [totalCount, setTotalCount] = useState(0);
    const [uiStreak, setUiStreak] = useState(0);
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState<string>('');
    const [telemetry, setTelemetry] = useState<any[]>([]);
    const [timerKey, setTimerKey] = useState(0);

    // --- REFS ---
    const recognitionRef = useRef<any>(null);
    const isRoundActive = useRef(false);
    const timerRef = useRef<number>(0);
    const autoRecoveryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // SOUND REFS
    const sfxRef = useRef<{ correct: any; wrong: any; levelup: any }>({
        correct: null,
        wrong: null,
        levelup: null,
    });
    const isAudioUnlocked = useRef(false);

    const targetRef = useRef(target);
    const feedbackRef = useRef(feedback);
    const levelRef = useRef(level);
    const streakRef = useRef(0);
    const failsRef = useRef(0);
    const isAdaptiveRef = useRef(isAdaptive);
    const transcriptRef = useRef(transcript);

    // --- SYNC REFS ---
    useEffect(() => {
        targetRef.current = target;
    }, [target]);
    useEffect(() => {
        feedbackRef.current = feedback;
    }, [feedback]);
    useEffect(() => {
        levelRef.current = level;
    }, [level]);
    useEffect(() => {
        isAdaptiveRef.current = isAdaptive;
    }, [isAdaptive]);
    useEffect(() => {
        transcriptRef.current = transcript;
    }, [transcript]);

    useEffect(() => {
        return () => {
            if (autoRecoveryTimeoutRef.current)
                clearTimeout(autoRecoveryTimeoutRef.current);
        };
    }, []);

    // --- CALLBACKS ---
    const stopMic = useCallback(() => {
        if (recognitionRef.current) {
            try {
                recognitionRef.current.abort();
            } catch (e) {}
            setIsListening(false);
        }
    }, []);

    const startMic = useCallback(() => {
        if (!recognitionRef.current) return;
        setTranscript('');
        try {
            recognitionRef.current.start();
        } catch (e: any) {}
    }, []);

    const generate = useCallback(
        (currentLevel: number) => {
            const nextTarget = getRandomWord(currentLevel);
            stopMic();
            isRoundActive.current = false;
            setTarget(nextTarget);
            setFeedback('preparing');
            setPrepTimer(3);
            setTranscript('');
        },
        [stopMic],
    );

    const handleResult = useCallback(
        (
            resultType: 'correct' | 'almost' | 'wrong' | 'timeout',
            finalTranscript: string,
        ) => {
            if (
                !isRoundActive.current ||
                !targetRef.current ||
                feedbackRef.current !== 'none'
            )
                return;
            isRoundActive.current = false;

            const isCorrect = resultType === 'correct';
            let nextLevel = levelRef.current;
            let levelShift: 'up' | 'down' | 'none' = 'none';

            if (isAdaptiveRef.current) {
                if (isCorrect) {
                    failsRef.current = 0;
                    streakRef.current += 1;
                    setUiStreak(streakRef.current);

                    if (
                        streakRef.current >= 3 &&
                        levelRef.current < MAX_LEVEL
                    ) {
                        nextLevel = levelRef.current + 1;
                        setLevel(nextLevel);
                        streakRef.current = 0;
                        setUiStreak(0);
                        levelShift = 'up';
                    }
                } else {
                    streakRef.current = 0;
                    setUiStreak(0);
                    failsRef.current += 1;

                    if (failsRef.current >= 2 && levelRef.current > 1) {
                        nextLevel = levelRef.current - 1;
                        setLevel(nextLevel);
                        failsRef.current = 0;
                        levelShift = 'down';
                    }
                }
            } else {
                if (isCorrect) {
                    streakRef.current += 1;
                    setUiStreak(streakRef.current);
                } else {
                    streakRef.current = 0;
                    setUiStreak(0);
                }
                nextLevel = levelRef.current;
            }

            const newTotal = totalCount + 1;
            const newCorrect = isCorrect ? correctCount + 1 : correctCount;
            setTotalCount(newTotal);
            if (isCorrect) setCorrectCount(newCorrect);

            const logEntry = {
                timestamp: new Date().toISOString(),
                action: 'voice_input',
                targetId: targetRef.current.prompt,
                isCorrect,
                responseTimeMs: Date.now() - timerRef.current,
                metadata: {
                    currentLevel: levelRef.current,
                    wordHeard: finalTranscript || '[silence]',
                    resultType,
                    levelShift:
                        isAdaptiveRef.current && levelShift !== 'none'
                            ? levelShift
                            : undefined,
                    adaptiveMode: isAdaptiveRef.current,
                },
            };

            setTelemetry((prev) => {
                const updated = [...prev, logEntry];
                window.parent.postMessage(
                    {
                        type: 'GAME_SCORE_UPDATE',
                        score: Math.round((newCorrect / newTotal) * 100),
                        rawTelemetry: updated,
                    },
                    '*',
                );
                return updated;
            });

            if (levelShift === 'up') {
                sfxRef.current.levelup?.play().catch(() => {});
            } else if (isCorrect) {
                sfxRef.current.correct?.play().catch(() => {});
            } else {
                sfxRef.current.wrong?.play().catch(() => {});
            }

            if (levelShift === 'up') setFeedback('levelup');
            else if (levelShift === 'down') setFeedback('leveldown');
            else setFeedback(resultType);

            stopMic();

            if (autoRecoveryTimeoutRef.current)
                clearTimeout(autoRecoveryTimeoutRef.current);

            if (isCorrect || levelShift !== 'none') {
                setTimeout(() => {
                    generate(nextLevel);
                }, 3500); // Slightly longer to appreciate the flip animation
            } else {
                autoRecoveryTimeoutRef.current = setTimeout(() => {
                    setFeedback('none');
                    setTranscript('');
                    isRoundActive.current = true;
                    const now = Date.now();
                    timerRef.current = now;
                    setTimerKey(now);
                    startMic();
                }, 3000);
            }
        },
        [totalCount, correctCount, generate, stopMic],
    );

    // --- EFFECTS ---
    useEffect(() => {
        const handleSync = (event: MessageEvent) => {
            if (event.data?.type === 'SYNC_STATE') {
                if (event.data.payload.isAdaptive !== undefined)
                    setIsAdaptive(event.data.payload.isAdaptive);
                if (event.data.payload.level !== undefined) {
                    setLevel(event.data.payload.level);
                    generate(event.data.payload.level);
                }
            }
        };
        window.addEventListener('message', handleSync);
        return () => window.removeEventListener('message', handleSync);
    }, [generate]);

    useEffect(() => {
        sfxRef.current = {
            correct: new Audio(
                'https://cdnjs.cloudflare.com/ajax/libs/ion-sound/3.0.7/sounds/glass.mp3',
            ),
            wrong: new Audio(
                'https://cdnjs.cloudflare.com/ajax/libs/ion-sound/3.0.7/sounds/water_droplet.mp3',
            ),
            levelup: new Audio(
                'https://cdnjs.cloudflare.com/ajax/libs/ion-sound/3.0.7/sounds/bell_ring.mp3',
            ),
        };
    }, []);

    useEffect(() => {
        const SpeechRecognition =
            (window as any).SpeechRecognition ||
            (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;

            recognition.onstart = () => setIsListening(true);

            recognition.onresult = (e: any) => {
                const currentTranscript = Array.from(e.results)
                    .map((res: any) => res[0].transcript)
                    .join('')
                    .toLowerCase()
                    .trim();

                setTranscript(currentTranscript);

                if (
                    isRoundActive.current &&
                    feedbackRef.current === 'none' &&
                    targetRef.current
                ) {
                    // Check against the ANSWER, not the prompt
                    const isMatch =
                        currentTranscript.includes(
                            targetRef.current.answer.toLowerCase(),
                        ) ||
                        targetRef.current.soundsLike?.some((s: string) =>
                            currentTranscript.includes(s.toLowerCase()),
                        );

                    if (isMatch) {
                        handleResult('correct', currentTranscript);
                    }
                }
            };

            recognition.onend = () => {
                setIsListening(false);
                setTimeout(() => {
                    if (
                        isRoundActive.current &&
                        feedbackRef.current === 'none'
                    ) {
                        try {
                            recognition.start();
                        } catch (e) {}
                    }
                }, 100);
            };

            recognitionRef.current = recognition;
        }
        return () => stopMic();
    }, [handleResult, stopMic]);

    useEffect(() => {
        if (feedback === 'preparing') {
            const t = setTimeout(() => {
                if (prepTimer > 0) {
                    setPrepTimer((prev) => prev - 1);
                } else {
                    setFeedback('none');
                    isRoundActive.current = true;
                    const now = Date.now();
                    timerRef.current = now;
                    setTimerKey(now);
                    startMic();
                }
            }, 1000);
            return () => clearTimeout(t);
        }
    }, [feedback, prepTimer, startMic]);

    useEffect(() => {
        let t: NodeJS.Timeout;
        let gracePeriod: NodeJS.Timeout;

        if (isListening && feedback === 'none') {
            t = setTimeout(() => {
                gracePeriod = setTimeout(() => {
                    if (feedbackRef.current !== 'none') return;
                    const final = transcriptRef.current.toLowerCase().trim();
                    if (!final) handleResult('timeout', '');
                    else if (
                        targetRef.current?.almostLike?.some((s: string) =>
                            final.includes(s.toLowerCase()),
                        )
                    )
                        handleResult('almost', final);
                    else handleResult('wrong', final);
                }, 500);
            }, 10000);
        }
        return () => {
            clearTimeout(t);
            clearTimeout(gracePeriod);
        };
    }, [isListening, feedback, handleResult]);

    const handleMicClick = () => {
        if (!isAudioUnlocked.current) {
            Object.values(sfxRef.current).forEach((audio: any) => {
                if (audio) {
                    audio.volume = 0;
                    audio.play().catch(() => {});
                    setTimeout(() => {
                        audio.pause();
                        audio.currentTime = 0;
                        audio.volume = 1;
                    }, 50);
                }
            });
            isAudioUnlocked.current = true;
        }

        if (autoRecoveryTimeoutRef.current)
            clearTimeout(autoRecoveryTimeoutRef.current);

        if (!isListening) {
            if (feedback === 'none' || feedback === 'preparing') {
                startMic();
            } else if (
                feedback === 'wrong' ||
                feedback === 'timeout' ||
                feedback === 'almost'
            ) {
                setFeedback('none');
                setTranscript('');
                isRoundActive.current = true;
                const now = Date.now();
                timerRef.current = now;
                setTimerKey(now);
                startMic();
            } else {
                generate(level);
            }
        }
    };

    if (!target) return null;

    const FloatingSparkles = () => {
        const sparkleProps = [
            { top: '-10%', left: '5%', size: 40, delay: 0 },
            { top: '15%', left: '-15%', size: 28, delay: 0.2 },
            { top: '-15%', left: '85%', size: 50, delay: 0.1 },
            { top: '45%', left: '105%', size: 35, delay: 0.3 },
            { top: '100%', left: '15%', size: 30, delay: 0.4 },
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

    const isTryAgainState =
        !isListening &&
        (feedback === 'wrong' ||
            feedback === 'timeout' ||
            feedback === 'almost');
    const isSuccessState = feedback === 'correct' || feedback === 'levelup';

    // --- UI ---
    return (
        <div className="w-full h-screen bg-[#fcfcfd] dark:bg-[#0a0c12] flex flex-col items-center justify-between py-6 px-4 overflow-hidden font-sans relative">
            <div className="w-full flex justify-center gap-4 opacity-80 shrink-0 z-20">
                {studentAge && (
                    <div className="flex items-center gap-2 bg-slate-100 dark:bg-white/10 px-4 py-2 rounded-full text-xs font-bold text-slate-500 uppercase tracking-widest">
                        <User size={14} /> Age {studentAge}
                    </div>
                )}
                <div className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-900/30 px-4 py-2 rounded-full text-xs font-bold text-indigo-600 uppercase tracking-widest">
                    <BarChart size={14} /> Level {level}
                </div>
                <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/30 px-4 py-2 rounded-full text-xs font-bold text-emerald-600 uppercase tracking-widest">
                    <Trophy size={14} />{' '}
                    {totalCount === 0
                        ? 0
                        : Math.round((correctCount / totalCount) * 100)}
                    %
                </div>
            </div>

            <div
                className="flex-1 flex flex-col items-center justify-center w-full min-h-0 relative z-10"
                style={{ perspective: 1000 }}
            >
                {/* 3D FLIPPING CARD */}
                <motion.div
                    animate={
                        isSuccessState
                            ? { rotateY: 180, scale: [1, 1.1, 1] }
                            : feedback === 'wrong' || feedback === 'leveldown'
                              ? { x: [-10, 10, -10, 10, 0] }
                              : { rotateY: 0, y: [0, -2, 0] }
                    }
                    transition={{ duration: 0.6, ease: 'easeInOut' }}
                    style={{ transformStyle: 'preserve-3d' }}
                    className={cn(
                        'aspect-square h-[30vh] max-h-[250px] rounded-[40px] bg-white border border-slate-200 shadow-xl flex flex-col items-center justify-center relative overflow-visible transition-shadow duration-500',
                        isSuccessState &&
                            'shadow-[0_0_50px_rgba(16,185,129,0.4)] border-emerald-200',
                    )}
                >
                    {isSuccessState && (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="absolute inset-0 rounded-[40px] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/confetti.png')] opacity-20 overflow-hidden"
                            />
                            <FloatingSparkles />
                        </>
                    )}

                    <AnimatePresence mode="wait">
                        {feedback !== 'preparing' ? (
                            <motion.div
                                key={isSuccessState ? 'answer' : 'prompt'}
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 1.2 }}
                                // Important: Counter-rotate the inner content so it's not backwards when flipped
                                style={{ rotateY: isSuccessState ? 180 : 0 }}
                                className="flex flex-col items-center z-10"
                            >
                                <span className="text-[15vh] sm:text-[120px] leading-none select-none drop-shadow-sm">
                                    {isSuccessState
                                        ? target.answerEmoji
                                        : target.promptEmoji}
                                </span>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="prep"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex flex-col items-center justify-center z-10"
                            >
                                <span className="text-7xl font-black text-rose-500 animate-pulse">
                                    {prepTimer > 0 ? prepTimer : 'GO!'}
                                </span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <AnimatePresence>
                        {feedback === 'levelup' && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                style={{ rotateY: 180 }}
                                className="absolute -top-12 text-emerald-500 flex flex-col items-center z-20"
                            >
                                <ArrowUpCircle
                                    size={40}
                                    className="animate-bounce"
                                />
                                <span className="text-[10px] font-black uppercase tracking-widest mt-1">
                                    Level Up!
                                </span>
                            </motion.div>
                        )}
                        {feedback === 'leveldown' && (
                            <motion.div
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="absolute -top-12 text-amber-500 flex flex-col items-center z-20"
                            >
                                <ArrowDownCircle
                                    size={40}
                                    className="animate-bounce"
                                />
                                <span className="text-[10px] font-black uppercase tracking-widest mt-1">
                                    Easier
                                </span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {level === 1 && feedback !== 'preparing' && (
                        <motion.span
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            style={{ rotateY: isSuccessState ? 180 : 0 }}
                            className="mt-2 text-xl font-black text-slate-300 uppercase tracking-widest relative z-10"
                        >
                            {isSuccessState ? target.answer : target.prompt}
                        </motion.span>
                    )}
                </motion.div>

                <div className="h-[12vh] flex flex-col items-center justify-center mt-4 z-10">
                    <AnimatePresence mode="wait">
                        <motion.h2
                            key={feedback}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="text-xl sm:text-2xl font-light text-slate-800 dark:text-slate-100 text-center px-4"
                        >
                            {feedback === 'preparing' ? (
                                <span className="text-slate-400 font-bold">
                                    Ready...
                                </span>
                            ) : isSuccessState ? (
                                <span className="text-emerald-500 font-black flex items-center gap-2 justify-center scale-110">
                                    <motion.div
                                        animate={{ scale: [0.8, 1.2, 0.8] }}
                                        transition={{
                                            repeat: Infinity,
                                            duration: 1.5,
                                        }}
                                    >
                                        <SparkleIcon className="w-6 h-6 text-emerald-400" />
                                    </motion.div>
                                    YES! {target.answer.toUpperCase()}
                                    <motion.div
                                        animate={{ scale: [0.8, 1.2, 0.8] }}
                                        transition={{
                                            repeat: Infinity,
                                            duration: 1.5,
                                            delay: 0.3,
                                        }}
                                    >
                                        <SparkleIcon className="w-6 h-6 text-emerald-400" />
                                    </motion.div>
                                </span>
                            ) : feedback === 'almost' ? (
                                <span className="text-amber-500 font-bold">
                                    Almost there!
                                </span>
                            ) : feedback === 'wrong' ? (
                                <span className="text-rose-500 font-bold">
                                    Try again!
                                </span>
                            ) : feedback === 'leveldown' ? (
                                <span className="text-amber-500 font-bold">
                                    Let's try an easier one!
                                </span>
                            ) : feedback === 'timeout' ? (
                                <span className="text-amber-500 font-bold">
                                    I didn&apos;t hear you...
                                </span>
                            ) : (
                                <>
                                    Opposite of{' '}
                                    <span className="font-semibold text-rose-500">
                                        "{target.prompt}"
                                    </span>
                                    ?
                                </>
                            )}
                        </motion.h2>
                    </AnimatePresence>
                    {transcript && (
                        <span className="text-slate-400 italic text-sm mt-1 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                            "{transcript}"
                        </span>
                    )}
                </div>
            </div>

            <div className="w-full flex flex-col items-center gap-2 shrink-0 pb-4 z-20">
                <div className="h-6 flex items-end gap-1 mb-2">
                    {isListening &&
                        [1, 2, 3, 4, 5].map((i) => (
                            <motion.div
                                key={i}
                                animate={{ height: [8, 20, 8] }}
                                transition={{
                                    repeat: Infinity,
                                    duration: 0.5 + i * 0.1,
                                }}
                                className="w-1.5 bg-rose-400 rounded-full"
                            />
                        ))}
                </div>

                <div className="relative flex flex-col items-center justify-center">
                    <AnimatePresence>
                        {isTryAgainState && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.5 }}
                                className="absolute -top-14 text-rose-500 z-30"
                            >
                                <ArrowDownCircle
                                    size={36}
                                    className="animate-bounce drop-shadow-md"
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        animate={isTryAgainState ? { scale: [1, 1.05, 1] } : {}}
                        transition={
                            isTryAgainState
                                ? {
                                      repeat: Infinity,
                                      duration: 1.5,
                                      ease: 'easeInOut',
                                  }
                                : {}
                        }
                        onClick={handleMicClick}
                        className={cn(
                            'w-24 h-24 rounded-full flex items-center justify-center border-4 shadow-xl transition-all duration-500 cursor-pointer relative',
                            isListening
                                ? 'bg-rose-500 border-rose-300 text-white shadow-rose-500/40'
                                : isTryAgainState
                                  ? 'bg-rose-50 border-rose-400 text-rose-500 shadow-[0_0_30px_rgba(244,63,94,0.3)]'
                                  : 'bg-white border-slate-200 text-rose-300 hover:border-rose-400',
                        )}
                    >
                        <Mic
                            size={40}
                            className={cn(isListening && 'animate-pulse')}
                        />
                    </motion.button>
                </div>

                <div className="w-48 h-1.5 bg-slate-200 rounded-full mt-4 overflow-hidden">
                    {isListening && feedback === 'none' && (
                        <motion.div
                            key={timerKey}
                            initial={{ width: '100%' }}
                            animate={{ width: '0%' }}
                            transition={{ duration: 10, ease: 'linear' }}
                            className="h-full bg-rose-500"
                        />
                    )}
                </div>

                <p
                    className={cn(
                        'text-[11px] font-black uppercase tracking-[0.2em] mt-1 transition-colors duration-300',
                        isTryAgainState
                            ? 'text-rose-500 animate-pulse'
                            : 'text-slate-400',
                    )}
                >
                    {isListening
                        ? 'Listening...'
                        : isTryAgainState
                          ? 'Get ready...'
                          : 'Tap Mic to Start'}
                </p>
            </div>
        </div>
    );
}
