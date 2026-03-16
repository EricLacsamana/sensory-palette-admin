'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { useMutation } from '@tanstack/react-query';
import Image from 'next/image';

import {
    KeyRound,
    Loader2Icon,
    ArrowRight,
    AlertCircle,
    HelpCircle,
} from 'lucide-react';
import { toast } from 'sonner';

import { setCredentials } from '@/redux/auth/authSlice';
import { RootState } from '@/redux/store';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export default function StudentLoginPage() {
    const dispatch = useDispatch();
    const router = useRouter();
    const { isAuthenticated } = useSelector((state: RootState) => state.auth);

    const [passcodeInput, setPasscodeInput] = useState('');
    const [mounted, setMounted] = useState(false);

    // 1. Prevent hydration mismatch cleanly
    useEffect(() => {
        setMounted(true);
    }, []);

    // 2. Handle the redirect logic
    useEffect(() => {
        if (mounted && isAuthenticated) {
            router.push('/student-portal');
        }
    }, [mounted, isAuthenticated, router]);

    const loginMutation = useMutation({
        mutationFn: async (passcode: string) => {
            const strapiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(
                /\/$/,
                '',
            );

            const response = await fetch(
                `${strapiUrl}/api/custom-auth/passcode-login`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ passcode }),
                },
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data?.error?.message || "Oops! That code didn't work.",
                );
            }

            return data;
        },
        onSuccess: (data) => {
            dispatch(setCredentials({ user: data.user, token: data.jwt }));
            toast.success('Yay! Welcome back!');
            router.push('/student-portal');
        },
        onError: (error: any) => {
            console.error('[Auth] Mutation Failed:', error.message || error);
            setPasscodeInput(''); // Clear input so they can try again easily
        },
    });

    const handleLoginSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (passcodeInput.length === 6) {
            loginMutation.mutate(passcodeInput);
        }
    };

    if (!mounted || isAuthenticated) return null;

    return (
        <div className="flex-1 min-h-screen flex flex-col items-center justify-center py-12 bg-sky-50 relative overflow-hidden font-sans">
            {/* --- PLAYFUL BACKGROUND ELEMENTS --- */}
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-yellow-300/40 rounded-full blur-[80px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-blue-400/30 rounded-full blur-[80px] pointer-events-none" />

            <div className="w-full max-w-[440px] px-6 relative z-10 my-auto animate-in zoom-in-95 duration-500">
                {/* --- ERROR FEEDBACK (Friendly) --- */}
                {loginMutation.isError && (
                    <Alert
                        variant="destructive"
                        className="mb-6 rounded-[24px] border-2 border-red-200 bg-red-50 text-red-600 shadow-lg animate-in fade-in slide-in-from-top-2 duration-300"
                    >
                        <AlertCircle className="h-5 w-5 stroke-[2.5px] text-red-500" />
                        <AlertDescription className="font-bold text-sm ml-2">
                            {loginMutation.error?.message || 'Oops! Try again.'}
                        </AlertDescription>
                    </Alert>
                )}

                {/* --- HEADER --- */}
                <div className="text-center mb-8 space-y-4 flex flex-col items-center">
                    <div className="bg-white p-4 rounded-[32px] shadow-sm border border-slate-100 rotate-[-2deg] hover:rotate-0 transition-all duration-300">
                        <Image
                            src="/tlc_therapy_center_logo.png"
                            alt="TLC Logo"
                            width={90}
                            height={90}
                            priority
                            className="object-contain"
                        />
                    </div>
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">
                            Welcome!
                        </h1>
                        <p className="text-sm font-semibold text-slate-500 mt-1">
                            Ready to learn and play?
                        </p>
                    </div>
                </div>

                {/* --- PORTAL LOGIN CARD --- */}
                <div className="bg-white p-8 sm:p-10 rounded-[40px] border-4 border-white shadow-[0_20px_40px_-12px_rgba(0,0,0,0.08)] relative overflow-hidden">
                    <form onSubmit={handleLoginSubmit} className="space-y-8">
                        <div className="space-y-4 text-center">
                            <label className="text-sm font-bold text-indigo-600 flex items-center justify-center gap-2">
                                <KeyRound
                                    size={18}
                                    className="text-indigo-500"
                                />
                                Enter Your Secret Code
                            </label>

                            <input
                                type="text"
                                maxLength={6}
                                value={passcodeInput}
                                onChange={(e) =>
                                    setPasscodeInput(
                                        e.target.value.replace(/\D/g, ''),
                                    )
                                }
                                placeholder="••••••"
                                className={cn(
                                    'w-full h-24 bg-slate-50 border-4 rounded-3xl text-center text-5xl font-black tracking-[0.3em] text-slate-800 placeholder:text-slate-200 outline-none transition-all shadow-inner',
                                    loginMutation.isError
                                        ? 'border-red-300 focus:border-red-400 bg-red-50/50'
                                        : 'border-slate-100 focus:border-indigo-400 focus:bg-indigo-50/30',
                                )}
                                disabled={loginMutation.isPending}
                                autoFocus
                            />
                        </div>

                        {/* --- CHUNKY TOY BUTTON --- */}
                        <div className="pt-2">
                            <Button
                                type="submit"
                                disabled={
                                    passcodeInput.length < 6 ||
                                    loginMutation.isPending
                                }
                                className={cn(
                                    'w-full h-16 rounded-2xl text-white font-extrabold text-lg transition-all flex items-center justify-center',
                                    'bg-orange-500 hover:bg-orange-400', // Using an orange to match your logo bulb
                                    'shadow-[0_6px_0_rgb(194,65,12)] hover:shadow-[0_4px_0_rgb(194,65,12)] hover:translate-y-[2px]', // 3D effect
                                    'active:shadow-none active:translate-y-[6px]', // Pressed effect
                                    'disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none disabled:translate-y-[6px]',
                                )}
                            >
                                {loginMutation.isPending ? (
                                    <Loader2Icon className="h-6 w-6 animate-spin" />
                                ) : (
                                    <>
                                        Let's Go!{' '}
                                        <ArrowRight className="ml-2 h-6 w-6 stroke-[3px]" />
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </div>

                {/* --- FOOTER --- */}
                <div className="mt-8 flex items-center justify-center">
                    <button className="flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-indigo-500 transition-colors bg-white/50 px-4 py-2 rounded-full backdrop-blur-sm">
                        <HelpCircle size={16} strokeWidth={3} />I need help
                        logging in
                    </button>
                </div>
            </div>
        </div>
    );
}
