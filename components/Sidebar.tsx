'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { useQuery } from '@tanstack/react-query';
import {
    PieChart,
    Users,
    Gamepad2,
    Wifi,
    LogOut,
    UserCircle,
    ChevronRight,
    ChevronLeft,
    PlusCircle,
    Activity,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { logout } from '@/redux/auth/authSlice';
import { me } from '@/api/users';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

// Define the interface so the Layout can control the Sidebar
interface SidebarProps {
    isCollapsed: boolean;
    setIsCollapsed: (value: boolean) => void;
}

const Sidebar = ({ isCollapsed, setIsCollapsed }: SidebarProps) => {
    const dispatch = useDispatch();
    const pathname = usePathname();

    const { data: user = {} } = useQuery({
        queryKey: ['me'],
        queryFn: me,
        initialData: { fullName: '', role: { name: '' } },
    });

    const navItems = [
        { path: '/dashboard', label: 'Overview', icon: PieChart, badge: null },
        { path: '/students', label: 'Learners', icon: Users, badge: null },
        {
            path: '/activities',
            label: 'Game Center',
            icon: Gamepad2,
            badge: null,
        },
        {
            path: '/activity-sessions',
            label: 'Activity Sessions',
            icon: Activity,
            badge: null,
        },
        { path: '/devices', label: 'Sensors', icon: Wifi, badge: 'Live' },
    ];

    return (
        <TooltipProvider delayDuration={0}>
            <aside
                className={cn(
                    'fixed left-0 top-0 z-50 flex h-screen flex-col border-r border-slate-200 bg-white transition-all duration-300 ease-in-out',
                    isCollapsed ? 'w-[80px]' : 'w-[280px]',
                )}
            >
                {/* COLLAPSE TOGGLE BUTTON */}
                <Button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    variant="ghost"
                    size="icon"
                    className="absolute -right-3 top-10 h-6 w-6 rounded-full border border-slate-200 bg-white shadow-sm hover:bg-slate-50 transition-transform active:scale-90"
                >
                    {isCollapsed ? (
                        <ChevronRight size={14} />
                    ) : (
                        <ChevronLeft size={14} />
                    )}
                </Button>

                {/* USER PROFILE SECTION */}
                <div
                    className={cn(
                        'px-4 pt-8 transition-all',
                        isCollapsed ? 'mb-6' : 'mb-8',
                    )}
                >
                    <div
                        className={cn(
                            'flex items-center gap-3 rounded-[20px] bg-slate-50 border border-slate-200 shadow-sm transition-all',
                            isCollapsed ? 'p-2 justify-center' : 'p-4',
                        )}
                    >
                        <Avatar className="h-10 w-10 shrink-0 rounded-xl bg-white shadow-sm ring-1 ring-slate-100">
                            <AvatarFallback className="text-indigo-600 bg-white">
                                <UserCircle size={24} />
                            </AvatarFallback>
                        </Avatar>
                        {!isCollapsed && (
                            <div className="flex flex-col overflow-hidden animate-in fade-in slide-in-from-left-2 duration-300">
                                <p className="truncate text-sm font-bold text-slate-900">
                                    {user.fullName || 'Therapist'}
                                </p>
                                <span className="text-[10px] font-semibold uppercase text-slate-400">
                                    {user?.role?.name || 'Clinical Staff'}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* QUICK ACTION BUTTON */}
                {!isCollapsed && (
                    <div className="px-5 mb-6 animate-in fade-in zoom-in-95 duration-300">
                        <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl gap-2 h-11 shadow-md shadow-indigo-100 font-bold">
                            <PlusCircle size={18} />
                            <span>New Session</span>
                        </Button>
                    </div>
                )}

                {/* NAVIGATION LABEL */}
                {!isCollapsed && (
                    <div className="px-6 mb-4 text-[10px] font-black uppercase tracking-widest text-slate-300">
                        Therapy Center Name
                    </div>
                )}

                {/* NAV LINKS */}
                <nav className="flex flex-1 flex-col gap-1.5 px-3">
                    {navItems.map((item) => {
                        const active = pathname.startsWith(item.path);
                        const Icon = item.icon;

                        const navLink = (
                            <Link
                                href={item.path}
                                className={cn(
                                    'group flex items-center rounded-2xl transition-all duration-200 active:scale-95',
                                    isCollapsed
                                        ? 'justify-center h-12 w-12 mx-auto'
                                        : 'px-4 py-3 gap-3',
                                    active
                                        ? 'bg-indigo-50 text-indigo-600 shadow-sm'
                                        : 'text-slate-500 hover:bg-slate-50',
                                )}
                            >
                                <Icon
                                    className={cn(
                                        'h-5 w-5 shrink-0 transition-colors',
                                        active
                                            ? 'text-indigo-600'
                                            : 'text-slate-300 group-hover:text-slate-400',
                                    )}
                                />

                                {!isCollapsed && (
                                    <>
                                        <span
                                            className={cn(
                                                'flex-1 text-[15px]',
                                                active
                                                    ? 'font-bold'
                                                    : 'font-medium',
                                            )}
                                        >
                                            {item.label}
                                        </span>
                                        {item.badge && (
                                            <span
                                                className={cn(
                                                    'px-2 py-0.5 rounded-full text-[10px] font-bold',
                                                    item.badge === 'Live'
                                                        ? 'bg-emerald-100 text-emerald-600 animate-pulse'
                                                        : 'bg-slate-100 text-slate-500',
                                                )}
                                            >
                                                {item.badge}
                                            </span>
                                        )}
                                    </>
                                )}
                            </Link>
                        );

                        return isCollapsed ? (
                            <Tooltip key={item.path}>
                                <TooltipTrigger asChild>
                                    {navLink}
                                </TooltipTrigger>
                                <TooltipContent
                                    side="right"
                                    className="bg-slate-900 text-white font-bold border-none shadow-xl"
                                >
                                    {item.label}
                                </TooltipContent>
                            </Tooltip>
                        ) : (
                            <React.Fragment key={item.path}>
                                {navLink}
                            </React.Fragment>
                        );
                    })}
                </nav>

                {/* FOOTER / LOGOUT */}
                <div className="mt-auto border-t border-slate-100 p-4">
                    <button
                        onClick={() => dispatch(logout())}
                        className={cn(
                            'group flex w-full items-center rounded-2xl transition-all hover:bg-red-50 hover:text-red-500',
                            isCollapsed
                                ? 'justify-center h-12'
                                : 'px-4 py-3 gap-3 text-[15px] font-bold text-slate-400',
                        )}
                    >
                        <LogOut className="h-5 w-5 shrink-0 transition-colors group-hover:text-red-500" />
                        {!isCollapsed && <span>Sign Out</span>}
                    </button>
                </div>
            </aside>
        </TooltipProvider>
    );
};

export default Sidebar;
