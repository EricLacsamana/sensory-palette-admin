'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, ShieldAlert, Zap } from 'lucide-react';
import { useSelector } from 'react-redux';

// API & Types
import { me } from '@/api/users';
import { getActivitySessionsNew } from '@/api/acitivity-session';

// UI & Redux
import { Button } from '@/components/ui/button';
import TherapistDashboard from '@/components/TherapistDashboard';
import StudentDashboard from '@/components/StudentDashboard';
import GameShellView from '@/components/GameShellView';

export default function RootPage() {
    // Select Auth state from Redux

    // 1. IDENTITY FETCH: Strictly gated by token and auth loading status
    // This prevents the "Forbidden" error by waiting for the token to exist
    const {
        data: user,
        isLoading: isUserLoading,
        isError: isUserError,
    } = useQuery({
        queryKey: ['me'],
        queryFn: me,

        retry: false, // Prevents a loop of 403 Forbidden errors
        staleTime: 1000 * 60 * 5, // 5 minute cache
    });

    console.log('test', user);

    const roleType = user?.role?.type;

    // 2. SESSION POLLING: Sequence-dependent on the 'user' query above
    const { data: activeSessions = [] } = useQuery({
        queryKey: [
            'active-session-poll',
            {
                filters: {
                    student: { id: { $eq: user?.id } },
                    activitySessionStatus: { $eq: 'in_progress' },
                    actualStartAt: { $notNull: true },
                },
                populate: {
                    activity: { populate: '*' },
                    student: { populate: '*' },
                },
            },
        ],
        queryFn: getActivitySessionsNew,
        // 🔥 THE FIX: Gated by user identity resolution to ensure we have an ID to filter by
        enabled: !!user?.id && roleType === 'student' && !isUserLoading,
        refetchInterval: 3000, // 3-second heartbeat for students
    });

    const activeSession = activeSessions?.[0];

    // --- LOADING STATE: Clinical Splash ---
    if (isUserLoading) {
        return (
            <div className="h-[100dvh] w-full flex flex-col items-center justify-center bg-[#F8FAFC]">
                <div className="relative flex items-center justify-center">
                    <div className="absolute h-24 w-24 rounded-full border-[3px] border-indigo-50 border-t-indigo-600 animate-spin" />
                    <div className="h-14 w-14 rounded-3xl bg-white shadow-2xl flex items-center justify-center text-indigo-600 border border-slate-100 relative z-10">
                        <Zap size={28} className="animate-pulse fill-current" />
                    </div>
                </div>
                <div className="mt-12 text-center">
                    <h2 className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400">
                        Secure Entry
                    </h2>
                    <p className="text-xs font-bold text-slate-300 mt-2 italic">
                        Configuring clinical workspace...
                    </p>
                </div>
            </div>
        );
    }

    // --- DISPATCHER LOGIC ---

    // A. INTERRUPT: Game Shell (Highest Priority for Students)
    if (roleType === 'student' && activeSession) {
        return <GameShellView session={activeSession} />;
    }

    // B. DASHBOARD ROUTING
    switch (roleType) {
        case 'admin':
            return <TherapistDashboard />;

        case 'therapist':
            return <TherapistDashboard />;

        case 'student':
            return <StudentDashboard />;

        default:
            return (
                <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50 text-slate-400">
                    <Loader2 className="animate-spin mb-4" size={32} />
                    <p className="text-[10px] font-black uppercase tracking-widest">
                        Awaiting Role Validation
                    </p>
                </div>
            );
    }
}
