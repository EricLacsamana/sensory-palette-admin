'use client';

import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { UserPlus, Save } from 'lucide-react';
import { toast } from 'sonner';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import UserForm, { UserFormValues } from './UserForm';

// Import your API instance and endpoints
import api from '@/api';
import { createUser, updateUserProfile, getUsers } from '@/api/users';

interface UserFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    userToEdit?: any | null;
}

export default function UserFormModal({
    isOpen,
    onClose,
    userToEdit,
}: UserFormModalProps) {
    const queryClient = useQueryClient();
    const isEditing = !!userToEdit;

    const [isUploading, setIsUploading] = useState(false);

    // --- Helper: Check for duplicate users ---
    const handleCheckUserExists = async (username: string, email: string) => {
        try {
            // 1. Check Username (if provided)
            if (username) {
                // Strapi's /users endpoint natively supports flat filtering like ?username=...
                const userRes = await getUsers({
                    queryKey: [
                        'checkUser',
                        {
                            filters: {
                                username: { eq$: username },
                            },
                        },
                    ],
                });

                const users = Array.isArray(userRes)
                    ? userRes
                    : userRes?.data || [];

                // Explicit physical check to guarantee we only stop if there is a 100% exact match
                const isUsernameTaken = users.some(
                    (u: any) =>
                        u.username?.toLowerCase() === username.toLowerCase(),
                );

                if (isUsernameTaken) {
                    return {
                        field: 'username',
                        message: 'This username is already taken.',
                    };
                }
            }

            // 2. Check Email (if provided)
            if (email) {
                const emailRes = await getUsers({
                    queryKey: [
                        'checkUser',
                        {
                            filters: {
                                username: { eq$: email },
                            },
                        },
                    ],
                });

                const emails = Array.isArray(emailRes)
                    ? emailRes
                    : emailRes?.data || [];

                const isEmailTaken = emails.some(
                    (u: any) => u.email?.toLowerCase() === email.toLowerCase(),
                );

                if (isEmailTaken) {
                    return {
                        field: 'email',
                        message: 'This email is already registered.',
                    };
                }
            }

            return null; // No duplicates found, safe to proceed!
        } catch (error) {
            console.error('Duplicate check failed:', error);
            // If the check fails (e.g. network error), we return null to let the form submit.
            // The backend will still catch the duplicate and return a proper 400 error toast.
            return null;
        }
    };

    // --- Helper: Upload File to Strapi ---
    const uploadFilesToStrapi = async (file: File) => {
        const formData = new FormData();
        formData.append('files', file);

        const response = await api.post('/api/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });

        return response.data;
    };

    // --- Data Mutation ---
    const mutation = useMutation({
        mutationFn: async (values: UserFormValues) => {
            let payload: any = { ...values };

            // 1. Prevent overwriting with an empty password during edits
            if (isEditing && !payload.password) {
                delete payload.password;
            }

            // 2. Clean up intentionally blank fields (like N/A for diagnosis)
            if (payload.diagnosis === 'N/A') {
                payload.diagnosis = null;
            }

            // 3. Handle Profile Picture Upload
            if (payload.profilePicture instanceof File) {
                setIsUploading(true);
                try {
                    const uploadedImage = await uploadFilesToStrapi(
                        payload.profilePicture,
                    );
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
                payload.profilePicture = payload.profilePicture.id;
            } else {
                payload.profilePicture = null;
            }

            // 4. Send standard JSON to the User endpoints
            if (isEditing) {
                return await updateUserProfile(userToEdit.id, payload);
            } else {
                return await createUser(payload);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            toast.success(
                isEditing
                    ? 'User updated successfully'
                    : 'User created successfully',
            );
            onClose();
        },
        onError: (error: any) => {
            toast.error(
                error?.response?.data?.error?.message ||
                    error?.response?.data?.message ||
                    error.message ||
                    'Failed to save user.',
            );
            setIsUploading(false);
        },
    });

    const handleSubmit = (values: UserFormValues) => {
        mutation.mutate(values);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[700px] p-8 bg-white rounded-[32px] border border-slate-100 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.06)] max-h-[90vh] overflow-y-auto">
                <DialogHeader className="mb-6 space-y-2">
                    <div className="inline-flex items-center justify-center p-3 bg-indigo-50 rounded-2xl mb-2 w-max">
                        {isEditing ? (
                            <Save className="w-6 h-6 text-indigo-600 stroke-[1.5px]" />
                        ) : (
                            <UserPlus className="w-6 h-6 text-indigo-600 stroke-[1.5px]" />
                        )}
                    </div>
                    <DialogTitle className="text-2xl font-semibold tracking-tight text-slate-900">
                        {isEditing ? 'Edit User Record' : 'Create New User'}
                    </DialogTitle>
                    <DialogDescription className="text-xs font-medium text-slate-400 uppercase tracking-widest">
                        {isEditing
                            ? 'Update system permissions and personal details'
                            : 'Register new system access and profile'}
                    </DialogDescription>
                </DialogHeader>

                <UserForm
                    initialData={userToEdit}
                    onSubmit={handleSubmit}
                    onCancel={onClose}
                    onCheckUserExists={handleCheckUserExists}
                    isLoading={mutation.isPending || isUploading}
                />
            </DialogContent>
        </Dialog>
    );
}
