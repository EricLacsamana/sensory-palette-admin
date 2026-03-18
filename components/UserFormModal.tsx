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

    // We can add a local loading state to track the upload phase specifically if desired,
    // though mutation.isPending will cover the whole process.
    const [isUploading, setIsUploading] = useState(false);

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
                // If it's an existing image object from Strapi, just pass its ID back
                payload.profilePicture = payload.profilePicture.id;
            } else {
                // If it's null or removed, ensure we don't send invalid data
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
        // Start the mutation flow
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
                    // Disable the form if the mutation is pending OR if the image is actively uploading
                    isLoading={mutation.isPending || isUploading}
                />
            </DialogContent>
        </Dialog>
    );
}
