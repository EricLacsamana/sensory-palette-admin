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
    Target,
    Activity,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const SparkleIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M11.64 5.232c.184-.525.932-.525 1.117 0l1.458 4.152a1.2 1.2 0 00.838.838l4.152 1.458c.525.184.525.932 0 1.117l-4.152 1.458a1.2 1.2 0 00-.838.838l-1.458 4.152c-.184.525-.932.525-1.117 0l-1.458-4.152a1.2 1.2 0 00-.838-.838l-4.152-1.458c-.525-.184-.525-.932 0-1.117l4.152-1.458a1.2 1.2 0 00.838-.838l1.458-4.152z" />
    </svg>
);

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

    const initialLevel = getStartingLevel();

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
    >('none');

    const [correctCount, setCorrectCount] = useState(0);
    const [totalCount, setTotalCount] = useState(0);
    const accuracy =
        totalCount === 0 ? 0 : Math.round((correctCount / totalCount) * 100);

    const [uiStreak, setUiStreak] = useState(0);
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState<string>('');
    const [telemetry, setTelemetry] = useState<any[]>([]);
    const [timerKey, setTimerKey] = useState(0);

    const recognitionRef = useRef<any>(null);
    const isRoundActive = useRef(false);
    const timerRef = useRef<number>(0);
    const autoRecoveryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
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
            setTranscript('');
            setFeedback('none');
            isRoundActive.current = true;
            timerRef.current = Date.now();
            setTimerKey(Date.now());
            startMic();
        },
        [stopMic, startMic],
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
            const newAccuracy = Math.round((newCorrect / newTotal) * 100);

            setTotalCount(newTotal);
            if (isCorrect) setCorrectCount(newCorrect);

            setTelemetry((prev) => {
                const updated = [
                    ...prev,
                    {
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
                    },
                ];
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

            if (levelShift === 'up') {
                setFeedback('levelup');
                sfxRef.current.levelup?.play().catch(() => {});
            } else if (isCorrect) {
                setFeedback('correct');
                sfxRef.current.correct?.play().catch(() => {});
            } else {
                if (levelShift === 'down') setFeedback('leveldown');
                else setFeedback(resultType);
                sfxRef.current.wrong?.play().catch(() => {});
            }

            stopMic();
            if (autoRecoveryTimeoutRef.current)
                clearTimeout(autoRecoveryTimeoutRef.current);

            if (isCorrect || levelShift !== 'none') {
                setTimeout(() => {
                    generate(nextLevel);
                }, 2500);
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
                    .join(' ')
                    .toLowerCase()
                    .trim();
                setTranscript(currentTranscript);
                if (
                    isRoundActive.current &&
                    feedbackRef.current === 'none' &&
                    targetRef.current
                ) {
                    const wordsSpoken = currentTranscript.split(/\s+/);
                    const isMatch =
                        wordsSpoken.includes(
                            targetRef.current.answer.toLowerCase(),
                        ) ||
                        targetRef.current.soundsLike?.some((s: string) =>
                            wordsSpoken.includes(s.toLowerCase()),
                        );
                    if (isMatch) handleResult('correct', currentTranscript);
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
        generate(level);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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
            if (feedback === 'none') startMic();
            else if (
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
            } else generate(level);
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

    return (
        <div className="w-full h-[100dvh] bg-[#fcfcfd] dark:bg-[#0a0c12] flex flex-col justify-between pt-[2dvh] px-4 overflow-hidden font-sans relative touch-none selection:bg-none">
            <motion.div
                animate={{ opacity: feedback === 'wrong' ? 1 : 0 }}
                className="absolute inset-0 bg-rose-500/20 pointer-events-none z-0 transition-opacity duration-300"
            />

            <div className="flex flex-wrap justify-center items-center gap-2 shrink-0 z-20">
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

            <div
                className="flex-1 min-h-0 flex flex-col items-center justify-center w-full relative z-10 py-6"
                style={{ perspective: 1000 }}
            >
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

                <motion.div
                    animate={
                        isSuccessState
                            ? { rotateY: 360, scale: [1, 1.1, 1] }
                            : feedback === 'wrong' || feedback === 'leveldown'
                              ? { x: [-15, 15, -15, 15, 0] }
                              : { rotateY: 0, y: [0, -2, 0] }
                    }
                    transition={{ duration: 0.6, ease: 'easeInOut' }}
                    style={{ transformStyle: 'preserve-3d' }}
                    className={cn(
                        'aspect-square max-h-full max-w-full w-auto h-full min-w-[150px] rounded-[25%] bg-white border shadow-xl flex flex-col items-center justify-center relative overflow-visible transition-colors duration-500',
                        isSuccessState
                            ? 'border-emerald-400 shadow-[0_0_80px_rgba(52,211,153,0.5)]'
                            : 'border-slate-200 dark:border-white/10',
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
                        <motion.div
                            key={isSuccessState ? 'answer' : 'prompt'}
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.5 }}
                            style={{ rotateY: isSuccessState ? 360 : 0 }}
                            className="flex flex-col items-center z-10"
                        >
                            <span
                                className={cn(
                                    'text-[clamp(4rem,20vmin,8rem)] leading-none select-none font-black drop-shadow-sm',
                                    isSuccessState
                                        ? 'text-emerald-500'
                                        : 'text-slate-800',
                                )}
                            >
                                {isSuccessState
                                    ? target.answerEmoji
                                    : target.promptEmoji}
                            </span>
                        </motion.div>
                    </AnimatePresence>
                </motion.div>
            </div>

            <div className="text-center shrink-0 w-full h-[8dvh] flex items-center justify-center z-10 px-4">
                <AnimatePresence mode="wait">
                    <motion.h2
                        key={feedback}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="text-[clamp(1.5rem,5vmin,2.5rem)] font-light tracking-tight leading-tight transition-colors"
                    >
                        {feedback === 'wrong' ? (
                            <span className="text-rose-500 font-bold">
                                Try again!
                            </span>
                        ) : feedback === 'leveldown' ? (
                            <span className="text-amber-500 font-bold">
                                Let's try an easier one!
                            </span>
                        ) : feedback === 'correct' ? (
                            <span className="text-emerald-500 font-bold">
                                Great Job!
                            </span>
                        ) : feedback === 'timeout' ? (
                            <span className="text-amber-500 font-bold">
                                I didn't hear you...
                            </span>
                        ) : (
                            <span className="text-slate-800 dark:text-slate-100">
                                Opposite of{' '}
                                <span className="font-semibold text-indigo-500">
                                    "{target.prompt}"
                                </span>
                                ?
                            </span>
                        )}
                    </motion.h2>
                </AnimatePresence>
            </div>

            <div className="h-[4dvh] flex items-center justify-center shrink-0 w-full mb-[1dvh]">
                {transcript && (
                    <span className="text-slate-400 italic text-[clamp(0.8rem,2.5vmin,1.2rem)] bg-slate-100 px-4 py-1 rounded-full border border-slate-200">
                        "{transcript}"
                    </span>
                )}
            </div>

            <div className="w-full flex flex-col items-center shrink-0 z-20 pb-4">
                <div className="h-[2dvh] flex items-end gap-1 mb-[1dvh]">
                    {isListening &&
                        [1, 2, 3, 4, 5].map((i) => (
                            <motion.div
                                key={i}
                                animate={{ height: [8, 20, 8] }}
                                transition={{
                                    repeat: Infinity,
                                    duration: 0.5 + i * 0.1,
                                }}
                                className="w-[clamp(4px,1vmin,6px)] bg-rose-400 rounded-full"
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
                                className="absolute -top-[6dvh] text-rose-500 z-30"
                            >
                                <ArrowDownCircle
                                    size={32}
                                    className="animate-bounce drop-shadow-md w-[clamp(1.5rem,5vmin,2.25rem)] h-[clamp(1.5rem,5vmin,2.25rem)]"
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
                            'w-[clamp(5rem,15vmin,7rem)] h-[clamp(5rem,15vmin,7rem)] rounded-full flex items-center justify-center border-[clamp(2px,0.6vmin,4px)] shadow-xl transition-all duration-500 cursor-pointer relative',
                            isListening
                                ? 'bg-rose-500 border-rose-300 text-white shadow-[0_0_30px_rgba(244,63,94,0.5)]'
                                : isTryAgainState
                                  ? 'bg-rose-50 border-rose-400 text-rose-500 shadow-[0_0_30px_rgba(244,63,94,0.3)]'
                                  : 'bg-white border-slate-200 text-rose-300 hover:border-rose-400',
                        )}
                    >
                        <Mic
                            className={cn(
                                'w-[clamp(2rem,6vmin,3rem)] h-[clamp(2rem,6vmin,3rem)]',
                                isListening && 'animate-pulse',
                            )}
                        />
                    </motion.button>
                </div>

                <div className="w-[clamp(10rem,30vmin,15rem)] h-[clamp(4px,1vmin,6px)] bg-slate-200 rounded-full mt-[2dvh] overflow-hidden">
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
                        'text-[clamp(0.6rem,2vmin,0.75rem)] font-black uppercase tracking-[0.2em] mt-[1dvh] transition-colors duration-300',
                        isTryAgainState
                            ? 'text-rose-500 animate-pulse'
                            : 'text-slate-400',
                    )}
                >
                    {isListening
                        ? 'Listening...'
                        : isTryAgainState
                          ? 'Tap Mic to Try Again'
                          : 'Tap Mic to Start'}
                </p>
            </div>
        </div>
    );
}
