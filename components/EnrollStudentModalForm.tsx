'use client';

import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { GraduationCap } from 'lucide-react';
import { toast } from 'sonner';

import EnrollStudentForm, { StudentFormValues } from './EnrollStudentForm';

// --- MOCK API (Replace with your actual API file import) ---
// import { createStudent } from '@/api/students';
const mockCreateStudent = async (data: any) =>
    new Promise((resolve) => setTimeout(resolve, 1000));

interface EnrollStudentModalProps {
    onClose: () => void;
}

export default function EnrollStudenModalForm({
    onClose,
}: EnrollStudentModalProps) {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: async (values: StudentFormValues) => {
            // Here we hardcode the role to your Strapi "Student" Role ID (e.g., '4')
            // and strip out empty passwords.
            const payload = {
                ...values,
                role: '4', // <--- CHANGE THIS TO YOUR ACTUAL STRAPI STUDENT ROLE ID
            };

            if (!payload.password) delete payload.password;

            // return createStudent(payload);
            await mockCreateStudent(payload);
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
        <div className="bg-white rounded-[32px] p-6 md:p-8 shadow-2xl border border-slate-100 w-full max-h-[90vh] overflow-y-auto relative flex flex-col">
            {/* Header */}
            <div className="mb-6 space-y-2 shrink-0">
                <div className="inline-flex items-center justify-center p-3 bg-indigo-50 rounded-2xl mb-2 w-max">
                    <GraduationCap className="w-6 h-6 text-indigo-600 stroke-[1.5px]" />
                </div>
                <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
                    Enroll New Learner
                </h2>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-widest">
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
