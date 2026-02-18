'use client';

import React from 'react';
import {
    Edit,
    MoreVertical,
    Shield,
    HeartPulse,
    GraduationCap,
    Briefcase,
    Trash2,
    CheckCircle2,
    Ban,
    UserCircle2,
} from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

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
        icon: UserCircle2,
        color: 'bg-slate-50 text-slate-600 border-slate-100',
        iconBg: 'bg-slate-100',
    };
};

export default function UsersTable({
    users,
    onEdit,
}: {
    users: any[];
    onEdit?: (user: any) => void;
}) {
    return (
        <Table className="relative">
            <TableHeader className="bg-slate-50/50 border-b border-slate-100">
                <TableRow className="hover:bg-transparent border-none">
                    <TableHead className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 h-12 pl-6">
                        Identity & Contact
                    </TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 h-12">
                        System Access
                    </TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 h-12">
                        Status
                    </TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 h-12 text-right pr-6">
                        Actions
                    </TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {users.map((user) => {
                    const displayName =
                        [user.firstName, user.lastName]
                            .filter(Boolean)
                            .join(' ') || user.username;
                    const roleName = user.role?.name || user.role || 'Unknown';
                    const RoleData = getRoleDetails(roleName);
                    const RoleIcon = RoleData.icon;

                    return (
                        <TableRow
                            key={user.id}
                            className="border-slate-100 hover:bg-indigo-50/30 transition-colors group"
                        >
                            <TableCell className="py-4 pl-6">
                                <div className="flex items-center gap-4">
                                    <Avatar className="h-10 w-10 rounded-xl border border-slate-100 shadow-sm transition-transform group-hover:scale-105">
                                        <AvatarImage
                                            src={user.profilePicture?.url}
                                            alt={displayName}
                                            className="object-cover"
                                        />
                                        <AvatarFallback className="bg-indigo-50 text-indigo-600 text-xs font-black">
                                            {getInitials(
                                                user.firstName,
                                                user.lastName,
                                                user.username,
                                            )}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-slate-900 leading-tight">
                                            {displayName}
                                        </span>
                                        <span className="text-[11px] font-medium text-slate-400 font-mono">
                                            {user.email}
                                        </span>
                                    </div>
                                </div>
                            </TableCell>

                            <TableCell className="py-4">
                                <div
                                    className={cn(
                                        'inline-flex items-center gap-2 pl-1.5 pr-3 py-1 rounded-xl border',
                                        RoleData.color,
                                    )}
                                >
                                    <div
                                        className={cn(
                                            'p-1 rounded-lg',
                                            RoleData.iconBg,
                                        )}
                                    >
                                        <RoleIcon size={12} strokeWidth={2.5} />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-wider leading-none">
                                        {roleName}
                                    </span>
                                </div>
                            </TableCell>

                            <TableCell className="py-4">
                                <div className="flex gap-2">
                                    {user.blocked ? (
                                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 text-rose-600 border border-rose-100">
                                            <Ban size={10} strokeWidth={3} />
                                            <span className="text-[9px] font-black uppercase tracking-widest">
                                                Blocked
                                            </span>
                                        </div>
                                    ) : user.confirmed ? (
                                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
                                            <CheckCircle2
                                                size={10}
                                                strokeWidth={3}
                                            />
                                            <span className="text-[9px] font-black uppercase tracking-widest">
                                                Verified
                                            </span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-50 text-slate-400 border border-slate-200">
                                            <span className="text-[9px] font-black uppercase tracking-widest">
                                                Pending
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </TableCell>

                            <TableCell className="py-4 text-right pr-6">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-9 w-9 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-white shadow-none"
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
                                            <Edit className="mr-2 h-4 w-4" />{' '}
                                            Edit Profile
                                        </DropdownMenuItem>
                                        <DropdownMenuItem className="rounded-xl text-xs font-bold uppercase tracking-wide py-2.5 cursor-pointer text-rose-600 focus:bg-rose-50 focus:text-rose-700">
                                            <Trash2 className="mr-2 h-4 w-4" />{' '}
                                            Terminate Access
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    );
                })}

                {/* --- BOTTOM SPACING ROW --- */}
                {/* This ensures the table doesn't feel cramped at the end of the scroll */}
                <TableRow className="hover:bg-transparent border-none">
                    <TableCell colSpan={4} className="h-10" />
                </TableRow>
            </TableBody>
        </Table>
    );
}
