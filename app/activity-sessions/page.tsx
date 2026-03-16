'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Activity, Search, Filter, X, Loader2 } from 'lucide-react';

import { getActivitySessionsNew } from '@/api/acitivity-session';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';

import { ActivitySessionLogsTable } from '@/components/ActivitySessionLogsTable';

export default function ActivitySessions() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [inputValue, setInputValue] = useState(searchParams.get('q') || '');
    const [debouncedSearch, setDebouncedSearch] = useState(inputValue);
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

    const {
        data,
        isFetching,
        isLoading,
        isFetchingNextPage,
        hasNextPage,
        fetchNextPage,
    } = useInfiniteQuery({
        // We keep the exact 2-item array structure your API expects
        queryKey: [
            'activity-sessions',
            {
                populate: {
                    activity: {
                        populate: {
                            categories: true,
                        },
                    },
                    student: true,
                },
                sort: ['updatedAt:desc'],
                // Add search directly into the config so the query array structure stays intact
                ...(debouncedSearch ? { q: debouncedSearch } : {}),
            },
        ],
        queryFn: (context) => {
            // We take the exact config object from queryKey[1]
            const config = { ...(context.queryKey[1] as Record<string, any>) };

            // Inject Strapi pagination into the config object
            config.pagination = {
                page: context.pageParam,
                pageSize: 20,
            };

            // Pass the context exactly as the React Query wrapper expects it
            return getActivitySessionsNew({
                ...context,
                queryKey: [context.queryKey[0], config],
            });
        },
        initialPageParam: 1,
        getNextPageParam: (lastPage, allPages) => {
            // Assuming your fetcher returns an array directly based on your original code.
            // If it returns exactly 20 items, trigger the next page.
            return lastPage?.length === 20 ? allPages.length + 1 : undefined;
        },
    });

    // Intersection Observer to detect when user scrolls to the bottom
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

    // useInfiniteQuery returns pages of arrays. We flatten them for the table.
    const activitySessions = data?.pages.flat() || [];

    if (isLoading) return <SessionsSkeleton />;

    return (
        <div className="flex flex-col h-full w-full overflow-hidden bg-[#FDFDFF] p-4 md:p-6 lg:p-10 box-border">
            <header className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-4 xl:gap-6 shrink-0 w-full max-w-[1600px] mx-auto mb-4 md:mb-6">
                <div className="flex items-center gap-4 md:gap-5">
                    <div className="h-10 w-10 md:h-12 md:w-12 shrink-0 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-[0_10px_20px_rgba(16,185,129,0.3)]">
                        <Activity size={24} strokeWidth={1.5} />
                    </div>
                    <div className="space-y-1">
                        <h1 className="text-2xl md:text-3xl font-semibold text-slate-900 tracking-tight leading-none">
                            Session Log
                        </h1>
                        <p className="text-[9px] md:text-[10px] font-medium text-slate-500 uppercase tracking-widest ml-0.5">
                            Historical Performance Analytics
                        </p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full xl:w-auto">
                    <div className="relative group flex-1 sm:flex-none">
                        <Search
                            className={cn(
                                'absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors',
                                isFetching && !isFetchingNextPage
                                    ? 'text-emerald-500 animate-pulse'
                                    : 'text-slate-400',
                            )}
                        />
                        <Input
                            placeholder="Search learner or activity..."
                            className="pl-11 pr-10 w-full sm:w-80 bg-white border-slate-200/60 rounded-xl h-11 focus-visible:ring-emerald-100 transition-all shadow-sm"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                        />
                        {inputValue && (
                            <button
                                onClick={() => setInputValue('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>
                    <Button
                        variant="outline"
                        className="rounded-xl h-11 border-slate-200/60 font-semibold text-xs gap-2 px-5 shrink-0"
                    >
                        <Filter size={14} /> Filters
                    </Button>
                </div>
            </header>

            <div className="flex-1 min-h-0 h-full w-full max-w-[1600px] mx-auto overflow-hidden">
                <Card className="flex flex-col h-full w-full rounded-[24px] md:rounded-[32px] border border-slate-200/60 shadow-[0_20px_50px_rgba(0,0,0,0.04)] bg-white overflow-hidden p-1 md:p-2">
                    <ScrollArea className="flex-1 h-full w-full rounded-[20px] md:rounded-[28px]">
                        <div className="min-w-[800px] w-full pb-12">
                            {activitySessions.length > 0 ? (
                                <>
                                    <ActivitySessionLogsTable
                                        data={activitySessions}
                                    />

                                    {/* Invisible loading marker for Intersection Observer */}
                                    <div
                                        ref={observerTarget}
                                        className="w-full h-12 flex items-center justify-center mt-4"
                                    >
                                        {isFetchingNextPage && (
                                            <div className="flex items-center gap-2 text-slate-400 text-sm font-medium">
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                Loading more...
                                            </div>
                                        )}
                                    </div>
                                </>
                            ) : (
                                !isFetching && (
                                    <div className="flex h-64 items-center justify-center">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                            No matching sessions found
                                        </p>
                                    </div>
                                )
                            )}
                        </div>
                    </ScrollArea>
                </Card>
            </div>
        </div>
    );
}

function SessionsSkeleton() {
    return (
        <div className="flex flex-col h-full w-full overflow-hidden bg-[#FDFDFF] p-4 md:p-6 lg:p-10 box-border animate-pulse">
            <Skeleton className="h-12 w-48 rounded-xl shrink-0 mb-4 md:mb-6" />
            <div className="flex-1 min-h-0 h-full w-full overflow-hidden">
                <Skeleton className="h-full w-full rounded-[24px] md:rounded-[32px] bg-white border border-slate-100 shadow-sm" />
            </div>
        </div>
    );
}
