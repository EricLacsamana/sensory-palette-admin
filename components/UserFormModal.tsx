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
import UserForm, { UserFormValues } from './UserForm'; // Import the new form

// --- API Functions (Import these from your actual API file) ---
const mockApiCall = async (data: any) =>
    new Promise((resolve) => setTimeout(resolve, 1000));

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

    // --- Mutations ---
    const mutation = useMutation({
        mutationFn: async (values: UserFormValues) => {
            // NOTE: Strip out empty password if editing so we don't overwrite it
            const payload = { ...values };
            if (isEditing && !payload.password) {
                delete payload.password;
            }
            // return isEditing ? updateUser(userToEdit.id, payload) : createUser(payload);
            await mockApiCall(payload);
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
        onError: (error) => {
            toast.error(error.message || 'Failed to save user.');
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
                            ? 'Update system permissions'
                            : 'Register system access'}
                    </DialogDescription>
                </DialogHeader>

                {/* Render the decoupled form component */}
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
