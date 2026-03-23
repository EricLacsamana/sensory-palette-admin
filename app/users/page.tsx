'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import {
    Plus,
    Search,
    LayoutGrid,
    List,
    FilterX,
    Loader2,
    Database,
    ArrowUpDown,
    Filter,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
        queryKey: ['users', { populate: '*' }],
        queryFn: getUsers,
        placeholderData: keepPreviousData,
    });

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
            <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-12 w-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
                    <p className="font-bold text-slate-400 text-xs uppercase tracking-widest">
                        Loading System Registry...
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
                            System Registry
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 leading-none">
                            User Directory
                        </h1>
                        <p className="text-sm font-medium text-slate-500 mt-2 max-w-xl">
                            Manage platform access, assign roles, and configure
                            system administrators.
                        </p>
                    </div>

                    <div className="w-full md:w-auto flex items-center gap-3">
                        <Button
                            onClick={handleOpenAddModal}
                            className="h-12 w-full md:w-auto px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 font-bold text-xs uppercase tracking-wider transition-all active:scale-95"
                        >
                            <Plus className="mr-2 h-5 w-5" />
                            Add User
                        </Button>
                    </div>
                </header>

                {/* --- SEARCH WIDGET BOX --- */}
                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between sticky top-4 bg-white/80 backdrop-blur-xl z-30 py-3 px-4 rounded-2xl border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] shrink-0">
                    <div className="relative w-full sm:w-[320px] group">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                            {isFetching && !isLoading ? (
                                <Loader2 className="h-4 w-4 text-indigo-600 animate-spin" />
                            ) : (
                                <Search className="h-4 w-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                            )}
                        </div>
                        <Input
                            className="pl-11 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50/50 transition-all rounded-xl h-11 text-sm font-medium placeholder:text-slate-400 shadow-inner"
                            placeholder="Search users by name or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
                        {(searchTerm || roleFilter !== 'all') && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setSearchTerm('');
                                    setRoleFilter('all');
                                }}
                                className="text-[10px] font-bold uppercase tracking-widest text-rose-500 hover:text-rose-600 hover:bg-rose-50 h-11 px-4 rounded-xl"
                            >
                                <FilterX size={14} className="mr-1.5" /> Clear
                            </Button>
                        )}

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="outline"
                                    className={cn(
                                        'h-11 rounded-xl font-bold text-[11px] uppercase tracking-widest shadow-sm',
                                        roleFilter !== 'all'
                                            ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
                                            : 'border-slate-200 bg-white text-slate-600',
                                    )}
                                >
                                    <Filter size={14} className="mr-2" /> Role:{' '}
                                    {roleFilter}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                align="end"
                                className="w-48 rounded-xl shadow-xl"
                            >
                                <DropdownMenuRadioGroup
                                    value={roleFilter}
                                    onValueChange={setRoleFilter}
                                >
                                    <DropdownMenuRadioItem
                                        value="all"
                                        className="text-xs font-bold"
                                    >
                                        All Roles
                                    </DropdownMenuRadioItem>
                                    <DropdownMenuRadioItem
                                        value="admin"
                                        className="text-xs font-bold"
                                    >
                                        Admin
                                    </DropdownMenuRadioItem>
                                    <DropdownMenuRadioItem
                                        value="therapist"
                                        className="text-xs font-bold"
                                    >
                                        Therapist
                                    </DropdownMenuRadioItem>
                                    <DropdownMenuRadioItem
                                        value="secretary"
                                        className="text-xs font-bold"
                                    >
                                        Secretary
                                    </DropdownMenuRadioItem>
                                    <DropdownMenuRadioItem
                                        value="student"
                                        className="text-xs font-bold"
                                    >
                                        Student
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
                    {(searchTerm || roleFilter !== 'all') &&
                        filteredUsers.length > 0 && (
                            <div className="mb-6 flex items-center gap-2 text-sm font-bold text-slate-500">
                                Showing {filteredUsers.length} matches
                            </div>
                        )}

                    {filteredUsers.length > 0 ? (
                        viewMode === 'grid' ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-stretch content-start w-full">
                                {filteredUsers.map((user: any) => (
                                    <UserCard
                                        key={user.id}
                                        user={user}
                                        onEdit={handleOpenEditModal}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden w-full">
                                <UsersTable
                                    users={filteredUsers}
                                    onEdit={handleOpenEditModal}
                                />
                            </div>
                        )
                    ) : (
                        <div className="flex flex-col items-center justify-center min-h-[30vh] text-center w-full border-2 border-dashed border-slate-200 rounded-[32px] bg-white">
                            <div className="h-16 w-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4">
                                <Search size={24} className="text-slate-300" />
                            </div>
                            <h3 className="text-lg font-black text-slate-900">
                                No records found
                            </h3>
                            <p className="text-sm font-medium text-slate-500 mt-2 max-w-[320px]">
                                {roleFilter !== 'all'
                                    ? `We couldn't find any ${roleFilter}s matching your criteria.`
                                    : `No users matched your search.`}
                            </p>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setSearchTerm('');
                                    setRoleFilter('all');
                                }}
                                className="mt-6 h-11 px-8 rounded-xl border-slate-200 text-slate-600 font-bold text-[10px] uppercase tracking-widest transition-all hover:bg-white hover:text-indigo-600 hover:border-indigo-200 shadow-sm"
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
