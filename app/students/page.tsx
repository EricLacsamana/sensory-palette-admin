'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import {
    Plus,
    Search,
    LayoutGrid,
    List,
    Users,
    FilterX,
    Loader2,
    Database,
    UserCheck,
    MoreHorizontal,
    ShieldAlert,
    ArrowUpDown,
    Filter,
    Download,
    GraduationCap,
    ActivitySquare,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuCheckboxItem,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu';
import { Toaster } from '@/components/ui/sonner';
import { Separator } from '@/components/ui/separator';

import { getStudents } from '@/api/students';
import StudentsTable from '@/components/StudentsTable';
import { StudentCard } from '@/components/StudentCard';
import EnrollStudenModalForm from '@/components/EnrollStudentModalForm';
import { cn } from '@/lib/utils';
import type { User } from '@/types/index';

// --- Debounce Hook ---
function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
}

// --- SUB-COMPONENT: Rich Metric Card ---
const MetricCard = ({
    icon: Icon,
    title,
    value,
    subtitle,
    trend,
    colorTheme,
}: any) => (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex items-start gap-4 flex-1 min-w-[200px]">
        <div
            className={cn(
                'p-3 rounded-xl shrink-0',
                colorTheme.bg,
                colorTheme.text,
            )}
        >
            <Icon size={20} />
        </div>
        <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                {title}
            </span>
            <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900 leading-none">
                    {value}
                </span>
                {trend && (
                    <span
                        className={cn(
                            'text-[10px] font-bold px-1.5 py-0.5 rounded-md',
                            trend.isPositive
                                ? 'bg-emerald-50 text-emerald-600'
                                : 'bg-rose-50 text-rose-600',
                        )}
                    >
                        {trend.value}
                    </span>
                )}
            </div>
            <span className="text-xs font-medium text-slate-500 mt-1.5">
                {subtitle}
            </span>
        </div>
    </div>
);

