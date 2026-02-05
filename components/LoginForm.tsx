'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import {
    EyeIcon,
    EyeOffIcon,
    Loader2Icon,
    UserIcon,
    LockIcon,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from '@/components/ui/card';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Login } from '@/types';

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
        // resolver: zodResolver(formSchema),
        defaultValues: {
            identifier: '',
            password: '',
        },
    });

    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <FieldGroup>
                {/* Username Field */}
                <Field>
                    <FieldLabel htmlFor="identifier">Username</FieldLabel>
                    <div className="relative">
                        <UserIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            id="identifier"
                            placeholder="Enter username"
                            className="pl-10"
                            {...register('identifier')}
                        />
                    </div>
                    {errors.identifier && (
                        <p className="text-xs text-destructive">
                            {errors.identifier.message}
                        </p>
                    )}
                </Field>

                {/* Password Field */}
                <Field>
                    <FieldLabel htmlFor="password">Password</FieldLabel>
                    <div className="relative">
                        <LockIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="••••••••"
                            className="pl-10 pr-10"
                            {...register('password')}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                        >
                            {showPassword ? (
                                <EyeOffIcon size={16} />
                            ) : (
                                <EyeIcon size={16} />
                            )}
                        </button>
                    </div>
                    {errors.password && (
                        <p className="text-xs text-destructive">
                            {errors.password.message}
                        </p>
                    )}
                </Field>

                <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                        <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        'Sign In'
                    )}
                </Button>
            </FieldGroup>
        </form>
    );
}
