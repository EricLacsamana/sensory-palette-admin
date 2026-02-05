'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import {
    User,
    Mail,
    Hash,
    BookOpen,
    ArrowRight,
    X,
    Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

export default function EnrollStudentForm({
    onClose,
}: {
    onClose?: () => void;
}) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { register, handleSubmit, reset } = useForm();

    const onSubmit = async (data: any) => {
        setIsSubmitting(true);
        await new Promise((resolve) => setTimeout(resolve, 1000));

        toast.success('Learner Enrolled Successfully', {
            description: `${data.firstName} ${data.lastName} is now active.`,
        });

        setIsSubmitting(false);
        reset();
        if (onClose) onClose();
    };

    return (
        <Card className="w-full max-w-2xl mx-auto rounded-[32px] border-none shadow-2xl bg-white overflow-hidden">
            <CardHeader className="bg-slate-50/50 p-8 border-b border-slate-100 relative">
                <div className="h-14 w-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white mb-4 shadow-lg shadow-indigo-100">
                    <User size={28} />
                </div>
                <CardTitle className="text-2xl font-black text-slate-900 tracking-tight">
                    Enroll New Learner
                </CardTitle>
                <CardDescription className="text-slate-500 uppercase tracking-widest text-[10px] mt-1">
                    Academic Year 2026 Registration
                </CardDescription>
            </CardHeader>

            <CardContent className="p-8">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">
                                First Name
                            </Label>
                            <Input
                                {...register('firstName')}
                                placeholder="John"
                                className="h-12 rounded-2xl border-slate-200 bg-slate-50/50 px-4"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">
                                Last Name
                            </Label>
                            <Input
                                {...register('lastName')}
                                placeholder="Doe"
                                className="h-12 rounded-2xl border-slate-200 bg-slate-50/50 px-4"
                            />
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">
                                Email Address
                            </Label>
                            <Input
                                {...register('email')}
                                type="email"
                                placeholder="john.doe@sensory.palette.ph"
                                className="h-12 rounded-2xl border-slate-200 bg-slate-50/50 px-4"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">
                                    Student ID
                                </Label>
                                <Input
                                    {...register('id')}
                                    placeholder="2026-X"
                                    className="h-12 rounded-2xl border-slate-200 bg-slate-50/50 px-4 font-mono"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">
                                    Grade
                                </Label>
                                <select
                                    {...register('grade')}
                                    className="w-full h-12 rounded-2xl border border-slate-200 bg-slate-50/50 px-4 text-sm outline-none appearance-none"
                                >
                                    <option>Level 1</option>
                                    <option>Level 2</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest text-[11px]"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-[2] h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 font-black uppercase tracking-widest text-[11px]"
                        >
                            {isSubmitting ? (
                                <Loader2 className="animate-spin h-5 w-5" />
                            ) : (
                                <>
                                    Complete Enrollment{' '}
                                    <ArrowRight className="ml-2 h-4 w-4 stroke-[3px]" />
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
