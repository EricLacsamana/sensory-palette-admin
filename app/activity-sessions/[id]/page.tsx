'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Loader2, AlertCircle, Database, Zap } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { getActivitySession } from '@/api/activity-session';
import ActivitySessionDashboard from '@/components/ActivitySessionDashboard';

export default function ActivitySessionPage() {
    const params = useParams();
    const documentId = params.id as string;

    const {
        data: session,
        isLoading,
        isError,
        refetch,
    } = useQuery({
        queryKey: ['activity-session', documentId],
        queryFn: () => getActivitySession(documentId),
        refetchOnWindowFocus: false,
    });

    if (isLoading) return <LoadingScreen />;

    if (isError || !session) return <ErrorScreen onRetry={() => refetch()} />;

    // Always show the Dashboard.
    // The Dashboard component now handles the Launch/Resume buttons via internal routing.
    return <ActivitySessionDashboard session={session} />;
}

// --- SUB-COMPONENTS: FEEDBACK STATES ---

function LoadingScreen() {
    return (
        <div className="fixed inset-0 bg-[#F8FAFC] flex flex-col items-center justify-center gap-6">
            <div className="relative">
                <div className="h-16 w-16 border-4 border-indigo-100 border-t-indigo-600 rounded-2xl animate-spin" />
                <Database
                    className="absolute inset-0 m-auto text-indigo-600 opacity-20"
                    size={20}
                />
            </div>
            <div className="text-center space-y-1">
                <p className="text-slate-900 font-bold text-xs uppercase tracking-[0.2em]">
                    Fetching Session Data
                </p>
                <p className="text-slate-400 text-[10px] font-medium">
                    Synchronizing clinical registry...
                </p>
            </div>
        </div>
    );
}

function ErrorScreen({ onRetry }: { onRetry: () => void }) {
    return (
        <div className="fixed inset-0 bg-white flex flex-col items-center justify-center text-center p-6">
            <div className="h-20 w-20 bg-rose-50 rounded-[32px] flex items-center justify-center mb-6">
                <AlertCircle className="text-rose-500" size={32} />
            </div>
            <h2 className="text-slate-900 font-black text-2xl tracking-tight mb-2">
                System Sync Failed
            </h2>
            <p className="text-slate-500 text-sm max-w-[280px] mb-8 font-medium leading-relaxed">
                We encountered a connection error while retrieving the session
                details.
            </p>
            <div className="flex gap-3">
                <Button
                    onClick={onRetry}
                    className="bg-slate-900 text-white hover:bg-slate-800 rounded-2xl px-8 h-12 font-bold uppercase text-[10px] tracking-widest"
                >
                    Retry Connection
                </Button>
            </div>
        </div>
    );
}
