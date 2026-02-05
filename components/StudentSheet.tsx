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
            <SheetContent className="sm:max-w-md border-l-slate-200">
                <SheetHeader className="space-y-4">
                    <div className="h-20 w-20 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 text-2xl font-bold">
                        {student.firstName[0]}
                    </div>
                    <div>
                        <SheetTitle className="text-2xl font-bold">
                            {student.firstName} {student.lastName}
                        </SheetTitle>
                        <SheetDescription>
                            Student ID: {student.id}
                        </SheetDescription>
                    </div>
                </SheetHeader>

                <div className="mt-8 space-y-6">
                    <section>
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">
                            Academic Info
                        </h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="p-3 bg-slate-50 rounded-xl">
                                <p className="text-slate-400 text-[10px] uppercase font-bold">
                                    Current Grade
                                </p>
                                <p className="font-bold text-slate-900">
                                    Grade 10 - A
                                </p>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-xl">
                                <p className="text-slate-400 text-[10px] uppercase font-bold">
                                    Attendance
                                </p>
                                <p className="font-bold text-emerald-600">
                                    98.2%
                                </p>
                            </div>
                        </div>
                    </section>

                    <Separator />

                    <section>
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">
                            Recent Activity
                        </h4>
                        <div className="space-y-3">
                            {/* Placeholder for activity log */}
                            <div className="text-xs p-3 border border-slate-100 rounded-lg">
                                Completed &quot;Math Quiz #4&quot; —{' '}
                                <span className="text-indigo-600 font-bold">
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
