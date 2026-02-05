'use client';

import React, { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter, useParams } from 'next/navigation';
import {
    Maximize2,
    Minimize2,
    Gamepad2,
    ChevronLeft,
    Activity,
    Play,
    Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { getActivitySession } from '@/api/acitivity-session';
import ColorMatchGame from '@/components/games/ColorMatchGame';

export default function ActivitySessionPage() {
    const params = useParams();
    const router = useRouter();
    const containerRef = useRef<HTMLDivElement>(null);

    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isStarted, setIsStarted] = useState(false);
    const [isLaunching, setIsLaunching] = useState(false);
    const [launchProgress, setLaunchProgress] = useState(0);

    const { data: session, isLoading } = useQuery({
        queryKey: ['activity-session', params.documentId],
        refetchOnWindowFocus: false,
        queryFn: () => getActivitySession(params.documentId as string),
    });

    const handleStartInteraction = () => {
        setIsLaunching(true);
        setLaunchProgress(0);

        const duration = 2000;
        const intervalTime = 50;
        const increment = 100 / (duration / intervalTime);

        const interval = setInterval(() => {
            setLaunchProgress((prev) => {
                if (prev >= 100) {
                    clearInterval(interval);
                    setTimeout(finalizeLaunch, 300);
                    return 100;
                }
                return prev + increment;
            });
        }, intervalTime);
    };

    const finalizeLaunch = async () => {
        setIsStarted(true);
        setIsLaunching(false);

        try {
            if (containerRef.current && !document.fullscreenElement) {
                await containerRef.current.requestFullscreen();
                setIsFullscreen(true);
            }
        } catch (err) {
            console.warn('Fullscreen blocked by browser policy.', err);
        }
    };

    const handleExit = () => {
        if (document.fullscreenElement) document.exitFullscreen();
        router.push('/dashboard');
    };

    if (isLoading) return <ActivityLoadingState />;

    return (
        <div
            ref={containerRef}
            className="fixed inset-0 bg-slate-950 z-[9999] flex flex-col overflow-hidden text-slate-50"
        >
            {/* --- HEADER --- */}
            <header className="h-20 border-b border-white/5 bg-slate-900/40 backdrop-blur-xl px-8 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-6">
                    <button
                        onClick={handleExit}
                        className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                            <Gamepad2 size={24} />
                        </div>
                        <div>
                            <h1 className="text-lg font-[1000] tracking-tight leading-none">
                                {session?.activity?.name || 'Interaction'}
                            </h1>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2">
                                Learner: {session?.student?.firstName}{' '}
                                {session?.student?.lastName}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                            !document.fullscreenElement
                                ? containerRef.current?.requestFullscreen()
                                : document.exitFullscreen()
                        }
                        className="rounded-xl hover:bg-white/5 text-slate-400"
                    >
                        {document.fullscreenElement ? (
                            <Minimize2 size={20} />
                        ) : (
                            <Maximize2 size={20} />
                        )}
                    </Button>
                    <Button
                        onClick={handleExit}
                        className="rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white border border-rose-500/20 h-11 px-6 font-black text-[10px] uppercase tracking-widest"
                    >
                        Exit
                    </Button>
                </div>
            </header>

            {/* --- STAGE --- */}
            <main className="flex-1 relative bg-black overflow-hidden">
                {!isStarted ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-950">
                        <div className="text-center p-12 w-full max-w-lg border border-white/5 bg-slate-900/20 rounded-[40px] backdrop-blur-sm">
                            {isLaunching ? (
                                <div className="flex flex-col items-center justify-center space-y-8">
                                    <div className="relative flex items-center justify-center">
                                        <Loader2
                                            size={100}
                                            className="text-indigo-500 animate-spin"
                                            strokeWidth={1.2}
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <span className="text-xs font-black text-white tabular-nums">
                                                {Math.round(launchProgress)}%
                                            </span>
                                        </div>
                                    </div>
                                    <div className="w-full max-w-[240px] space-y-4">
                                        <Progress
                                            value={launchProgress}
                                            className="h-1.5 bg-white/5"
                                        />
                                        <div className="space-y-1">
                                            <h2 className="text-sm font-[1000] text-white tracking-tight">
                                                Syncing Environment
                                            </h2>
                                            <p className="text-[8px] font-black text-indigo-400 uppercase tracking-[0.3em]">
                                                Entering Fullscreen Mode
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="h-24 w-24 rounded-[32px] bg-indigo-500/10 flex items-center justify-center text-indigo-400 mx-auto border border-indigo-500/20 mb-8">
                                        <Activity size={48} strokeWidth={1.5} />
                                    </div>
                                    <h2 className="text-3xl font-[1000] tracking-tighter mb-4">
                                        Initialize Session
                                    </h2>
                                    <p className="text-slate-400 text-sm mb-10 leading-relaxed">
                                        Transitioning to full-screen mode for
                                        the learner. Ensure the environment is
                                        prepared.
                                    </p>
                                    <Button
                                        onClick={handleStartInteraction}
                                        className="h-16 px-16 rounded-[24px] bg-indigo-600 hover:bg-indigo-700 text-white font-[1000] text-sm uppercase tracking-[0.2em] shadow-2xl active:scale-95 transition-all"
                                    >
                                        <Play
                                            className="mr-3 fill-current"
                                            size={18}
                                        />
                                        Start Interaction
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center animate-in fade-in duration-1000">
                        <ColorMatchGame />
                    </div>
                )}
            </main>
        </div>
    );
}

function ActivityLoadingState() {
    return (
        <div className="fixed inset-0 bg-slate-950 z-[9999] flex flex-col items-center justify-center gap-4">
            <Loader2 className="h-10 w-10 text-indigo-500 animate-spin" />
            <p className="text-slate-600 font-black text-[9px] uppercase tracking-widest">
                Loading Immersive Shell
            </p>
        </div>
    );
}
