'use client';

import React from 'react';
import {
    Activity,
    MessageCircle,
    Zap,
    Calendar,
    Target,
    FileJson,
    ArrowRight,
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { FormatService } from '@/utils/helpers';
import { Button } from './ui/button';

export function SessionDetailView({ session }: { session: any }) {
    return (
        <div className="flex flex-col h-full overflow-hidden font-sans">
            {/* Header Block */}
            <div className="bg-white p-8 border-b border-slate-100 shrink-0">
                <div className="flex items-center gap-2 text-indigo-600 font-bold text-[10px] uppercase tracking-[0.2em] mb-5">
                    <Activity size={14} /> Clinical Log Entry
                </div>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight leading-none mb-2">
                    {session.student?.firstName} {session.student?.lastName}
                </h2>
                <p className="text-sm font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    {session.activity?.name} <ArrowRight size={10} />{' '}
                    {FormatService.formatDateTime(session.startAt)}
                </p>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                {/* Score Section */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">
                            Accuracy Score
                        </span>
                        <div className="text-3xl font-black text-slate-900 tabular-nums">
                            {session.score ?? 0}%
                        </div>
                    </div>
                    <div className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">
                            Status
                        </span>
                        <div className="text-xs font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2 py-1 rounded-lg w-fit mt-1">
                            {session.activitySessionStatus}
                        </div>
                    </div>
                </div>

                <Separator className="bg-slate-100" />

                {/* AI Recommendation */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-indigo-50 rounded-lg text-indigo-600">
                            <Zap size={14} fill="currentColor" />
                        </div>
                        <span className="text-[11px] font-black uppercase tracking-widest text-slate-900">
                            Clinical AI Insight
                        </span>
                    </div>
                    <div className="bg-indigo-600 rounded-[32px] p-7 text-white shadow-xl shadow-indigo-100 leading-relaxed relative overflow-hidden group">
                        <Zap
                            size={60}
                            className="absolute -right-4 -top-4 opacity-10 rotate-12"
                        />
                        <p className="text-sm font-medium opacity-95 relative z-10 italic">
                            "
                            {session.recommendationActivity ||
                                'Consistent tactical feedback is improving learner engagement. Recommend increasing difficulty in next module.'}
                            "
                        </p>
                    </div>
                </div>

                {/* Clinician Notes */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-slate-100 rounded-lg text-slate-600">
                            <MessageCircle size={14} />
                        </div>
                        <span className="text-[11px] font-black uppercase tracking-widest text-slate-900">
                            Clinician Field Notes
                        </span>
                    </div>
                    <div className="bg-white border border-slate-100 rounded-[32px] p-7 text-slate-600 text-sm leading-relaxed shadow-sm">
                        {session.teacherNotes ||
                            'No clinical notes were recorded during this session.'}
                    </div>
                </div>

                {/* Technical Meta */}
                <div className="bg-slate-50/50 rounded-2xl p-5 border border-slate-100">
                    <div className="flex items-center gap-2 mb-4">
                        <FileJson size={14} className="text-slate-400" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                            Technical Identifier
                        </span>
                    </div>
                    <code className="text-[10px] font-mono text-slate-500 break-all bg-white p-2 rounded-lg border border-slate-100 block">
                        SESSION_ID: {session.sessionId || 'NOT_ASSIGNED'}
                    </code>
                </div>
            </div>

            {/* Footer Action */}
            <div className="p-6 bg-white border-t border-slate-100 shrink-0">
                <Button className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold uppercase tracking-widest text-[10px]">
                    Download Evaluation Report
                </Button>
            </div>
        </div>
    );
}
