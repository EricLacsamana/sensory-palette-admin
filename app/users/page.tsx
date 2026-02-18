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
    Shield,
    HeartPulse,
    GraduationCap,
    MoreHorizontal,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Toaster } from '@/components/ui/sonner';
import { Separator } from '@/components/ui/separator';

// Custom Components
import { UserCard } from '@/components/UserCard';
import UsersTable from '@/components/UsersTable';
import UserFormModal from '@/components/UserFormModal';
import { cn } from '@/lib/utils';
import { getUsers } from '@/api/users';

// --- Debounce Hook ---
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

// --- SUB-COMPONENT: Stat Badge ---
const StatBadge = ({ icon: Icon, label, value, colorClass }: any) => (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-100 bg-white shadow-sm">
        <div className={cn('p-1 rounded-md', colorClass)}>
            <Icon size={12} />
        </div>
        <div className="flex flex-col">
            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-0.5">
                {label}
            </span>
            <span className="text-xs font-bold text-slate-900 leading-none tabular-nums">
                {value}
            </span>
        </div>
    </div>
);

export default function UsersDirectory() {
    // --- STATE ---
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [userToEdit, setUserToEdit] = useState<any | null>(null);

    const debouncedSearch = useDebounce(searchTerm, 300);

    // --- DATA FETCHING ---
    const {
        data: users = [],
        isLoading,
        isFetching,
    } = useQuery({
        queryKey: ['users', { populate: '*' }], // Static key so we fetch everything once
        queryFn: getUsers,
        placeholderData: keepPreviousData,
    });

    // --- LOGIC: FILTERING (The Fix) ---
    // We filter the users locally. This is fast and keeps the KPI Stats accurate.
    const filteredUsers = useMemo(() => {
        return users.filter((user: any) => {
            const matchesSearch =
                !debouncedSearch ||
                [user.firstName, user.lastName, user.username, user.email]
                    .filter(Boolean)
                    .some((field) =>
                        field
                            .toLowerCase()
                            .includes(debouncedSearch.toLowerCase()),
                    );

            const roleName =
                user.role?.name?.toLowerCase() ||
                user.role?.toLowerCase() ||
                '';
            const matchesRole =
                roleFilter === 'all' ||
                roleName.includes(roleFilter.toLowerCase());

            return matchesSearch && matchesRole;
        });
    }, [users, debouncedSearch, roleFilter]);

    // --- HANDLERS ---
    const handleOpenAddModal = () => {
        setUserToEdit(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (user: any) => {
        setUserToEdit(user);
        setIsModalOpen(true);
    };

    const isInitialLoading = isLoading && users.length === 0;

    if (isInitialLoading)
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-12 w-12 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                    <p className="font-mono text-slate-400 text-xs uppercase tracking-widest">
                        Loading System Registry...
                    </p>
                </div>
            </div>
        );

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            {/* Background Grid Pattern */}
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

            <div className="max-w-[1600px] mx-auto p-6 lg:p-8 relative z-10 flex flex-col gap-10 font-sans">
                <Toaster position="top-right" richColors closeButton />

                {/* --- SECTION 1: HEADER --- */}
                <header className="flex flex-col gap-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/60 pb-8">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 text-indigo-600 font-bold text-[10px] uppercase tracking-widest ml-0.5">
                                <Database size={12} /> System Registry
                            </div>
                            <h1 className="text-3xl font-bold tracking-tight text-slate-900 leading-none">
                                User Directory
                            </h1>
                        </div>

                        <div className="flex items-center gap-3">
                            {/* KPI Stats (Uses the 'users' array so counts stay accurate) */}
                            <div className="hidden md:flex gap-3 mr-4">
                                <StatBadge
                                    icon={Users}
                                    label="Total"
                                    value={users.length}
                                    colorClass="bg-indigo-50 text-indigo-600"
                                />
                                <StatBadge
                                    icon={Shield}
                                    label="Admins"
                                    value={
                                        users.filter(
                                            (u: any) =>
                                                u.role?.name
                                                    ?.toLowerCase()
                                                    .includes('admin') ||
                                                u.role === 'admin',
                                        ).length
                                    }
                                    colorClass="bg-rose-50 text-rose-600"
                                />
                                <StatBadge
                                    icon={HeartPulse}
                                    label="Staff"
                                    value={
                                        users.filter(
                                            (u: any) =>
                                                u.role?.name
                                                    ?.toLowerCase()
                                                    .includes('therapist') ||
                                                u.role === 'therapist',
                                        ).length
                                    }
                                    colorClass="bg-emerald-50 text-emerald-600"
                                />
                                <StatBadge
                                    icon={GraduationCap}
                                    label="Students"
                                    value={
                                        users.filter(
                                            (u: any) =>
                                                u.role?.name
                                                    ?.toLowerCase()
                                                    .includes('student') ||
                                                u.role === 'student',
                                        ).length
                                    }
                                    colorClass="bg-blue-50 text-blue-600"
                                />
                            </div>

                            <Separator
                                orientation="vertical"
                                className="h-8 hidden md:block bg-slate-200"
                            />

                            <Button
                                onClick={handleOpenAddModal}
                                className="h-11 pl-4 pr-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100 font-bold text-xs uppercase tracking-wide transition-all active:scale-95"
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Add User
                            </Button>
                        </div>
                    </div>

                    {/* --- SECTION 2: TOOLBAR --- */}
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between sticky top-4 bg-white/70 backdrop-blur-xl z-30 py-3 px-4 rounded-2xl border border-slate-200/50 shadow-sm">
                        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto items-center">
                            <div className="relative w-full sm:w-[320px] group">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                    {/* Show loader only if the query itself is refetching */}
                                    {isFetching && !isLoading ? (
                                        <Loader2 className="h-4 w-4 text-indigo-600 animate-spin" />
                                    ) : (
                                        <Search className="h-4 w-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                                    )}
                                </div>
                                <Input
                                    className="pl-11 bg-slate-100/50 border-transparent focus:bg-white focus:border-indigo-200 focus:ring-4 focus:ring-indigo-50/50 transition-all rounded-xl h-11 text-sm font-medium placeholder:text-slate-400"
                                    placeholder="Search users by name or email..."
                                    value={searchTerm}
                                    onChange={(e) =>
                                        setSearchTerm(e.target.value)
                                    }
                                />
                            </div>

                            <Select
                                value={roleFilter}
                                onValueChange={setRoleFilter}
                            >
                                <SelectTrigger className="w-full sm:w-[160px] h-11 bg-slate-100/50 border-transparent focus:bg-white transition-all rounded-xl text-xs font-bold uppercase tracking-wider text-slate-700">
                                    <SelectValue placeholder="All Roles" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        All Roles
                                    </SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                    <SelectItem value="therapist">
                                        Therapist
                                    </SelectItem>
                                    <SelectItem value="secretary">
                                        Secretary
                                    </SelectItem>
                                    <SelectItem value="student">
                                        Student
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-center gap-2 self-end md:self-auto">
                            {(searchTerm || roleFilter !== 'all') && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        setSearchTerm('');
                                        setRoleFilter('all');
                                    }}
                                    className="text-[10px] font-bold uppercase tracking-widest text-rose-500 hover:text-rose-600 hover:bg-rose-50 h-9 px-3"
                                >
                                    <FilterX size={14} className="mr-1.5" />{' '}
                                    Clear Filters
                                </Button>
                            )}

                            <Tabs
                                value={viewMode}
                                onValueChange={(v: any) => setViewMode(v)}
                            >
                                <TabsList className="h-11 bg-slate-100/80 p-1 rounded-xl border border-slate-200/50">
                                    <TabsTrigger
                                        value="grid"
                                        className="h-9 rounded-lg px-4 data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm"
                                    >
                                        <LayoutGrid size={16} />
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="table"
                                        className="h-9 rounded-lg px-4 data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm"
                                    >
                                        <List size={16} />
                                    </TabsTrigger>
                                </TabsList>
                            </Tabs>
                        </div>
                    </div>
                </header>

                {/* --- SECTION 3: CONTENT AREA --- */}
                <main className="min-h-[50vh]">
                    {/* Notice we use filteredUsers here! */}
                    {filteredUsers.length > 0 ? (
                        viewMode === 'grid' ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                {filteredUsers.map((user: any) => (
                                    <UserCard
                                        key={user.id}
                                        user={user}
                                        onEdit={handleOpenEditModal}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-500">
                                <UsersTable
                                    users={filteredUsers}
                                    onEdit={handleOpenEditModal}
                                />
                            </div>
                        )
                    ) : (
                        /* --- EMPTY STATE --- */
                        <div className="flex flex-col items-center justify-center py-40 text-center animate-in zoom-in-95 duration-500 border-2 border-dashed border-slate-200 rounded-[40px] bg-slate-50/30">
                            <div className="h-20 w-20 bg-white rounded-3xl flex items-center justify-center mb-6 border border-slate-100 shadow-sm">
                                <Search size={32} className="text-slate-300" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900">
                                No records found
                            </h3>
                            <p className="text-sm font-medium text-slate-400 mt-2 max-w-[320px]">
                                {roleFilter !== 'all'
                                    ? `We couldn't find any ${roleFilter}s matching your criteria.`
                                    : `No users matched your search for "${searchTerm}".`}
                            </p>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setSearchTerm('');
                                    setRoleFilter('all');
                                }}
                                className="mt-8 h-11 px-8 rounded-xl border-slate-200 text-slate-600 font-bold text-[10px] uppercase tracking-widest transition-all hover:bg-white hover:text-indigo-600 hover:border-indigo-200 shadow-sm"
                            >
                                Reset All Filters
                            </Button>
                        </div>
                    )}
                </main>

                <div className="h-16 w-full shrink-0" aria-hidden="true" />
            </div>

            <UserFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                userToEdit={userToEdit}
            />
        </div>
    );
}
