'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';

import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Bell,
    Check,
    Clock,
    ChevronDown,
    CheckCircle2,
    PlayCircle,
    PauseCircle,
    XCircle,
    Flag,
    CalendarClock,
    ExternalLink,
    AlertCircle,
    AlertTriangle,
    Info,
    LayoutDashboard, // For appointment icon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

import {
    getMyNotifications,
    markAsRead,
    markAllMyRead,
} from '@/api/notifications';
import { ActivitySessionStatus } from '@/types/activitiy-session';

// --- CONFIG: SHARED STATUS BADGES ---
const statusConfig: Record<
    string,
    { bg: string; border: string; text: string; icon: any; label: string }
> = {
    [ActivitySessionStatus.Pending]: {
        bg: 'bg-amber-50',
        border: 'border-amber-200/60',
        text: 'text-amber-700',
        icon: Clock,
        label: 'Pending',
    },
    [ActivitySessionStatus.InProgress]: {
        bg: 'bg-blue-50',
        border: 'border-blue-200/60',
        text: 'text-blue-700',
        icon: PlayCircle,
        label: 'Live',
    },
    [ActivitySessionStatus.Completed]: {
        bg: 'bg-teal-50',
        border: 'border-teal-200/60',
        text: 'text-teal-700',
        icon: CheckCircle2,
        label: 'Done',
    },
    [ActivitySessionStatus.Paused]: {
        bg: 'bg-orange-50',
        border: 'border-orange-200/60',
        text: 'text-orange-700',
        icon: PauseCircle,
        label: 'Paused',
    },
    [ActivitySessionStatus.Cancelled]: {
        bg: 'bg-red-50',
        border: 'border-red-200/60',
        text: 'text-red-700',
        icon: XCircle,
        label: 'Void',
    },
    [ActivitySessionStatus.Abandoned]: {
        bg: 'bg-slate-50',
        border: 'border-slate-200/60',
        text: 'text-slate-600',
        icon: Flag,
        label: 'Dropped',
    },
    [ActivitySessionStatus.Reschedule]: {
        bg: 'bg-violet-50',
        border: 'border-violet-200/60',
        text: 'text-violet-700',
        icon: CalendarClock,
        label: 'Resched',
    },
    [ActivitySessionStatus.Queued]: {
        bg: 'bg-indigo-50',
        border: 'border-indigo-200/60',
        text: 'text-indigo-700',
        icon: Clock,
        label: 'Queued',
    },
};

const stripEmojis = (str: string) => {
    if (!str) return '';
    return str.replace(/\p{Emoji_Presentation}/gu, '').trim();
};

