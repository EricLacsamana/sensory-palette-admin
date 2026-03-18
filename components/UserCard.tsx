'use client';

import React from 'react';
import {
    MoreVertical,
    Shield,
    HeartPulse,
    GraduationCap,
    Briefcase,
    Mail,
    Edit,
    Trash2,
    CheckCircle2,
    Ban,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { FormatService } from '@/utils/helpers';

const getInitials = (
    firstName?: string,
    lastName?: string,
    username?: string,
) => {
    if (firstName && lastName)
        return `${firstName[0]}${lastName[0]}`.toUpperCase();
    if (username) return username.substring(0, 2).toUpperCase();
    return 'U';
};

const getRoleDetails = (roleName: string) => {
    const role = roleName?.toLowerCase() || 'user';
    if (role.includes('admin'))
        return {
            icon: Shield,
            color: 'bg-rose-50 text-rose-600 border-rose-100',
            iconBg: 'bg-rose-100/50',
        };
    if (role.includes('therapist'))
        return {
            icon: HeartPulse,
            color: 'bg-emerald-50 text-emerald-600 border-emerald-100',
            iconBg: 'bg-emerald-100/50',
        };
    if (role.includes('secretary'))
        return {
            icon: Briefcase,
            color: 'bg-amber-50 text-amber-600 border-amber-100',
            iconBg: 'bg-amber-100/50',
        };
    if (role.includes('student'))
        return {
            icon: GraduationCap,
            color: 'bg-indigo-50 text-indigo-600 border-indigo-100',
            iconBg: 'bg-indigo-100/50',
        };

    return {
        icon: Shield,
        color: 'bg-slate-50 text-slate-600 border-slate-100',
        iconBg: 'bg-slate-100',
    };
};

export function UserCard({
    user,
    onEdit,
}: {
    user: any;
    onEdit?: (user: any) => void;
}) {
    const displayName =
        [user.firstName, user.lastName].filter(Boolean).join(' ') ||
        user.username;
    const roleName = user.role?.name || user.role || 'Unknown Role';
    const RoleData = getRoleDetails(roleName);
    const RoleIcon = RoleData.icon;

    return (
        <div className="bg-white rounded-[32px] border border-slate-200/60 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col group h-full">
            <div className="p-6 flex flex-col flex-1 relative">
                {/* --- STATUS BADGES --- */}
                <div className="absolute top-5 left-6 flex items-center gap-1.5">
                    {user.blocked ? (
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-100">
                            <Ban size={10} strokeWidth={2.5} />
                            <span className="text-[9px] font-bold uppercase tracking-wider">
                                Blocked
                            </span>
                        </div>
                    ) : user.confirmed ? (
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-500 border border-emerald-100">
                            <CheckCircle2 size={10} strokeWidth={2.5} />
                            <span className="text-[9px] font-bold uppercase tracking-wider">
                                Verified
                            </span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-50 text-slate-400 border border-slate-200">
                            <span className="text-[9px] font-bold uppercase tracking-wider">
                                Pending
                            </span>
                        </div>
                    )}
                </div>

                {/* --- ACTIONS --- */}
                <div className="absolute top-4 right-4">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                            >
                                <MoreVertical size={18} />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            align="end"
                            className="w-44 rounded-2xl border-slate-100 shadow-2xl p-1.5"
                        >
                            <DropdownMenuItem
                                onClick={() => onEdit?.(user)}
                                className="rounded-xl text-xs font-bold uppercase tracking-wide py-2.5 cursor-pointer text-slate-600 focus:bg-indigo-50 focus:text-indigo-600"
                            >
                                <Edit className="mr-2 h-4 w-4" /> Edit Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem className="rounded-xl text-xs font-bold uppercase tracking-wide py-2.5 cursor-pointer text-rose-600 focus:bg-rose-50 focus:text-rose-700">
                                <Trash2 className="mr-2 h-4 w-4" /> Delete User
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* --- IDENTITY SECTION --- */}
                <div className="flex flex-col items-center mt-10 text-center">
                    <div className="relative mb-4">
                        <Avatar className="h-20 w-20 rounded-[28px] border-4 border-white shadow-md ring-1 ring-slate-100 group-hover:scale-105 transition-transform duration-500">
                            {/* 🚨 FIX: Pass the whole object, not just .url */}
                            <AvatarImage
                                src={FormatService.formatStrapiMedia(
                                    user.profilePicture,
                                    'thumbnail',
                                )}
                                alt={displayName}
                                className="object-cover"
                            />
                            <AvatarFallback className="bg-indigo-50 text-indigo-600 font-bold text-xl">
                                {getInitials(
                                    user.firstName,
                                    user.lastName,
                                    user.username,
                                )}
                            </AvatarFallback>
                        </Avatar>
                        <div
                            className={cn(
                                'absolute bottom-0 right-0 h-5 w-5 rounded-full border-[4px] border-white shadow-sm',
                                user.blocked ? 'bg-rose-500' : 'bg-emerald-500',
                            )}
                        />
                    </div>

                    <h3 className="font-bold text-slate-900 text-lg mb-1 leading-tight px-2">
                        {displayName}
                    </h3>

                    <div className="flex items-center gap-1.5 text-slate-400 mb-6 group-hover:text-slate-500 transition-colors">
                        <Mail size={13} strokeWidth={2} />
                        <span className="text-[11px] font-medium truncate max-w-[190px]">
                            {user.email}
                        </span>
                    </div>

                    <div
                        className={cn(
                            'inline-flex items-center gap-2 pl-1.5 pr-3 py-1 rounded-xl border transition-all duration-300',
                            RoleData.color,
                        )}
                    >
                        <div className={cn('p-1 rounded-lg', RoleData.iconBg)}>
                            <RoleIcon size={14} strokeWidth={2.5} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.1em] leading-none">
                            {roleName}
                        </span>
                    </div>
                </div>
            </div>

            <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex justify-between items-center mt-auto">
                <div className="flex flex-col">
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">
                        Username
                    </span>
                    <span className="text-[10px] font-bold text-slate-600 font-mono">
                        @{user.username}
                    </span>
                </div>
                <div className="flex flex-col items-end">
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">
                        Gender
                    </span>
                    <span className="text-[10px] font-bold text-slate-600">
                        {user.gender || 'N/A'}
                    </span>
                </div>
            </div>
        </div>
    );
}
