'use client';

import React from 'react';
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
import { createUser, updateUserProfile } from '@/api/users';

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

    // --- Data Mutation ---
    const mutation = useMutation({
        mutationFn: async (values: UserFormValues) => {
            const payload = { ...values };

            // 1. Prevent overwriting with an empty password during edits
            if (isEditing && !payload.password) {
                delete payload.password;
            }

            // 2. Initialize FormData for file upload support
            const formData = new FormData();

            // 3. Append all values to FormData
            Object.entries(payload).forEach(([key, value]) => {
                if (value instanceof File) {
                    // Handle the actual File object
                    formData.append(key, value);
                } else if (value !== undefined && value !== null) {
                    // Convert booleans and numbers to strings
                    formData.append(key, String(value));
                } else if (value === null) {
                    // Send an empty string for intentional nulls (like 'N/A' diagnosis)
                    formData.append(key, '');
                }
            });

            // 4. Send FormData instead of standard JSON
            if (isEditing) {
                // Assuming userToEdit has an id or _id field
                return await updateUserProfile(userToEdit.id, formData);
            } else {
                return await createUser(formData);
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
                error?.response?.data?.message ||
                    error.message ||
                    'Failed to save user.',
            );
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

                {/* Pure Form Component */}
                <UserForm
                    initialData={userToEdit}
                    onSubmit={handleSubmit}
                    onCancel={onClose}
                    isLoading={mutation.isPending}
                />
            </DialogContent>
        </Dialog>
    );
}
