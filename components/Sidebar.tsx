'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
    PieChart,
    Users,
    Gamepad2,
    Wifi,
    LogOut,
    ChevronRight,
    ChevronLeft,
    Activity,
    LayoutGrid,
    Plus,
    Settings2,
    Users2,
    Settings,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { logout } from '@/redux/auth/authSlice';
import { me } from '@/api/users';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { InitializeSessionButton } from './SessionPlanningModal/components/InitializeSessionPlanningButton';
import { FormatService } from '@/utils/helpers';

interface SidebarProps {
    isCollapsed: boolean;
    setIsCollapsed: (value: boolean) => void;
}

const Sidebar = ({ isCollapsed, setIsCollapsed }: SidebarProps) => {
    const router = useRouter();
    const dispatch = useDispatch();
    const pathname = usePathname();

    const { data: user, isLoading } = useQuery({
        queryKey: ['me'],
        queryFn: me,
    });

    const handleLogout = () => {
        dispatch(logout());
    };

    const userRole = user?.role?.type;

    if (userRole === 'student') {
        return null;
    }

    const navItems = [
        {
            path: '/',
            label: 'Overview',
            icon: PieChart,
            allowedRoles: ['admin', 'therapist', 'secretary'],
        },
        {
            path: '/students',
            label: 'Learners',
            icon: Users,
            allowedRoles: ['therapist', 'secretary'],
        },
        {
            path: '/activities',
            label: 'Activity Center',
            icon: Gamepad2,
            allowedRoles: ['therapist'],
        },
        {
            path: '/activity-manager',
            label: 'Activity Manager',
            icon: Gamepad2,
            allowedRoles: ['admin'],
        },
        {
            path: '/activity-sessions',
            label: 'Sessions',
            icon: Activity,
            allowedRoles: ['admin', 'therapist', 'secretary'],
        },
        {
            path: '/users',
            label: 'Users Directory',
            icon: Users2,
            allowedRoles: ['admin', 'secretary'],
        },
        // {
        //     path: '/devices',
        //     label: 'Sensors',
        //     icon: Wifi,
        //     badge: 'LIVE',
        //     allowedRoles: ['admin', 'therapist'],
        // },
        {
            path: '/settings',
            label: 'Settings',
            icon: Settings,
            allowedRoles: ['admin', 'therapist', 'secretary'],
        },
    ];

    // Filter items based on the current user's role
    const visibleNavItems = navItems.filter(
        (item) => !userRole || item.allowedRoles.includes(userRole),
    );

    return (
        <TooltipProvider delayDuration={100}>
            <aside
                className={cn(
                    'fixed left-0 top-0 z-50 flex h-screen flex-col border-r border-slate-200 bg-white transition-all duration-300 ease-in-out',
                    isCollapsed ? 'w-[72px]' : 'w-[260px]',
                )}
            >
                {/* --- FLOATING COLLAPSE TOGGLE BUTTON --- */}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="absolute -right-3.5 top-[50px] z-50 flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 shadow-sm transition-all hover:scale-110 hover:text-indigo-600 focus:outline-none"
                >
                    {isCollapsed ? (
                        <ChevronRight size={14} />
                    ) : (
                        <ChevronLeft size={14} />
                    )}
                </button>

                {/* --- HEADER / LOGO AREA --- */}
                <div className="h-16 flex items-center px-5 border-b border-slate-100 shrink-0">
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0 shadow-sm shadow-indigo-200">
                            <LayoutGrid size={18} className="text-white" />
                        </div>
                        <AnimatePresence>
                            {!isCollapsed && (
                                <motion.span
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    transition={{ duration: 0.2 }}
                                    className="font-bold text-lg tracking-tight text-slate-900 whitespace-nowrap"
                                >
                                    Sensory
                                    <span className="text-indigo-600">
                                        Palette
                                    </span>
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* --- USER PROFILE --- */}
                <div className="px-3 py-6">
                    <div
                        className={cn(
                            'rounded-xl bg-slate-50 border border-slate-100 transition-all duration-300 relative group overflow-hidden',
                            isCollapsed ? 'p-1.5' : 'p-3',
                        )}
                    >
                        <div className="flex items-center gap-3">
                            <div className="relative shrink-0">
                                <Avatar className="h-9 w-9 rounded-lg border border-white shadow-sm">
                                    <AvatarImage
                                        src={FormatService.formatStrapiMedia(
                                            user?.profilePicture,
                                            'thumbnail',
                                        )}
                                        className="object-cover"
                                    />
                                    <AvatarFallback className="bg-slate-200 text-slate-500 rounded-lg text-xs font-bold">
                                        {user?.fullName?.charAt(0) || '?'}
                                    </AvatarFallback>
                                </Avatar>
                                <span className="absolute -bottom-1 -right-1 block h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                            </div>

                            {!isCollapsed && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="flex flex-col min-w-0 pr-4"
                                >
                                    <p className="truncate text-sm font-semibold text-slate-900 leading-none mb-1">
                                        {user?.fullName || 'Loading...'}
                                    </p>
                                    <p className="truncate text-[10px] font-medium text-slate-500 uppercase tracking-wide">
                                        {user?.role?.name || '...'}
                                    </p>
                                </motion.div>
                            )}
                        </div>

                        {/* Settings Gear Hover Effect */}
                        {!isCollapsed && (
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Link href="/settings">
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-7 w-7 text-slate-400 hover:text-indigo-600 bg-white/80 backdrop-blur-sm"
                                    >
                                        <Settings2 size={14} />
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </div>
                </div>

                {/* --- PRIMARY ACTION --- */}
                {['therapist', 'secretary'].includes(userRole) && (
                    <div
                        className={cn(
                            'px-3 mb-6 transition-all',
                            isCollapsed ? 'flex justify-center' : '',
                        )}
                    >
                        {isCollapsed ? (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        size="icon"
                                        className="h-10 w-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-200"
                                        onClick={() => {
                                            const btn =
                                                document.getElementById(
                                                    'init-session-btn',
                                                );
                                            if (btn) btn.click();
                                            else {
                                                const params =
                                                    new URLSearchParams(
                                                        window.location.search,
                                                    );
                                                params.set(
                                                    'isActivitySessionPlanningOpen',
                                                    'true',
                                                );
                                                router.push(
                                                    `${pathname}?${params.toString()}`,
                                                );
                                            }
                                        }}
                                    >
                                        <Plus
                                            size={20}
                                            className="text-white"
                                        />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent side="right">
                                    Initialize Session
                                </TooltipContent>
                            </Tooltip>
                        ) : (
                            <div className="animate-in fade-in zoom-in-95 duration-300">
                                <InitializeSessionButton className="w-full" />
                            </div>
                        )}
                    </div>
                )}

                {/* --- NAVIGATION --- */}
                <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
                    {!isCollapsed && visibleNavItems.length > 0 && (
                        <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                            Platform
                        </div>
                    )}

                    {visibleNavItems.map((item) => {
                        const active =
                            pathname === item.path ||
                            (item.path !== '/' &&
                                pathname.startsWith(item.path));
                        const Icon = item.icon;

                        return (
                            <Tooltip
                                key={item.path}
                                delayDuration={isCollapsed ? 0 : 1000}
                            >
                                <TooltipTrigger asChild>
                                    <Link
                                        href={item.path}
                                        className={cn(
                                            'relative group flex items-center rounded-lg transition-all duration-200',
                                            isCollapsed
                                                ? 'justify-center h-10 w-10 mx-auto'
                                                : 'px-3 py-2.5 gap-3',
                                            active
                                                ? 'bg-slate-50 text-indigo-600'
                                                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900',
                                        )}
                                    >
                                        {/* Active Indicator Line */}
                                        {active && (
                                            <motion.div
                                                layoutId="activeNavIndicator"
                                                className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-indigo-600 rounded-r-full"
                                            />
                                        )}

                                        <Icon
                                            size={20}
                                            strokeWidth={active ? 2.5 : 2}
                                            className={cn(
                                                'shrink-0 transition-colors',
                                                active
                                                    ? 'text-indigo-600'
                                                    : 'text-slate-400 group-hover:text-slate-600',
                                            )}
                                        />

                                        {!isCollapsed && (
                                            <span
                                                className={cn(
                                                    'text-sm transition-all',
                                                    active
                                                        ? 'font-semibold'
                                                        : 'font-medium',
                                                )}
                                            >
                                                {item.label}
                                            </span>
                                        )}

                                        {/* Live Badge */}
                                        {!isCollapsed && item.badge && (
                                            <span className="ml-auto px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-700 uppercase tracking-wide">
                                                {item.badge}
                                            </span>
                                        )}
                                        {isCollapsed && item.badge && (
                                            <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white" />
                                        )}
                                    </Link>
                                </TooltipTrigger>
                                {isCollapsed && (
                                    <TooltipContent
                                        side="right"
                                        className="font-semibold bg-slate-900 text-white border-none"
                                    >
                                        {item.label}
                                    </TooltipContent>
                                )}
                            </Tooltip>
                        );
                    })}
                </div>

                {/* --- FOOTER --- */}
                <div className="p-3 border-t border-slate-100 bg-slate-50/30">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button
                                onClick={() => handleLogout()}
                                className={cn(
                                    'group flex w-full items-center rounded-lg transition-all hover:bg-red-50 hover:text-red-600',
                                    isCollapsed
                                        ? 'justify-center h-10'
                                        : 'px-3 py-2.5 gap-3',
                                )}
                            >
                                <LogOut
                                    size={20}
                                    className="shrink-0 text-slate-400 group-hover:text-red-500 transition-colors"
                                />
                                {!isCollapsed && (
                                    <span className="text-sm font-medium text-slate-500 group-hover:text-red-600">
                                        Sign Out
                                    </span>
                                )}
                            </button>
                        </TooltipTrigger>
                        {isCollapsed && (
                            <TooltipContent side="right">
                                Sign Out
                            </TooltipContent>
                        )}
                    </Tooltip>
                </div>
            </aside>
        </TooltipProvider>
    );
};

export default Sidebar;
