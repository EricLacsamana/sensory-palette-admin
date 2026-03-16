'use client';

import * as React from 'react';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    EyeIcon,
    EyeOffIcon,
    Loader2Icon,
    UserIcon,
    LockIcon,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Login } from '@/types';
import { cn } from '@/lib/utils';

const formSchema = z.object({
    identifier: z.string().min(1, 'Username is required'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
});

interface LoginFormProps {
    onSubmit: (values: Login) => void;
    isLoading: boolean;
}

export default function LoginForm({ onSubmit, isLoading }: LoginFormProps) {
    const [showPassword, setShowPassword] = React.useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            identifier: '',
            password: '',
        },
    });

    return (
        <div className="w-full max-w-[440px] animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* --- HEADER --- */}
            <div className="text-center mb-8 space-y-2">
                <div className="inline-flex items-center justify-center mb-4">
                    <Image
                        src="/tlc_therapy_center_logo.png"
                        alt="TLC Logo"
                        width={120}
                        height={120}
                        priority
                        className="object-contain"
                    />
                </div>
                <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                    Welcome Back
                </h1>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-widest">
                    TLC SPED & Therapy Center Login
                </p>
            </div>

            {/* --- CARD --- */}
            <div className="bg-white p-10 rounded-[32px] border border-slate-100 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.06)] relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-600/80" />

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {/* Username Field */}
                    <div className="space-y-2">
                        <label
                            htmlFor="identifier"
                            className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest ml-1"
                        >
                            Username
                        </label>
                        <div className="relative group">
                            <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-indigo-500 transition-colors stroke-[1.5px]" />
                            <Input
                                id="identifier"
                                placeholder="Enter your username"
                                className={cn(
                                    'pl-11 h-12 rounded-xl border-slate-200 bg-slate-50/30 focus:bg-white focus:ring-4 focus:ring-indigo-50/50 transition-all font-medium text-slate-900 placeholder:font-normal placeholder:text-slate-300',
                                    errors.identifier &&
                                        'border-red-200 focus:ring-red-50',
                                )}
                                {...register('identifier')}
                                disabled={isLoading}
                            />
                        </div>
                        {errors.identifier && (
                            <p className="text-[11px] font-medium text-red-500 ml-1">
                                {errors.identifier.message}
                            </p>
                        )}
                    </div>

                    {/* Password Field */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-center px-1">
                            <label
                                htmlFor="password"
                                className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest"
                            >
                                Password
                            </label>
                            {/* <button
                                type="button"
                                className="text-[10px] font-semibold text-indigo-600 uppercase tracking-widest hover:text-indigo-700 transition-colors"
                            >
                                Forgot?
                            </button> */}
                        </div>
                        <div className="relative group">
                            <LockIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-indigo-500 transition-colors stroke-[1.5px]" />
                            <Input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="••••••••"
                                className={cn(
                                    'pl-11 pr-11 h-12 rounded-xl border-slate-200 bg-slate-50/30 focus:bg-white focus:ring-4 focus:ring-indigo-50/50 transition-all font-medium text-slate-900 placeholder:font-normal placeholder:text-slate-300',
                                    errors.password &&
                                        'border-red-200 focus:ring-red-50',
                                )}
                                {...register('password')}
                                disabled={isLoading}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors"
                            >
                                {showPassword ? (
                                    <EyeOffIcon size={16} />
                                ) : (
                                    <EyeIcon size={16} />
                                )}
                            </button>
                        </div>
                        {errors.password && (
                            <p className="text-[11px] font-medium text-red-500 ml-1">
                                {errors.password.message}
                            </p>
                        )}
                    </div>

                    <Button
                        type="submit"
                        className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold uppercase tracking-widest text-[11px] shadow-md shadow-indigo-100 transition-all active:scale-[0.98]"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <Loader2Icon className="h-4 w-4 animate-spin" />
                        ) : (
                            'Sign In'
                        )}
                    </Button>
                </form>
            </div>
        </div>
    );
}
