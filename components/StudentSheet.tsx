'use client';

import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';

export function StudentDetailsSheet({ student, isOpen, onOpenChange }: any) {
    if (!student) return null;

    return (
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-md border-l-slate-200 p-8">
                <SheetHeader className="space-y-5">
                    <div className="h-20 w-20 rounded-3xl bg-indigo-50 border border-indigo-100/50 flex items-center justify-center text-indigo-600 text-2xl font-semibold">
                        {student.firstName[0]}
                    </div>
                    <div>
                        <SheetTitle className="text-2xl font-semibold text-slate-900 tracking-tight">
                            {student.firstName} {student.lastName}
                        </SheetTitle>
                        <SheetDescription className="text-sm font-medium text-slate-500 mt-1">
                            Learner ID: #
                            {student.id.toString().padStart(4, '0')}
                        </SheetDescription>
                    </div>
                </SheetHeader>

                <div className="mt-10 space-y-8">
                    <section>
                        <h4 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400 mb-4">
                            Clinical Profile
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <p className="text-slate-500 text-[10px] uppercase font-semibold tracking-wider mb-1.5">
                                    Diagnostic
                                </p>
                                <p className="font-semibold text-slate-900 text-sm">
                                    {student.diagnosis || 'Standard'}
                                </p>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <p className="text-slate-500 text-[10px] uppercase font-semibold tracking-wider mb-1.5">
                                    Attendance
                                </p>
                                <p className="font-semibold text-emerald-600 text-sm">
                                    98.2%
                                </p>
                            </div>
                        </div>
                    </section>

                    <Separator className="bg-slate-100" />

                    <section>
                        <h4 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400 mb-4">
                            Recent Activity
                        </h4>
                        <div className="space-y-3">
                            <div className="text-xs p-4 border border-slate-100 rounded-2xl bg-white shadow-sm flex justify-between items-center">
                                <span className="text-slate-600 font-medium">
                                    Completed Sensory Task #4
                                </span>
                                <span className="text-indigo-600 font-semibold bg-indigo-50 px-2 py-1 rounded-lg">
                                    88/100
                                </span>
                            </div>
                        </div>
                    </section>
                </div>
            </SheetContent>
        </Sheet>
    );
}