export default function StudentsDirectory() {
    // UI State
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // Filtering & Sorting State
    const [statusFilter, setStatusFilter] = useState<
        'all' | 'active' | 'blocked'
    >('all');
    const [sortBy, setSortBy] = useState<'name-asc' | 'name-desc' | 'newest'>(
        'name-asc',
    );

    const debouncedSearch = useDebounce(searchTerm, 500);

    const {
        data: rawStudents = [],
        isLoading,
        isFetching,
    } = useQuery({
        queryKey: ['students', { searchQuery: debouncedSearch }],
        queryFn: getStudents,
        placeholderData: keepPreviousData,
    });

    // ✨ ENHANCED: Client-Side Processing (Filtering & Sorting)
    const processedStudents = useMemo(() => {
        let result = [...rawStudents];

        // 1. Filter by Status
        if (statusFilter === 'active')
            result = result.filter((s) => !s.blocked);
        if (statusFilter === 'blocked')
            result = result.filter((s) => s.blocked);

        // 2. Sort Data
        result.sort((a, b) => {
            if (sortBy === 'name-asc')
                return (a.firstName || '').localeCompare(b.firstName || '');
            if (sortBy === 'name-desc')
                return (b.firstName || '').localeCompare(a.firstName || '');
            if (sortBy === 'newest') {
                return (
                    new Date(b.createdAt || 0).getTime() -
                    new Date(a.createdAt || 0).getTime()
                );
            }
            return 0;
        });

        return result;
    }, [rawStudents, statusFilter, sortBy]);

    // Metrics calculation
    const totalCount = rawStudents.length;
    const activeCount = rawStudents.filter((s) => !s.blocked).length;
    const blockedCount = totalCount - activeCount;

    const isInitialLoading = isLoading && rawStudents.length === 0;

    if (isInitialLoading)
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
                <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                        <div className="h-16 w-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
                        <Database
                            size={20}
                            className="absolute inset-0 m-auto text-indigo-600 animate-pulse"
                        />
                    </div>
                    <p className="font-bold text-slate-400 text-xs uppercase tracking-widest">
                        Initializing Registry...
                    </p>
                </div>
            </div>
        );

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            <div
                className="fixed inset-0 pointer-events-none opacity-[0.4]"
                style={{
                    backgroundImage:
                        'linear-gradient(#e2e8f0 1px, transparent 1px), linear-gradient(90deg, #e2e8f0 1px, transparent 1px)',
                    backgroundSize: '40px 40px',
                    maskImage:
                        'linear-gradient(to bottom, black 40%, transparent 100%)',
                }}
            />

            <div className="max-w-[1600px] mx-auto p-6 lg:p-8 relative z-10 flex flex-col gap-8">
                <Toaster position="top-right" richColors closeButton />

                {/* --- HEADER & METRICS --- */}
                <header className="flex flex-col gap-8">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-indigo-600 font-bold text-[10px] uppercase tracking-widest ml-0.5">
                                <Database
                                    size={14}
                                    className="fill-indigo-600/20"
                                />{' '}
                                Learner Database
                            </div>
                            <h1 className="text-3xl lg:text-4xl font-black tracking-tight text-slate-900 leading-none">
                                Student Roster
                            </h1>
                            <p className="text-sm font-medium text-slate-500 max-w-xl">
                                Manage your assigned learners, track clinical
                                status, and enroll new students into the digital
                                therapy ecosystem.
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            <Dialog
                                open={isDialogOpen}
                                onOpenChange={setIsDialogOpen}
                            >
                                <DialogTrigger asChild>
                                    <Button className="h-12 pl-5 pr-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 font-bold text-xs uppercase tracking-wider transition-all active:scale-95">
                                        <Plus className="mr-2 h-5 w-5" /> Enroll
                                        Student
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl p-0 border-none bg-transparent shadow-none">
                                    <DialogHeader className="sr-only">
                                        <DialogTitle>
                                            Enroll New Student
                                        </DialogTitle>
                                    </DialogHeader>
                                    <EnrollStudenModalForm
                                        onClose={() => setIsDialogOpen(false)}
                                    />
                                </DialogContent>
                            </Dialog>
                        </div>
                    </div>

                    {/* Rich Metrics Row */}
                    <div className="flex flex-wrap gap-4">
                        <MetricCard
                            icon={Users}
                            title="Total Enrolled"
                            value={totalCount}
                            subtitle="All assigned students"
                            colorTheme={{
                                bg: 'bg-blue-50',
                                text: 'text-blue-600',
                            }}
                        />
                        <MetricCard
                            icon={UserCheck}
                            title="Active Status"
                            value={activeCount}
                            subtitle="Currently engaging in therapy"
                            trend={{ value: 'Ready', isPositive: true }}
                            colorTheme={{
                                bg: 'bg-emerald-50',
                                text: 'text-emerald-600',
                            }}
                        />
                        <MetricCard
                            icon={ShieldAlert}
                            title="Needs Review"
                            value={blockedCount}
                            subtitle="Blocked or suspended accounts"
                            trend={
                                blockedCount > 0
                                    ? { value: 'Attention', isPositive: false }
                                    : null
                            }
                            colorTheme={{
                                bg: 'bg-amber-50',
                                text: 'text-amber-600',
                            }}
                        />
                    </div>
                </header>

                {/* --- ADVANCED TOOLBAR --- */}
                <div className="flex flex-col lg:flex-row gap-4 items-center justify-between sticky top-4 bg-white/80 backdrop-blur-xl z-30 py-3 px-4 rounded-2xl border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                    {/* Search Field */}
                    <div className="relative w-full lg:w-[400px] group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            {isFetching && debouncedSearch ? (
                                <Loader2 className="h-4 w-4 text-indigo-600 animate-spin" />
                            ) : (
                                <Search className="h-4 w-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                            )}
                        </div>
                        <Input
                            className="pl-12 bg-slate-50 border-slate-200 focus:bg-white focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50 transition-all rounded-xl h-12 text-sm font-semibold placeholder:text-slate-400 placeholder:font-medium shadow-inner"
                            placeholder="Search by name, ID, or clinical profile..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* Filters & Toggles */}
                    <div className="flex items-center gap-2 w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0">
                        {/* Sort Dropdown */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="h-12 rounded-xl border-slate-200 bg-white text-slate-600 hover:text-indigo-600 font-bold text-[11px] uppercase tracking-widest shadow-sm"
                                >
                                    <ArrowUpDown size={14} className="mr-2" />{' '}
                                    Sort
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                align="end"
                                className="w-48 rounded-xl shadow-xl border-slate-100"
                            >
                                <DropdownMenuLabel className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    Sort Alphabetically
                                </DropdownMenuLabel>
                                <DropdownMenuRadioGroup
                                    value={sortBy}
                                    onValueChange={(v: any) => setSortBy(v)}
                                >
                                    <DropdownMenuRadioItem
                                        value="name-asc"
                                        className="text-xs font-bold cursor-pointer"
                                    >
                                        Name (A to Z)
                                    </DropdownMenuRadioItem>
                                    <DropdownMenuRadioItem
                                        value="name-desc"
                                        className="text-xs font-bold cursor-pointer"
                                    >
                                        Name (Z to A)
                                    </DropdownMenuRadioItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuLabel className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                        Sort Chronologically
                                    </DropdownMenuLabel>
                                    <DropdownMenuRadioItem
                                        value="newest"
                                        className="text-xs font-bold cursor-pointer"
                                    >
                                        Newest Enrolled
                                    </DropdownMenuRadioItem>
                                </DropdownMenuRadioGroup>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* Filter Dropdown */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="outline"
                                    className={cn(
                                        'h-12 rounded-xl font-bold text-[11px] uppercase tracking-widest shadow-sm transition-colors',
                                        statusFilter !== 'all'
                                            ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
                                            : 'border-slate-200 bg-white text-slate-600 hover:text-indigo-600',
                                    )}
                                >
                                    <Filter size={14} className="mr-2" />{' '}
                                    Status: {statusFilter}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                align="end"
                                className="w-48 rounded-xl shadow-xl border-slate-100"
                            >
                                <DropdownMenuLabel className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    Filter by Status
                                </DropdownMenuLabel>
                                <DropdownMenuRadioGroup
                                    value={statusFilter}
                                    onValueChange={(v: any) =>
                                        setStatusFilter(v)
                                    }
                                >
                                    <DropdownMenuRadioItem
                                        value="all"
                                        className="text-xs font-bold cursor-pointer"
                                    >
                                        All Students
                                    </DropdownMenuRadioItem>
                                    <DropdownMenuRadioItem
                                        value="active"
                                        className="text-xs font-bold cursor-pointer text-emerald-600 focus:text-emerald-700"
                                    >
                                        Active Only
                                    </DropdownMenuRadioItem>
                                    <DropdownMenuRadioItem
                                        value="blocked"
                                        className="text-xs font-bold cursor-pointer text-amber-600 focus:text-amber-700"
                                    >
                                        Needs Review / Blocked
                                    </DropdownMenuRadioItem>
                                </DropdownMenuRadioGroup>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <Separator
                            orientation="vertical"
                            className="h-8 mx-2 bg-slate-200"
                        />

                        {/* View Mode Tabs */}
                        <Tabs
                            value={viewMode}
                            onValueChange={(v: any) => setViewMode(v)}
                        >
                            <TabsList className="h-12 bg-slate-100/80 p-1.5 rounded-xl border border-slate-200/50">
                                <TabsTrigger
                                    value="grid"
                                    className="h-9 rounded-lg px-4 data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm transition-all"
                                >
                                    <LayoutGrid size={16} />
                                </TabsTrigger>
                                <TabsTrigger
                                    value="table"
                                    className="h-9 rounded-lg px-4 data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm transition-all"
                                >
                                    <List size={16} />
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>
                </div>

                {/* --- CONTENT AREA --- */}
                <main
                    className={cn(
                        'min-h-[50vh] transition-opacity duration-300',
                        isFetching && debouncedSearch
                            ? 'opacity-50'
                            : 'opacity-100',
                    )}
                >
                    {/* Applied Filters indicator */}
                    {(searchTerm || statusFilter !== 'all') &&
                        processedStudents.length > 0 && (
                            <div className="mb-6 flex items-center gap-2 text-sm font-bold text-slate-500">
                                Showing {processedStudents.length} result
                                {processedStudents.length !== 1 && 's'}
                                <Button
                                    variant="link"
                                    onClick={() => {
                                        setSearchTerm('');
                                        setStatusFilter('all');
                                    }}
                                    className="h-auto p-0 text-indigo-600 ml-2 text-xs uppercase tracking-widest"
                                >
                                    Clear Filters
                                </Button>
                            </div>
                        )}

                    {processedStudents.length > 0 ? (
                        viewMode === 'grid' ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                {processedStudents.map((student) => (
                                    <StudentCard
                                        key={student.id}
                                        student={student}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-500">
                                <StudentsTable students={processedStudents} />
                            </div>
                        )
                    ) : (
                        /* --- ENHANCED EMPTY STATE --- */
                        <div className="flex flex-col items-center justify-center py-32 text-center animate-in zoom-in-95 duration-500 border-2 border-dashed border-slate-200 rounded-[3rem] bg-white shadow-sm">
                            <div className="relative mb-6">
                                <div className="absolute inset-0 bg-indigo-50 rounded-full blur-xl opacity-70" />
                                <div className="h-24 w-24 bg-white rounded-full flex items-center justify-center border border-slate-100 shadow-xl relative z-10">
                                    {statusFilter === 'blocked' ? (
                                        <ShieldAlert
                                            size={36}
                                            className="text-amber-400"
                                        />
                                    ) : (
                                        <Search
                                            size={36}
                                            className="text-indigo-300"
                                        />
                                    )}
                                </div>
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                                No learners found
                            </h3>
                            <p className="text-sm font-medium text-slate-500 mt-3 max-w-[360px] leading-relaxed">
                                {searchTerm
                                    ? `We couldn't find any students matching "${searchTerm}". Try adjusting your filters or checking your spelling.`
                                    : 'Your roster is currently empty based on your selected filters.'}
                            </p>
                            <div className="mt-8 flex gap-3">
                                {(searchTerm || statusFilter !== 'all') && (
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setSearchTerm('');
                                            setStatusFilter('all');
                                        }}
                                        className="h-12 px-8 rounded-xl border-slate-200 text-slate-600 font-bold text-[11px] uppercase tracking-widest hover:bg-slate-50"
                                    >
                                        Reset Filters
                                    </Button>
                                )}
                                {!searchTerm && statusFilter === 'all' && (
                                    <Button
                                        onClick={() => setIsDialogOpen(true)}
                                        className="h-12 px-8 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] uppercase tracking-widest shadow-md"
                                    >
                                        Enroll First Student
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}
                </main>

                <footer className="h-16 w-full shrink-0" aria-hidden="true" />
            </div>
        </div>
    );
}
