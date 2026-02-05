"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { useMutation } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { loginUser } from '@/api/auth';
import { loginStart, loginSuccess, loginFailure } from '@/redux/auth/authSlice';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ShieldAlert } from 'lucide-react';

import studentImg from '@/assets/student.png';
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
            router.push('/dashboard');
        },
        onError: (err) => {
            const errorMessage = err.response?.data?.error?.message || 'Invalid credentials';
            dispatch(loginFailure(errorMessage));
            setError(errorMessage);
        },
    });

    const handleLoginSubmit = (values: Login) => {
        mutation.mutate(values);
    };

    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-slate-50 p-4">
            <div className="grid w-full max-w-5xl items-center gap-12 lg:grid-cols-2">
                
                <div className="hidden flex-col items-center justify-center space-y-4 lg:flex">
                    <Image 
                        src={studentImg} 
                        alt="Student Login Illustration" 
                        width={450} 
                        height={450} 
                        priority 
                        className="drop-shadow-2xl"
                    />
                </div>

                <div className="flex flex-col items-center">
                    <Card className="w-full max-w-[400px] border-none shadow-2xl ring-1 ring-black/5">
                        <CardHeader className="space-y-1 text-center">
                            <CardTitle className="text-3xl font-extrabold tracking-tight">
                                Welcome Back
                            </CardTitle>
                            <CardDescription className="text-sm text-muted-foreground">
                                Please enter your credentials to log in
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="grid gap-4">
                            {error && (
                                <Alert variant="destructive" className="animate-in fade-in zoom-in duration-300">
                                    <ShieldAlert className="h-4 w-4" />
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}
                 
                            <LoginForm 
                                onSubmit={handleLoginSubmit} 
                                isLoading={mutation.isPending} 
                            />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}