'use client';

import React, { useEffect, useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Loader2, Pause, Star, X, PartyPopper } from 'lucide-react';
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

    const activity: any = session?.activity || {};

    const iframeRef = useRef<HTMLIFrameElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
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

    // ✨ MEDIA PARSER FIX: Static URL ensures iframe NEVER hard reloads mid-game!
    const mediaConfig = useMemo(() => {
        let baseUrl = activity.activityUrl || '';
        const type = activity.activityType?.toLowerCase() || '';
        const rawHtml =
            activity.visualContent ||
            activity.content ||
            activity.htmlContent ||
            activity.richText ||
            activity.description ||
            '';

        if (type === 'visual' || (!baseUrl && rawHtml)) {
            const htmlDocument = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>body{font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;line-height:1.7;color:#1e293b;padding:2rem 5%;max-width:800px;margin:0 auto;font-size:18px;word-wrap:break-word;}img,video,iframe{max-width:100%;height:auto;border-radius:8px;margin:1rem 0;}a{color:#6366f1;text-decoration:none;font-weight:500;}a:hover{text-decoration:underline;}h1,h2,h3,h4{margin-top:2rem;margin-bottom:1rem;color:#0f172a;line-height:1.2;}blockquote{border-left:4px solid #cbd5e1;margin:1.5rem 0;padding-left:1rem;color:#64748b;font-style:italic;}pre,code{background:#f1f5f9;padding:0.2rem 0.4rem;border-radius:4px;font-size:0.9em;}@media (prefers-color-scheme: dark){body{color:#f8fafc;background:#000;}h1,h2,h3,h4{color:#ffffff;}blockquote{border-left-color:#334155;color:#94a3b8;}pre,code{background:#1e293b;color:#f8fafc;}}</style></head><body>${rawHtml}</body></html>`;
            return { renderType: 'html', srcDoc: htmlDocument };
        }

        if (!baseUrl) return { renderType: 'none', src: '' };

        if (
            type === 'youtube' ||
            baseUrl.includes('youtube.com') ||
            baseUrl.includes('youtu.be')
        ) {
            const ytRegex =
                /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
            const match = baseUrl.match(ytRegex);
            const videoId = match ? match[1] : null;
            const origin =
                typeof window !== 'undefined' ? window.location.origin : '';
            return {
                renderType: 'iframe',
                src: videoId
                    ? `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&enablejsapi=1&origin=${origin}`
                    : baseUrl,
            };
        }

        if (type === 'pdf' || baseUrl.toLowerCase().endsWith('.pdf'))
            return { renderType: 'iframe', src: baseUrl };
        if (type === 'video' || baseUrl.match(/\.(mp4|webm|ogg|mov)$/i))
            return { renderType: 'video', src: baseUrl };
        if (
            type === 'image' ||
            baseUrl.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i)
        )
            return { renderType: 'image', src: baseUrl };

        if (type === 'game' && typeof window !== 'undefined') {
            try {
                const parsedUrl = new URL(baseUrl);
                if (
                    parsedUrl.hostname === 'localhost' ||
                    parsedUrl.hostname === '127.0.0.1'
                ) {
                    baseUrl = `${window.location.origin}${parsedUrl.pathname}${parsedUrl.search}`;
                }
            } catch (e) {}
        } else if (type === 'game') {
            const adminPort = process.env.NEXT_PUBLIC_ADMIN_PORT || '';
            baseUrl = baseUrl.replace(`http://localhost:${adminPort}`, '');
        }

        const separator = baseUrl.includes('?') ? '&' : '?';
        const finalSrc =
            type === 'game' ? `${baseUrl}${separator}source=platform` : baseUrl;

        return { renderType: 'iframe', src: finalSrc };
    }, [
        activity.activityUrl,
        activity.activityType,
        activity.visualContent,
        activity.content,
        activity.htmlContent,
        activity.richText,
        activity.description,
    ]);

    // SILENT PUSH: Sync Source of Truth down to the iframe silently
    useEffect(() => {
        if (iframeRef.current?.contentWindow) {
            iframeRef.current.contentWindow.postMessage(
                {
                    type: 'SYNC_STATE',
                    payload: {
                        isAdaptive: session.enableAdaptiveDifficulty !== false,
                        enableLearnerControls:
                            session.enableLearnerControls || false,
                    },
                },
                '*',
            );
        }
    }, [session.enableAdaptiveDifficulty, session.enableLearnerControls]);

    // MEDIA CONTROL
    useEffect(() => {
        if (status === 'paused') {
            if (
                mediaConfig.src?.includes('youtube') &&
                iframeRef.current?.contentWindow
            ) {
                iframeRef.current.contentWindow.postMessage(
                    JSON.stringify({
                        event: 'command',
                        func: 'pauseVideo',
                        args: [],
                    }),
                    '*',
                );
            }
            if (mediaConfig.renderType === 'video' && videoRef.current)
                videoRef.current.pause();
        } else if (status === 'playing') {
            if (
                mediaConfig.src?.includes('youtube') &&
                iframeRef.current?.contentWindow
            ) {
                iframeRef.current.contentWindow.postMessage(
                    JSON.stringify({
                        event: 'command',
                        func: 'playVideo',
                        args: [],
                    }),
                    '*',
                );
            }
            if (mediaConfig.renderType === 'video' && videoRef.current)
                videoRef.current.play();
        }
    }, [status, mediaConfig.src, mediaConfig.renderType]);

    // AUTO-START LOGIC
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

    // COUNTDOWN LOGIC
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
            className="fixed inset-0 bg-sky-50 z-[9999] flex flex-col font-sans overflow-hidden touch-none"
        >
            {/* --- PLAYFUL HEADER --- */}
            <header className="h-20 md:h-24 shrink-0 bg-white border-b-4 border-slate-100 px-4 md:px-8 flex items-center justify-between z-50 rounded-b-[32px] shadow-sm relative">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-indigo-100 flex items-center justify-center border-2 border-indigo-200 shadow-inner rotate-[-3deg]">
                        <Star
                            size={24}
                            className="text-indigo-500 fill-indigo-400"
                        />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xs font-black text-indigo-400 uppercase tracking-widest">
                            {status === 'playing' ? 'Now Playing' : 'Up Next'}
                        </span>
                        <h1 className="text-lg md:text-xl font-extrabold text-slate-700 truncate max-w-[150px] md:max-w-xs">
                            {activity.name}
                        </h1>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {session?.enableLearnerControls && (
                        <>
                            {status === 'playing' && (
                                <button
                                    onClick={onPause}
                                    className="h-12 px-6 rounded-2xl bg-amber-400 hover:bg-amber-300 active:translate-y-[4px] active:shadow-none transition-all shadow-[0_4px_0_rgb(217,119,6)] text-amber-900 font-extrabold uppercase tracking-wide flex items-center gap-2 text-sm"
                                >
                                    <Pause size={18} className="fill-current" />{' '}
                                    Pause
                                </button>
                            )}
                            {status === 'paused' && (
                                <button
                                    onClick={onResume}
                                    className="h-12 px-6 rounded-2xl bg-emerald-400 hover:bg-emerald-300 active:translate-y-[4px] active:shadow-none transition-all shadow-[0_4px_0_rgb(5,150,105)] text-emerald-950 font-extrabold uppercase tracking-wide flex items-center gap-2 text-sm"
                                >
                                    <Play size={18} className="fill-current" />{' '}
                                    Play
                                </button>
                            )}
                            {status === 'playing' && (
                                <button
                                    onClick={onFinish}
                                    className="h-12 px-6 rounded-2xl bg-indigo-500 hover:bg-indigo-400 active:translate-y-[4px] active:shadow-none transition-all shadow-[0_4px_0_rgb(67,56,202)] text-white font-extrabold uppercase tracking-wide flex items-center justify-center min-w-[100px] text-sm"
                                >
                                    {isSaving ? (
                                        <Loader2 className="animate-spin h-5 w-5" />
                                    ) : (
                                        'Done!'
                                    )}
                                </button>
                            )}
                        </>
                    )}

                    {/* Exit Button (Mobile & Desktop) */}
                    <button
                        onClick={handleClose}
                        className="h-12 w-12 flex items-center justify-center rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-red-500 transition-colors"
                    >
                        <X size={24} strokeWidth={3} />
                    </button>
                </div>
            </header>

            {/* --- MAIN MEDIA AREA --- */}
            <main className="flex-1 relative w-full min-h-0 overflow-hidden bg-sky-50">
                {shouldShowIframe && (
                    <div className="absolute inset-0 w-full h-full z-10 flex items-center justify-center bg-transparent p-2 md:p-6">
                        {/* Wrapper for soft borders around the game */}
                        <div className="w-full h-full rounded-[32px] overflow-hidden shadow-xl border-4 border-white bg-white relative">
                            {mediaConfig.renderType === 'html' && (
                                <iframe
                                    ref={iframeRef}
                                    key={session.documentId}
                                    srcDoc={mediaConfig.srcDoc}
                                    className="w-full h-full border-none m-0 p-0 block bg-white"
                                    sandbox="allow-scripts allow-same-origin allow-popups"
                                />
                            )}
                            {mediaConfig.renderType === 'iframe' && (
                                <iframe
                                    ref={iframeRef}
                                    key={session.documentId}
                                    src={mediaConfig.src}
                                    className="w-full h-full border-none m-0 p-0 block bg-transparent"
                                    allow="autoplay *; fullscreen *; clipboard-write *; microphone *; picture-in-picture *;"
                                    allowFullScreen
                                />
                            )}
                            {mediaConfig.renderType === 'video' && (
                                <video
                                    ref={videoRef}
                                    src={mediaConfig.src}
                                    controls
                                    autoPlay
                                    className="w-full h-full max-h-full object-contain bg-black"
                                />
                            )}
                            {mediaConfig.renderType === 'image' && (
                                <img
                                    src={mediaConfig.src}
                                    alt={activity.name}
                                    className="w-full h-full max-h-full object-contain"
                                />
                            )}
                        </div>
                    </div>
                )}

                {/* --- OVERLAYS --- */}
                <AnimatePresence mode="wait">
                    {/* PAUSED OVERLAY */}
                    {status === 'paused' && (
                        <motion.div
                            key="paused"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 z-[40] flex flex-col items-center justify-center bg-white/80 backdrop-blur-md"
                        >
                            <motion.div
                                animate={{ y: [0, -10, 0] }}
                                transition={{ repeat: Infinity, duration: 2 }}
                                className="h-32 w-32 bg-amber-400 rounded-full flex items-center justify-center mb-6 text-white shadow-[0_8px_0_rgb(217,119,6)]"
                            >
                                <Pause size={64} className="fill-current" />
                            </motion.div>
                            <h2 className="text-4xl md:text-5xl font-black text-slate-800 tracking-tight mb-4">
                                Game Paused!
                            </h2>
                            <p className="text-xl text-slate-500 font-bold text-center max-w-md">
                                {`Time for a quick break! ${session.enableLearnerControls ? 'Click Play' : 'Let your teacher know'} when you are ready to start again.`}
                            </p>
                        </motion.div>
                    )}

                    {/* COMPLETED OVERLAY */}
                    {status === 'completed' && (
                        <motion.div
                            key="success"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 z-[100] flex items-center justify-center p-6 bg-sky-50"
                        >
                            <div className="w-full max-w-lg text-center bg-white p-12 md:p-16 rounded-[48px] border-8 border-yellow-300 shadow-2xl relative">
                                <PartyPopper
                                    size={80}
                                    className="text-yellow-500 mx-auto mb-6"
                                />
                                <h2 className="text-4xl md:text-5xl font-black text-slate-800 mb-6">
                                    Awesome Job!
                                </h2>

                                {session?.isHandsFree === true ? (
                                    <div className="flex flex-col items-center gap-4 bg-sky-50 p-6 rounded-3xl border-4 border-sky-100">
                                        <Loader2
                                            className="animate-spin text-sky-500"
                                            size={32}
                                        />
                                        <span className="text-lg font-bold text-sky-600">
                                            Getting your next game ready...
                                        </span>
                                    </div>
                                ) : (
                                    <button
                                        onClick={handleClose}
                                        className="w-full h-20 rounded-3xl bg-green-500 hover:bg-green-400 active:translate-y-[6px] active:shadow-none transition-all shadow-[0_8px_0_rgb(22,163,74)] text-white font-black text-2xl tracking-wide"
                                    >
                                        Back to Home
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {/* IDLE / MANUAL START OVERLAY */}
                    {status === 'idle' && !isInitiating && (
                        <motion.div
                            key="idle-container"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-sky-100/90 backdrop-blur-sm"
                        >
                            {countdown !== null ? (
                                <motion.div className="flex flex-col items-center gap-8">
                                    {session?.isHandsFree === true && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="px-6 py-3 bg-white rounded-full flex items-center gap-3 shadow-sm border-2 border-sky-200"
                                        >
                                            <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                                            <span className="text-sm font-bold uppercase tracking-widest text-slate-500">
                                                Starting Automatically
                                            </span>
                                        </motion.div>
                                    )}
                                    <motion.span
                                        key={countdown}
                                        initial={{
                                            scale: 0.5,
                                            opacity: 0,
                                            rotate: -10,
                                        }}
                                        animate={{
                                            scale: 1,
                                            opacity: 1,
                                            rotate: 0,
                                        }}
                                        exit={{ scale: 1.5, opacity: 0 }}
                                        transition={{
                                            type: 'spring',
                                            bounce: 0.5,
                                        }}
                                        className="text-[30vh] font-black text-indigo-500 drop-shadow-[0_10px_0_rgba(99,102,241,0.2)]"
                                    >
                                        {countdown}
                                    </motion.span>
                                </motion.div>
                            ) : (
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setCountdown(3)}
                                    className="px-12 py-8 rounded-[40px] bg-green-400 hover:bg-green-300 shadow-[0_12px_0_rgb(22,163,74)] active:shadow-[0_4px_0_rgb(22,163,74)] active:translate-y-[8px] flex items-center justify-center gap-6 group transition-colors"
                                >
                                    <Play
                                        size={48}
                                        className="text-white fill-white"
                                    />
                                    <span className="text-4xl font-black text-white uppercase tracking-wider">
                                        Let's Play!
                                    </span>
                                </motion.button>
                            )}
                        </motion.div>
                    )}

                    {/* INITIATING OVERLAY */}
                    {isInitiating && status === 'idle' && (
                        <motion.div
                            key="initiating"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="absolute inset-0 z-[100] flex items-center justify-center bg-sky-100"
                        >
                            <motion.span
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="text-[25vh] font-black text-green-500 drop-shadow-[0_10px_0_rgba(34,197,94,0.2)]"
                            >
                                GO!
                            </motion.span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}
