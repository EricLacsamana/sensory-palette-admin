'use client';

import React, { useEffect, useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, CheckCircle2, Loader2, Activity, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ActivitySessionResponse } from '@/types/activitiy-session';
import { cn } from '@/lib/utils';

interface GameShellViewProps {
    session: ActivitySessionResponse & {
        isHandsFree?: boolean;
        enableAdaptiveDifficulty?: boolean;
    };
    telemetry: any;
    isSaving: boolean;
    onStart: (timestamp: string) => Promise<void>;
    onPause: () => void;
    onResume: () => void;
    onFinish: () => void;
    onClose: () => void;
}

export default function GameShellView({
    session,
    telemetry,
    isSaving,
    onStart,
    onPause,
    onResume,
    onFinish,
    onClose,
}: GameShellViewProps) {
    const { status, initialize } = telemetry;
    const [countdown, setCountdown] = useState<number | null>(null);
    const [isInitiating, setIsInitiating] = useState(false);
    const activity = session?.activity || {};

    // 1. SHELL IS THE SOURCE OF TRUTH FOR LEVEL
    // It can start at a base difficulty if provided by the activity, otherwise 1
    const [currentLevel, setCurrentLevel] = useState<number>(1);

    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [vh, setVh] = useState('100vh');

    useEffect(() => {
        const updateHeight = () => setVh(`${window.innerHeight}px`);
        updateHeight();
        window.addEventListener('resize', updateHeight);
        return () => window.removeEventListener('resize', updateHeight);
    }, []);

    useEffect(() => {
        if (session?.documentId) {
            initialize(session.documentId, activity?.documentId || 'unknown');
        }
    }, [session?.documentId, activity?.documentId, initialize]);

    const tickSfx = useRef<HTMLAudioElement | null>(null);
    const startSfx = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        tickSfx.current = new Audio(
            'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3',
        );
        startSfx.current = new Audio(
            'https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3',
        );
    }, []);

    const shouldShowIframe =
        status === 'playing' || status === 'paused' || isInitiating;

    // 2. INITIAL IFRAME MOUNT (Only happens once)
    const iframeSrc = useMemo(() => {
        if (!activity.activityUrl) return '';
        const adminPort = process.env.NEXT_PUBLIC_ADMIN_PORT || '1337';
        const baseUrl = activity.activityUrl.replace(
            `http://localhost:${adminPort}`,
            '',
        );
        const separator = baseUrl.includes('?') ? '&' : '?';

        // Pass initial state so the game boots correctly
        const adaptiveFlag =
            session.enableAdaptiveDifficulty !== false ? 'true' : 'false';
        return `${baseUrl}${separator}adaptive=${adaptiveFlag}&level=${currentLevel}`;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activity.activityUrl]); // Notice we DO NOT put currentLevel here so it doesn't reload the iframe URL

    // 3. SILENT PUSH: Sync Source of Truth down to the iframe without reloading
    useEffect(() => {
        if (iframeRef.current?.contentWindow) {
            iframeRef.current.contentWindow.postMessage(
                {
                    type: 'SYNC_STATE',
                    payload: {
                        isAdaptive: session.enableAdaptiveDifficulty !== false,
                        level: currentLevel,
                    },
                },
                '*',
            );
        }
    }, [session.enableAdaptiveDifficulty, currentLevel]);

    // 4. LISTEN FOR TELEMETRY & ENFORCE ADAPTIVE LOGIC
    useEffect(() => {
        const handleGameMessage = (event: MessageEvent) => {
            // Only proceed if it's a score update and we have telemetry data
            if (
                event.data?.type === 'GAME_SCORE_UPDATE' &&
                event.data.rawTelemetry
            ) {
                const telemetryArray = event.data.rawTelemetry;
                const latestLog = telemetryArray[telemetryArray.length - 1];

                // 1. Check the Source of Truth from the Session
                const isAdaptiveEnabled =
                    session?.enableAdaptiveDifficulty !== false;

                // 2. ONLY update the shell's level state if Adaptive is actually ON
                if (isAdaptiveEnabled && latestLog?.metadata?.levelShift) {
                    const shift = latestLog.metadata.levelShift;

                    if (shift === 'up') {
                        setCurrentLevel((prev) => Math.min(prev + 1, 5));
                    } else if (shift === 'down') {
                        setCurrentLevel((prev) => Math.max(prev - 1, 1));
                    }
                }
                // If Adaptive is OFF, the Shell simply ignores 'levelShift'
                // metadata and keeps currentLevel exactly where it is.
            }
        };

        window.addEventListener('message', handleGameMessage);
        return () => window.removeEventListener('message', handleGameMessage);

        // Ensure session properties are in the dependency array so the listener
        // doesn't use a stale 'false' or 'true' value.
    }, [session?.enableAdaptiveDifficulty, session?.documentId]);

    // --- AUTO-START LOGIC ---
    useEffect(() => {
        if (
            session?.isHandsFree &&
            status === 'idle' &&
            countdown === null &&
            !isInitiating
        ) {
            const autoStartTimer = setTimeout(() => setCountdown(3), 150);
            return () => clearTimeout(autoStartTimer);
        }
    }, [session?.isHandsFree, status, countdown, isInitiating]);

    // --- COUNTDOWN LOGIC ---
    useEffect(() => {
        if (countdown === null || countdown === 0) return;
        tickSfx.current?.play().catch(() => {});
        const timer = setTimeout(() => {
            if (countdown === 1) {
                startSfx.current?.play().catch(() => {});
                setIsInitiating(true);
                onStart(new Date().toISOString());
                setCountdown(0);
            } else {
                setCountdown(countdown - 1);
            }
        }, 1000);
        return () => clearTimeout(timer);
    }, [countdown, onStart]);

    const handleClose = () => {
        setCountdown(null);
        setIsInitiating(false);
        onClose();
    };

    return (
        <div
            style={{ height: vh }}
            className="fixed inset-0 bg-[#f8fafc] dark:bg-[#06080c] z-[9999] flex flex-col font-sans overflow-hidden touch-none"
        >
            <header className="h-16 md:h-20 shrink-0 border-b border-slate-200/50 dark:border-white/5 bg-white/40 dark:bg-slate-900/10 backdrop-blur-2xl px-6 md:px-8 flex items-center justify-between z-50">
                <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                        <Activity size={20} className="text-indigo-500" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">
                            {status === 'playing'
                                ? 'Live Activity'
                                : 'Activity Shell'}
                        </span>
                        <h1 className="text-sm font-semibold text-slate-600 dark:text-slate-300 truncate max-w-[150px] md:max-w-xs">
                            {activity.name}
                        </h1>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {session?.enableLearnerControls && (
                        <>
                            {status === 'playing' && (
                                <Button
                                    variant="outline"
                                    onClick={onPause}
                                    className="rounded-full text-[10px] font-bold uppercase tracking-widest px-4 text-amber-600 border-amber-200 bg-amber-50 hover:bg-amber-100"
                                >
                                    <Pause
                                        size={14}
                                        className="mr-1.5 fill-current"
                                    />{' '}
                                    Pause
                                </Button>
                            )}
                            {status === 'paused' && (
                                <Button
                                    onClick={onResume}
                                    className="rounded-full text-[10px] font-bold uppercase tracking-widest px-4 bg-amber-500 hover:bg-amber-600 text-white"
                                >
                                    <Play
                                        size={14}
                                        className="mr-1.5 fill-current"
                                    />{' '}
                                    Resume
                                </Button>
                            )}
                            {status === 'playing' && (
                                <Button
                                    variant="ghost"
                                    onClick={onFinish}
                                    className="rounded-full text-[10px] font-black uppercase tracking-[0.2em] px-4 md:px-8 text-slate-400 hover:text-indigo-500"
                                >
                                    {isSaving ? (
                                        <Loader2 className="animate-spin" />
                                    ) : (
                                        'Finish'
                                    )}
                                </Button>
                            )}
                        </>
                    )}
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-[10px] font-bold text-slate-400 md:hidden"
                        onClick={handleClose}
                    >
                        EXIT
                    </Button>
                </div>
            </header>

            <main className="flex-1 relative w-full min-h-0 overflow-hidden bg-[#f8fafc] dark:bg-black">
                {shouldShowIframe && (
                    <iframe
                        ref={iframeRef}
                        // FIX: Key is strictly the session ID so it NEVER remounts or blinks white.
                        key={session.documentId}
                        src={iframeSrc}
                        className="absolute inset-0 w-full h-full border-none m-0 p-0 block z-10 bg-transparent"
                        allow="autoplay *; fullscreen *; clipboard-write *; microphone *;"
                    />
                )}

                <AnimatePresence mode="wait">
                    {status === 'paused' && (
                        <motion.div
                            key="paused"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 z-[40] flex flex-col items-center justify-center bg-white/60 dark:bg-black/80 backdrop-blur-md"
                        >
                            <div className="h-24 w-24 bg-amber-100 rounded-full flex items-center justify-center mb-6 text-amber-500 shadow-xl shadow-amber-500/20">
                                <Pause size={40} className="fill-current" />
                            </div>
                            <h2 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight mb-2">
                                Activity Paused
                            </h2>
                            <p className="text-slate-500 font-medium">{`Take a deep breath. ${session.enableLearnerControls ? 'Click resume' : 'Let your teacher know'} when you are ready.`}</p>
                        </motion.div>
                    )}

                    {status === 'completed' && (
                        <motion.div
                            key="success"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 z-[100] flex items-center justify-center p-6 bg-[#f8fafc] dark:bg-[#06080c]"
                        >
                            <div className="w-full max-w-md text-center bg-white dark:bg-slate-900/40 p-16 rounded-[60px] border border-slate-100 dark:border-white/5 backdrop-blur-3xl shadow-2xl">
                                <CheckCircle2
                                    size={60}
                                    className="text-emerald-500/80 mx-auto mb-10"
                                />
                                <h2
                                    className={cn(
                                        'font-semibold text-slate-800 dark:text-white',
                                        session?.isHandsFree === true
                                            ? 'text-3xl mb-8'
                                            : 'text-3xl mb-3',
                                    )}
                                >
                                    Wonderful
                                </h2>
                                {session?.isHandsFree === true ? (
                                    <div className="flex flex-col items-center gap-3">
                                        <Loader2
                                            className="animate-spin text-emerald-500"
                                            size={24}
                                        />
                                        <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
                                            Syncing next activity...
                                        </span>
                                    </div>
                                ) : (
                                    <Button
                                        className="w-full h-16 mt-4 bg-slate-900 dark:bg-white dark:text-black rounded-2xl"
                                        onClick={handleClose}
                                    >
                                        Home
                                    </Button>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {status === 'idle' && !isInitiating && (
                        <motion.div
                            key="idle-container"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-[#f8fafc] dark:bg-[#06080c]"
                        >
                            {countdown !== null ? (
                                <motion.div className="flex flex-col items-center gap-6">
                                    {session?.isHandsFree === true && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="px-4 py-2 bg-slate-200 dark:bg-white/10 rounded-full flex items-center gap-2 mb-4"
                                        >
                                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                                                Auto-Starting Next Activity
                                            </span>
                                        </motion.div>
                                    )}
                                    <motion.span
                                        key={countdown}
                                        initial={{ scale: 0.8, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        className="text-[20vh] font-extralight text-slate-300"
                                    >
                                        {countdown}
                                    </motion.span>
                                </motion.div>
                            ) : (
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setCountdown(3)}
                                    className="w-64 h-24 rounded-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-2xl flex items-center justify-center gap-4 group cursor-pointer hover:shadow-indigo-500/20"
                                >
                                    <Play
                                        size={24}
                                        className="text-indigo-50"
                                        fill="#6366f1"
                                    />
                                    <span className="text-xl font-medium text-slate-600 dark:text-slate-100">
                                        Begin
                                    </span>
                                </motion.button>
                            )}
                        </motion.div>
                    )}

                    {isInitiating && status === 'idle' && (
                        <motion.div
                            key="initiating"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="absolute inset-0 z-[100] flex items-center justify-center bg-[#f8fafc] dark:bg-[#06080c]"
                        >
                            <span className="text-[20vh] font-extralight text-slate-300 animate-pulse">
                                Enjoy
                            </span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}
