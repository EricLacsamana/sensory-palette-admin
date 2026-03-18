'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import {
    Loader2Icon,
    ChevronRight,
    ChevronLeft,
    Check,
    Camera,
    EyeIcon,
    ShieldCheck,
    HeartHandshake,
    GraduationCap,
    Zap,
    Brain,
    Minus,
} from 'lucide-react';

import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

export const ROLES = {
    ADMIN: '6',
    THERAPIST: '5',
    STUDENT: '3',
};

// --- BASE VALIDATION SCHEMA ---
export const baseUserFormSchema = z
    .object({
        role: z.string().min(1, 'Role is required.'),
        username: z.string().min(3, 'Minimum 3 characters.'),
        email: z.string().email('Invalid email.'),
        confirmed: z.boolean().optional(),
        blocked: z.boolean().optional(),
        profilePicture: z.any().optional(),
        firstName: z.string().min(1, 'First name is required.'),
        middleName: z.string().optional(),
        lastName: z.string().min(1, 'Last name is required.'),
        dateOfBirth: z.string().min(1, 'Date of birth is required.'),
        gender: z.enum(['male', 'female'], {
            required_error: 'Please select a gender.',
        }),

        diagnosis: z.string().nullable().optional(),
        addressLabel: z.string().optional(),
        streetAddress: z.string().optional(),
        city: z.string().optional(),
        stateProvince: z.string().optional(),
        postalCode: z.string().optional(),
        countryCode: z.string().max(2, 'Max 2 chars').optional(),
        isDefault: z.boolean().optional(),

        guardianName: z.string().optional(),
        guardianRelationship: z.string().optional(),
        guardianContact: z.string().optional(),
        guardianEmail: z
            .string()
            .email('Invalid email.')
            .optional()
            .or(z.literal('')),
    })
    .superRefine((data, ctx) => {
        // Apply strict requirements ONLY if the user is a student
        if (data.role === ROLES.STUDENT) {
            if (!data.diagnosis || data.diagnosis === '') {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: 'Diagnosis is required.',
                    path: ['diagnosis'],
                });
            }
            if (!data.guardianName || data.guardianName.trim() === '') {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: 'Guardian name is required.',
                    path: ['guardianName'],
                });
            }
            if (
                !data.guardianRelationship ||
                data.guardianRelationship.trim() === ''
            ) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: 'Relationship is required.',
                    path: ['guardianRelationship'],
                });
            }
            if (!data.guardianContact || data.guardianContact.trim() === '') {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: 'Contact number is required.',
                    path: ['guardianContact'],
                });
            }
        }
    });

export type UserFormValues = z.infer<typeof baseUserFormSchema> & {
    password?: string;
};

interface UserFormProps {
    initialData?: any;
    onSubmit: (values: UserFormValues) => void;
    onCancel: () => void;
    onCheckUserExists?: (
        username: string,
        email: string,
    ) => Promise<{ field: string; message: string } | null>;
    isLoading: boolean;
}

const styles = {
    formItem: 'space-y-1.5 relative pb-4',
    formLabel:
        'text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1',
    formInput:
        'h-11 rounded-xl border-slate-200 bg-slate-50/50 text-sm shadow-inner focus-visible:ring-4 focus-visible:ring-indigo-500/10 focus-visible:border-indigo-400 transition-all font-medium placeholder:text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed',
    formMessage:
        'text-[10px] font-bold text-rose-500 absolute bottom-0 left-1 leading-none',
};

