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
} from 'lucide-react';
import { useActivities } from '@/hooks/useActivities';
import { useStudent } from '@/hooks/useStudents';
import { cn } from '@/lib/utils';

const getCategoryIcon = (type: string) => {
    switch (type?.toLowerCase()) {
        case 'cognitive':
            return <Brain className="mr-2 h-3 w-3" />;
        case 'motor':
            return <Activity className="mr-2 h-3 w-3" />;
        default:
            return <Tag className="mr-2 h-3 w-3" />;
    }
};

const ActivityLibrary = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const studentId = searchParams.get('studentId');

    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');
    const [hoveredId, setHoveredId] = useState<string | number | null>(null);

    const {
        data: activities,
        isLoading: actLoading,
        isError: actError,
    } = useActivities();
    const { data: student, isLoading: stuLoading } = useStudent(studentId);

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
            <div className="flex h-[70vh] items-center justify-center text-indigo-600 font-bold animate-pulse">
                Syncing Library...
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-7xl px-6 py-12">
            {/* Header */}
            <header className="mb-12 text-center">
                <div className="flex items-center justify-center gap-6 mb-4">
                    <button
                        onClick={() => router.back()}
                        className="p-3 rounded-2xl bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-100 transition-all active:scale-90 shadow-sm"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">
                        {studentId
                            ? `${student?.firstName}'s Tasks`
                            : 'Activity Vault'}
                    </h1>
                </div>
                <p className="text-slate-500 font-medium italic">
                    Select a module to initiate the session workflow.
                </p>
            </header>

            {/* Filters & Search */}
            <div className="flex flex-col items-center gap-8 mb-16">
                <div className="relative w-full max-w-xl group">
                    <Search
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors"
                        size={18}
                    />
                    <input
                        type="text"
                        placeholder="Search specific goals..."
                        className="w-full rounded-2xl border border-slate-200 bg-white py-4 pl-12 pr-6 outline-none transition-all shadow-sm focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-400 font-medium"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex flex-wrap justify-center gap-3">
                    {categoryButtons.map((catName: any) => (
                        <button
                            key={catName}
                            onClick={() => setActiveCategory(catName)}
                            className={cn(
                                'flex items-center rounded-xl px-6 py-2.5 text-xs font-black uppercase tracking-widest transition-all duration-300',
                                activeCategory === catName
                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 -translate-y-0.5'
                                    : 'bg-white text-slate-500 border border-slate-200 hover:border-indigo-200 hover:text-indigo-500',
                            )}
                        >
                            {catName === 'All' ? (
                                <Gamepad2 className="mr-2" size={14} />
                            ) : (
                                <Tag className="mr-2" size={14} />
                            )}
                            {catName}
                        </button>
                    ))}
                </div>
            </div>

            {/* Grid Area */}
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
                                'group relative flex flex-col rounded-[40px] bg-white border border-slate-100 transition-all duration-500 isolate',
                                isAvailable
                                    ? 'cursor-pointer'
                                    : 'cursor-not-allowed grayscale-[0.5]',
                                isHovered && isAvailable
                                    ? 'translate-y-[-12px] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.12)] border-indigo-100'
                                    : 'shadow-sm',
                            )}
                        >
                            {/* Image Wrapper */}
                            <div className="relative h-56 w-full p-4">
                                <div className="h-full w-full rounded-[32px] overflow-hidden bg-slate-50">
                                    <img
                                        src={
                                            activity.banner?.url
                                                ? `http://localhost:1337${activity.banner.url}`
                                                : 'https://via.placeholder.com/400x225'
                                        }
                                        alt={activity.name}
                                        className={cn(
                                            'h-full w-full object-cover transition-transform duration-700 ease-out',
                                            isHovered &&
                                                isAvailable &&
                                                'scale-110',
                                        )}
                                    />
                                </div>
                                {!isAvailable && (
                                    <div className="absolute inset-4 rounded-[32px] flex flex-col items-center justify-center bg-slate-900/60 text-white backdrop-blur-[2px]">
                                        <Lock
                                            size={28}
                                            className="mb-3 opacity-80"
                                        />
                                        <span className="text-xs font-black tracking-widest uppercase">
                                            System Locked
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Content */}
                            <div className="flex flex-col p-8 pt-2">
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {activity.categories?.map(
                                        (cat: any, idx: number) => (
                                            <span
                                                key={idx}
                                                className="flex items-center px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-tighter"
                                            >
                                                {getCategoryIcon(cat.type)}
                                                {cat.name}
                                            </span>
                                        ),
                                    )}
                                </div>

                                <h3 className="text-2xl font-bold text-slate-900 mb-2 leading-tight">
                                    {activity.name}
                                </h3>
                                <p className="text-sm text-slate-500 line-clamp-2 mb-8 font-medium">
                                    {activity.description ||
                                        'No description available for this protocol.'}
                                </p>

                                <div className="mt-auto flex items-center justify-between">
                                    <div className="flex items-center text-slate-300">
                                        <ChevronRight size={16} />
                                    </div>

                                    <div
                                        className={cn(
                                            'flex items-center justify-center rounded-2xl transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] shadow-lg',
                                            isAvailable
                                                ? 'bg-indigo-600 shadow-indigo-100'
                                                : 'bg-slate-200 shadow-none',
                                            isHovered && isAvailable
                                                ? 'w-36 h-12'
                                                : 'w-12 h-12',
                                        )}
                                    >
                                        <div className="flex items-center gap-3 text-white">
                                            <Play
                                                size={16}
                                                className={cn(
                                                    isHovered &&
                                                        isAvailable &&
                                                        'fill-current',
                                                )}
                                            />
                                            {isHovered && isAvailable && (
                                                <span className="text-[11px] font-black uppercase tracking-wider animate-in fade-in slide-in-from-left-2">
                                                    Launch
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
                <div className="py-32 text-center">
                    <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Gamepad2 size={40} className="text-slate-200" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-400 uppercase tracking-widest">
                        No matching activities
                    </h2>
                    <p className="text-slate-400 text-sm mt-2">
                        Try adjusting your search or category filters.
                    </p>
                </div>
            )}
        </div>
    );
};

export default ActivityLibrary;
