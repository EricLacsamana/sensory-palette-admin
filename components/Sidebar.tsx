'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
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

interface SidebarProps {
    isCollapsed: boolean;
    setIsCollapsed: (value: boolean) => void;
}

const Sidebar = ({ isCollapsed, setIsCollapsed }: SidebarProps) => {
    const router = useRouter();
    const dispatch = useDispatch();
    const pathname = usePathname();

    const { data: user = {} } = useQuery({
        queryKey: ['me'],
        queryFn: me,
        initialData: { fullName: '', role: { name: '' } },
    });

    const handleLogout = () => {
        router.push('/auth/login');
        dispatch(logout());
    };

    const navItems = [
        { path: '/', label: 'Overview', icon: PieChart, badge: null },
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
                    'fixed left-0 top-0 z-50 flex h-screen flex-col border-r border-slate-200/60 bg-white transition-all duration-500 ease-in-out',
                    isCollapsed ? 'w-[80px]' : 'w-[280px]',
                )}
            >
                {/* COLLAPSE TOGGLE BUTTON */}
                <Button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    variant="ghost"
                    size="icon"
                    className="absolute -right-3 top-12.5 h-6 w-6 rounded-full border border-slate-200 bg-white shadow-sm hover:bg-slate-50 transition-all active:scale-95"
                >
                    {isCollapsed ? (
                        <ChevronRight size={12} strokeWidth={2.5} />
                    ) : (
                        <ChevronLeft size={12} strokeWidth={2.5} />
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
                            'flex items-center gap-3 rounded-2xl bg-slate-50/50 border border-slate-100 transition-all',
                            isCollapsed ? 'p-2 justify-center' : 'p-3',
                        )}
                    >
                        <Avatar className="h-9 w-9 shrink-0 rounded-xl bg-white border border-slate-200/60 shadow-sm">
                            <AvatarFallback className="text-indigo-600 bg-white">
                                <UserCircle size={20} strokeWidth={1.5} />
                            </AvatarFallback>
                        </Avatar>
                        {!isCollapsed && (
                            <div className="flex flex-col overflow-hidden animate-in fade-in slide-in-from-left-2 duration-500">
                                <p className="truncate text-[13px] font-semibold text-slate-900 leading-tight">
                                    {user.fullName || 'Therapist'}
                                </p>
                                <span className="text-[10px] font-medium uppercase text-slate-500 tracking-tight">
                                    {user?.role?.name || 'Clinical Staff'}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* QUICK ACTION BUTTON */}
                {!isCollapsed && (
                    <div className="px-5 mb-6 animate-in fade-in zoom-in-95 duration-500">
                        <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl gap-2 h-10 shadow-md shadow-indigo-100 font-semibold text-sm">
                            <PlusCircle size={16} strokeWidth={2} />
                            <span>New Session</span>
                        </Button>
                    </div>
                )}

                {/* NAVIGATION LABEL */}
                {!isCollapsed && (
                    <div className="px-6 mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                        Menu
                    </div>
                )}

                {/* NAV LINKS */}
                <nav className="flex flex-1 flex-col gap-1 px-3">
                    {navItems.map((item) => {
                        const active = pathname === item.path;
                        const Icon = item.icon;

                        const navLink = (
                            <Link
                                href={item.path}
                                className={cn(
                                    'group flex items-center rounded-xl transition-all duration-300',
                                    isCollapsed
                                        ? 'justify-center h-11 w-11 mx-auto'
                                        : 'px-4 py-2.5 gap-3',
                                    active
                                        ? 'bg-indigo-50 text-indigo-600 shadow-sm border border-indigo-100/50'
                                        : 'text-slate-500 hover:bg-slate-50',
                                )}
                            >
                                <Icon
                                    className={cn(
                                        'h-5 w-5 shrink-0 transition-colors',
                                        active
                                            ? 'text-indigo-600'
                                            : 'text-slate-400 group-hover:text-slate-500',
                                    )}
                                    strokeWidth={active ? 2 : 1.5}
                                />

                                {!isCollapsed && (
                                    <>
                                        <span
                                            className={cn(
                                                'flex-1 text-[14px]',
                                                active
                                                    ? 'font-semibold'
                                                    : 'font-medium',
                                            )}
                                        >
                                            {item.label}
                                        </span>
                                        {item.badge && (
                                            <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-emerald-50 text-emerald-600 border border-emerald-100/50 animate-pulse">
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
                                    className="bg-slate-900 text-white font-medium border-none shadow-xl"
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
                        onClick={() => handleLogout()}
                        className={cn(
                            'group flex w-full items-center rounded-xl transition-all hover:bg-red-50 hover:text-red-500',
                            isCollapsed
                                ? 'justify-center h-11'
                                : 'px-4 py-2.5 gap-3 text-[14px] font-medium text-slate-500',
                        )}
                    >
                        <LogOut
                            className="h-5 w-5 shrink-0 transition-colors text-slate-400 group-hover:text-red-500"
                            strokeWidth={1.5}
                        />
                        {!isCollapsed && <span>Sign Out</span>}
                    </button>
                </div>
            </aside>
        </TooltipProvider>
    );
};

export default Sidebar;
