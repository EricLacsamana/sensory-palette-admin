'use client';

import React, { useState, useRef } from 'react';
import {
    Play,
    Gamepad2,
    Maximize2,
    Minimize2,
    Loader2,
    Activity,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import ColorMatchGame from '@/components/games/ColorMatchGame';

export default function GameShellView({ session }: { session: any }) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isStarted, setIsStarted] = useState(false);
    const [isLaunching, setIsLaunching] = useState(false);
    const [launchProgress, setLaunchProgress] = useState(0);

    const handleStartInteraction = () => {
        setIsLaunching(true);
        let progress = 0;
        const interval = setInterval(() => {
            progress += 5;
            setLaunchProgress(progress);
            if (progress >= 100) {
                clearInterval(interval);
                finalizeLaunch();
            }
        }, 50);
    };

    const finalizeLaunch = async () => {
        setIsStarted(true);
        setIsLaunching(false);
        if (containerRef.current) {
            containerRef.current
                .requestFullscreen()
                .catch(() => console.warn('Fullscreen blocked'));
        }
    };

    return (
        <div
            ref={containerRef}
            className="fixed inset-0 bg-slate-950 z-[9999] flex flex-col text-slate-50"
        >
            <header className="h-20 border-b border-white/5 bg-slate-900/40 px-8 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center">
                        <Gamepad2 size={20} />
                    </div>
                    <div>
                        <h1 className="text-sm font-black uppercase tracking-widest">
                            {session?.activity?.name}
                        </h1>
                        <p className="text-[10px] text-slate-500 uppercase">
                            Learner: {session?.student?.firstName}
                        </p>
                    </div>
                </div>
                <Button
                    variant="ghost"
                    className="text-rose-500 font-bold text-xs"
                    onClick={() => window.history.back()}
                >
                    EXIT
                </Button>
            </header>

            <main className="flex-1 relative bg-black flex items-center justify-center">
                {!isStarted ? (
                    <div className="text-center p-12 bg-slate-900/40 border border-white/5 rounded-[40px] max-w-md w-full backdrop-blur-md">
                        {isLaunching ? (
                            <div className="space-y-6 flex flex-col items-center">
                                <Loader2
                                    size={48}
                                    className="animate-spin text-indigo-500"
                                />
                                <Progress
                                    value={launchProgress}
                                    className="h-1 w-full bg-white/10"
                                />
                                <p className="text-[10px] font-black uppercase tracking-[0.3em]">
                                    Syncing environment
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className="h-20 w-20 rounded-3xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 mx-auto mb-6 border border-indigo-500/20">
                                    <Activity size={32} />
                                </div>
                                <h2 className="text-2xl font-black mb-2">
                                    Start Session
                                </h2>
                                <p className="text-slate-400 text-xs mb-8">
                                    Click below to enter fullscreen mode and
                                    begin the activity.
                                </p>
                                <Button
                                    onClick={handleStartInteraction}
                                    className="w-full h-14 rounded-2xl bg-indigo-600 font-black uppercase tracking-widest hover:bg-indigo-700"
                                >
                                    <Play
                                        className="mr-2 fill-current"
                                        size={16}
                                    />{' '}
                                    Begin
                                </Button>
                            </>
                        )}
                    </div>
                ) : (
                    <div className="w-full h-full animate-in fade-in zoom-in duration-700">
                        <ColorMatchGame session={session} />
                    </div>
                )}
            </main>
        </div>
    );
}
