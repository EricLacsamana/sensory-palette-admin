'use client';

import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
    Sparkles,
    BrainCircuit,
    Activity,
    Clock,
    Target,
    ChevronLeft,
    Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { triggerActivitySessionRecommendation } from '@/api/acitivity-session';

export default function AnalysisDashboardView({ session }: { session: any }) {
    const queryClient = useQueryClient();

    const aiMutation = useMutation({
        mutationFn: triggerActivitySessionRecommendation,
        onSuccess: () => {
            toast.success('Clinical insights updated');
            queryClient.invalidateQueries({
                queryKey: ['activity-session', session.documentId],
            });
        },
    });

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-12">
            <div className="mx-auto max-w-5xl space-y-8">
                <header className="flex justify-between items-end">
                    <div>
                        <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-2">
                            Post-Session Analysis
                        </p>
                        <h1 className="text-3xl font-[1000] text-slate-900">
                            {session.activity?.name}
                        </h1>
                    </div>
                    <Button
                        onClick={() => aiMutation.mutate(session.documentId)}
                        disabled={aiMutation.isPending}
                        className="bg-indigo-600 text-white shadow-xl shadow-indigo-200"
                    >
                        {aiMutation.isPending ? (
                            <Loader2 className="animate-spin mr-2" />
                        ) : (
                            <Sparkles className="mr-2" />
                        )}
                        Generate AI Recommendation
                    </Button>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Performance Metrics */}
                    <Card className="md:col-span-2">
                        <CardHeader>
                            <CardTitle className="text-sm font-bold uppercase text-slate-400">
                                Core Metrics
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-3 gap-4">
                            <MetricItem
                                label="Score"
                                value={`${session.actualScore}%`}
                            />
                            <MetricItem
                                label="Latency"
                                value={`${session.avgLatency}ms`}
                            />
                            <MetricItem
                                label="Prompt"
                                value={session.promptLevel}
                            />
                        </CardContent>
                    </Card>

                    {/* AI Insight Card */}
                    {(session.aiRecommendation || aiMutation.isPending) && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="md:col-span-3"
                        >
                            <Card className="border-2 border-indigo-500 bg-indigo-50/50">
                                <CardContent className="p-8 flex flex-col md:flex-row gap-6">
                                    <div className="h-14 w-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shrink-0">
                                        <BrainCircuit size={32} />
                                    </div>
                                    <div className="space-y-4">
                                        <h3 className="text-xl font-bold text-indigo-900">
                                            Gemini Clinical Insight
                                        </h3>
                                        {aiMutation.isPending ? (
                                            <div className="space-y-2 animate-pulse">
                                                <div className="h-4 w-full bg-indigo-100 rounded" />
                                                <div className="h-4 w-2/3 bg-indigo-100 rounded" />
                                            </div>
                                        ) : (
                                            <p className="text-indigo-800 text-lg italic leading-relaxed">
                                                "{session.aiRecommendation}"
                                            </p>
                                        )}
                                        {session.recommendationActivity && (
                                            <Badge
                                                variant="outline"
                                                className="border-indigo-300 text-indigo-700 bg-white"
                                            >
                                                Next Step:{' '}
                                                {
                                                    session
                                                        .recommendationActivity
                                                        .name
                                                }
                                            </Badge>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
}

function MetricItem({ label, value }: { label: string; value: string }) {
    return (
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">
                {label}
            </p>
            <p className="text-xl font-black text-slate-900 capitalize">
                {value}
            </p>
        </div>
    );
}
