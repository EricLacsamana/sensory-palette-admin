'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { motion, Variants } from 'framer-motion';
import {
    Star,
    Zap,
    Activity,
    Radio,
    Trophy,
    Building2,
    LogOut,
    Settings,
    LayoutGrid,
    Flame,
    Loader2,
} from 'lucide-react';

// API & State
import { me } from '@/api/users';
import { logout } from '@/redux/auth/authSlice';
import { RootState } from '@/redux/store';
import { getActivitySessionsNew } from '@/api/acitivity-session';

// UI Components
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { TimelineTrackList } from '@/components/TimelineTrackList';
import { FormatService } from '@/utils/helpers';
import { cn } from '@/lib/utils';

// --- Animation Variants ---
const pageVariants: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05, duration: 0.4 } },
};

const itemVariants: Variants = {
    hidden: { y: 15, opacity: 0 },
    show: { y: 0, opacity: 1, transition: { duration: 0.3, ease: 'easeOut' } },
};

const TechnicalLabel = ({
    children,
    className,
}: {
    children: React.ReactNode;
    className?: string;
}) => (
    <span
        className={cn(
            'text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] select-none',
            className,
        )}
    >
        {children}
    </span>
);

export default function StudentDashboard() {
    const dispatch = useDispatch();

    // 1. SELECT AUTH STATE
    // We grab 'token' specifically to use as a dependency in our queries.
    const { token, isAuthenticated } = useSelector(
        (state: RootState) => state.auth,
    );

    // 2. IDENTITY QUERY: Fetch user profile
    const { data: user, isLoading: isUserLoading } = useQuery({
        queryKey: ['me', token], // Keyed by token to ensure fresh data after switching users
        queryFn: me,
        enabled: isAuthenticated && !!token,
        retry: false,
        staleTime: 1000 * 60 * 5,
    });

    // 3. FILTERED SESSION QUERY: Only in_progress and actualStartAt exists
    const { data: activitySessions = [], isLoading: isSessionsLoading } =
        useQuery({
            queryKey: [
                'activity-sessions',
                'filtered-in-progress',
                user?.id,
                token,
            ],
            queryFn: () =>
                getActivitySessionsNew({
                    filters: {
                        student: { id: { $eq: user?.id } },
                        activitySessionStatus: { $eq: 'in_progress' },
                        actualStartAt: { $notNull: true },
                    },
                    populate: {
                        activity: { populate: '*' },
                        student: { populate: '*' },
                    },
                }),
            // 🔥 THE GATEKEEPER: This prevents the 403 Forbidden by ensuring we have a
            // valid user context and token before the request fires.
            enabled: !!user?.id && !!token && isAuthenticated,
            refetchInterval: 5000, // Optional: Poll every 5s for live session updates
        });

    // 4. SEAMLESS LOGOUT LOGIC
    const handleLogout = () => {
        // Clear Redux State
        dispatch(logout());

        // Nuclear Option: Clear storage and force a hard reload.
        // This is the only way to 100% guarantee Axios memory is wiped clean
        // before the Therapist logs in.
        if (typeof window !== 'undefined') {
            localStorage.clear();
            sessionStorage.clear();
            window.location.href = '/auth/login';
        }
    };

    // --- LOADING STATE ---
    if (isUserLoading) {
        return (
            <div className="h-screen w-full flex flex-col items-center justify-center bg-[#F8FAFC]">
                <div className="relative flex items-center justify-center">
                    <div className="absolute h-24 w-24 rounded-full border-[3px] border-indigo-50 border-t-indigo-600 animate-spin" />
                    <div className="h-14 w-14 rounded-3xl bg-white shadow-2xl flex items-center justify-center text-indigo-600 border border-slate-100 relative z-10">
                        <Zap size={28} className="animate-pulse fill-current" />
                    </div>
                </div>
                <div className="mt-12 text-center">
                    <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400">
                        Synchronizing Profile
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen w-full bg-[#F8FAFC] overflow-hidden flex flex-col font-sans text-slate-900 relative">
            {/* Aesthetic Background Grid */}
            <div
                className="fixed inset-0 pointer-events-none opacity-[0.4]"
                style={{
                    backgroundImage:
                        'linear-gradient(#e2e8f0 1px, transparent 1px), linear-gradient(90deg, #e2e8f0 1px, transparent 1px)',
                    backgroundSize: '40px 40px',
                }}
            />

            <motion.div
                initial="hidden"
                animate="show"
                variants={pageVariants}
                className="max-w-[1600px] w-full mx-auto p-4 lg:p-6 flex flex-col h-full max-h-screen relative z-10 overflow-hidden gap-4 lg:gap-6"
            >
                {/* --- HEADER --- */}
                <motion.header
                    variants={itemVariants}
                    className="flex flex-col md:flex-row items-center justify-between gap-4 shrink-0 bg-white p-4 lg:p-5 rounded-[24px] lg:rounded-[32px] border border-slate-200 shadow-sm"
                >
                    <div className="flex items-center gap-4 lg:gap-6">
                        <div className="relative">
                            <Avatar className="h-12 w-12 lg:h-14 lg:w-14 rounded-[18px] lg:rounded-[22px] border-2 border-white shadow-md">
                                <AvatarImage
                                    src={FormatService.formatStrapiMedia(
                                        user?.profilePicture,
                                        'thumbnail',
                                    )}
                                />
                                <AvatarFallback className="bg-slate-900 text-white font-black text-lg">
                                    {user?.firstName?.charAt(0)}
                                </AvatarFallback>
                            </Avatar>
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-[2px] border-white shadow-sm flex items-center justify-center">
                                <span className="h-1 w-1 bg-white rounded-full animate-ping" />
                            </div>
                        </div>
                        <div>
                            <h1 className="text-xl lg:text-2xl font-black text-slate-900 tracking-tight">
                                Welcome, {user?.firstName}!
                            </h1>
                            <div className="flex items-center gap-2 mt-0.5">
                                <div className="flex items-center gap-1 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                                    <Radio
                                        size={8}
                                        className="text-indigo-600 animate-pulse"
                                    />
                                    <TechnicalLabel className="text-indigo-600 !text-[8px]">
                                        Live Connect
                                    </TechnicalLabel>
                                </div>
                                <span className="font-mono text-slate-400 text-[9px] font-bold uppercase">
                                    ID: #{user?.id?.toString().padStart(4, '0')}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 lg:gap-3">
                        <div className="bg-orange-50 px-3 lg:px-4 py-2 rounded-xl border border-orange-100 flex items-center gap-2 lg:gap-3">
                            <Flame
                                className="text-orange-500 fill-orange-500"
                                size={16}
                            />
                            <div className="leading-none">
                                <TechnicalLabel className="text-orange-600 block text-[8px] mb-0.5">
                                    Streak
                                </TechnicalLabel>
                                <span className="text-sm lg:text-base font-black text-orange-700">
                                    5 Days
                                </span>
                            </div>
                        </div>
                        <div className="bg-amber-50 px-3 lg:px-4 py-2 rounded-xl border border-amber-100 flex items-center gap-2 lg:gap-3">
                            <Star
                                className="text-amber-500 fill-amber-500"
                                size={16}
                            />
                            <div className="leading-none">
                                <TechnicalLabel className="text-amber-600 block text-[8px] mb-0.5">
                                    Stars
                                </TechnicalLabel>
                                <span className="text-sm lg:text-base font-black text-amber-700 tabular-nums">
                                    1,240
                                </span>
                            </div>
                        </div>
                    </div>
                </motion.header>

                {/* --- CONTENT GRID --- */}
                <div className="grid grid-cols-12 gap-4 lg:gap-6 flex-1 min-h-0">
                    {/* Left Sidebar */}
                    <motion.aside
                        variants={itemVariants}
                        className="col-span-12 lg:col-span-3 flex flex-col gap-4 lg:gap-6 min-h-0"
                    >
                        <Card className="rounded-[24px] lg:rounded-[32px] border-none shadow-xl bg-indigo-600 p-6 lg:p-8 text-white relative overflow-hidden shrink-0">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 via-teal-400 to-indigo-500" />
                            <Radio
                                className="absolute -right-6 -bottom-6 opacity-10"
                                size={140}
                            />
                            <div className="relative z-10 space-y-3 lg:space-y-4">
                                <div className="h-10 w-10 lg:h-12 lg:w-12 rounded-xl lg:rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                                    <LayoutGrid
                                        size={20}
                                        className="text-white"
                                    />
                                </div>
                                <div>
                                    <h2 className="text-xl lg:text-2xl font-black tracking-tight leading-tight">
                                        Ready to play?
                                    </h2>
                                    <p className="text-[11px] font-medium mt-2 text-indigo-100 leading-relaxed">
                                        Keep this window open. Your activity
                                        launches automatically when your teacher
                                        starts the session.
                                    </p>
                                </div>
                            </div>
                        </Card>

                        <Card className="rounded-[24px] lg:rounded-[32px] border-slate-200 shadow-sm bg-white overflow-hidden flex-1 flex flex-col min-h-0">
                            <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-3 lg:py-4 px-5">
                                <TechnicalLabel>System</TechnicalLabel>
                            </CardHeader>
                            <CardContent className="p-3 lg:p-4 flex-1 flex flex-col justify-between min-h-0">
                                <div className="space-y-1 lg:space-y-2 overflow-y-auto">
                                    <Button
                                        variant="ghost"
                                        className="w-full justify-start h-10 lg:h-11 rounded-xl gap-2 lg:gap-3 text-slate-600 hover:text-indigo-600 font-bold text-[11px] uppercase tracking-widest"
                                    >
                                        <Settings size={16} /> Settings
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        className="w-full justify-start h-10 lg:h-11 rounded-xl gap-2 lg:gap-3 text-slate-600 hover:text-indigo-600 font-bold text-[11px] uppercase tracking-widest"
                                    >
                                        <Building2 size={16} /> Help Center
                                    </Button>
                                </div>

                                <Button
                                    onClick={handleLogout}
                                    variant="ghost"
                                    className="w-full justify-start h-10 lg:h-11 rounded-xl gap-2 lg:gap-3 text-rose-500 hover:text-rose-600 hover:bg-rose-50 font-black text-[11px] uppercase tracking-[0.2em] mt-2 lg:mt-auto"
                                >
                                    <LogOut size={16} /> Sign Out
                                </Button>
                            </CardContent>
                        </Card>
                    </motion.aside>

                    {/* Main Feed */}
                    <motion.main
                        variants={itemVariants}
                        className="col-span-12 lg:col-span-9 flex flex-col gap-4 lg:gap-6 min-h-0"
                    >
                        <div className="flex-1 min-h-0 flex flex-col bg-white rounded-[24px] lg:rounded-[40px] border border-slate-200 shadow-xl overflow-hidden relative">
                            <CardHeader className="p-4 lg:p-6 border-b border-slate-100 flex flex-row items-center justify-between shrink-0 bg-white">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 lg:h-10 lg:w-10 rounded-xl lg:rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                                        <Activity size={18} />
                                    </div>
                                    <div>
                                        <TechnicalLabel className="text-slate-900 !text-[9px] lg:!text-[11px] !tracking-[0.3em]">
                                            Active History
                                        </TechnicalLabel>
                                        <p className="text-[10px] font-bold text-slate-400 mt-0.5">
                                            Live and in-progress sessions
                                        </p>
                                    </div>
                                </div>
                            </CardHeader>

                            {/* Internal Scrolling List */}
                            <div className="flex-1 overflow-y-auto p-4 lg:p-6 custom-scrollbar">
                                {isSessionsLoading ? (
                                    <div className="flex items-center justify-center h-full">
                                        <Loader2
                                            className="animate-spin text-slate-200"
                                            size={40}
                                        />
                                    </div>
                                ) : (
                                    <TimelineTrackList
                                        data={activitySessions}
                                        className="border-0 shadow-none"
                                    />
                                )}
                                <div className="h-10 w-full shrink-0" />
                            </div>

                            <div className="absolute bottom-0 left-0 right-0 h-12 lg:h-20 bg-gradient-to-t from-white to-transparent pointer-events-none" />
                        </div>
                    </motion.main>
                </div>
            </motion.div>
        </div>
    );
}