export const NotificationCenter = () => {
    const router = useRouter();
    const queryClient = useQueryClient();

    const [viewMode, setViewMode] = useState<'all' | 'unread'>('all');
    const [isOpen, setIsOpen] = useState(false);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [localReadIds, setLocalReadIds] = useState<Set<string>>(new Set());

    const { data: notifications = [] } = useQuery({
        queryKey: ['notifications'],
        queryFn: getMyNotifications,
        refetchInterval: 5000,
    });

    const markReadMutation = useMutation({
        mutationFn: markAsRead,
        onSuccess: () =>
            queryClient.invalidateQueries({ queryKey: ['notifications'] }),
    });

    const markAllReadMutation = useMutation({
        mutationFn: markAllMyRead,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            toast.success('All caught up!');
            setViewMode('all');
            setLocalReadIds(new Set());
        },
    });

    const unreadCount = notifications.filter((n: any) => !n.isRead).length;

    const displayedNotifications =
        viewMode === 'unread'
            ? notifications.filter(
                  (n: any) => !n.isRead || localReadIds.has(n.documentId),
              )
            : notifications;

    const handleExpandToggle = (notif: any) => {
        setExpandedId(
            expandedId === notif.documentId ? null : notif.documentId,
        );

        if (!notif.isRead && !localReadIds.has(notif.documentId)) {
            markReadMutation.mutate(notif.documentId);
            setLocalReadIds((prev) => new Set(prev).add(notif.documentId));
        }
    };

    /**
     * Universal action handler for both types
     */
    const handleNotificationAction = (notif: any) => {
        setIsOpen(false);
        setLocalReadIds(new Set());

        // Check for Appointment assigned (Routes to root planner)
        if (notif.appointment) {
            const appId = notif.appointment.documentId || notif.appointment.id;
            router.push(
                `/?isActivitySessionPlanningOpen=true&planAppointmentId=${appId}`,
            );
            return;
        }

        // Check for Activity Session (Routes to session detail)
        if (notif.activitySession?.documentId) {
            router.push(
                `/activity-sessions/${notif.activitySession.documentId}`,
            );
            return;
        }
    };

    const handleOpenChange = (open: boolean) => {
        setIsOpen(open);
        if (!open) {
            setLocalReadIds(new Set());
            setExpandedId(null);
        }
    };

    const handleTabChange = (mode: 'all' | 'unread') => {
        setViewMode(mode);
        setLocalReadIds(new Set());
    };

    const getPriorityIcon = (priority: string) => {
        switch (priority) {
            case 'critical':
                return <AlertCircle size={18} className="text-rose-600" />;
            case 'warning':
                return <AlertTriangle size={18} className="text-amber-600" />;
            case 'success':
                return <CheckCircle2 size={18} className="text-emerald-600" />;
            default:
                return <Info size={18} className="text-blue-600" />;
        }
    };

    return (
        <Popover open={isOpen} onOpenChange={handleOpenChange}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    className="relative h-12 w-12 rounded-2xl border-slate-200 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 transition-all shadow-sm flex items-center justify-center p-0"
                >
                    <Bell size={20} />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 ring-2 ring-white">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full text-[8px] font-black text-white">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        </span>
                    )}
                </Button>
            </PopoverTrigger>

            <PopoverContent
                align="end"
                className="w-[420px] p-0 rounded-[28px] shadow-2xl border-slate-200/60 overflow-hidden bg-white z-50 flex flex-col"
            >
                {/* --- HEADER --- */}
                <div className="p-5 pb-4 border-b border-slate-100 bg-white space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                                <Bell
                                    size={16}
                                    className="fill-indigo-600/20"
                                />
                            </div>
                            <h3 className="font-black text-slate-900 text-base tracking-tight">
                                Notifications
                            </h3>
                        </div>
                        {unreadCount > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    markAllReadMutation.mutate();
                                }}
                                className="h-8 text-[10px] uppercase font-bold tracking-widest text-slate-400 hover:text-indigo-600 rounded-lg"
                            >
                                <Check className="mr-1.5 h-3.5 w-3.5" /> Mark
                                all Read
                            </Button>
                        )}
                    </div>

                    <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl">
                        <button
                            onClick={() => handleTabChange('all')}
                            className={cn(
                                'flex-1 px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-widest transition-all',
                                viewMode === 'all'
                                    ? 'bg-white text-slate-900 shadow-sm'
                                    : 'text-slate-500',
                            )}
                        >
                            All Inbox
                        </button>
                        <button
                            onClick={() => handleTabChange('unread')}
                            className={cn(
                                'flex-1 px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-widest transition-all',
                                viewMode === 'unread'
                                    ? 'bg-white text-indigo-600 shadow-sm'
                                    : 'text-slate-500',
                            )}
                        >
                            Unread
                        </button>
                    </div>
                </div>

                <div className="max-h-[450px] overflow-y-auto custom-scrollbar bg-slate-50/30">
                    {displayedNotifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-12 text-center h-[200px]">
                            <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mb-4 text-slate-300 shadow-inner">
                                <CheckCircle2 size={32} />
                            </div>
                            <h4 className="text-base font-bold text-slate-900 mb-1">
                                Inbox Zero!
                            </h4>
                        </div>
                    ) : (
                        <div className="flex flex-col p-2 gap-2">
                            {displayedNotifications.map((notif: any) => {
                                const isExpanded =
                                    expandedId === notif.documentId;
                                const isEffectivelyRead =
                                    notif.isRead ||
                                    localReadIds.has(notif.documentId);

                                // Detection logic
                                const isAppointment = !!notif.appointment;
                                const sessionStatus =
                                    notif.activitySession?.activitySessionStatus?.toLowerCase() ||
                                    'pending';
                                const badgeConfig =
                                    statusConfig[sessionStatus] ||
                                    statusConfig.pending;

                                return (
                                    <Collapsible
                                        key={notif.documentId}
                                        open={isExpanded}
                                        onOpenChange={() =>
                                            handleExpandToggle(notif)
                                        }
                                        className={cn(
                                            'group relative rounded-2xl transition-all duration-200 border overflow-hidden',
                                            isEffectivelyRead
                                                ? 'bg-transparent border-transparent hover:bg-slate-100/50'
                                                : 'bg-white border-slate-200 shadow-sm hover:border-indigo-200 hover:shadow-md',
                                        )}
                                    >
                                        <CollapsibleTrigger asChild>
                                            <div className="flex gap-3 p-4 cursor-pointer items-start outline-none pr-10">
                                                <div className="pt-1.5 shrink-0 flex items-center justify-center w-4">
                                                    <div
                                                        className={cn(
                                                            'h-2.5 w-2.5 rounded-full transition-colors duration-300',
                                                            isEffectivelyRead
                                                                ? 'bg-slate-200'
                                                                : 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]',
                                                        )}
                                                    />
                                                </div>

                                                <div
                                                    className={cn(
                                                        'flex-1 min-w-0 transition-opacity',
                                                        isEffectivelyRead
                                                            ? 'opacity-60'
                                                            : 'opacity-100',
                                                    )}
                                                >
                                                    <div className="flex items-start gap-2 mb-1">
                                                        <div className="flex items-center gap-1.5 min-w-0">
                                                            <div className="shrink-0 flex items-center justify-center">
                                                                {getPriorityIcon(
                                                                    notif.priority,
                                                                )}
                                                            </div>
                                                            <span
                                                                className={cn(
                                                                    'text-sm leading-tight truncate',
                                                                    isEffectivelyRead
                                                                        ? 'font-semibold text-slate-600'
                                                                        : 'font-black text-slate-900',
                                                                )}
                                                            >
                                                                {stripEmojis(
                                                                    notif.title,
                                                                )}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <p
                                                        className={cn(
                                                            'text-xs leading-relaxed line-clamp-1 break-words',
                                                            isEffectivelyRead
                                                                ? 'text-slate-400'
                                                                : 'text-slate-500 font-medium',
                                                        )}
                                                    >
                                                        {notif.message}
                                                    </p>
                                                    <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">
                                                        <Clock size={10} />
                                                        {formatDistanceToNow(
                                                            new Date(
                                                                notif.createdAt,
                                                            ),
                                                        )}
                                                    </div>
                                                    <ChevronDown
                                                        size={14}
                                                        className={cn(
                                                            'absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition-transform duration-300',
                                                            isExpanded &&
                                                                'rotate-180',
                                                        )}
                                                    />
                                                </div>
                                            </div>
                                        </CollapsibleTrigger>

                                        <CollapsibleContent className="overflow-hidden">
                                            <div className="px-4 pb-4 pt-1 ml-7 border-t border-slate-100/60 mt-1">
                                                <p className="text-xs leading-relaxed text-slate-600 mb-4 whitespace-pre-wrap mt-2">
                                                    {notif.message}
                                                </p>

                                                {/* ACTION AREA - SAME BUTTON VIEW FOR BOTH */}
                                                {(notif.activitySession ||
                                                    isAppointment) && (
                                                    <div className="flex items-center justify-between gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                                        <div className="flex-1 min-w-0 flex flex-col items-start gap-1">
                                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                                                {isAppointment
                                                                    ? 'Schedule Assignment'
                                                                    : 'Linked Activity'}
                                                            </span>
                                                            <div className="flex items-center gap-2 max-w-full">
                                                                <span className="text-xs font-bold text-slate-700 truncate">
                                                                    {isAppointment
                                                                        ? notif
                                                                              .appointment
                                                                              .service
                                                                              ?.name ||
                                                                          'Therapy Appointment'
                                                                        : notif
                                                                              .activitySession
                                                                              .activity
                                                                              ?.name ||
                                                                          'Activity Session'}
                                                                </span>
                                                                {!isAppointment && (
                                                                    <Badge
                                                                        variant="outline"
                                                                        className={cn(
                                                                            'h-5 px-1.5 text-[9px] font-black uppercase tracking-widest border shrink-0',
                                                                            badgeConfig.bg,
                                                                            badgeConfig.border,
                                                                            badgeConfig.text,
                                                                        )}
                                                                    >
                                                                        {
                                                                            badgeConfig.label
                                                                        }
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <Button
                                                            size="sm"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleNotificationAction(
                                                                    notif,
                                                                );
                                                            }}
                                                            className={cn(
                                                                'shrink-0 h-8 rounded-lg font-bold text-[10px] uppercase shadow-sm transition-all px-3',
                                                                isAppointment
                                                                    ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                                                                    : 'bg-white border border-slate-200 text-indigo-600 hover:bg-indigo-50',
                                                            )}
                                                        >
                                                            {isAppointment
                                                                ? 'Open Planner'
                                                                : 'View Session'}
                                                            {isAppointment ? (
                                                                <LayoutDashboard
                                                                    size={12}
                                                                    className="ml-1.5"
                                                                />
                                                            ) : (
                                                                <ExternalLink
                                                                    size={12}
                                                                    className="ml-1.5"
                                                                />
                                                            )}
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        </CollapsibleContent>
                                    </Collapsible>
                                );
                            })}
                        </div>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
};
