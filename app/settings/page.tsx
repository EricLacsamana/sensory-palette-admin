'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import {
    User as UserIcon,
    Lock,
    Bell,
    Sliders,
    Upload,
    Save,
    Loader2,
    Mail,
    ShieldCheck,
    Zap,
} from 'lucide-react';
import { toast } from 'sonner';

import { me, updateUserProfile, changePassword } from '@/api/users';
import { RootState } from '@/redux/store';
import { FormatService } from '@/utils/helpers';
import { cn } from '@/lib/utils';

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';

type TabType = 'profile' | 'security' | 'preferences' | 'notifications';

interface ProfileFormValues {
    firstName: string;
    lastName: string;
    email: string;
}

interface SecurityFormValues {
    currentPassword: string;
    password: string;
    passwordConfirmation: string;
}

const getStorageBool = (key: string, defaultVal: boolean) => {
    if (typeof window === 'undefined') return defaultVal;
    const val = localStorage.getItem(key);
    if (val === null) return defaultVal;
    return val === 'true';
};

export default function SettingsPage() {
    const queryClient = useQueryClient();
    const { token, isAuthenticated } = useSelector(
        (state: RootState) => state.auth,
    );

    const [activeTab, setActiveTab] = useState<TabType>('profile');

    // UI states
    const [mounted, setMounted] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Local Image Preview State
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    // Preferences State
    const [autoStart, setAutoStart] = useState(true);
    const [handsFree, setHandsFree] = useState(false);

    // Prevent Cascading Renders by deferring the state update slightly
    useEffect(() => {
        const timer = setTimeout(() => {
            setAutoStart(getStorageBool('therapist_auto_start', true));
            setHandsFree(getStorageBool('therapist_hands_free', false));
            setMounted(true);
        }, 0);
        return () => clearTimeout(timer);
    }, []);

    const { data: user, isLoading } = useQuery({
        queryKey: ['me', token],
        queryFn: me,
        enabled: isAuthenticated && !!token,
    });

    // --- FORM 1: PROFILE ---
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ProfileFormValues>({
        values: {
            firstName: user?.firstName || '',
            lastName: user?.lastName || '',
            email: user?.email || '',
        },
    });

    // --- FORM 2: SECURITY ---
    const {
        register: registerSecurity,
        handleSubmit: handleSecuritySubmit,
        reset: resetSecurityForm,
        watch: watchSecurity,
        formState: { errors: securityErrors },
    } = useForm<SecurityFormValues>();

    const newPassword = watchSecurity('password');

    // Profile Mutation
    const updateProfileMutation = useMutation({
        mutationFn: (data: any) => updateUserProfile(user.id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['me'] });
            toast.success('Profile updated successfully');
            setSelectedImage(null);
            setPreviewUrl(null);
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to update profile');
            console.error(error);
        },
    });

    // Password Change Mutation
    const changePasswordMutation = useMutation({
        mutationFn: (data: SecurityFormValues) => changePassword(data),
        onSuccess: () => {
            toast.success('Password updated securely!');
            resetSecurityForm();
        },
        onError: (error: any) => {
            // This pops up the beautiful red Toast notification on the screen
            toast.error(error.message || 'Failed to update password');

            // (Removed the console.error line so your terminal stays clean!)
        },
    });
    // Submit Profile Logic
    const onSubmitProfile = async (data: ProfileFormValues) => {
        setIsSaving(true);
        const toastId = toast.loading('Saving profile data...');

        try {
            let profilePictureId = user?.profilePicture?.id;

            if (selectedImage) {
                const strapiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(
                    /\/$/,
                    '',
                );
                const formData = new FormData();
                formData.append('files', selectedImage);

                const uploadResponse = await fetch(`${strapiUrl}/api/upload`, {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${token}` },
                    body: formData,
                });

                if (!uploadResponse.ok) {
                    const rawText = await uploadResponse.text();
                    let errorMessage = `Upload failed (Status: ${uploadResponse.status})`;
                    try {
                        const errObj = JSON.parse(rawText);
                        errorMessage = errObj?.error?.message || errorMessage;
                    } catch (e) {}
                    throw new Error(errorMessage);
                }

                const uploadedFiles = await uploadResponse.json();
                profilePictureId = uploadedFiles[0].id;
            }

            const payload = {
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
                profilePicture: profilePictureId,
            };

            await updateProfileMutation.mutateAsync(payload);
            toast.dismiss(toastId);
        } catch (error: any) {
            toast.error(error.message || 'An error occurred while saving.', {
                id: toastId,
            });
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    // Submit Security Logic
    const onSubmitSecurity = (data: SecurityFormValues) => {
        changePasswordMutation.mutate(data);
    };

    const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toast.error('Please select a valid image file (JPG, PNG).');
            return;
        }

        setSelectedImage(file);
        setPreviewUrl(URL.createObjectURL(file));
    };

    const handleTogglePreference = (key: string, val: boolean) => {
        if (typeof window !== 'undefined')
            localStorage.setItem(key, String(val));
        if (key === 'therapist_auto_start') setAutoStart(val);
        if (key === 'therapist_hands_free') {
            setHandsFree(val);
            if (val && !autoStart) {
                setAutoStart(true);
                localStorage.setItem('therapist_auto_start', 'true');
            }
        }
        toast.success('Preferences saved automatically');
    };

    if (isLoading)
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
                <Loader2 className="animate-spin text-indigo-600 h-8 w-8" />
            </div>
        );

    const avatarImageSrc =
        previewUrl ||
        FormatService.formatStrapiMedia(user?.profilePicture, 'thumbnail') ||
        undefined;

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-24">
            <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-slate-100 to-transparent pointer-events-none" />

            <div className="max-w-6xl mx-auto p-6 lg:p-10 relative z-10">
                <header className="mb-10">
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                        System Settings
                    </h1>
                    <p className="text-sm font-medium text-slate-500 mt-2">
                        Manage your account parameters and platform preferences.
                    </p>
                </header>

                <div className="flex flex-col lg:flex-row gap-8 items-start">
                    {/* --- SIDEBAR NAVIGATION --- */}
                    <Card className="w-full lg:w-72 shrink-0 rounded-3xl border border-slate-200 shadow-sm bg-white overflow-hidden p-2">
                        <nav className="flex flex-col gap-1">
                            <TabButton
                                active={activeTab === 'profile'}
                                onClick={() => setActiveTab('profile')}
                                icon={UserIcon}
                                label="Personal Profile"
                            />
                            <TabButton
                                active={activeTab === 'preferences'}
                                onClick={() => setActiveTab('preferences')}
                                icon={Sliders}
                                label="App Preferences"
                            />
                            <TabButton
                                active={activeTab === 'security'}
                                onClick={() => setActiveTab('security')}
                                icon={Lock}
                                label="Password & Security"
                            />
                            {/* <TabButton
                                active={activeTab === 'notifications'}
                                onClick={() => setActiveTab('notifications')}
                                icon={Bell}
                                label="Notifications"
                            /> */}
                        </nav>
                    </Card>

                    {/* --- MAIN CONTENT AREA --- */}
                    <div className="flex-1 w-full min-w-0">
                        {/* TAB: PROFILE */}
                        {activeTab === 'profile' && (
                            <form
                                onSubmit={handleSubmit(onSubmitProfile)}
                                className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300"
                            >
                                <Card className="rounded-[2rem] border border-slate-200 shadow-sm bg-white overflow-hidden">
                                    <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-6">
                                        <CardTitle className="text-xl font-bold">
                                            Public Profile
                                        </CardTitle>
                                        <CardDescription className="text-xs font-semibold">
                                            This is how you appear to learners
                                            and administrators.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-8 space-y-8">
                                        {/* AVATAR PREVIEW */}
                                        <div className="flex items-center gap-6">
                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                className="hidden"
                                                accept="image/*"
                                                onChange={handleImageSelect}
                                            />

                                            <div
                                                className="relative group cursor-pointer"
                                                onClick={() =>
                                                    fileInputRef.current?.click()
                                                }
                                            >
                                                <Avatar className="h-24 w-24 rounded-2xl shadow-md border-2 border-white group-hover:opacity-75 transition-opacity">
                                                    <AvatarImage
                                                        src={avatarImageSrc}
                                                        className="object-cover"
                                                    />
                                                    <AvatarFallback className="bg-indigo-50 text-indigo-600 text-2xl font-black">
                                                        {user?.firstName?.[0]}
                                                    </AvatarFallback>
                                                </Avatar>

                                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl bg-slate-900/20 backdrop-blur-[2px]">
                                                    <div className="bg-slate-900/80 p-2 rounded-full text-white">
                                                        <Upload size={16} />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-1.5">
                                                <h3 className="font-bold text-slate-900">
                                                    Profile Picture
                                                </h3>
                                                <p className="text-xs text-slate-500 font-medium max-w-[250px]">
                                                    Upload a square image,
                                                    ideally 500x500px. JPG, PNG
                                                    or WebP.
                                                </p>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() =>
                                                            fileInputRef.current?.click()
                                                        }
                                                        className="h-8 rounded-lg text-[10px] font-bold uppercase tracking-widest text-slate-600 hover:text-indigo-600"
                                                    >
                                                        {selectedImage
                                                            ? 'Change Image'
                                                            : 'Choose Image'}
                                                    </Button>
                                                    {selectedImage && (
                                                        <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest bg-amber-50 px-2 py-1 rounded-md">
                                                            Pending Save
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <Separator className="bg-slate-100" />

                                        {/* Form Fields connected to React Hook Form */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                    First Name
                                                </label>
                                                <Input
                                                    {...register('firstName', {
                                                        required: true,
                                                    })}
                                                    className="h-12 rounded-xl bg-slate-50 border-slate-200 focus:bg-white focus:ring-4 focus:ring-indigo-50 font-semibold"
                                                />
                                                {errors.firstName && (
                                                    <span className="text-[10px] font-bold text-rose-500">
                                                        First name is required
                                                    </span>
                                                )}
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                    Last Name
                                                </label>
                                                <Input
                                                    {...register('lastName', {
                                                        required: true,
                                                    })}
                                                    className="h-12 rounded-xl bg-slate-50 border-slate-200 focus:bg-white focus:ring-4 focus:ring-indigo-50 font-semibold"
                                                />
                                                {errors.lastName && (
                                                    <span className="text-[10px] font-bold text-rose-500">
                                                        Last name is required
                                                    </span>
                                                )}
                                            </div>
                                            <div className="space-y-2 md:col-span-2">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                    Email Address
                                                </label>
                                                <div className="relative">
                                                    <Mail className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
                                                    <Input
                                                        type="email"
                                                        {...register('email', {
                                                            required: true,
                                                        })}
                                                        className="h-12 pl-12 rounded-xl bg-slate-50 border-slate-200 focus:bg-white focus:ring-4 focus:ring-indigo-50 font-semibold"
                                                    />
                                                </div>
                                                {errors.email && (
                                                    <span className="text-[10px] font-bold text-rose-500">
                                                        Valid email is required
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <div className="flex justify-end">
                                    <Button
                                        type="submit"
                                        disabled={isSaving}
                                        className="h-12 px-8 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-widest shadow-lg shadow-indigo-200 transition-all active:scale-95"
                                    >
                                        {isSaving ? (
                                            <Loader2
                                                className="animate-spin mr-2"
                                                size={16}
                                            />
                                        ) : (
                                            <Save className="mr-2" size={16} />
                                        )}
                                        Save Profile Changes
                                    </Button>
                                </div>
                            </form>
                        )}

                        {/* TAB: PREFERENCES */}
                        {activeTab === 'preferences' && mounted && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <Card className="rounded-[2rem] border border-slate-200 shadow-sm bg-white overflow-hidden">
                                    <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-6">
                                        <CardTitle className="text-xl font-bold flex items-center gap-2">
                                            <Sliders
                                                size={20}
                                                className="text-indigo-600"
                                            />{' '}
                                            Session Workflows
                                        </CardTitle>
                                        <CardDescription className="text-xs font-semibold">
                                            Customize how your dashboard behaves
                                            during live clinical sessions.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-8 space-y-6">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                                            <div>
                                                <h4 className="text-sm font-bold text-slate-900">
                                                    Auto-Advance Queue
                                                </h4>
                                                <p className="text-xs text-slate-500 font-medium mt-1 max-w-[400px]">
                                                    When a session timer reaches
                                                    zero, immediately mark it as
                                                    complete and start the next
                                                    queued activity.
                                                </p>
                                            </div>
                                            <Switch
                                                checked={autoStart}
                                                onCheckedChange={(val) =>
                                                    handleTogglePreference(
                                                        'therapist_auto_start',
                                                        val,
                                                    )
                                                }
                                            />
                                        </div>

                                        <div
                                            className={cn(
                                                'flex flex-col md:flex-row md:items-center justify-between gap-6 p-4 rounded-2xl border transition-colors',
                                                handsFree
                                                    ? 'border-emerald-200 bg-emerald-50/30'
                                                    : 'border-slate-100 bg-slate-50/50 hover:bg-slate-50',
                                            )}
                                        >
                                            <div>
                                                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                                    Hands-Free Mode{' '}
                                                    <Zap
                                                        size={14}
                                                        className={
                                                            handsFree
                                                                ? 'text-emerald-500 fill-emerald-500'
                                                                : 'text-slate-300'
                                                        }
                                                    />
                                                </h4>
                                                <p className="text-xs text-slate-500 font-medium mt-1 max-w-[400px]">
                                                    Bypass the learner's manual
                                                    "Ready" screen, forcing the
                                                    student's portal to launch
                                                    the activity instantly.
                                                </p>
                                            </div>
                                            <Switch
                                                checked={handsFree}
                                                onCheckedChange={(val) =>
                                                    handleTogglePreference(
                                                        'therapist_hands_free',
                                                        val,
                                                    )
                                                }
                                            />
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        )}

                        {/* TAB: SECURITY */}
                        {activeTab === 'security' && (
                            <form
                                onSubmit={handleSecuritySubmit(
                                    onSubmitSecurity,
                                )}
                                className="animate-in fade-in slide-in-from-bottom-2 duration-300"
                            >
                                <Card className="rounded-[2rem] border border-slate-200 shadow-sm bg-white overflow-hidden">
                                    <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-6">
                                        <CardTitle className="text-xl font-bold flex items-center gap-2">
                                            <ShieldCheck
                                                size={20}
                                                className="text-emerald-500"
                                            />{' '}
                                            Account Security
                                        </CardTitle>
                                        <CardDescription className="text-xs font-semibold">
                                            Update your password and secure your
                                            account.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-8 space-y-6">
                                        <div className="space-y-2 max-w-md">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                Current Password
                                            </label>
                                            <Input
                                                type="password"
                                                placeholder="••••••••"
                                                {...registerSecurity(
                                                    'currentPassword',
                                                    {
                                                        required:
                                                            'Current password is required',
                                                    },
                                                )}
                                                className="h-12 rounded-xl bg-slate-50 border-slate-200 focus:bg-white focus:ring-4 focus:ring-indigo-50 font-semibold"
                                            />
                                            {securityErrors.currentPassword && (
                                                <p className="text-[10px] font-bold text-rose-500">
                                                    {
                                                        securityErrors
                                                            .currentPassword
                                                            .message
                                                    }
                                                </p>
                                            )}
                                        </div>

                                        <Separator className="bg-slate-100 max-w-md" />

                                        <div className="space-y-2 max-w-md">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                New Password
                                            </label>
                                            <Input
                                                type="password"
                                                placeholder="••••••••"
                                                {...registerSecurity(
                                                    'password',
                                                    {
                                                        required:
                                                            'New password is required',
                                                        minLength: {
                                                            value: 6,
                                                            message:
                                                                'Password must be at least 6 characters',
                                                        },
                                                    },
                                                )}
                                                className="h-12 rounded-xl bg-slate-50 border-slate-200 focus:bg-white focus:ring-4 focus:ring-indigo-50 font-semibold"
                                            />
                                            {securityErrors.password && (
                                                <p className="text-[10px] font-bold text-rose-500">
                                                    {
                                                        securityErrors.password
                                                            .message
                                                    }
                                                </p>
                                            )}
                                        </div>

                                        <div className="space-y-2 max-w-md">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                Confirm New Password
                                            </label>
                                            <Input
                                                type="password"
                                                placeholder="••••••••"
                                                {...registerSecurity(
                                                    'passwordConfirmation',
                                                    {
                                                        required:
                                                            'Please confirm your new password',
                                                        validate: (value) =>
                                                            value ===
                                                                newPassword ||
                                                            'Passwords do not match',
                                                    },
                                                )}
                                                className="h-12 rounded-xl bg-slate-50 border-slate-200 focus:bg-white focus:ring-4 focus:ring-indigo-50 font-semibold"
                                            />
                                            {securityErrors.passwordConfirmation && (
                                                <p className="text-[10px] font-bold text-rose-500">
                                                    {
                                                        securityErrors
                                                            .passwordConfirmation
                                                            .message
                                                    }
                                                </p>
                                            )}
                                        </div>

                                        <Button
                                            type="submit"
                                            disabled={
                                                changePasswordMutation.isPending
                                            }
                                            className="h-12 mt-4 px-8 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-widest shadow-md transition-all active:scale-95"
                                        >
                                            {changePasswordMutation.isPending ? (
                                                <Loader2
                                                    className="animate-spin mr-2"
                                                    size={16}
                                                />
                                            ) : (
                                                <Lock
                                                    className="mr-2"
                                                    size={16}
                                                />
                                            )}
                                            Update Password
                                        </Button>
                                    </CardContent>
                                </Card>
                            </form>
                        )}

                        {/* TAB: NOTIFICATIONS */}
                        {activeTab === 'notifications' && (
                            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <Card className="rounded-[2rem] border border-slate-200 shadow-sm bg-white overflow-hidden p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
                                    <div className="h-20 w-20 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-400 mb-6">
                                        <Bell size={32} />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900">
                                        Push Notifications
                                    </h3>
                                    <p className="text-sm font-medium text-slate-500 mt-2 max-w-[300px]">
                                        Email and push notification preferences
                                        are currently managed by your
                                        organization's administrator.
                                    </p>
                                </Card>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function TabButton({
    active,
    onClick,
    icon: Icon,
    label,
}: {
    active: boolean;
    onClick: () => void;
    icon: any;
    label: string;
}) {
    return (
        <button
            onClick={onClick}
            type="button"
            className={cn(
                'w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all outline-none',
                active
                    ? 'bg-slate-50 text-indigo-600 shadow-sm border border-slate-100'
                    : 'text-slate-500 hover:bg-slate-50/50 hover:text-slate-800 border border-transparent',
            )}
        >
            <Icon
                size={18}
                className={active ? 'text-indigo-600' : 'text-slate-400'}
            />
            {label}
        </button>
    );
}
