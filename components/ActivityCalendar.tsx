'use client';

import React, { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format, isSameDay, parseISO } from 'date-fns';
import { ClipboardList, Target, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ActivityCalendar({ sessions }: { sessions: any[] }) {
    const [date, setDate] = useState<Date | undefined>(new Date());

    // Filter sessions for the selected day
    const selectedSessions = sessions.filter((s) =>
        s.startTime ? isSameDay(parseISO(s.startTime), date!) : false,
    );

    // Create a list of dates that have sessions for highlighting
    const sessionDates = sessions.map((s) => parseISO(s.startTime));

    return (
        <div className="flex flex-col gap-4">
            <Card className="border-slate-200 shadow-sm overflow-hidden">
                <CardContent className="p-3">
                    <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        className="rounded-md"
                        modifiers={{ hasSession: sessionDates }}
                        modifiersClassNames={{
                            hasSession:
                                'bg-indigo-50 text-indigo-700 font-black rounded-full',
                        }}
                    />
                </CardContent>
            </Card>

            <Card className="bg-white border-slate-200 shadow-sm overflow-hidden min-h-[250px]">
                <CardHeader className="bg-slate-50/50 py-3 px-4 border-b border-slate-100">
                    <CardTitle className="text-xs font-bold flex items-center gap-2 uppercase tracking-widest text-slate-500">
                        <ClipboardList className="h-3.5 w-3.5 text-indigo-600" />
                        {date ? format(date, 'MMM dd, yyyy') : 'Select a day'}
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                    {selectedSessions.length > 0 ? (
                        selectedSessions.map((session) => (
                            <div
                                key={session.id}
                                className="border-b border-slate-50 pb-3 last:border-0 group"
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <Badge
                                        variant="outline"
                                        className="text-[9px] font-black uppercase tracking-tighter h-5"
                                    >
                                        {session.activityStatus}
                                    </Badge>
                                    <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold">
                                        <Clock size={10} />
                                        {format(
                                            parseISO(session.startTime),
                                            'p',
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-slate-700">
                                            {session.activity?.name ||
                                                'Therapy Session'}
                                        </span>
                                        <div className="flex items-center gap-1 mt-1">
                                            <Target className="h-3 w-3 text-emerald-500" />
                                            <span className="text-[11px] font-bold text-emerald-600">
                                                {session.successRate
                                                    ? `${(session.successRate * 100).toFixed(0)}% Accuracy`
                                                    : 'N/A'}
                                            </span>
                                        </div>
                                    </div>
                                    <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">
                                        {session.actualScore || 0} pts
                                    </span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 opacity-40">
                            <ClipboardList
                                size={32}
                                className="mb-2 text-slate-300"
                            />
                            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                                No sessions logged
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
