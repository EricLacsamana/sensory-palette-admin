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
        // URL is completely static. All dynamic data is sent via postMessage sync.
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
                    <div className="absolute inset-0 w-full h-full z-10 flex items-center justify-center bg-transparent">
                        {mediaConfig.renderType === 'html' && (
                            <iframe
                                ref={iframeRef}
                                key={session.documentId}
                                srcDoc={mediaConfig.srcDoc}
                                className="w-full h-full border-none m-0 p-0 block bg-white dark:bg-black"
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
