'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useInfiniteQuery, keepPreviousData } from '@tanstack/react-query';
import { useInView } from 'react-intersection-observer';
import {
    Activity,
    Search,
    Filter,
    Calendar as CalendarIcon,
    ArrowUpRight,
    Clock,
    CheckCircle2,
    PlayCircle,
    FileJson,
    Loader2,
    X,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';

import { getActivitySessions } from '@/api/acitivity-session';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';

export default function ActivitySessions() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [inputValue, setInputValue] = useState(searchParams.get('q') || '');
    const [debouncedSearch, setDebouncedSearch] = useState(inputValue);

    const { ref, inView } = useInView();

    // --- DEBOUNCE & URL SYNC ---
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(inputValue);
            const params = new URLSearchParams(searchParams.toString());
            if (inputValue) params.set('q', inputValue);
            else params.delete('q');
            router.replace(`?${params.toString()}`, { scroll: false });
        }, 500);
        return () => clearTimeout(handler);
    }, [inputValue, router, searchParams]);

    // --- INFINITE QUERY WITH BLINK-FIX ---
    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isFetching,
        isLoading,
    } = useInfiniteQuery({
        queryKey: ['activity-sessions-infinite', debouncedSearch],
        queryFn: ({ pageParam }) =>
            getActivitySessions({ pageParam, searchTerm: debouncedSearch }),
        initialPageParam: 1,
        getNextPageParam: (lastPage) => {
            const pagination = lastPage?.meta?.pagination;
            if (!pagination) return undefined;
            return pagination.page < pagination.pageCount
                ? pagination.page + 1
                : undefined;
        },
        // This is the magic line that stops the blinking:
        placeholderData: keepPreviousData,
    });

    const allSessions = useMemo(
        () => data?.pages.flatMap((page) => page.data) || [],
        [data],
    );

    useEffect(() => {
        if (inView && hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
        }
    }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

    // Only show skeleton on the very first load of the app
    if (isLoading && !data) return <SessionsSkeleton />;

    return (
        <div className="flex flex-col h-screen max-h-screen overflow-hidden bg-[#FDFDFF] p-6 lg:p-10 space-y-6">
            <header className="flex flex-col md:flex-row justify-between items-end gap-6 shrink-0 max-w-[1600px] w-full mx-auto">
                <div className="flex items-center gap-5">
                    <div className="h-12 w-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-[0_10px_20px_rgba(16,185,129,0.3)]">
                        <Activity size={24} strokeWidth={1.5} />
                    </div>
                    <div className="space-y-1">
                        <h1 className="text-3xl font-semibold text-slate-900 tracking-tight leading-none">
                            Session Log
                        </h1>
                        <p className="text-[10px] font-medium text-slate-500 uppercase tracking-widest ml-0.5">
                            Historical Performance Analytics
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <Search
                            className={cn(
                                'absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors',
                                isFetching
                                    ? 'text-emerald-500 animate-pulse'
                                    : 'text-slate-400',
                            )}
                        />
                        <Input
                            placeholder="Search learner or activity..."
                            className="pl-11 pr-10 w-80 bg-white border-slate-200/60 rounded-xl h-11 focus-visible:ring-emerald-100 transition-all shadow-sm"
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
                        className="rounded-xl h-11 border-slate-200/60 font-semibold text-xs gap-2 px-5"
                    >
                        <Filter size={14} /> Filters
                    </Button>
                </div>
            </header>

            <div className="flex-1 min-h-0 w-full max-w-[1600px] mx-auto">
                <Card className="flex flex-col h-full rounded-[32px] border border-slate-200/60 shadow-[0_20px_50px_rgba(0,0,0,0.04)] bg-white overflow-hidden p-2">
                    <div className="shrink-0 border-b border-slate-100 bg-white z-20">
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent border-none">
                                    <TableHead className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 py-6 px-10 w-[30%]">
                                        Learner
                                    </TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 w-[15%]">
                                        Status
                                    </TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 w-[20%]">
                                        Timeline
                                    </TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 w-[20%]">
                                        Accuracy
                                    </TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 text-right pr-10 w-[15%]">
                                        Actions
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                        </Table>
                    </div>

                    <ScrollArea className="flex-1 h-full w-full">
                        {/* The dimming effect while fetching new search results */}
                        <div
                            className={cn(
                                'transition-opacity duration-300',
                                isFetching && !isFetchingNextPage
                                    ? 'opacity-40'
                                    : 'opacity-100',
                            )}
                        >
                            <Table>
                                <TableBody>
                                    {allSessions.length > 0
                                        ? allSessions.map((session: any) => (
                                              <TableRow
                                                  key={session.id}
                                                  className="group border-slate-50 transition-colors hover:bg-slate-50/50 cursor-pointer"
                                                  onClick={() =>
                                                      router.push(
                                                          `/activity-session/${session.documentId}`,
                                                      )
                                                  }
                                              >
                                                  <TableCell className="px-10 py-5 w-[30%]">
                                                      <div className="flex items-center gap-4">
                                                          <div className="h-10 w-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                                                              <Activity
                                                                  size={18}
                                                              />
                                                          </div>
                                                          <div className="space-y-0.5">
                                                              <p className="text-sm font-semibold text-slate-900 leading-tight">
                                                                  {
                                                                      session
                                                                          .student
                                                                          ?.firstName
                                                                  }{' '}
                                                                  {
                                                                      session
                                                                          .student
                                                                          ?.lastName
                                                                  }
                                                              </p>
                                                              <p className="text-[10px] text-slate-400 uppercase font-medium">
                                                                  {session
                                                                      .activity
                                                                      ?.name ||
                                                                      'Session'}
                                                              </p>
                                                          </div>
                                                      </div>
                                                  </TableCell>
                                                  <TableCell className="w-[15%]">
                                                      <StatusBadge
                                                          status={
                                                              session.activityStatus
                                                          }
                                                      />
                                                  </TableCell>
                                                  <TableCell className="w-[20%] text-[11px] font-semibold text-slate-500">
                                                      {format(
                                                          parseISO(
                                                              session.startTime,
                                                          ),
                                                          'MMM d, hh:mm a',
                                                      )}
                                                  </TableCell>
                                                  <TableCell className="w-[20%] font-bold text-slate-900">
                                                      {(
                                                          session.successRate *
                                                          100
                                                      ).toFixed(0)}
                                                      %
                                                  </TableCell>
                                                  <TableCell className="text-right pr-10 w-[15%]">
                                                      <ArrowUpRight
                                                          size={16}
                                                          className="ml-auto text-slate-200 group-hover:text-indigo-600 transition-colors"
                                                      />
                                                  </TableCell>
                                              </TableRow>
                                          ))
                                        : !isFetching && (
                                              <TableRow>
                                                  <TableCell
                                                      colSpan={5}
                                                      className="h-64 text-center"
                                                  >
                                                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                                          No matching sessions
                                                          found
                                                      </p>
                                                  </TableCell>
                                              </TableRow>
                                          )}
                                </TableBody>
                            </Table>
                        </div>

                        <div
                            ref={ref}
                            className="py-12 flex justify-center items-center gap-3 w-full border-t border-slate-50"
                        >
                            {isFetchingNextPage ? (
                                <Loader2 className="animate-spin h-5 w-5 text-emerald-500" />
                            ) : (
                                <span className="text-[10px] text-slate-300 uppercase font-bold tracking-[0.3em]">
                                    {hasNextPage
                                        ? 'Scroll for more'
                                        : 'End of session history'}
                                </span>
                            )}
                        </div>
                    </ScrollArea>
                </Card>
            </div>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const config = {
        completed: {
            label: 'Done',
            icon: CheckCircle2,
            className: 'bg-emerald-50 text-emerald-600 border-emerald-100/50',
        },
        live: {
            label: 'Live',
            icon: PlayCircle,
            className:
                'bg-indigo-50 text-indigo-600 border-indigo-100/50 animate-pulse',
        },
        pending: {
            label: 'Wait',
            icon: Clock,
            className: 'bg-amber-50 text-amber-600 border-amber-100/50',
        },
    } as any;
    const { label, icon: Icon, className } = config[status] || config.pending;
    return (
        <div
            className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border transition-all',
                className,
            )}
        >
            <Icon size={11} strokeWidth={2} /> {label}
        </div>
    );
}

function SessionsSkeleton() {
    return (
        <div className="p-10 space-y-10 animate-pulse h-screen overflow-hidden bg-[#FDFDFF]">
            <Skeleton className="h-10 w-48 rounded-xl" />
            <Skeleton className="flex-1 rounded-[32px] bg-white border border-slate-100 shadow-sm" />
        </div>
    );
}
