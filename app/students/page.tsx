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
    TrendingUp,
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

// --- UNIFIED DASHBOARD STAT CARD ---
const DashboardStatCard = ({
    title,
    value,
    trend,
    icon: Icon,
    colorClass,
    isLoading,
}: any) => (
    <div className="bg-white rounded-[24px] border border-slate-200 p-6 flex flex-col justify-between hover:shadow-lg transition-all duration-300 relative overflow-hidden group h-full">
        <div
            className={cn(
                'absolute -right-4 -top-4 opacity-[0.03] transition-transform group-hover:scale-110 group-hover:opacity-[0.07]',
                colorClass,
            )}
        >
            <Icon size={90} />
        </div>
        <div className="flex items-center gap-3 mb-4 relative z-10">
            <div
                className={cn(
                    'p-2.5 rounded-xl shrink-0',
                    colorClass
                        .replace('text-', 'bg-')
                        .replace('600', '50')
                        .replace('500', '50'),
                )}
            >
                <Icon size={18} className={colorClass} />
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest select-none">
                {title}
            </span>
        </div>
        <div className="relative z-10">
            {isLoading ? (
                <div className="h-9 w-24 bg-slate-100 animate-pulse rounded-xl mb-1" />
            ) : (
                <div className="text-3xl font-black text-slate-900 tracking-tight tabular-nums">
                    {value}
                </div>
            )}
            {trend && (
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1.5 flex items-center gap-1.5">
                    <TrendingUp size={12} className={colorClass} /> {trend}
                </div>
            )}
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

    const processedStudents = useMemo(() => {
        let result = [...studentsList];

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

        if (statusFilter === 'active')
            result = result.filter((s) => !s.blocked);
        if (statusFilter === 'blocked')
            result = result.filter((s) => s.blocked);

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
            <Toaster position="top-right" richColors closeButton />

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

            <div className="max-w-[1600px] mx-auto p-6 lg:p-8 relative z-10 flex flex-col gap-8 pb-24">
                {/* --- UNIFIED DASHBOARD HEADER --- */}
                <header className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 bg-white p-6 md:p-8 rounded-[32px] border border-slate-200 shadow-sm shrink-0">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-indigo-600 font-bold text-[10px] uppercase tracking-widest ml-0.5 mb-2">
                            <Database size={14} className="text-indigo-600" />{' '}
                            Learner Database
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-none">
                            Student Roster
                        </h1>
                        <p className="text-sm font-medium text-slate-500 mt-2 max-w-xl">
                            Manage your assigned learners, track clinical
                            status, and enroll new students.
                        </p>
                    </div>

                    <div className="w-full md:w-auto flex flex-col sm:flex-row items-center gap-3">
                        <Dialog
                            open={isDialogOpen}
                            onOpenChange={setIsDialogOpen}
                        >
                            <DialogTrigger asChild>
                                <Button className="h-12 w-full md:w-auto px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 font-bold text-xs uppercase tracking-wider transition-all active:scale-95">
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
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
                    <DashboardStatCard
                        title="Total Enrolled"
                        value={totalCount}
                        trend="All assigned students"
                        icon={Users}
                        colorClass="text-blue-600"
                        isLoading={isLoading}
                    />
                    <DashboardStatCard
                        title="Active Status"
                        value={activeCount}
                        trend="Currently engaging in therapy"
                        icon={UserCheck}
                        colorClass="text-emerald-600"
                        isLoading={isLoading}
                    />
                    <DashboardStatCard
                        title="Needs Review"
                        value={blockedCount}
                        trend={
                            blockedCount > 0
                                ? 'Blocked or suspended accounts'
                                : 'All clear'
                        }
                        icon={ShieldAlert}
                        colorClass="text-amber-500"
                        isLoading={isLoading}
                    />
                </div>

                {/* --- SEARCH WIDGET BOX --- */}
                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between sticky top-4 bg-white/80 backdrop-blur-xl z-30 py-3 px-4 rounded-2xl border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] shrink-0">
                    <div className="relative w-full sm:w-[320px] group">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                            {searchTerm !== debouncedSearch ? (
                                <Loader2 className="h-4 w-4 text-indigo-600 animate-spin" />
                            ) : (
                                <Search className="h-4 w-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                            )}
                        </div>
                        <Input
                            className="pl-11 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50/50 transition-all rounded-xl h-11 text-sm font-medium placeholder:text-slate-400 shadow-inner"
                            placeholder="Search by name, ID, or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="h-11 rounded-xl border-slate-200 bg-white text-slate-600 hover:text-indigo-600 font-bold text-[11px] uppercase tracking-widest shadow-sm"
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
                                        'h-11 rounded-xl font-bold text-[11px] uppercase tracking-widest shadow-sm',
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

                <main className="min-h-[50vh] flex flex-col w-full">
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
                                    className="h-auto p-0 text-indigo-600 ml-2 text-[10px] uppercase tracking-widest"
                                >
                                    Clear Filters
                                </Button>
                            </div>
                        )}

                    {processedStudents.length > 0 ? (
                        viewMode === 'grid' ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-stretch content-start w-full">
                                {processedStudents.map((student) => (
                                    <StudentCard
                                        key={student.id}
                                        student={student}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden w-full">
                                <StudentsTable students={processedStudents} />
                            </div>
                        )
                    ) : (
                        <div className="flex flex-col items-center justify-center min-h-[30vh] text-center w-full border-2 border-dashed border-slate-200 rounded-[32px] bg-white">
                            <div className="h-16 w-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4">
                                <Search size={24} className="text-slate-300" />
                            </div>
                            <h3 className="text-lg font-black text-slate-900">
                                No learners found
                            </h3>
                            <p className="text-sm font-medium text-slate-500 mt-2 max-w-[320px]">
                                Try adjusting your search or filters.
                            </p>
                        </div>
                    )}
                </main>
                <div className="h-16 w-full shrink-0" aria-hidden="true" />
            </div>
        </div>
    );
}
