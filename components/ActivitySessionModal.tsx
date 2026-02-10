'use client';

import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Clock,
    Play,
    ArrowRight,
    Coffee,
    Gamepad2,
    User,
    Calendar,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

export default function ActivitySessionModal({
    isOpen,
    onClose,
    learnerName,
    activities = [],
    existingSession,
    onLaunchActivity,
    onLaunchFullSession,
}: any) {
    return (
        <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="!max-w-[1000px] !w-[90vw] h-[85vh] p-0 overflow-hidden flex flex-col rounded-[40px] border-none shadow-2xl bg-white focus:outline-none">
                <DialogHeader className="p-8 border-b flex flex-row justify-between items-center shrink-0">
                    <div className="flex items-center gap-5">
                        <div className="h-14 w-14 rounded-[22px] bg-indigo-600 flex items-center justify-center text-white text-xl font-black">
                            {learnerName?.charAt(0)}
                        </div>
                        <div>
                            <DialogTitle className="text-2xl font-[1000] text-slate-900 tracking-tight">
                                {learnerName}
                            </DialogTitle>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 flex items-center gap-2">
                                <Calendar
                                    size={12}
                                    className="text-indigo-500"
                                />
                                {existingSession?.startAt
                                    ? format(
                                          parseISO(existingSession.startAt),
                                          'MMMM do, yyyy',
                                      )
                                    : ''}
                            </p>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-1 min-h-0 bg-slate-50/20">
                    <ScrollArea className="h-full">
                        <div className="max-w-3xl mx-auto py-12 px-6 space-y-4">
                            {activities.map((session: any) => {
                                const isBreak =
                                    session.activity?.name
                                        ?.toLowerCase()
                                        .includes('break') ||
                                    session.name
                                        ?.toLowerCase()
                                        .includes('break');
                                return (
                                    <div
                                        key={session.id}
                                        className={cn(
                                            'p-6 rounded-[32px] border bg-white flex items-center justify-between transition-all hover:shadow-lg group',
                                            isBreak &&
                                                'border-dashed border-amber-200 bg-amber-50/10 shadow-none',
                                        )}
                                    >
                                        <div className="flex items-center gap-5">
                                            <div
                                                className={cn(
                                                    'h-14 w-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110',
                                                    isBreak
                                                        ? 'bg-amber-100 text-amber-600'
                                                        : 'bg-indigo-50 text-indigo-600 shadow-sm',
                                                )}
                                            >
                                                {isBreak ? (
                                                    <Coffee size={24} />
                                                ) : (
                                                    <Gamepad2 size={24} />
                                                )}
                                            </div>
                                            <div>
                                                <h4 className="font-[1000] text-lg text-slate-900 tracking-tight">
                                                    {session.activity?.name ||
                                                        (isBreak
                                                            ? 'Rest Break'
                                                            : 'Therapy Game')}
                                                </h4>
                                                <div className="flex items-center gap-3 mt-1">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                        {format(
                                                            parseISO(
                                                                session.startAt,
                                                            ),
                                                            'p',
                                                        )}
                                                    </span>
                                                    <span className="text-[10px] font-black text-indigo-500 uppercase flex items-center gap-1">
                                                        <Clock size={12} />{' '}
                                                        {Math.floor(
                                                            session.durationSeconds /
                                                                60,
                                                        )}
                                                        m Block
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <Button
                                            onClick={() =>
                                                onLaunchActivity(session)
                                            }
                                            className={cn(
                                                'h-12 px-10 rounded-2xl font-black text-[10px] uppercase shadow-sm active:scale-95 transition-all',
                                                isBreak
                                                    ? 'bg-amber-500 hover:bg-amber-600'
                                                    : 'bg-indigo-600 hover:bg-indigo-700 text-white',
                                            )}
                                        >
                                            <Play
                                                size={14}
                                                className="mr-2 fill-current"
                                            />{' '}
                                            Start Game
                                        </Button>
                                    </div>
                                );
                            })}
                        </div>
                    </ScrollArea>
                </div>

                <div className="p-8 border-t flex justify-between items-center bg-white shrink-0">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        className="font-black text-[10px] uppercase text-slate-400"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={() => onLaunchFullSession(activities)}
                        className="h-14 px-12 rounded-[22px] bg-slate-900 text-white font-[1000] text-xs uppercase tracking-[0.2em] shadow-2xl flex items-center gap-3 active:scale-95"
                    >
                        Launch Sequence <ArrowRight size={16} />
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
