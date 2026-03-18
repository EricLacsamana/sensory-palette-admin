'use client';

import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { GraduationCap } from 'lucide-react';
import { toast } from 'sonner';
import { useSelector } from 'react-redux';

import EnrollStudentForm, { StudentFormValues } from './EnrollStudentForm';
import { createUser, me } from '@/api/users';
import api from '@/api'; // Import your API instance for the upload call
import { RootState } from '@/redux/store';

interface EnrollStudentModalProps {
    onClose: () => void;
}

export default function EnrollStudenModalForm({
    onClose,
}: EnrollStudentModalProps) {
    const queryClient = useQueryClient();
    const [isUploading, setIsUploading] = useState(false);

    const { token, isAuthenticated } = useSelector(
        (state: RootState) => state.auth,
    );

    const { data: user } = useQuery({
        queryKey: ['me', token],
        queryFn: me,
        enabled: isAuthenticated && !!token,
    });

    // --- Helper: Upload File to Strapi ---
    const uploadFilesToStrapi = async (file: File) => {
        const formData = new FormData();
        formData.append('files', file);

        const response = await api.post('/api/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });

        return response.data;
    };

    const mutation = useMutation({
        mutationFn: async (values: StudentFormValues) => {
            let payload: any = {
                ...values,
                role: '3', // Student Role ID
                therapist: user?.id,
            };

            // 1. Clean up intentionally blank fields
            if (payload.diagnosis === 'N/A') {
                payload.diagnosis = null;
            }

            // 2. Handle Profile Picture Upload Natively
            if (payload.profilePicture instanceof File) {
                setIsUploading(true);
                try {
                    const uploadedImage = await uploadFilesToStrapi(
                        payload.profilePicture,
                    );
                    // Attach the returned media ID to the payload
                    payload.profilePicture = uploadedImage[0].id;
                } catch (error) {
                    console.error('Image upload failed:', error);
                    throw new Error(
                        'Failed to upload profile picture. Please try again.',
                    );
                } finally {
                    setIsUploading(false);
                }
            } else if (payload.profilePicture && payload.profilePicture.id) {
                // Failsafe in case an existing object is passed
                payload.profilePicture = payload.profilePicture.id;
            } else {
                // Prevent sending invalid data if no file is present
                payload.profilePicture = null;
            }

            // 3. Submit final JSON payload
            return await createUser(payload);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['students'] });
            toast.success('Learner successfully enrolled!');
            onClose();
        },
        onError: (error: any) => {
            toast.error(
                error?.response?.data?.error?.message ||
                    error?.response?.data?.message ||
                    error.message ||
                    'Failed to enroll learner.',
            );
            setIsUploading(false);
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
                // Pass combined loading state to disable form actions during upload
                isLoading={mutation.isPending || isUploading}
            />
        </div>
    );
}
