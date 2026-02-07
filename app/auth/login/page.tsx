'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { useMutation } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { loginUser } from '@/api/auth';
import { loginStart, loginSuccess, loginFailure } from '@/redux/auth/authSlice';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { ShieldAlert, Info } from 'lucide-react';

import LoginForm from '@/components/LoginForm';
import { Login, LoginResponse } from '@/types';

interface ApiError {
    error: {
        message: string;
    };
}

export default function LoginPage() {
    const router = useRouter();
    const dispatch = useDispatch();
    const [error, setError] = useState<string>('');

    const mutation = useMutation<LoginResponse, AxiosError<ApiError>, Login>({
        mutationFn: (data: Login) => loginUser(data.identifier, data.password),
        onMutate: () => {
            setError('');
            dispatch(loginStart());
        },
        onSuccess: (data) => {
            dispatch(loginSuccess(data));
            router.push('/');
        },
        onError: (err) => {
            const errorMessage =
                err.response?.data?.error?.message || 'Invalid credentials';
            dispatch(loginFailure(errorMessage));
            setError(errorMessage);
        },
    });

    const handleLoginSubmit = (values: Login) => {
        mutation.mutate(values);
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-[#F8FAFC] relative overflow-hidden">
            {/* --- THEME BACKGROUND ELEMENTS --- */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/5 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/5 rounded-full blur-[120px]" />

            <div className="w-full max-w-[440px] px-6 relative z-10">
                {/* --- ERROR FEEDBACK (Themed) --- */}
                {error && (
                    <Alert
                        variant="destructive"
                        className="mb-6 rounded-[24px] border-none bg-red-50 text-red-600 shadow-xl shadow-red-100/50 animate-in fade-in slide-in-from-top-2 duration-500"
                    >
                        <ShieldAlert className="h-4 w-4 stroke-[3px]" />
                        <AlertDescription className="font-bold text-xs uppercase tracking-tight">
                            {error}
                        </AlertDescription>
                    </Alert>
                )}

                {/* --- THE LOGIN FORM COMPONENT --- */}
                <LoginForm
                    onSubmit={handleLoginSubmit}
                    isLoading={mutation.isPending}
                />

                {/* --- ADDITIONAL THEMED FOOTER --- */}
                <div className="mt-12 flex items-center justify-center gap-6">
                    <div className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Server: Online
                        </span>
                    </div>
                    <div className="h-4 w-px bg-slate-200" />
                    <button className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 hover:text-indigo-600 uppercase tracking-widest transition-colors">
                        <Info size={12} />
                        Help Center
                    </button>
                </div>
            </div>
        </div>
    );
}
