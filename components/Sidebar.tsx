'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
    PieChart,
    Users,
    Gamepad2,
    LogOut,
    ChevronRight,
    ChevronLeft,
    Activity,
    LayoutGrid,
    Plus,
    Settings,
    Users2,
    Loader2,
    CalendarPlus,
    CalendarDays, // <-- Imported for the collapsed appointment button
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
import { ScheduleAppointmentButton } from './AppointmentSchedulingModal/components/ScheduleAppointmentButton';

// --- Static Navigation Items ---
const NAV_ITEMS = [
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
        path: '/appointments', // <-- 2. Added Appointments Tab
        label: 'Appointments',
        icon: CalendarDays,
        allowedRoles: ['admin'], // <-- Restricted to admin only
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
    {
        path: '/settings',
        label: 'Settings',
        icon: Settings,
        allowedRoles: ['admin', 'therapist', 'secretary'],
    },
];

// --- Tooltip Wrapper ---
const TooltipWrapper = ({
    children,
    tooltipText,
    shouldWrap,
    isMobile,
}: {
    children: React.ReactNode;
    tooltipText: string;
    shouldWrap: boolean;
    isMobile: boolean;
}) => {
    if (!shouldWrap || isMobile) return <>{children}</>;
    return (
        <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>{children}</TooltipTrigger>
            <TooltipContent
                side="right"
                className="font-semibold bg-slate-900 text-white border-none"
            >
                {tooltipText}
            </TooltipContent>
        </Tooltip>
    );
};

interface SidebarProps {
    isCollapsed: boolean;
    setIsCollapsed: (value: boolean) => void;
}

