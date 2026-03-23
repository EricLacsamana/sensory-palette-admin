'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    Plus,
    Search,
    LayoutGrid,
    List,
    Users,
    Loader2,
    Database,
    UserCheck,
    ShieldAlert,
    ArrowUpDown,
    Filter,
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
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
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

// --- Debounce Hook ---
function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
}

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
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [statusFilter, setStatusFilter] = useState<
        'all' | 'active' | 'blocked'
    >('all');
    const [sortBy, setSortBy] = useState<'name-asc' | 'name-desc' | 'newest'>(
        'name-asc',
    );

    const debouncedSearch = useDebounce(searchTerm, 300);

    const {
        data: studentsList = [],
        isFetching,
        isLoading,
    } = useQuery({
        queryKey: ['students', {}],
        queryFn: getStudents,
    });

    // 2. ✨ ENHANCED: Client-Side Search and Processing
    const processedStudents = useMemo(() => {
        let result = [...studentsList];

        // A. Search in Memory (Name, ID, or Email)
        if (debouncedSearch) {
            const query = debouncedSearch.toLowerCase();
            result = result.filter(
                (s) =>
                    s.firstName?.toLowerCase().includes(query) ||
                    s.lastName?.toLowerCase().includes(query) ||
                    s.email?.toLowerCase().includes(query) ||
                    s.id?.toString().includes(query),
            );
        }

        // B. Filter by Status
        if (statusFilter === 'active')
            result = result.filter((s) => !s.blocked);
        if (statusFilter === 'blocked')
            result = result.filter((s) => s.blocked);

        // C. Sort
        result.sort((a, b) => {
            if (sortBy === 'name-asc')
                return (a.firstName || '').localeCompare(b.firstName || '');
            if (sortBy === 'name-desc')
                return (b.firstName || '').localeCompare(a.firstName || '');
            if (sortBy === 'newest')
                return (
                    new Date(b.createdAt || 0).getTime() -
                    new Date(a.createdAt || 0).getTime()
                );
            return 0;
        });

        return result;
    }, [studentsList, statusFilter, sortBy, debouncedSearch]);

    // 3. Metrics are now stable because they reference studentsList (the full set)
    const totalCount = studentsList.length;
    const activeCount = studentsList.filter((s) => !s.blocked).length;
    const blockedCount = totalCount - activeCount;

    if (isLoading && studentsList.length === 0)
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
                                status, and enroll new students.
                            </p>
                        </div>

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

                <div className="flex flex-col lg:flex-row gap-4 items-center justify-between sticky top-4 bg-white/80 backdrop-blur-xl z-30 py-3 px-4 rounded-2xl border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                    <div className="relative w-full lg:w-[400px] group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            {/* We use searchTerm here to show UI feedback while typing */}
                            {searchTerm !== debouncedSearch ? (
                                <Loader2 className="h-4 w-4 text-indigo-600 animate-spin" />
                            ) : (
                                <Search className="h-4 w-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                            )}
                        </div>
                        <Input
                            className="pl-12 bg-slate-50 border-slate-200 focus:bg-white focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50 transition-all rounded-xl h-12 text-sm font-semibold shadow-inner"
                            placeholder="Search by name, ID, or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center gap-2 w-full lg:w-auto overflow-x-auto">
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
                                className="w-48 rounded-xl shadow-xl"
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
                                        className="text-xs font-bold"
                                    >
                                        Name (A to Z)
                                    </DropdownMenuRadioItem>
                                    <DropdownMenuRadioItem
                                        value="name-desc"
                                        className="text-xs font-bold"
                                    >
                                        Name (Z to A)
                                    </DropdownMenuRadioItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuLabel className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                        Sort Chronologically
                                    </DropdownMenuLabel>
                                    <DropdownMenuRadioItem
                                        value="newest"
                                        className="text-xs font-bold"
                                    >
                                        Newest Enrolled
                                    </DropdownMenuRadioItem>
                                </DropdownMenuRadioGroup>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="outline"
                                    className={cn(
                                        'h-12 rounded-xl font-bold text-[11px] uppercase tracking-widest shadow-sm',
                                        statusFilter !== 'all'
                                            ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
                                            : 'border-slate-200 bg-white text-slate-600',
                                    )}
                                >
                                    <Filter size={14} className="mr-2" />{' '}
                                    Status: {statusFilter}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                align="end"
                                className="w-48 rounded-xl shadow-xl"
                            >
                                <DropdownMenuRadioGroup
                                    value={statusFilter}
                                    onValueChange={(v: any) =>
                                        setStatusFilter(v)
                                    }
                                >
                                    <DropdownMenuRadioItem
                                        value="all"
                                        className="text-xs font-bold"
                                    >
                                        All Students
                                    </DropdownMenuRadioItem>
                                    <DropdownMenuRadioItem
                                        value="active"
                                        className="text-xs font-bold text-emerald-600"
                                    >
                                        Active Only
                                    </DropdownMenuRadioItem>
                                    <DropdownMenuRadioItem
                                        value="blocked"
                                        className="text-xs font-bold text-amber-600"
                                    >
                                        Needs Review
                                    </DropdownMenuRadioItem>
                                </DropdownMenuRadioGroup>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <Separator
                            orientation="vertical"
                            className="h-8 mx-2 bg-slate-200"
                        />

                        <Tabs
                            value={viewMode}
                            onValueChange={(v: any) => setViewMode(v)}
                        >
                            <TabsList className="h-12 bg-slate-100/80 p-1.5 rounded-xl border border-slate-200/50">
                                <TabsTrigger
                                    value="grid"
                                    className="h-9 rounded-lg px-4 data-[state=active]:bg-white data-[state=active]:text-indigo-600"
                                >
                                    <LayoutGrid size={16} />
                                </TabsTrigger>
                                <TabsTrigger
                                    value="table"
                                    className="h-9 rounded-lg px-4 data-[state=active]:bg-white data-[state=active]:text-indigo-600"
                                >
                                    <List size={16} />
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>
                </div>

                <main className="min-h-[50vh]">
                    {(searchTerm || statusFilter !== 'all') &&
                        processedStudents.length > 0 && (
                            <div className="mb-6 flex items-center gap-2 text-sm font-bold text-slate-500">
                                Showing {processedStudents.length} matches
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
                        <div className="flex flex-col items-center justify-center py-32 text-center border-2 border-dashed border-slate-200 rounded-[3rem] bg-white shadow-sm">
                            <div className="h-24 w-24 bg-white rounded-full flex items-center justify-center border border-slate-100 shadow-xl mb-6">
                                <Search size={36} className="text-indigo-300" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                                No learners found
                            </h3>
                            <p className="text-sm font-medium text-slate-500 mt-3 max-w-[360px]">
                                Try adjusting your search or filters.
                            </p>
                        </div>
                    )}
                </main>
                <footer className="h-16 w-full shrink-0" aria-hidden="true" />
            </div>
        </div>
    );
}
