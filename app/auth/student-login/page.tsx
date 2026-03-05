'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { useMutation } from '@tanstack/react-query';

import {
    LockIcon,
    Loader2Icon,
    ArrowRight,
    ShieldAlert,
    Info,
    Sparkles,
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

    // 1. Prevent hydration mismatch cleanly (Zero dependencies)
    useEffect(() => {
        const timer = setTimeout(() => {
            setMounted(true);
        }, 0);
        return () => clearTimeout(timer);
    }, []);

    // 2. Handle the redirect logic completely separately
    useEffect(() => {
        if (mounted && isAuthenticated) {
            router.push('/student-portal');
        }
    }, [mounted, isAuthenticated, router]);
    // ✨ Upgraded to useMutation to match your Therapist login architecture
    const loginMutation = useMutation({
        mutationFn: async (passcode: string) => {
            const strapiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(
                /\/$/,
                '',
            );

            // ✨ LOGGER 1: Check the exact URL being called
            console.log(
                '[Auth] Attempting login at:',
                `${strapiUrl}/api/custom-auth/passcode-login`,
            );
            console.log('[Auth] Payload:', { passcode });

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
                // ✨ LOGGER 2: See exactly what Strapi is complaining about
                console.error(
                    '[Auth] Backend rejected login. Status:',
                    response,
                );
                console.error('[Auth] Strapi Error Response:', data);

                throw new Error(
                    data?.error?.message || 'Invalid or expired passcode',
                );
            }

            return data;
        },
        onSuccess: (data) => {
            dispatch(setCredentials({ user: data.user, token: data.jwt }));
            toast.success('Access Granted! Welcome to your session.');
            router.push('/student-portal');
        },
        onError: (error: any) => {
            // ✨ LOGGER 3: Final error caught by React Query
            console.error('[Auth] Mutation Failed:', error.message || error);

            setPasscodeInput(''); // Clear the input on failure so they can try again
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
        <div className="flex-1 min-h-full flex flex-col items-center justify-center py-12 bg-slate-950 relative overflow-hidden">
            {/* --- IMMERSIVE DARK THEME BACKGROUND ELEMENTS --- */}
            <div className="absolute top-[10%] left-[10%] w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[10%] right-[10%] w-[400px] h-[400px] bg-rose-500/10 rounded-full blur-[100px] pointer-events-none" />

            <div className="w-full max-w-[440px] px-6 relative z-10 my-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* --- ERROR FEEDBACK (Dark Theme Adapted) --- */}
                {loginMutation.isError && (
                    <Alert
                        variant="destructive"
                        className="mb-6 rounded-[24px] border border-rose-500/20 bg-rose-500/10 text-rose-400 shadow-xl shadow-rose-500/10 animate-in fade-in slide-in-from-top-2 duration-300 backdrop-blur-md"
                    >
                        <ShieldAlert className="h-4 w-4 stroke-[3px] text-rose-400" />
                        <AlertDescription className="font-bold text-xs uppercase tracking-tight ml-2">
                            {loginMutation.error?.message ||
                                'Authentication Failed'}
                        </AlertDescription>
                    </Alert>
                )}

                {/* --- HEADER --- */}
                <div className="text-center mb-8 space-y-2">
                    <div className="inline-flex items-center justify-center p-3 bg-white/5 border border-white/10 rounded-2xl mb-4 backdrop-blur-sm shadow-inner">
                        <Sparkles className="h-6 w-6 text-indigo-400 stroke-[1.5px]" />
                    </div>
                    <h1 className="text-2xl font-semibold tracking-tight text-white">
                        Learner Portal
                    </h1>
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-widest">
                        Enter Session PIN
                    </p>
                </div>

                {/* --- PORTAL LOGIN CARD (Frosted Glass) --- */}
                <div className="bg-white/5 backdrop-blur-2xl p-10 rounded-[32px] border border-white/10 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.5)] relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-500/80" />

                    <form onSubmit={handleLoginSubmit} className="space-y-8">
                        <div className="space-y-3">
                            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest flex items-center justify-center gap-2">
                                <LockIcon
                                    size={12}
                                    className="text-slate-500"
                                />
                                Unique Passcode
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
                                    'w-full h-20 bg-black/40 border-2 focus:border-indigo-500 rounded-2xl text-center text-4xl font-black text-white tracking-[0.5em] placeholder:text-white/10 outline-none transition-all',
                                    loginMutation.isError
                                        ? 'border-rose-500/50 focus:border-rose-500'
                                        : 'border-white/10',
                                )}
                                disabled={loginMutation.isPending}
                                autoFocus
                            />
                        </div>

                        <Button
                            type="submit"
                            disabled={
                                passcodeInput.length < 6 ||
                                loginMutation.isPending
                            }
                            className="w-full h-14 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-white/5 disabled:text-slate-600 text-white font-bold uppercase tracking-widest text-[11px] shadow-lg shadow-indigo-900/50 transition-all active:scale-[0.98]"
                        >
                            {loginMutation.isPending ? (
                                <Loader2Icon className="h-5 w-5 animate-spin" />
                            ) : (
                                <>
                                    Access Session{' '}
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </>
                            )}
                        </Button>
                    </form>
                </div>

                {/* --- ADDITIONAL PORTAL FOOTER --- */}
                <div className="mt-12 flex items-center justify-center gap-6">
                    <div className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                            Server: Online
                        </span>
                    </div>
                    <div className="h-4 w-px bg-slate-800" />
                    <button className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 hover:text-indigo-400 uppercase tracking-widest transition-colors">
                        <Info size={12} />
                        Help Center
                    </button>
                </div>
            </div>
        </div>
    );
}