const Sidebar = ({ isCollapsed, setIsCollapsed }: SidebarProps) => {
    const router = useRouter();
    const dispatch = useDispatch();
    const pathname = usePathname();
    const [isMobile, setIsMobile] = useState(false);

    // Feedback states
    const [pendingPath, setPendingPath] = useState<string | null>(null);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    // Clear pending state immediately on route match
    if (pendingPath === pathname) {
        setPendingPath(null);
    }

    const { data: user } = useQuery({
        queryKey: ['me'],
        queryFn: me,
    });

    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth < 768;
            setIsMobile(mobile);
            if (mobile) setIsCollapsed(true);
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [setIsCollapsed]);

    const userRole = user?.role?.type;

    const visibleNavItems = useMemo(
        () =>
            NAV_ITEMS.filter(
                (item) => !userRole || item.allowedRoles.includes(userRole),
            ),
        [userRole],
    );

    // Early return for students
    if (userRole === 'student') return null;

    const handleLogout = async () => {
        setIsLoggingOut(true);
        try {
            await new Promise((resolve) => setTimeout(resolve, 600));
            dispatch(logout());
        } catch (error) {
            setIsLoggingOut(false);
        }
    };

    // Role-based Action Permissions
    const canPlanSession = ['therapist', 'secretary'].includes(userRole || '');
    const canScheduleAppointment = ['admin', 'secretary'].includes(
        userRole || '',
    );

    return (
        <TooltipProvider delayDuration={100}>
            <aside
                className={cn(
                    'fixed left-0 top-0 z-50 flex h-screen flex-col border-r border-slate-200 bg-white transition-all duration-300 ease-in-out',
                    isCollapsed ? 'w-[72px]' : 'w-[260px]',
                )}
            >
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

                {/* Header */}
                <div className="h-16 flex items-center px-5 border-b border-slate-100 shrink-0">
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0 shadow-sm shadow-indigo-200">
                            <LayoutGrid size={18} className="text-white" />
                        </div>
                        <AnimatePresence mode="wait">
                            {!isCollapsed && (
                                <motion.span
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
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

                {/* Profile */}
                <div className="px-3 py-6 shrink-0">
                    <div
                        className={cn(
                            'rounded-xl bg-slate-50 border border-slate-100 transition-all duration-300 flex items-center',
                            isCollapsed ? 'p-1.5 justify-center' : 'p-3',
                        )}
                    >
                        <Avatar className="h-9 w-9 rounded-lg border border-white shadow-sm shrink-0">
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
                        {!isCollapsed && (
                            <div className="ml-3 flex flex-col min-w-0 pr-4">
                                <p className="truncate text-sm font-semibold text-slate-900 leading-none mb-1">
                                    {user?.fullName || 'User'}
                                </p>
                                <p className="truncate text-[10px] font-medium text-slate-500 uppercase tracking-wide">
                                    {user?.role?.name || 'Role'}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* --- Dynamic Action Buttons --- */}
                {(canPlanSession || canScheduleAppointment) && (
                    <div
                        className={cn(
                            'px-3 mb-6 shrink-0 flex flex-col gap-2',
                            isCollapsed && 'items-center',
                        )}
                    >
                        {/* 1. Admin/Secretary: Schedule Clinical Appointments */}
                        {canScheduleAppointment &&
                            (isCollapsed ? (
                                <TooltipWrapper
                                    shouldWrap
                                    tooltipText="Book Appointment"
                                    isMobile={isMobile}
                                >
                                    <Button
                                        size="icon"
                                        className="h-10 w-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-200 shrink-0"
                                        onClick={() => {
                                            const params = new URLSearchParams(
                                                window.location.search,
                                            );
                                            params.set(
                                                'isAppointmentModalOpen',
                                                'true',
                                            );
                                            router.push(
                                                `${pathname}?${params.toString()}`,
                                                { scroll: false },
                                            );
                                        }}
                                    >
                                        <CalendarPlus
                                            size={20}
                                            className="text-white"
                                        />
                                    </Button>
                                </TooltipWrapper>
                            ) : (
                                <ScheduleAppointmentButton className="w-full" />
                            ))}

                        {/* 2. Therapist/Secretary: Plan Activity Sessions */}
                        {canPlanSession &&
                            (isCollapsed ? (
                                <TooltipWrapper
                                    shouldWrap
                                    tooltipText="Plan Activity Session"
                                    isMobile={isMobile}
                                >
                                    <Button
                                        size="icon"
                                        className={cn(
                                            'h-10 w-10 rounded-xl shadow-md shrink-0 transition-colors',
                                            // Make the second button visually distinct if both exist (e.g. for Secretary)
                                            canScheduleAppointment
                                                ? 'bg-white border border-slate-200 text-indigo-600 hover:bg-slate-50'
                                                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200',
                                        )}
                                        onClick={() => {
                                            const params = new URLSearchParams(
                                                window.location.search,
                                            );
                                            params.set(
                                                'isActivitySessionPlanningOpen',
                                                'true',
                                            );
                                            router.push(
                                                `${pathname}?${params.toString()}`,
                                                { scroll: false },
                                            );
                                        }}
                                    >
                                        <Plus
                                            size={20}
                                            className={
                                                canScheduleAppointment
                                                    ? 'text-indigo-600'
                                                    : 'text-white'
                                            }
                                        />
                                    </Button>
                                </TooltipWrapper>
                            ) : (
                                // Adding logic to make the second button a secondary variant if the first one rendered
                                <InitializeSessionButton
                                    className={cn(
                                        'w-full',
                                        canScheduleAppointment &&
                                            'bg-slate-800 hover:bg-slate-900 border-slate-700 shadow-slate-300',
                                    )}
                                />
                            ))}
                    </div>
                )}

                {/* Navigation */}
                <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1 custom-scrollbar">
                    {!isCollapsed && (
                        <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                            Platform
                        </div>
                    )}

                    {visibleNavItems.map((item) => {
                        const active =
                            pathname === item.path ||
                            (item.path !== '/' &&
                                pathname.startsWith(item.path));
                        const isPending = pendingPath === item.path;
                        const Icon = item.icon;

                        return (
                            <TooltipWrapper
                                key={item.path}
                                shouldWrap={isCollapsed}
                                tooltipText={item.label}
                                isMobile={isMobile}
                            >
                                <Link
                                    href={item.path}
                                    onClick={() => setPendingPath(item.path)}
                                    className={cn(
                                        'relative group flex items-center rounded-lg transition-all duration-200 h-10',
                                        isCollapsed
                                            ? 'w-10 mx-auto justify-center'
                                            : 'px-3 gap-3',
                                        active
                                            ? 'bg-indigo-50/50 text-indigo-600'
                                            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900',
                                        isPending &&
                                            !active &&
                                            'bg-slate-100 animate-pulse cursor-wait',
                                    )}
                                >
                                    {(active || isPending) && (
                                        <motion.div
                                            layoutId="activeNavIndicator"
                                            className={cn(
                                                'absolute left-0 w-1 h-6 bg-indigo-600 rounded-r-full z-10',
                                                isPending &&
                                                    !active &&
                                                    'bg-indigo-300 opacity-60',
                                            )}
                                            initial={false}
                                            transition={{
                                                type: 'spring',
                                                stiffness: 500,
                                                damping: 38,
                                            }}
                                            style={{ top: '8px' }}
                                        />
                                    )}

                                    <div className="relative shrink-0 flex items-center justify-center z-20">
                                        {isPending && !active ? (
                                            <Loader2
                                                size={18}
                                                className="animate-spin text-indigo-500"
                                            />
                                        ) : (
                                            <Icon
                                                size={20}
                                                strokeWidth={active ? 2.5 : 2}
                                                className={cn(
                                                    'transition-colors',
                                                    active
                                                        ? 'text-indigo-600'
                                                        : 'text-slate-400 group-hover:text-slate-600',
                                                )}
                                            />
                                        )}
                                    </div>

                                    {!isCollapsed && (
                                        <span
                                            className={cn(
                                                'text-sm transition-all relative z-20 whitespace-nowrap overflow-hidden',
                                                active
                                                    ? 'font-semibold'
                                                    : 'font-medium',
                                                isPending &&
                                                    !active &&
                                                    'text-indigo-400',
                                            )}
                                        >
                                            {item.label}
                                        </span>
                                    )}
                                </Link>
                            </TooltipWrapper>
                        );
                    })}
                </div>

                {/* Sign Out Footer */}
                <div className="p-3 border-t border-slate-100 bg-slate-50/30 shrink-0">
                    <TooltipWrapper
                        shouldWrap={isCollapsed}
                        tooltipText="Sign Out"
                        isMobile={isMobile}
                    >
                        <button
                            onClick={handleLogout}
                            disabled={isLoggingOut}
                            className={cn(
                                'group flex w-full items-center rounded-lg transition-all h-10',
                                isCollapsed ? 'justify-center' : 'px-3 gap-3',
                                isLoggingOut
                                    ? 'bg-red-50 text-red-400 cursor-wait'
                                    : 'text-slate-500 hover:bg-red-50 hover:text-red-600 cursor-pointer',
                            )}
                        >
                            <div className="shrink-0 flex items-center justify-center">
                                {isLoggingOut ? (
                                    <Loader2
                                        size={20}
                                        className="animate-spin"
                                    />
                                ) : (
                                    <LogOut
                                        size={20}
                                        className="text-slate-400 group-hover:text-red-500 transition-colors"
                                    />
                                )}
                            </div>

                            {!isCollapsed && (
                                <span
                                    className={cn(
                                        'text-sm font-medium transition-opacity truncate',
                                        isLoggingOut
                                            ? 'opacity-70'
                                            : 'opacity-100',
                                    )}
                                >
                                    {isLoggingOut
                                        ? 'Signing out...'
                                        : 'Sign Out'}
                                </span>
                            )}
                        </button>
                    </TooltipWrapper>
                </div>
            </aside>
        </TooltipProvider>
    );
};

export default Sidebar;
