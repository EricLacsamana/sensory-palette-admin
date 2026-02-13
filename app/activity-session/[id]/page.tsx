'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';

import GameShellView from './GameShellView';
import AnalysisDashboardView from './AnalysisDashboardView';
import { Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getActivitySession } from '@/api/acitivity-session';

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

    // SMART SWITCH: If completed, show therapist dashboard. Otherwise, show game.
    return session.activitySessionStatus === 'completed' ? (
        <AnalysisDashboardView session={session} />
    ) : (
        <GameShellView session={session} />
    );
}

function LoadingScreen() {
    return (
        <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center gap-4">
            <Loader2 className="h-10 w-10 text-indigo-500 animate-spin" />
            <p className="text-slate-600 font-black text-[9px] uppercase tracking-widest">
                Syncing Environment
            </p>
        </div>
    );
}

function ErrorScreen({ onRetry }: { onRetry: () => void }) {
    return (
        <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center text-center p-6">
            <AlertCircle className="text-rose-500 mb-4" size={48} />
            <h2 className="text-white font-bold text-xl mb-2">
                Session Sync Failed
            </h2>
            <Button
                onClick={onRetry}
                variant="outline"
                className="text-white border-white/20"
            >
                Retry Connection
            </Button>
        </div>
    );
}