export default function UserForm({
    initialData,
    onSubmit,
    onCancel,
    onCheckUserExists,
    isLoading: isSubmitting,
}: UserFormProps) {
    const [step, setStep] = React.useState(1);
    const [isValidating, setIsValidating] = React.useState(false);
    const [showPassword, setShowPassword] = React.useState(false);
    const [imagePreview, setImagePreview] = React.useState<string | null>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const isEditing = !!initialData;
    const isLoading = isSubmitting || isValidating;

    const formSchema = React.useMemo(() => {
        return baseUserFormSchema.and(
            z.object({
                password: isEditing
                    ? z.string().optional().or(z.literal(''))
                    : z.string().min(6, 'Password is required (min 6 chars).'),
            }),
        );
    }, [isEditing]);

    const form = useForm<UserFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            role: '',
            username: '',
            email: '',
            password: '',
            confirmed: true,
            blocked: false,
            profilePicture: null,
            firstName: '',
            middleName: '',
            lastName: '',
            dateOfBirth: '',
            gender: undefined,
            diagnosis: '',
            addressLabel: 'Home',
            streetAddress: '',
            city: '',
            stateProvince: '',
            postalCode: '',
            countryCode: '',
            isDefault: false,
            guardianName: '',
            guardianRelationship: '',
            guardianContact: '',
            guardianEmail: '',
        },
    });

    const selectedRole = form.watch('role');
    const isStudent = String(selectedRole) === ROLES.STUDENT;

    const STEPS = React.useMemo(() => {
        const baseSteps = [
            { id: 'role', title: 'Role' },
            { id: 'personal', title: 'Personal' },
        ];
        if (!isStudent) baseSteps.push({ id: 'account', title: 'Account' });
        baseSteps.push({ id: 'address', title: 'Address' });
        if (isStudent) baseSteps.push({ id: 'guardian', title: 'Guardian' });
        return baseSteps;
    }, [isStudent]);

    const currentStepId = STEPS[step - 1]?.id;

    React.useEffect(() => {
        if (initialData) {
            form.reset({
                ...form.getValues(),
                role:
                    initialData.role?.id?.toString() || initialData.role || '',
                username: initialData.username || '',
                email: initialData.email || '',
                confirmed: initialData.confirmed ?? true,
                blocked: initialData.blocked ?? false,
                firstName: initialData.firstName || '',
                middleName: initialData.middleName || '',
                lastName: initialData.lastName || '',
                dateOfBirth: initialData.dateOfBirth || '',
                gender: initialData.gender || undefined,
                diagnosis: initialData.diagnosis || '',
                streetAddress: initialData.streetAddress || '',
                city: initialData.city || '',
                stateProvince: initialData.stateProvince || '',
                postalCode: initialData.postalCode || '',
                countryCode: initialData.countryCode || '',
                guardianName: initialData.guardianName || '',
                guardianRelationship: initialData.guardianRelationship || '',
                guardianContact: initialData.guardianContact || '',
                guardianEmail: initialData.guardianEmail || '',
            });
            if (initialData.profilePicture?.url) {
                setImagePreview(initialData.profilePicture.url);
            }
        }
    }, [initialData, form]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImagePreview(URL.createObjectURL(file));
            form.setValue('profilePicture', file, { shouldDirty: true });
        }
    };

    const handleSkip = async () => {
        if (currentStepId === 'address') {
            form.setValue('streetAddress', '');
            form.setValue('city', '');
            form.setValue('stateProvince', '');
            form.setValue('postalCode', '');
            form.setValue('countryCode', '');
            form.clearErrors([
                'streetAddress',
                'city',
                'stateProvince',
                'postalCode',
                'countryCode',
            ]);
        }
        if (step < STEPS.length) {
            setStep((prev) => prev + 1);
        } else {
            await form.handleSubmit(handleFinalSubmit)();
        }
    };

    const autoGenerateAccountInfo = () => {
        const first = form.getValues('firstName') || '';
        const last = form.getValues('lastName') || '';
        const dob = form.getValues('dateOfBirth');

        const firstClean = first
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '');
        const lastClean = last
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '');
        const numericSuffix = dob
            ? dob.split('-')[0]
            : Math.floor(1000 + Math.random() * 9000);

        const generatedUsername = `${firstClean}.${lastClean}${numericSuffix}`;
        const generatedEmail = `${generatedUsername}@sensorypalette.com`;

        const capitalizedFirst =
            first.trim().charAt(0).toUpperCase() +
            first.trim().slice(1).replace(/\s+/g, '');
        const generatedPassword = `${capitalizedFirst}@${numericSuffix}`;

        form.setValue('username', generatedUsername);
        form.setValue('email', generatedEmail);
        if (!isEditing) form.setValue('password', generatedPassword);
    };

    const handleFinalSubmit = (values: UserFormValues) => {
        const finalPayload = { ...values };
        if (finalPayload.diagnosis === 'N/A') finalPayload.diagnosis = null;
        onSubmit(finalPayload);
    };

    const handleSmartSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (step < STEPS.length) {
            let fieldsToValidate: (keyof UserFormValues)[] = [];

            if (currentStepId === 'role') fieldsToValidate = ['role'];
            if (currentStepId === 'personal') {
                fieldsToValidate = [
                    'firstName',
                    'lastName',
                    'dateOfBirth',
                    'gender',
                ];
                if (isStudent) fieldsToValidate.push('diagnosis');
            }
            if (currentStepId === 'account')
                fieldsToValidate = ['username', 'email', 'password'];
            if (currentStepId === 'address')
                fieldsToValidate = [
                    'streetAddress',
                    'city',
                    'stateProvince',
                    'postalCode',
                    'countryCode',
                ];

            const isStepValid = await form.trigger(fieldsToValidate);

            if (isStepValid) {
                // --- ASYNC DUPLICATE CHECK ---
                if (currentStepId === 'account' && onCheckUserExists) {
                    const currentUsername = form.getValues('username');
                    const currentEmail = form.getValues('email');

                    const isUsernameChanged =
                        currentUsername !== initialData?.username;
                    const isEmailChanged = currentEmail !== initialData?.email;

                    if (!isEditing || isUsernameChanged || isEmailChanged) {
                        setIsValidating(true);
                        const checkUsername =
                            !isEditing || isUsernameChanged
                                ? currentUsername
                                : '';
                        const checkEmail =
                            !isEditing || isEmailChanged ? currentEmail : '';

                        const duplicateError = await onCheckUserExists(
                            checkUsername,
                            checkEmail,
                        );
                        setIsValidating(false);

                        if (duplicateError) {
                            form.setError(duplicateError.field as any, {
                                type: 'manual',
                                message: duplicateError.message,
                            });
                            return; // 🚨 Halt form transition
                        }
                    }
                }

                if (currentStepId === 'personal' && isStudent) {
                    autoGenerateAccountInfo();
                }

                setStep((prev) => prev + 1); // ✅ Only fires if valid
            } else {
                toast.error('Please fill in all required fields correctly.');
            }
        } else {
            // Final Step (Guardian or Address)
            if (isStudent) {
                const isFinalValid = await form.trigger([
                    'guardianName',
                    'guardianRelationship',
                    'guardianContact',
                ]);
                if (!isFinalValid) {
                    toast.error(
                        'Please provide all required Guardian details.',
                    );
                    return;
                }
            }
            await form.handleSubmit(handleFinalSubmit)(e);
        }
    };

    return (
        <div className="flex flex-col w-full h-full">
            {/* WIZARD PROGRESS BAR */}
            <div className="mb-8 relative px-2">
                <div className="absolute top-1/2 left-6 right-6 h-[2px] bg-slate-100 -translate-y-1/2 z-0 rounded-full" />
                <div
                    className="absolute top-1/2 left-6 h-[2px] bg-indigo-600 -translate-y-1/2 z-0 transition-all duration-500 ease-out rounded-full shadow-[0_0_10px_rgba(79,70,229,0.4)]"
                    style={{
                        width: `calc(${((step - 1) / (STEPS.length - 1)) * 100}% - 1.5rem)`,
                    }}
                />
                <div className="relative z-10 flex justify-between">
                    {STEPS.map((s, index) => {
                        const stepNum = index + 1;
                        return (
                            <div
                                key={s.id}
                                className="flex flex-col items-center gap-2 bg-white px-2"
                            >
                                <div
                                    className={cn(
                                        'h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-black transition-all duration-500 border-2',
                                        step > stepNum
                                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-200'
                                            : step === stepNum
                                              ? 'bg-white border-indigo-600 text-indigo-600 shadow-sm ring-4 ring-indigo-50'
                                              : 'bg-white border-slate-200 text-slate-300',
                                    )}
                                >
                                    {step > stepNum ? (
                                        <Check size={12} strokeWidth={4} />
                                    ) : (
                                        stepNum
                                    )}
                                </div>
                                <span
                                    className={cn(
                                        'text-[8px] uppercase tracking-widest font-black transition-colors duration-300',
                                        step >= stepNum
                                            ? 'text-indigo-900'
                                            : 'text-slate-300',
                                    )}
                                >
                                    {s.title}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            <Form {...form}>
                <form
                    onSubmit={handleSmartSubmit}
                    className="flex flex-col flex-1"
                >
                    <div className="min-h-[340px] flex flex-col justify-start">
                        {/* --- STEP 1: ROLE --- */}
                        <div
                            className={cn(
                                'space-y-4 animate-in slide-in-from-right-4 fade-in duration-500',
                                currentStepId === 'role' ? 'block' : 'hidden',
                            )}
                        >
                            <FormField
                                control={form.control}
                                name="role"
                                render={({ field }) => (
                                    <FormItem className="space-y-4 relative pb-4">
                                        <FormLabel className={styles.formLabel}>
                                            Select Account Type *
                                        </FormLabel>
                                        <FormControl>
                                            <div className="grid grid-cols-1 gap-3 mt-2">
                                                <label
                                                    className={cn(
                                                        'relative flex cursor-pointer rounded-2xl border p-4 shadow-sm transition-all duration-200',
                                                        field.value ===
                                                            ROLES.ADMIN
                                                            ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600'
                                                            : 'border-slate-200 bg-white hover:border-indigo-200 hover:bg-slate-50',
                                                        (isLoading ||
                                                            isEditing) &&
                                                            'opacity-60 cursor-not-allowed',
                                                    )}
                                                >
                                                    <input
                                                        type="radio"
                                                        value={ROLES.ADMIN}
                                                        checked={
                                                            field.value ===
                                                            ROLES.ADMIN
                                                        }
                                                        onChange={(e) =>
                                                            field.onChange(
                                                                e.target.value,
                                                            )
                                                        }
                                                        disabled={
                                                            isLoading ||
                                                            isEditing
                                                        }
                                                        className="sr-only"
                                                    />
                                                    <div className="flex w-full items-center gap-4">
                                                        <div
                                                            className={cn(
                                                                'flex h-12 w-12 items-center justify-center rounded-full transition-colors',
                                                                field.value ===
                                                                    ROLES.ADMIN
                                                                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                                                                    : 'bg-slate-100 text-slate-500',
                                                            )}
                                                        >
                                                            <ShieldCheck
                                                                size={24}
                                                            />
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span
                                                                className={cn(
                                                                    'text-sm font-bold',
                                                                    field.value ===
                                                                        ROLES.ADMIN
                                                                        ? 'text-indigo-900'
                                                                        : 'text-slate-900',
                                                                )}
                                                            >
                                                                System Admin
                                                            </span>
                                                            <span className="text-xs font-medium text-slate-500 mt-0.5">
                                                                Full access to
                                                                system settings
                                                                and management.
                                                            </span>
                                                        </div>
                                                    </div>
                                                </label>

                                                <label
                                                    className={cn(
                                                        'relative flex cursor-pointer rounded-2xl border p-4 shadow-sm transition-all duration-200',
                                                        field.value ===
                                                            ROLES.THERAPIST
                                                            ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600'
                                                            : 'border-slate-200 bg-white hover:border-indigo-200 hover:bg-slate-50',
                                                        (isLoading ||
                                                            isEditing) &&
                                                            'opacity-60 cursor-not-allowed',
                                                    )}
                                                >
                                                    <input
                                                        type="radio"
                                                        value={ROLES.THERAPIST}
                                                        checked={
                                                            field.value ===
                                                            ROLES.THERAPIST
                                                        }
                                                        onChange={(e) =>
                                                            field.onChange(
                                                                e.target.value,
                                                            )
                                                        }
                                                        disabled={
                                                            isLoading ||
                                                            isEditing
                                                        }
                                                        className="sr-only"
                                                    />
                                                    <div className="flex w-full items-center gap-4">
                                                        <div
                                                            className={cn(
                                                                'flex h-12 w-12 items-center justify-center rounded-full transition-colors',
                                                                field.value ===
                                                                    ROLES.THERAPIST
                                                                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                                                                    : 'bg-slate-100 text-slate-500',
                                                            )}
                                                        >
                                                            <HeartHandshake
                                                                size={24}
                                                            />
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span
                                                                className={cn(
                                                                    'text-sm font-bold',
                                                                    field.value ===
                                                                        ROLES.THERAPIST
                                                                        ? 'text-indigo-900'
                                                                        : 'text-slate-900',
                                                                )}
                                                            >
                                                                Therapist /
                                                                Staff
                                                            </span>
                                                            <span className="text-xs font-medium text-slate-500 mt-0.5">
                                                                Manage
                                                                schedules,
                                                                sessions, and
                                                                track progress.
                                                            </span>
                                                        </div>
                                                    </div>
                                                </label>

                                                <label
                                                    className={cn(
                                                        'relative flex cursor-pointer rounded-2xl border p-4 shadow-sm transition-all duration-200',
                                                        field.value ===
                                                            ROLES.STUDENT
                                                            ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600'
                                                            : 'border-slate-200 bg-white hover:border-indigo-200 hover:bg-slate-50',
                                                        (isLoading ||
                                                            isEditing) &&
                                                            'opacity-60 cursor-not-allowed',
                                                    )}
                                                >
                                                    <input
                                                        type="radio"
                                                        value={ROLES.STUDENT}
                                                        checked={
                                                            field.value ===
                                                            ROLES.STUDENT
                                                        }
                                                        onChange={(e) =>
                                                            field.onChange(
                                                                e.target.value,
                                                            )
                                                        }
                                                        disabled={
                                                            isLoading ||
                                                            isEditing
                                                        }
                                                        className="sr-only"
                                                    />
                                                    <div className="flex w-full items-center gap-4">
                                                        <div
                                                            className={cn(
                                                                'flex h-12 w-12 items-center justify-center rounded-full transition-colors',
                                                                field.value ===
                                                                    ROLES.STUDENT
                                                                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                                                                    : 'bg-slate-100 text-slate-500',
                                                            )}
                                                        >
                                                            <GraduationCap
                                                                size={24}
                                                            />
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span
                                                                className={cn(
                                                                    'text-sm font-bold',
                                                                    field.value ===
                                                                        ROLES.STUDENT
                                                                        ? 'text-indigo-900'
                                                                        : 'text-slate-900',
                                                                )}
                                                            >
                                                                Student Learner
                                                            </span>
                                                            <span className="text-xs font-medium text-slate-500 mt-0.5">
                                                                Enrolls student
                                                                profiles
                                                                requiring a
                                                                guardian.
                                                            </span>
                                                        </div>
                                                    </div>
                                                </label>
                                            </div>
                                        </FormControl>
                                        <FormMessage
                                            className={styles.formMessage}
                                        />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* --- STEP 2: PERSONAL --- */}
                        <div
                            className={cn(
                                'space-y-4 animate-in slide-in-from-right-4 fade-in duration-500',
                                currentStepId === 'personal'
                                    ? 'block'
                                    : 'hidden',
                            )}
                        >
                            <div className="flex justify-center pb-2">
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    ref={fileInputRef}
                                    onChange={handleImageChange}
                                />
                                <div
                                    onClick={() =>
                                        fileInputRef.current?.click()
                                    }
                                    className="relative cursor-pointer group hover:scale-105 transition-all"
                                >
                                    <Avatar className="h-20 w-20 border-4 border-white shadow-lg bg-slate-50">
                                        {imagePreview && (
                                            <AvatarImage
                                                src={imagePreview}
                                                className="object-cover"
                                            />
                                        )}
                                        <AvatarFallback className="bg-indigo-50">
                                            <Camera
                                                className="text-indigo-400"
                                                size={24}
                                            />
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="absolute inset-0 bg-slate-900/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                                        <Camera
                                            size={18}
                                            className="text-white"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                                <FormField
                                    control={form.control}
                                    name="firstName"
                                    render={({ field }) => (
                                        <FormItem className={styles.formItem}>
                                            <FormLabel
                                                className={styles.formLabel}
                                            >
                                                First Name *
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    className={styles.formInput}
                                                    {...field}
                                                    disabled={isLoading}
                                                />
                                            </FormControl>
                                            <FormMessage
                                                className={styles.formMessage}
                                            />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="middleName"
                                    render={({ field }) => (
                                        <FormItem className={styles.formItem}>
                                            <FormLabel
                                                className={styles.formLabel}
                                            >
                                                Middle Name
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    className={styles.formInput}
                                                    {...field}
                                                    disabled={isLoading}
                                                />
                                            </FormControl>
                                            <FormMessage
                                                className={styles.formMessage}
                                            />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="lastName"
                                    render={({ field }) => (
                                        <FormItem className={styles.formItem}>
                                            <FormLabel
                                                className={styles.formLabel}
                                            >
                                                Last Name *
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    className={styles.formInput}
                                                    {...field}
                                                    disabled={isLoading}
                                                />
                                            </FormControl>
                                            <FormMessage
                                                className={styles.formMessage}
                                            />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                                <FormField
                                    control={form.control}
                                    name="dateOfBirth"
                                    render={({ field }) => (
                                        <FormItem className={styles.formItem}>
                                            <FormLabel
                                                className={styles.formLabel}
                                            >
                                                Date of Birth *
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="date"
                                                    className={styles.formInput}
                                                    {...field}
                                                    disabled={isLoading}
                                                />
                                            </FormControl>
                                            <FormMessage
                                                className={styles.formMessage}
                                            />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="gender"
                                    render={({ field }) => (
                                        <FormItem className={styles.formItem}>
                                            <FormLabel
                                                className={styles.formLabel}
                                            >
                                                Gender *
                                            </FormLabel>
                                            <FormControl>
                                                <div className="flex gap-3">
                                                    <label className="flex-1 cursor-pointer">
                                                        <input
                                                            type="radio"
                                                            value="male"
                                                            checked={
                                                                field.value ===
                                                                'male'
                                                            }
                                                            onChange={(e) =>
                                                                field.onChange(
                                                                    e.target
                                                                        .value,
                                                                )
                                                            }
                                                            disabled={isLoading}
                                                            className="sr-only peer"
                                                        />
                                                        <div className="h-11 flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50/50 text-sm font-bold text-slate-400 transition-all peer-checked:border-indigo-600 peer-checked:bg-indigo-50 peer-checked:text-indigo-700 hover:border-indigo-200 hover:bg-white hover:text-slate-600 shadow-inner peer-checked:shadow-sm">
                                                            Male
                                                        </div>
                                                    </label>
                                                    <label className="flex-1 cursor-pointer">
                                                        <input
                                                            type="radio"
                                                            value="female"
                                                            checked={
                                                                field.value ===
                                                                'female'
                                                            }
                                                            onChange={(e) =>
                                                                field.onChange(
                                                                    e.target
                                                                        .value,
                                                                )
                                                            }
                                                            disabled={isLoading}
                                                            className="sr-only peer"
                                                        />
                                                        <div className="h-11 flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50/50 text-sm font-bold text-slate-400 transition-all peer-checked:border-pink-500 peer-checked:bg-pink-50 peer-checked:text-pink-700 hover:border-pink-200 hover:bg-white hover:text-slate-600 shadow-inner peer-checked:shadow-sm">
                                                            Female
                                                        </div>
                                                    </label>
                                                </div>
                                            </FormControl>
                                            <FormMessage
                                                className={styles.formMessage}
                                            />
                                        </FormItem>
                                    )}
                                />

                                {isStudent && (
                                    <FormField
                                        control={form.control}
                                        name="diagnosis"
                                        render={({ field }) => (
                                            <FormItem
                                                className={styles.formItem}
                                            >
                                                <FormLabel
                                                    className={styles.formLabel}
                                                >
                                                    Diagnosis *
                                                </FormLabel>
                                                <FormControl>
                                                    <div className="flex gap-2">
                                                        <label className="flex-1 cursor-pointer">
                                                            <input
                                                                type="radio"
                                                                value="ADHD"
                                                                checked={
                                                                    field.value ===
                                                                    'ADHD'
                                                                }
                                                                onChange={(e) =>
                                                                    field.onChange(
                                                                        e.target
                                                                            .value,
                                                                    )
                                                                }
                                                                disabled={
                                                                    isLoading
                                                                }
                                                                className="sr-only peer"
                                                            />
                                                            <div className="h-11 flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-bold text-slate-400 transition-all peer-checked:border-amber-500 peer-checked:bg-amber-50 peer-checked:text-amber-700 hover:border-amber-200 hover:bg-white hover:text-slate-600 shadow-inner peer-checked:shadow-sm">
                                                                <Zap
                                                                    size={14}
                                                                />{' '}
                                                                ADHD
                                                            </div>
                                                        </label>
                                                        <label className="flex-1 cursor-pointer">
                                                            <input
                                                                type="radio"
                                                                value="Autism"
                                                                checked={
                                                                    field.value ===
                                                                    'Autism'
                                                                }
                                                                onChange={(e) =>
                                                                    field.onChange(
                                                                        e.target
                                                                            .value,
                                                                    )
                                                                }
                                                                disabled={
                                                                    isLoading
                                                                }
                                                                className="sr-only peer"
                                                            />
                                                            <div className="h-11 flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-bold text-slate-400 transition-all peer-checked:border-indigo-600 peer-checked:bg-indigo-50 peer-checked:text-indigo-700 hover:border-indigo-200 hover:bg-white hover:text-slate-600 shadow-inner peer-checked:shadow-sm">
                                                                <Brain
                                                                    size={14}
                                                                />{' '}
                                                                Autism
                                                            </div>
                                                        </label>
                                                        <label className="flex-1 cursor-pointer">
                                                            <input
                                                                type="radio"
                                                                value="N/A"
                                                                checked={
                                                                    field.value ===
                                                                    'N/A'
                                                                }
                                                                onChange={(e) =>
                                                                    field.onChange(
                                                                        e.target
                                                                            .value,
                                                                    )
                                                                }
                                                                disabled={
                                                                    isLoading
                                                                }
                                                                className="sr-only peer"
                                                            />
                                                            <div className="h-11 flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-bold text-slate-400 transition-all peer-checked:border-slate-500 peer-checked:bg-slate-100 peer-checked:text-slate-700 hover:border-slate-300 hover:bg-white hover:text-slate-600 shadow-inner peer-checked:shadow-sm">
                                                                <Minus
                                                                    size={14}
                                                                />{' '}
                                                                N/A
                                                            </div>
                                                        </label>
                                                    </div>
                                                </FormControl>
                                                <FormMessage
                                                    className={
                                                        styles.formMessage
                                                    }
                                                />
                                            </FormItem>
                                        )}
                                    />
                                )}
                            </div>
                        </div>

                        {/* --- STEP 3: ACCOUNT (Non-Student Only) --- */}
                        {!isStudent && (
                            <div
                                className={cn(
                                    'space-y-4 animate-in slide-in-from-right-4 fade-in duration-500',
                                    currentStepId === 'account'
                                        ? 'block'
                                        : 'hidden',
                                )}
                            >
                                <FormField
                                    control={form.control}
                                    name="username"
                                    render={({ field }) => (
                                        <FormItem className={styles.formItem}>
                                            <FormLabel
                                                className={styles.formLabel}
                                            >
                                                Username *
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    className={styles.formInput}
                                                    {...field}
                                                    disabled={isLoading}
                                                />
                                            </FormControl>
                                            <FormMessage
                                                className={styles.formMessage}
                                            />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem className={styles.formItem}>
                                            <FormLabel
                                                className={styles.formLabel}
                                            >
                                                Email Address *
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="email"
                                                    className={styles.formInput}
                                                    {...field}
                                                    disabled={isLoading}
                                                />
                                            </FormControl>
                                            <FormMessage
                                                className={styles.formMessage}
                                            />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="password"
                                    render={({ field }) => (
                                        <FormItem className={styles.formItem}>
                                            <FormLabel
                                                className={styles.formLabel}
                                            >
                                                {isEditing
                                                    ? 'New Password (Optional)'
                                                    : 'Password *'}
                                            </FormLabel>
                                            <div className="relative">
                                                <FormControl>
                                                    <Input
                                                        type={
                                                            showPassword
                                                                ? 'text'
                                                                : 'password'
                                                        }
                                                        className={cn(
                                                            styles.formInput,
                                                            'pr-10',
                                                        )}
                                                        {...field}
                                                        disabled={isLoading}
                                                    />
                                                </FormControl>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setShowPassword(
                                                            !showPassword,
                                                        )
                                                    }
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-500 transition-colors"
                                                >
                                                    <EyeIcon size={16} />
                                                </button>
                                            </div>
                                            <FormMessage
                                                className={styles.formMessage}
                                            />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        )}

                        {/* --- STEP 4/3: ADDRESS --- */}
                        <div
                            className={cn(
                                'space-y-4 animate-in slide-in-from-right-4 fade-in duration-500',
                                currentStepId === 'address'
                                    ? 'block'
                                    : 'hidden',
                            )}
                        >
                            <FormField
                                control={form.control}
                                name="streetAddress"
                                render={({ field }) => (
                                    <FormItem className={styles.formItem}>
                                        <FormLabel className={styles.formLabel}>
                                            Street Address
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                className={styles.formInput}
                                                {...field}
                                                disabled={isLoading}
                                            />
                                        </FormControl>
                                        <FormMessage
                                            className={styles.formMessage}
                                        />
                                    </FormItem>
                                )}
                            />
                            <div className="grid grid-cols-2 gap-4 items-start">
                                <FormField
                                    control={form.control}
                                    name="city"
                                    render={({ field }) => (
                                        <FormItem className={styles.formItem}>
                                            <FormLabel
                                                className={styles.formLabel}
                                            >
                                                City
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    className={styles.formInput}
                                                    {...field}
                                                    disabled={isLoading}
                                                />
                                            </FormControl>
                                            <FormMessage
                                                className={styles.formMessage}
                                            />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="stateProvince"
                                    render={({ field }) => (
                                        <FormItem className={styles.formItem}>
                                            <FormLabel
                                                className={styles.formLabel}
                                            >
                                                State / Province
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    className={styles.formInput}
                                                    {...field}
                                                    disabled={isLoading}
                                                />
                                            </FormControl>
                                            <FormMessage
                                                className={styles.formMessage}
                                            />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="postalCode"
                                    render={({ field }) => (
                                        <FormItem className={styles.formItem}>
                                            <FormLabel
                                                className={styles.formLabel}
                                            >
                                                Zip Code
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    className={styles.formInput}
                                                    {...field}
                                                    disabled={isLoading}
                                                />
                                            </FormControl>
                                            <FormMessage
                                                className={styles.formMessage}
                                            />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="countryCode"
                                    render={({ field }) => (
                                        <FormItem className={styles.formItem}>
                                            <FormLabel
                                                className={styles.formLabel}
                                            >
                                                Country Code
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="PH"
                                                    className={cn(
                                                        styles.formInput,
                                                        'uppercase',
                                                    )}
                                                    maxLength={2}
                                                    {...field}
                                                    disabled={isLoading}
                                                />
                                            </FormControl>
                                            <FormMessage
                                                className={styles.formMessage}
                                            />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        {/* --- STEP 5/4: GUARDIAN (Student Only) --- */}
                        {isStudent && (
                            <div
                                className={cn(
                                    'space-y-4 animate-in slide-in-from-right-4 fade-in duration-500',
                                    currentStepId === 'guardian'
                                        ? 'block'
                                        : 'hidden',
                                )}
                            >
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
                                    <FormField
                                        control={form.control}
                                        name="guardianName"
                                        render={({ field }) => (
                                            <FormItem
                                                className={styles.formItem}
                                            >
                                                <FormLabel
                                                    className={styles.formLabel}
                                                >
                                                    Guardian Name *
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        className={
                                                            styles.formInput
                                                        }
                                                        {...field}
                                                        disabled={isLoading}
                                                    />
                                                </FormControl>
                                                <FormMessage
                                                    className={
                                                        styles.formMessage
                                                    }
                                                />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="guardianRelationship"
                                        render={({ field }) => (
                                            <FormItem
                                                className={styles.formItem}
                                            >
                                                <FormLabel
                                                    className={styles.formLabel}
                                                >
                                                    Relationship *
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="e.g. Mother, Father"
                                                        className={
                                                            styles.formInput
                                                        }
                                                        {...field}
                                                        disabled={isLoading}
                                                    />
                                                </FormControl>
                                                <FormMessage
                                                    className={
                                                        styles.formMessage
                                                    }
                                                />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="guardianContact"
                                        render={({ field }) => (
                                            <FormItem
                                                className={styles.formItem}
                                            >
                                                <FormLabel
                                                    className={styles.formLabel}
                                                >
                                                    Contact Number *
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="tel"
                                                        className={
                                                            styles.formInput
                                                        }
                                                        {...field}
                                                        disabled={isLoading}
                                                    />
                                                </FormControl>
                                                <FormMessage
                                                    className={
                                                        styles.formMessage
                                                    }
                                                />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="guardianEmail"
                                        render={({ field }) => (
                                            <FormItem
                                                className={styles.formItem}
                                            >
                                                <FormLabel
                                                    className={styles.formLabel}
                                                >
                                                    Email Address
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="email"
                                                        className={
                                                            styles.formInput
                                                        }
                                                        {...field}
                                                        disabled={isLoading}
                                                    />
                                                </FormControl>
                                                <FormMessage
                                                    className={
                                                        styles.formMessage
                                                    }
                                                />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* --- ACTIONS --- */}
                    <div className="flex gap-3 pt-6 border-t border-slate-100 mt-auto">
                        {step === 1 ? (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onCancel}
                                disabled={isLoading}
                                className="flex-1 h-12 rounded-xl text-xs font-bold uppercase tracking-widest shadow-sm hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-colors"
                            >
                                Cancel
                            </Button>
                        ) : (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setStep(step - 1)}
                                disabled={isLoading}
                                className="flex-1 h-12 rounded-xl text-xs font-bold uppercase tracking-widest shadow-sm"
                            >
                                <ChevronLeft className="w-4 h-4 mr-1.5" /> Back
                            </Button>
                        )}

                        {currentStepId === 'address' && (
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={handleSkip}
                                disabled={isLoading}
                                className="flex-1 h-12 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold uppercase tracking-widest"
                            >
                                Skip Address
                            </Button>
                        )}

                        {step < STEPS.length ? (
                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="flex-1 h-12 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-widest shadow-md transition-all active:scale-95"
                            >
                                {isValidating ? (
                                    <>
                                        <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />{' '}
                                        Verifying...
                                    </>
                                ) : (
                                    <>
                                        Continue{' '}
                                        <ChevronRight className="w-4 h-4 ml-1.5" />
                                    </>
                                )}
                            </Button>
                        ) : (
                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="flex-[1.5] h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase tracking-widest shadow-lg shadow-indigo-200 transition-all active:scale-95"
                            >
                                {isLoading ? (
                                    <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                                ) : isEditing ? (
                                    'Save Changes'
                                ) : (
                                    'Complete Setup'
                                )}
                            </Button>
                        )}
                    </div>
                </form>
            </Form>
        </div>
    );
}
