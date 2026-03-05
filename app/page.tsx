'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Zap } from 'lucide-react';

// API & Types
import { me } from '@/api/users';

// UI & Dashboards
import TherapistDashboard from '@/components/TherapistDashboard';
import AdminDashboard from '@/components/AdminDashboard';
import ActivitySessionLauncher from '@/components/ActivitySessionLauncher';

export default function RootPage() {
    const { data: user, isLoading: isUserLoading } = useQuery({
        queryKey: ['me'],
        queryFn: me,
        retry: false,
        staleTime: 1000 * 60 * 5,
    });

    const roleType = user?.role?.type;

    if (isUserLoading) {
        return (
            <div className="h-[100dvh] w-full flex flex-col items-center justify-center bg-[#F8FAFC]">
                <div className="relative flex items-center justify-center">
                    <div className="absolute h-24 w-24 rounded-full border-[3px] border-indigo-50 border-t-indigo-600 animate-spin" />
                    <div className="h-14 w-14 rounded-3xl bg-white shadow-2xl flex items-center justify-center text-indigo-600 border border-slate-100 relative z-10">
                        <Zap size={28} className="animate-pulse fill-current" />
                    </div>
                </div>
            </div>
        );
    }

    // If student, the Launcher handles the polling and the GameShell
    if (roleType === 'student') {
        return <ActivitySessionLauncher user={user} />;
    }

    switch (roleType) {
        case 'admin':
            return <AdminDashboard />;
        case 'therapist':
            return <TherapistDashboard />;
        default:
            return (
                <div className="h-screen w-full flex items-center justify-center">
                    <Loader2 className="animate-spin" />
                </div>
            );
    }
}
