'use client';

import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { GraduationCap } from 'lucide-react';
import { toast } from 'sonner';

import EnrollStudentForm, { StudentFormValues } from './EnrollStudentForm';
import { createUser, me } from '@/api/users';
import { RootState } from '@/redux/store';
import { useSelector } from 'react-redux';

interface EnrollStudentModalProps {
    onClose: () => void;
}

export default function EnrollStudenModalForm({
    onClose,
}: EnrollStudentModalProps) {
    const queryClient = useQueryClient();
    const { token, isAuthenticated } = useSelector(
        (state: RootState) => state.auth,
    );
    const { data: user } = useQuery({
        queryKey: ['me', token],
        queryFn: me,
        enabled: isAuthenticated && !!token,
    });

    const mutation = useMutation({
        mutationFn: async (values: StudentFormValues) => {
            const payload = {
                ...values,
                role: '6',
                therapist: user.id,
            };

            if (!payload.password) delete payload.password;

            await createUser(payload);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['students'] });
            toast.success('Learner successfully enrolled!');
            onClose();
        },
        onError: (error) => {
            toast.error(error.message || 'Failed to enroll learner.');
        },
    });

    const handleSubmit = (values: StudentFormValues) => {
        mutation.mutate(values);
    };

    return (
        <div className="bg-white rounded-[2.5rem] p-6 md:p-8 shadow-2xl border border-slate-100 w-full max-h-[90vh] overflow-y-auto relative flex flex-col">
            {/* Header */}
            <div className="mb-8 space-y-2 shrink-0">
                <div className="inline-flex items-center justify-center p-3.5 bg-indigo-50 rounded-[1.25rem] mb-3 shadow-inner">
                    <GraduationCap className="w-6 h-6 text-indigo-600 stroke-[2px]" />
                </div>
                <h2 className="text-3xl font-black tracking-tight text-slate-900 leading-none">
                    Enroll New Learner
                </h2>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">
                    Create a new student record
                </p>
            </div>

            {/* Form Wizard */}
            <EnrollStudentForm
                onSubmit={handleSubmit}
                onCancel={onClose}
                isLoading={mutation.isPending}
            />
        </div>
    );
}
