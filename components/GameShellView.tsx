'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
    Gamepad2,
    Maximize2,
    Minimize2,
    Loader2,
    Clock,
    LogOut,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import ColorMatchGame from '@/components/games/ColorMatchGame';
import { cn } from '@/lib/utils';

export default function GameShellView({ session }: { session: any }) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isStarted, setIsStarted] = useState(false);
    const [isLaunching, setIsLaunching] = useState(true);
    const [launchProgress, setLaunchProgress] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Timer State
    const durationMinutes = session?.activity?.durationMinutes;
    const durationSeconds = durationMinutes * 60;
    const [timeLeft, setTimeLeft] = useState(durationSeconds);

    // --- 1. AUTO-LAUNCH LOGIC ---
    useEffect(() => {
        // Automatically fill the progress bar over 2 seconds, then show the game
        let progress = 0;
        const interval = setInterval(() => {
            progress += 5;
            setLaunchProgress(progress);
            if (progress >= 100) {
                clearInterval(interval);
                setIsStarted(true);
                setIsLaunching(false);
            }
        }, 100); // 100ms * 20 ticks = 2 seconds

        return () => clearInterval(interval);
    }, []);

    // --- 2. TIMER LOGIC ---
    useEffect(() => {
        if (!session?.actualStartAt) return;
        const startTime = new Date(session.actualStartAt).getTime();

        const interval = setInterval(() => {
            const now = new Date().getTime();
            const elapsedSeconds = Math.floor((now - startTime) / 1000);
            const remaining = durationSeconds - elapsedSeconds;

            if (remaining <= 0) {
                setTimeLeft(0);
                clearInterval(interval);
            } else {
                setTimeLeft(remaining);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [session?.actualStartAt, durationSeconds]);

    // --- FULLSCREEN HANDLER ---
    // Browsers block auto-fullscreen, so we provide a manual toggle in the header
    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            containerRef.current?.requestFullscreen().catch((err) => {
                console.warn('Fullscreen blocked:', err);
            });
        } else {
            document.exitFullscreen();
        }
    };

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () =>
            document.removeEventListener(
                'fullscreenchange',
                handleFullscreenChange,
            );
    }, []);

    // --- TIME FORMATTER ---
    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const isTimeCritical = timeLeft <= 60;

    return (
        <div
            ref={containerRef}
            className="fixed inset-0 bg-slate-950 z-[9999] flex flex-col text-slate-50 overflow-hidden"
        >
            {/* HEADER */}
            <header className="h-16 md:h-20 border-b border-white/10 bg-slate-900/80 backdrop-blur-md px-6 md:px-8 flex items-center justify-between z-50 shrink-0">
                {/* Left: Activity Info */}
                <div className="flex items-center gap-4 w-1/3">
                    <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-900/50 shrink-0">
                        <Gamepad2 size={20} className="text-white" />
                    </div>
                    <div className="hidden sm:block">
                        <h1 className="text-sm font-black uppercase tracking-widest text-slate-100 truncate max-w-[200px]">
                            {session?.activity?.name || 'Activity'}
                        </h1>
                        <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider truncate max-w-[200px]">
                            Learner: {session?.student?.firstName}
                        </p>
                    </div>
                </div>

                {/* Center: Live Timer */}
                <div className="flex justify-center w-1/3">
                    {isStarted && (
                        <div
                            className={cn(
                                'flex items-center gap-2 md:gap-3 px-4 py-1.5 md:px-6 md:py-2 rounded-full border bg-slate-900/50 shadow-inner transition-colors duration-500',
                                isTimeCritical
                                    ? 'border-rose-500/50 text-rose-400'
                                    : 'border-indigo-500/30 text-indigo-300',
                            )}
                        >
                            <Clock
                                size={16}
                                className={cn(
                                    isTimeCritical && 'animate-pulse',
                                )}
                            />
                            <span className="text-xl md:text-2xl font-black tabular-nums tracking-tighter">
                                {formatTime(timeLeft)}
                            </span>
                        </div>
                    )}
                </div>

                {/* Right: Controls */}
                <div className="flex items-center justify-end gap-2 md:gap-3 w-1/3">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-slate-400 hover:text-white hover:bg-white/10 rounded-xl h-10 w-10"
                        onClick={toggleFullscreen}
                        title="Toggle Fullscreen"
                    >
                        {isFullscreen ? (
                            <Minimize2 size={18} />
                        ) : (
                            <Maximize2 size={18} />
                        )}
                    </Button>
                    <Button
                        variant="ghost"
                        className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 font-bold text-xs rounded-xl h-10 px-3 md:px-4"
                        onClick={() => window.history.back()}
                    >
                        <LogOut size={14} className="mr-0 md:mr-2" />
                        <span className="hidden md:inline">EXIT</span>
                    </Button>
                </div>
            </header>

            {/* MAIN CONTENT AREA */}
            <main className="flex-1 relative bg-black flex items-center justify-center">
                {isLaunching ? (
                    // LOADING / SYNC STATE
                    <div className="text-center p-12 bg-slate-900/40 border border-white/5 rounded-[40px] max-w-md w-full mx-4 backdrop-blur-md animate-in fade-in duration-500">
                        <div className="space-y-8 flex flex-col items-center">
                            <div className="relative">
                                <div className="absolute inset-0 bg-indigo-500 blur-2xl opacity-20 rounded-full" />
                                <Loader2
                                    size={56}
                                    className="animate-spin text-indigo-500 relative z-10"
                                />
                            </div>

                            <div className="w-full space-y-3">
                                <Progress
                                    value={launchProgress}
                                    className="h-1.5 w-full bg-slate-800"
                                    indicatorClassName="bg-indigo-500"
                                />
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400 animate-pulse">
                                    Syncing therapist environment...
                                </p>
                            </div>
                        </div>
                    </div>
                ) : (
                    // ACTUAL GAME INSTANCE
                    <div className="w-full h-full animate-in fade-in zoom-in duration-700">
                        {/* We leave the sample game exactly as requested */}
                        <ColorMatchGame session={session} />
                    </div>
                )}
            </main>
        </div>
    );
}
