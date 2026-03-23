'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useInfiniteQuery } from '@tanstack/react-query';
import {
    Activity,
    Search,
    Filter,
    X,
    Loader2,
    LayoutGrid,
    List,
} from 'lucide-react';

import { getActivitySessionsNew } from '@/api/activity-session';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

import {
    ActivitySessionLogsTable,
    ActivitySessionCard,
} from '@/components/ActivitySessionLogsTable';

export default function ActivitySessions() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [inputValue, setInputValue] = useState(searchParams.get('q') || '');
    const [debouncedSearch, setDebouncedSearch] = useState(inputValue);
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
    const observerTarget = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = setTimeout(() => {
            const currentQ = searchParams.get('q') || '';

            if (inputValue !== currentQ) {
                setDebouncedSearch(inputValue);
                const params = new URLSearchParams(searchParams.toString());
                if (inputValue) params.set('q', inputValue);
                else params.delete('q');

                router.replace(`?${params.toString()}`, { scroll: false });
            } else if (inputValue !== debouncedSearch) {
                setDebouncedSearch(inputValue);
            }
        }, 500);

        return () => clearTimeout(handler);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [inputValue]);

    // --- INFINITE SCROLL LOGIC PRESERVED ---
    const {
        data,
        isFetching,
        isLoading,
        isFetchingNextPage,
        hasNextPage,
        fetchNextPage,
    } = useInfiniteQuery({
        queryKey: [
            'activity-sessions-logs',
            {
                populate: {
                    activity: {
                        populate: '*',
                    },
                    student: {
                        populate: '*',
                    },
                },
                sort: ['updatedAt:desc'],
                ...(debouncedSearch ? { q: debouncedSearch } : {}),
            },
        ],
        queryFn: (context) => {
            const config = { ...(context.queryKey[1] as Record<string, any>) };

            config.pagination = {
                page: context.pageParam,
                pageSize: 20,
            };

            return getActivitySessionsNew({
                ...context,
                queryKey: [context.queryKey[0], config],
            });
        },
        initialPageParam: 1,
        getNextPageParam: (lastPage, allPages) => {
            return lastPage?.length === 20 ? allPages.length + 1 : undefined;
        },
    });

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (
                    entries[0].isIntersecting &&
                    hasNextPage &&
                    !isFetchingNextPage
                ) {
                    fetchNextPage();
                }
            },
            { threshold: 1.0 },
        );

        if (observerTarget.current) {
            observer.observe(observerTarget.current);
        }

        return () => observer.disconnect();
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    const activitySessions = data?.pages.flat() || [];

    if (isLoading) return <SessionsSkeleton />;

    return (
        <div className="h-screen bg-[#F8FAFC] flex flex-col relative overflow-hidden">
            <div
                className="absolute inset-0 pointer-events-none opacity-[0.4]"
                style={{
                    backgroundImage:
                        'linear-gradient(#e2e8f0 1px, transparent 1px), linear-gradient(90deg, #e2e8f0 1px, transparent 1px)',
                    backgroundSize: '40px 40px',
                    maskImage:
                        'linear-gradient(to bottom, black 40%, transparent 100%)',
                }}
            />

            <div className="flex-1 flex flex-col min-h-0 max-w-[1600px] w-full mx-auto p-6 lg:p-8 relative z-10 gap-6">
                {/* --- UNIFIED DASHBOARD HEADER --- */}
                <header className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 bg-white p-6 md:p-8 rounded-[32px] border border-slate-200 shadow-sm shrink-0">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-emerald-600 font-bold text-[10px] uppercase tracking-widest ml-0.5 mb-2">
                            <Activity size={14} className="text-emerald-600" />{' '}
                            Historical Analytics
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 leading-none">
                            Activity Session Records
                        </h1>
                        <p className="text-sm font-medium text-slate-500 mt-2 max-w-xl">
                            Review past activity performance and telemetry data.
                        </p>
                    </div>
                </header>

                {/* --- SEARCH WIDGET BOX --- */}
                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between sticky top-4 bg-white/80 backdrop-blur-xl z-30 py-3 px-4 rounded-2xl border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] shrink-0">
                    <div className="relative w-full sm:w-[320px] group">
                        <Search
                            className={cn(
                                'absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors',
                                isFetching && !isFetchingNextPage
                                    ? 'text-emerald-500 animate-pulse'
                                    : 'text-slate-400 group-focus-within:text-emerald-500',
                            )}
                        />
                        <Input
                            placeholder="Search learner or activity..."
                            className="pl-11 pr-10 w-full bg-slate-50 border border-slate-200 rounded-xl h-11 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-inner font-medium text-sm"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                        />
                        {inputValue && (
                            <button
                                onClick={() => setInputValue('')}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>
                    <div className="flex items-center w-full sm:w-auto gap-2">
                        {/* <Button
                            variant="outline"
                            className="w-full sm:w-auto rounded-xl h-11 border-slate-200 bg-white font-bold text-[11px] uppercase tracking-widest gap-2 px-6 shrink-0 shadow-sm hover:text-emerald-600 hover:border-emerald-200 transition-colors"
                        >
                            <Filter size={14} /> Filters
                        </Button> */}

                        <div className="h-8 w-px bg-slate-200 mx-2 hidden sm:block" />

                        <Tabs
                            value={viewMode}
                            onValueChange={(v: any) => setViewMode(v)}
                        >
                            <TabsList className="h-11 bg-slate-100/80 p-1.5 rounded-xl border border-slate-200/50">
                                <TabsTrigger
                                    value="grid"
                                    className="h-8 rounded-lg px-4 data-[state=active]:bg-white data-[state=active]:text-indigo-600 shadow-sm"
                                >
                                    <LayoutGrid size={14} />
                                </TabsTrigger>
                                <TabsTrigger
                                    value="table"
                                    className="h-8 rounded-lg px-4 data-[state=active]:bg-white data-[state=active]:text-indigo-600 shadow-sm"
                                >
                                    <List size={14} />
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>
                </div>

                {/* --- CONTENT AREA WITH LAZY LOADING TARGET --- */}
                {activitySessions.length > 0 ? (
                    viewMode === 'grid' ? (
                        <div className="flex-1 overflow-y-auto custom-scrollbar pb-12 w-full pr-2">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 content-start w-full animate-in fade-in duration-500">
                                {activitySessions.map((session) => (
                                    <ActivitySessionCard
                                        key={session.id || session.documentId}
                                        session={session}
                                    />
                                ))}
                            </div>

                            {/* INFINITE SCROLL TRIGGER (GRID) */}
                            <div
                                ref={observerTarget}
                                className="w-full h-16 flex items-center justify-center mt-6"
                            >
                                {isFetchingNextPage && (
                                    <div className="flex items-center gap-2 text-indigo-600 text-[10px] font-bold uppercase tracking-widest bg-indigo-50 px-4 py-2 rounded-xl shadow-sm">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Loading more logs...
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 min-h-[50vh] flex flex-col bg-white border border-slate-200 rounded-[32px] shadow-sm overflow-hidden w-full animate-in fade-in duration-500">
                            <div className="flex-1 overflow-auto custom-scrollbar relative">
                                <ActivitySessionLogsTable
                                    data={activitySessions}
                                />

                                {/* INFINITE SCROLL TRIGGER (TABLE) */}
                                <div
                                    ref={observerTarget}
                                    className="w-full h-16 flex items-center justify-center"
                                >
                                    {isFetchingNextPage && (
                                        <div className="flex items-center gap-2 text-indigo-600 text-[10px] font-bold uppercase tracking-widest bg-indigo-50 px-4 py-2 rounded-xl">
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Loading more logs...
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )
                ) : (
                    !isFetching && (
                        <div className="flex flex-col items-center justify-center min-h-[30vh] text-center w-full bg-white rounded-[32px] border-2 border-dashed border-slate-200">
                            <div className="h-16 w-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4">
                                <Search size={24} className="text-slate-300" />
                            </div>
                            <h3 className="text-lg font-black text-slate-900">
                                No logs found
                            </h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">
                                Adjust your search criteria
                            </p>
                        </div>
                    )
                )}
            </div>
        </div>
    );
}

function SessionsSkeleton() {
    return (
        <div className="flex flex-col h-screen w-full overflow-hidden bg-[#F8FAFC] relative">
            <div
                className="absolute inset-0 pointer-events-none opacity-[0.4]"
                style={{
                    backgroundImage:
                        'linear-gradient(#e2e8f0 1px, transparent 1px), linear-gradient(90deg, #e2e8f0 1px, transparent 1px)',
                    backgroundSize: '40px 40px',
                    maskImage:
                        'linear-gradient(to bottom, black 40%, transparent 100%)',
                }}
            />
            <div className="flex-1 flex flex-col min-h-0 max-w-[1600px] w-full mx-auto p-6 lg:p-8 relative z-10 gap-8 animate-pulse">
                <Skeleton className="h-40 w-full rounded-[32px] shrink-0 bg-white shadow-sm border border-slate-100" />
                <div className="flex-1 min-h-0 w-full overflow-hidden">
                    <Skeleton className="h-full w-full rounded-[32px] bg-white border border-slate-100 shadow-sm" />
                </div>
            </div>
        </div>
    );
}
