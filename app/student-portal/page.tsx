'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LogOut,
    Play,
    Compass,
    Sparkles,
    LayoutDashboard,
    CheckCircle2,
    PauseCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

// API & State
import { me } from '@/api/users';
import { logout } from '@/redux/auth/authSlice';
import { RootState } from '@/redux/store';
import { getActivitySessionsNew } from '@/api/acitivity-session';

// UI Components
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { FormatService } from '@/utils/helpers';
import { cn } from '@/lib/utils';

// ✨ IMPORT YOUR LAUNCHER COMPONENT ✨
import ActivitySessionLauncher from '@/components/ActivitySessionLauncher';
import { ActivitySessionResponse } from '@/types/activitiy-session';

export default function StudentPortal() {
    const dispatch = useDispatch();
    const router = useRouter();
    const { token, isAuthenticated } = useSelector(
        (state: RootState) => state.auth,
    );

    const [isAutoLoggingOut, setIsAutoLoggingOut] = useState(false);

    // ✨ FIX: Smart Overflow State
    const carouselContainerRef = useRef<HTMLDivElement>(null);
    const [isOverflowing, setIsOverflowing] = useState(false);

    const { data: user, isLoading: isUserLoading } = useQuery({
        queryKey: ['me', token],
        queryFn: me,
        enabled: isAuthenticated && !!token,
    });

    const { data: sessions = [], isSuccess: isSessionsFetched } = useQuery({
        queryKey: [
            'student-portal-sessions',
            {
                filters: {
                    student: { id: { $eq: user?.id } },
                    activitySessionStatus: {
                        $in: ['in_progress', 'paused', 'queued'],
                    },
                },
                populate: {
                    activity: { populate: '*' },
                    student: { populate: '*' },
                },
                sort: ['startAt:asc'],
            },
        ],
        queryFn: getActivitySessionsNew,
        enabled: !!user?.id,
        refetchInterval: 5000,
    });

    // Track the logout trigger with a ref so it only ever fires once
    const logoutTriggeredRef = React.useRef(false);

    const handleLogout = React.useCallback(() => {
        dispatch(logout());
        if (typeof window !== 'undefined') {
            localStorage.clear();
            window.location.href = 'auth/student-login';
        }
    }, [dispatch]);

    // THE AUTO-LOGOUT LOGIC
    useEffect(() => {
        if (
            isSessionsFetched &&
            sessions.length === 0 &&
            !logoutTriggeredRef.current
        ) {
            logoutTriggeredRef.current = true;

            setTimeout(() => {
                setIsAutoLoggingOut(true);
                toast.success(
                    'All activities complete! Logging out safely...',
                    { icon: '🎉' },
                );
            }, 0);

            const timer = setTimeout(() => {
                handleLogout();
            }, 3500);

            return () => clearTimeout(timer);
        }
    }, [isSessionsFetched, sessions.length, handleLogout]);

    const activeSession = sessions.find(
        (s: ActivitySessionResponse) =>
            s.activitySessionStatus === 'in_progress' ||
            s.activitySessionStatus === 'paused',
    );
    const isPaused = activeSession?.activitySessionStatus === 'paused';

    const upcoming = sessions.filter(
        (s: ActivitySessionResponse) =>
            s.activitySessionStatus !== 'in_progress' &&
            s.activitySessionStatus !== 'paused',
    );

    // ✨ FIX: Smart Width Detection for the Carousel
    useEffect(() => {
        const checkWidth = () => {
            if (carouselContainerRef.current) {
                const containerWidth = carouselContainerRef.current.offsetWidth;
                // Card width (300px md / 260px sm) + Gap (16px)
                const itemWidth = window.innerWidth >= 768 ? 316 : 276;
                const totalContentWidth = upcoming.length * itemWidth;

                // If the total width of the items exceeds the container, enable the marquee
                setIsOverflowing(totalContentWidth > containerWidth);
            }
        };

        checkWidth();
        window.addEventListener('resize', checkWidth);
        return () => window.removeEventListener('resize', checkWidth);
    }, [upcoming.length]);

    // If it overflows, duplicate it to create a seamless infinite loop. Otherwise, just map it once.
    const carouselItems = isOverflowing
        ? Array(8).fill(upcoming).flat()
        : upcoming;

    if (isUserLoading) return <PortalLoadingScreen />;

    // AUTO-LOGOUT UI SCREEN
    if (isAutoLoggingOut) {
        return (
            <div className="h-screen w-full bg-[#FDFEFE] flex flex-col items-center justify-center relative overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-400/10 rounded-full blur-[100px] pointer-events-none" />
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', bounce: 0.5 }}
                    className="flex flex-col items-center text-center z-10"
                >
                    <div className="h-24 w-24 bg-emerald-50 rounded-[2rem] flex items-center justify-center text-emerald-500 mb-6 shadow-sm border border-emerald-100">
                        <CheckCircle2 size={48} className="animate-pulse" />
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">
                        Session Complete!
                    </h1>
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                        Great job today. Logging you out securely...
                    </p>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="h-screen w-full bg-[#FDFEFE] font-sans text-slate-800 relative overflow-hidden flex flex-col">
            <div className="flex-1 flex flex-col max-w-7xl mx-auto w-full p-6 lg:p-10 z-10 overflow-hidden">
                {/* --- MINIMAL HEADER --- */}
                <header className="flex items-center justify-between mb-6 shrink-0">
                    <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 rounded-xl border border-slate-100 shadow-sm">
                            <AvatarImage
                                src={FormatService.formatStrapiMedia(
                                    user?.profilePicture,
                                    'thumbnail',
                                )}
                            />
                            <AvatarFallback className="bg-slate-50 text-slate-400 text-xs">
                                {user?.firstName?.charAt(0)}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-[0.2em]">
                                Connected
                            </p>
                            <h1 className="text-sm font-medium text-slate-900 leading-none">
                                Student: {user?.fullName}
                            </h1>
                        </div>
                    </div>
                    <Button
                        onClick={handleLogout}
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-300 hover:text-rose-500 rounded-lg transition-colors"
                        title="End Session & Log Out"
                    >
                        <LogOut size={16} />
                    </Button>
                </header>

                {/* --- HERO: THE LARGE BANNER STAGE --- */}
                <main className="flex-1 flex flex-col justify-center min-h-0">
                    <AnimatePresence mode="wait">
                        {activeSession ? (
                            <motion.div
                                key="active"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 1.02 }}
                                className="w-full h-full max-h-[500px]"
                            >
                                <Card className="relative w-full h-full border-none shadow-[0_40px_80px_-20px_rgba(0,0,0,0.12)] bg-slate-900 overflow-hidden rounded-[3rem]">
                                    {/* 🖼️ THE FULL-SIZE BANNER IMAGE */}
                                    {activeSession.activity?.banner &&
                                        FormatService.formatStrapiMedia(
                                            activeSession.activity.banner,
                                        ) && (
                                            <img
                                                src={FormatService.formatStrapiMedia(
                                                    activeSession.activity
                                                        .banner,
                                                )}
                                                className={cn(
                                                    'absolute inset-0 w-full h-full object-cover transition-transform duration-[20s] scale-110',
                                                    isPaused
                                                        ? 'opacity-30 grayscale blur-sm'
                                                        : 'opacity-60 hover:scale-100',
                                                )}
                                                alt="Activity Banner"
                                            />
                                        )}
                                    {/* Gradient Scrim for Readability */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent md:bg-gradient-to-r md:from-slate-900/90 md:via-slate-900/40 md:to-transparent" />

                                    {/* CONTENT OVERLAY */}
                                    <div className="absolute inset-0 flex flex-col justify-center p-10 lg:p-20">
                                        <div className="max-w-xl space-y-6">
                                            <motion.div
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 0.2 }}
                                                className="flex items-center gap-2"
                                            >
                                                {isPaused ? (
                                                    <>
                                                        <PauseCircle
                                                            size={36}
                                                            className="text-amber-400"
                                                        />
                                                        <span className="text-[16px] font-black text-amber-400 uppercase tracking-[0.3em]">
                                                            Teacher Paused
                                                        </span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                                                        <span className="text-[10px] font-black text-white uppercase tracking-[0.3em]">
                                                            Ready to Launch
                                                        </span>
                                                    </>
                                                )}
                                            </motion.div>

                                            <motion.h2
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 0.3 }}
                                                className={cn(
                                                    'text-3xl lg:text-5xl font-bold tracking-tight leading-none transition-colors',
                                                    isPaused
                                                        ? 'text-slate-400'
                                                        : 'text-white',
                                                )}
                                            >
                                                {activeSession.activity?.name}
                                            </motion.h2>

                                            <motion.p
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 0.4 }}
                                                className="text-slate-200 text-sm lg:text-base font-medium max-w-sm leading-relaxed opacity-90"
                                            >
                                                {isPaused
                                                    ? 'Take a quick breather! Your teacher has paused the activity. It will resume shortly.'
                                                    : 'Your personalized session is prepared. Step inside to begin your next learning adventure.'}
                                            </motion.p>

                                            <AnimatePresence mode="wait">
                                                {!isPaused && (
                                                    <motion.div
                                                        key="game-launcher"
                                                        initial={{
                                                            opacity: 0,
                                                            y: 20,
                                                        }}
                                                        animate={{
                                                            opacity: 1,
                                                            y: 0,
                                                        }}
                                                        exit={{
                                                            opacity: 0,
                                                            y: -20,
                                                        }}
                                                        transition={{
                                                            delay: 0.5,
                                                        }}
                                                        className="pt-4"
                                                    >
                                                        {/* ✨ INJECTED LAUNCHER COMPONENT ✨ */}
                                                        <ActivitySessionLauncher
                                                            user={user}
                                                        />
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="empty"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-center"
                            >
                                <div className="h-20 w-20 bg-white rounded-[2rem] shadow-sm border border-slate-50 flex items-center justify-center mx-auto text-slate-200 mb-6">
                                    <LayoutDashboard size={32} />
                                </div>
                                <h2 className="text-lg font-bold text-slate-400 uppercase tracking-widest">
                                    Awaiting Your Path
                                </h2>
                                <p className="text-slate-300 text-[10px] mt-2 font-bold uppercase tracking-widest">
                                    Your teacher will broadcast your next
                                    activity soon.
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </main>

                {/* --- CAROUSEL: UPCOMING PROMOTION --- */}
                <footer className="mt-auto pt-8 shrink-0 overflow-hidden relative">
                    <div className="flex items-center gap-2 mb-4 px-2">
                        <Compass size={14} className="text-indigo-400" />
                        <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
                            Scheduled Discovery
                        </h3>
                    </div>

                    <div
                        ref={carouselContainerRef}
                        className={cn(
                            'relative flex overflow-hidden py-2 w-full transition-all duration-500',
                            isOverflowing ? 'mask-linear-fade' : '',
                        )}
                    >
                        <motion.div
                            className={cn(
                                'flex gap-4 whitespace-nowrap w-max',
                                !isOverflowing && 'w-full justify-start',
                            )}
                            animate={
                                isOverflowing
                                    ? { x: ['0%', '-50%'] }
                                    : { x: '0%' }
                            }
                            transition={
                                isOverflowing
                                    ? {
                                          repeat: Infinity,
                                          ease: 'linear',
                                          duration: Math.max(
                                              30,
                                              carouselItems.length * 2,
                                          ), // Adjust speed dynamically
                                      }
                                    : {}
                            }
                        >
                            {carouselItems.length > 0 ? (
                                carouselItems.map(
                                    (
                                        s: ActivitySessionResponse,
                                        idx: number,
                                    ) => (
                                        <div
                                            key={idx}
                                            className="w-[260px] md:w-[300px] rounded-2xl border border-slate-100 bg-white/50 backdrop-blur-sm p-3 flex items-center gap-4 shadow-sm hover:border-indigo-100 transition-colors"
                                        >
                                            <div className="h-12 w-12 rounded-xl bg-slate-100 overflow-hidden shrink-0 grayscale opacity-40">
                                                {s.activity?.banner && (
                                                    <img
                                                        src={FormatService.formatStrapiMedia(
                                                            s.activity.banner,
                                                            'thumbnail',
                                                        )}
                                                        className="w-full h-full object-cover"
                                                        alt={s.activity?.name}
                                                    />
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <h4 className="font-bold text-slate-900 text-[12px] truncate leading-none mb-1">
                                                    {s.activity?.name}
                                                </h4>
                                                <div className="flex items-center gap-1.5">
                                                    <Sparkles
                                                        size={10}
                                                        className={cn(
                                                            s.activitySessionStatus ===
                                                                'queued'
                                                                ? 'text-amber-400'
                                                                : 'text-slate-300',
                                                        )}
                                                    />
                                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                                                        {s.activitySessionStatus ===
                                                        'queued'
                                                            ? 'Upcoming'
                                                            : 'Planned'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ),
                                )
                            ) : (
                                <div className="text-[10px] font-bold text-slate-200 uppercase tracking-widest ml-4">
                                    No scheduled tasks
                                </div>
                            )}
                        </motion.div>
                    </div>
                </footer>
            </div>

            <style jsx global>{`
                .mask-linear-fade {
                    mask-image: linear-gradient(
                        to right,
                        transparent,
                        black 10%,
                        black 90%,
                        transparent
                    );
                    -webkit-mask-image: linear-gradient(
                        to right,
                        transparent,
                        black 10%,
                        black 90%,
                        transparent
                    );
                }
            `}</style>
        </div>
    );
}

function PortalLoadingScreen() {
    return (
        <div className="h-screen w-full flex items-center justify-center bg-white">
            <div className="h-12 w-12 bg-indigo-50 rounded-2xl animate-pulse" />
        </div>
    );
}
