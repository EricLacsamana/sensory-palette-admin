'use client';

import React, { useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    Lock,
    Play,
    Search,
    Gamepad2,
    ArrowLeft,
    Brain,
    Tag,
    Activity,
    ChevronRight,
    Layers,
    Filter,
    Terminal,
} from 'lucide-react';
import { useActivities } from '@/hooks/useActivities';
import { useStudent } from '@/hooks/useStudents';
import { cn } from '@/lib/utils';

const getCategoryIcon = (type: string) => {
    switch (type?.toLowerCase()) {
        case 'cognitive':
            return <Brain className="mr-1.5 h-3 w-3" />;
        case 'motor':
            return <Activity className="mr-1.5 h-3 w-3" />;
        default:
            return <Tag className="mr-1.5 h-3 w-3" />;
    }
};

const ActivityLibrary = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const studentId = searchParams.get('studentId');

    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');
    const [hoveredId, setHoveredId] = useState<string | number | null>(null);

    const { data: activities, isLoading: actLoading } = useActivities();
    const { data: student, isLoading: stuLoading } = useStudent(
        Number(studentId),
    );

    const filteredActivities = useMemo(() => {
        return activities?.filter((activity: any) => {
            const matchesSearch = activity.name
                .toLowerCase()
                .includes(searchTerm.toLowerCase());
            const matchesCategory =
                activeCategory === 'All' ||
                activity.categories?.some(
                    (cat: any) => cat.name === activeCategory,
                );
            return matchesSearch && matchesCategory;
        });
    }, [activities, searchTerm, activeCategory]);

    const categoryButtons = useMemo(() => {
        if (!activities) return ['All'];
        const allNames = activities.flatMap(
            (a: any) => a.categories?.map((c: any) => c.name) || [],
        );
        return ['All', ...Array.from(new Set(allNames.filter(Boolean)))];
    }, [activities]);

    if (actLoading || (studentId && stuLoading)) {
        return (
            <div className="flex h-[80vh] flex-col items-center justify-center gap-4">
                <div className="h-12 w-12 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-indigo-600 animate-pulse">
                    Initializing Registry...
                </p>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-[1400px] px-8 py-10">
            {/* Header: Technical Header */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 border-b border-slate-100 pb-10">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-indigo-600 font-bold text-[10px] uppercase tracking-widest">
                        <Layers size={14} /> Repository v2.4
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.back()}
                            className="h-10 w-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-200 transition-all active:scale-95 shadow-sm"
                        >
                            <ArrowLeft size={18} />
                        </button>
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                            {studentId ? (
                                <>
                                    Protocol for{' '}
                                    <span className="text-indigo-600">
                                        {student?.firstName}
                                    </span>
                                </>
                            ) : (
                                'Protocol Library'
                            )}
                        </h1>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="text-right border-l border-slate-100 pl-4 hidden sm:block">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">
                            Modules
                        </p>
                        <p className="text-sm font-bold text-slate-900 tabular-nums leading-none font-mono">
                            [{filteredActivities?.length || 0}]
                        </p>
                    </div>
                </div>
            </header>

            {/* Filters & Search: Integrated Module */}
            <div className="bg-slate-50/50 border border-slate-200 p-2 rounded-2xl mb-12 flex flex-col lg:flex-row gap-2">
                <div className="relative flex-1 group">
                    <Search
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors"
                        size={16}
                    />
                    <input
                        type="text"
                        placeholder="Search system protocols..."
                        className="w-full bg-white border border-slate-200 rounded-xl py-3.5 pl-11 pr-4 outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-400 text-sm font-medium transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex flex-wrap gap-1 p-1 bg-white border border-slate-200 rounded-xl overflow-x-auto no-scrollbar">
                    {categoryButtons.map((catName: any) => (
                        <button
                            key={catName}
                            onClick={() => setActiveCategory(catName)}
                            className={cn(
                                'flex items-center rounded-lg px-4 py-2 text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap',
                                activeCategory === catName
                                    ? 'bg-slate-900 text-white shadow-sm'
                                    : 'text-slate-500 hover:bg-slate-50',
                            )}
                        >
                            {catName === 'All' && (
                                <Terminal size={12} className="mr-1.5" />
                            )}
                            {catName}
                        </button>
                    ))}
                </div>
            </div>

            {/* Grid Area: Technical "Spec" Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {filteredActivities?.map((activity: any) => {
                    const id = activity.documentId || activity.id;
                    const isAvailable = activity.activityStatus === 'active';
                    const isHovered = hoveredId === id;

                    return (
                        <div
                            key={id}
                            onMouseEnter={() => setHoveredId(id)}
                            onMouseLeave={() => setHoveredId(null)}
                            onClick={() =>
                                isAvailable &&
                                router.push(
                                    `/activities/${id}?studentId=${studentId}`,
                                )
                            }
                            className={cn(
                                'group relative flex flex-col rounded-[32px] bg-white border border-slate-200 transition-all duration-500 ease-out overflow-hidden',
                                isAvailable
                                    ? 'cursor-pointer'
                                    : 'cursor-not-allowed grayscale-[0.4]',
                                isHovered && isAvailable
                                    ? 'border-indigo-500 shadow-[0_32px_64px_-16px_rgba(79,70,229,0.15)] -translate-y-2'
                                    : 'shadow-sm',
                            )}
                        >
                            {/* Media Section */}
                            <div className="relative h-52 w-full overflow-hidden bg-slate-100 p-3">
                                <div className="h-full w-full rounded-[24px] overflow-hidden relative">
                                    <img
                                        src={
                                            activity.banner?.url
                                                ? `http://localhost:1337${activity.banner.url}`
                                                : 'https://via.placeholder.com/400x225'
                                        }
                                        alt={activity.name}
                                        className={cn(
                                            'h-full w-full object-cover transition-transform duration-1000 ease-out',
                                            isHovered &&
                                                isAvailable &&
                                                'scale-110',
                                        )}
                                    />
                                    <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                                        {activity.categories?.map(
                                            (cat: any, idx: number) => (
                                                <span
                                                    key={idx}
                                                    className="flex items-center px-2 py-1 bg-slate-900/80 backdrop-blur-md text-white border border-white/10 rounded-lg text-[9px] font-bold uppercase tracking-wider"
                                                >
                                                    {getCategoryIcon(cat.type)}
                                                    {cat.name}
                                                </span>
                                            ),
                                        )}
                                    </div>
                                </div>

                                {!isAvailable && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/60 backdrop-blur-[2px] text-white">
                                        <Lock
                                            size={28}
                                            className="mb-2 opacity-80"
                                        />
                                        <span className="text-[10px] font-bold tracking-[0.3em] uppercase">
                                            SYSTEM_LOCKED
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Info Section */}
                            <div className="flex flex-col p-8 pt-4 flex-1">
                                <div className="flex justify-between items-start mb-3">
                                    <h3
                                        className={cn(
                                            'text-2xl font-bold text-slate-900 leading-tight transition-colors',
                                            isHovered &&
                                                isAvailable &&
                                                'text-indigo-600',
                                        )}
                                    >
                                        {activity.name}
                                    </h3>
                                    <ChevronRight
                                        className={cn(
                                            'text-slate-300 transition-transform duration-300',
                                            isHovered &&
                                                'translate-x-1 text-indigo-400',
                                        )}
                                        size={20}
                                    />
                                </div>
                                <p className="text-sm text-slate-500 line-clamp-2 mb-8 font-medium leading-relaxed">
                                    {activity.description ||
                                        'System module ready for initialization and deployment.'}
                                </p>

                                <div className="mt-auto pt-6 border-t border-slate-50 flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">
                                            Authorization
                                        </span>
                                        <span className="text-[10px] font-bold text-slate-900 uppercase font-mono tracking-tight">
                                            Level_01/OPS
                                        </span>
                                    </div>

                                    <div
                                        className={cn(
                                            'flex items-center justify-center rounded-2xl transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] border',
                                            isAvailable
                                                ? 'bg-indigo-600 border-indigo-500 shadow-lg shadow-indigo-100'
                                                : 'bg-slate-100 border-slate-200 shadow-none',
                                            isHovered && isAvailable
                                                ? 'w-32 h-12'
                                                : 'w-12 h-12',
                                        )}
                                    >
                                        <div className="flex items-center gap-3 text-white">
                                            <Play
                                                size={14}
                                                className={cn(
                                                    'transition-transform duration-300',
                                                    isHovered &&
                                                        isAvailable &&
                                                        'fill-current scale-110',
                                                )}
                                            />
                                            {isHovered && isAvailable && (
                                                <span className="text-[11px] font-black uppercase tracking-wider animate-in fade-in slide-in-from-left-2">
                                                    Deploy
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Empty State */}
            {filteredActivities?.length === 0 && (
                <div className="py-32 flex flex-col items-center justify-center border-2 border-dashed border-slate-100 rounded-[48px] bg-slate-50/50">
                    <div className="bg-white p-6 rounded-[24px] shadow-sm border border-slate-100 mb-6">
                        <Filter size={32} className="text-slate-300" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 uppercase tracking-[0.2em]">
                        Zero Matches Found
                    </h2>
                    <p className="text-slate-400 text-sm mt-2 font-medium">
                        Re-initialize filters or clear search parameters.
                    </p>
                    <button
                        onClick={() => {
                            setSearchTerm('');
                            setActiveCategory('All');
                        }}
                        className="mt-8 px-6 py-2.5 rounded-xl bg-white border border-slate-200 text-[10px] font-bold text-indigo-600 uppercase tracking-widest hover:border-indigo-600 hover:bg-indigo-50 transition-all shadow-sm"
                    >
                        Reset System Registry
                    </button>
                </div>
            )}
        </div>
    );
};

export default ActivityLibrary;
