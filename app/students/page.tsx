'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query'; // Import keepPreviousData
import {
    Plus,
    Search,
    GraduationCap,
    LayoutGrid,
    List,
    Users,
    FilterX,
    Loader2,
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
import { Toaster } from '@/components/ui/sonner';
import { Badge } from '@/components/ui/badge';

import { getStudents } from '@/api/students';
import StudentsTable from '@/components/StudentsTable';
import { StudentCard } from '@/components/StudentCard';
import EnrollStudentForm from '@/components/EnrollStudentForm';
import type { User } from '@/types/index';

// --- 1. Add a Debounce Hook helper ---
// This prevents the search from firing on every single keystroke
function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => clearTimeout(handler);
    }, [value, delay]);

    return debouncedValue;
}

export default function StudentsDirectory() {
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // Use the hook to wait 500ms after typing stops
    const debouncedSearch = useDebounce(searchTerm, 500);

    const {
        data: students = [],
        isLoading,
        isFetching,
    } = useQuery<User[]>({
        queryKey: [
            'students',
            {
                searchQuery: debouncedSearch,
            },
        ],
        queryFn: getStudents,

        placeholderData: keepPreviousData,
    });

    // --- 3. Fix Loading Logic ---
    // Only show full screen loader on the INITIAL load, not during search
    const isInitialLoading = isLoading && students.length === 0;

    if (isInitialLoading)
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50/50">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-10 w-10 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                    <p className="font-medium text-slate-400 uppercase tracking-[0.2em] text-[10px]">
                        Syncing Directory
                    </p>
                </div>
            </div>
        );

    return (
        <div className="p-6 lg:p-10 bg-slate-50/30 min-h-screen space-y-8 max-w-[1600px] mx-auto animate-in fade-in duration-700">
            <Toaster position="top-right" richColors closeButton />

            {/* --- HEADER --- */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="flex items-center gap-5">
                    <div className="h-12 w-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-100/50">
                        <GraduationCap size={24} strokeWidth={1.5} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-semibold text-slate-900 tracking-tight leading-none">
                            Learner Directory
                        </h1>
                        <div className="flex items-center gap-3 mt-2.5">
                            <span className="text-[10px] text-slate-500 font-medium uppercase tracking-widest">
                                {students?.length} Learners Found
                            </span>
                            <div className="h-1 w-1 rounded-full bg-slate-300" />
                            <span className="text-[10px] text-indigo-600 font-semibold uppercase tracking-widest">
                                Quezon City Hub
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative group flex-1 md:flex-none">
                        {/* Show Spinner if fetching, otherwise show Search Icon */}
                        {isFetching && debouncedSearch ? (
                            <Loader2 className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-600 animate-spin" />
                        ) : (
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors stroke-[1.5px]" />
                        )}

                        <Input
                            className="pl-11 w-full md:w-72 bg-white border-slate-200/60 rounded-xl h-11 shadow-sm focus-visible:ring-indigo-50 transition-all font-medium text-sm placeholder:text-slate-300 placeholder:font-normal"
                            placeholder="Search directory..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="h-11 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100 font-semibold text-sm transition-all active:scale-95 shrink-0">
                                <Plus className="mr-2 h-4 w-4 stroke-[2px]" />
                                Enroll Learner
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl p-0 border-none bg-transparent shadow-none">
                            <DialogHeader className="sr-only">
                                <DialogTitle>Enroll New Learner</DialogTitle>
                            </DialogHeader>
                            <EnrollStudentForm
                                onClose={() => setIsDialogOpen(false)}
                            />
                        </DialogContent>
                    </Dialog>
                </div>
            </header>

            {/* --- CONTROLS BAR --- */}
            <div className="flex items-center justify-between bg-white border border-slate-200/60 p-1.5 rounded-2xl shadow-sm">
                <div className="flex items-center gap-3 px-4">
                    <Users
                        size={16}
                        className="text-slate-400 stroke-[1.5px]"
                    />
                    <h2 className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500">
                        Roster Management
                    </h2>
                    {searchTerm && (
                        <Badge
                            variant="secondary"
                            className="bg-indigo-50 text-indigo-600 border-none text-[9px] font-semibold uppercase px-2 py-0.5 ml-2"
                        >
                            Filtered
                        </Badge>
                    )}
                </div>
                <Tabs
                    value={viewMode}
                    onValueChange={(v: any) => setViewMode(v)}
                >
                    <TabsList className="bg-slate-100/50 rounded-xl p-1">
                        <TabsTrigger
                            value="grid"
                            className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm px-5 py-2 transition-all"
                        >
                            <LayoutGrid
                                size={14}
                                className="mr-2 stroke-[1.5px]"
                            />
                            <span className="text-[11px] font-semibold uppercase tracking-tight">
                                Grid
                            </span>
                        </TabsTrigger>
                        <TabsTrigger
                            value="table"
                            className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm px-5 py-2 transition-all"
                        >
                            <List size={14} className="mr-2 stroke-[1.5px]" />
                            <span className="text-[11px] font-semibold uppercase tracking-tight">
                                List
                            </span>
                        </TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            {/* --- CONTENT AREA --- */}
            {/* Added opacity transition to show background loading state */}
            <div
                className={`min-h-[50vh] relative transition-opacity duration-300 ${isFetching && debouncedSearch ? 'opacity-50' : 'opacity-100'}`}
            >
                {students.length > 0 ? (
                    viewMode === 'grid' ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                            {students.map((student) => (
                                <StudentCard
                                    key={student.id}
                                    student={student}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white rounded-[32px] border border-slate-200/60 shadow-sm overflow-hidden p-2 animate-in fade-in duration-500">
                            <StudentsTable students={students} />
                        </div>
                    )
                ) : (
                    <div className="flex flex-col items-center justify-center py-40 text-center animate-in zoom-in-95 duration-500">
                        <div className="h-20 w-20 bg-slate-50 rounded-[40px] flex items-center justify-center mb-6 border border-slate-100 shadow-sm">
                            <FilterX
                                size={32}
                                className="text-slate-300 stroke-[1.5px]"
                            />
                        </div>
                        <h3 className="text-xl font-semibold text-slate-900 tracking-tight">
                            No learners matched
                        </h3>
                        <p className="text-sm font-medium text-slate-400 mt-2 max-w-[280px] leading-relaxed">
                            Try adjusting your search terms or verify the
                            Learner ID.
                        </p>
                        <Button
                            variant="outline"
                            onClick={() => setSearchTerm('')}
                            className="mt-8 h-10 px-6 rounded-xl border-slate-200 text-slate-600 font-semibold text-xs transition-all hover:bg-slate-50"
                        >
                            Clear Search Filters
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
