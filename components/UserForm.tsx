'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
    Loader2Icon,
    EyeIcon,
    EyeOffIcon,
    ChevronRight,
    ChevronLeft,
    Check,
    Camera,
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

// --- VALIDATION SCHEMA ---
export const userFormSchema = z.object({
    username: z.string().min(3, 'Minimum 3 characters.'),
    email: z.string().email('Invalid email.').min(6),
    password: z
        .string()
        .min(6, 'Minimum 6 characters.')
        .optional()
        .or(z.literal('')),
    role: z.string().min(1, 'Role is required.'),
    confirmed: z.boolean(),
    blocked: z.boolean(),

    profilePicture: z.any().optional(),
    firstName: z.string().min(1, 'First name is required.'),
    middleName: z.string().optional(),
    lastName: z.string().min(1, 'Last name is required.'),
    dateOfBirth: z.string().min(1, 'Date of birth is required.'),
    gender: z.enum(['male', 'female'], { required_error: 'Select a gender.' }),

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
        .email('Invalid email')
        .optional()
        .or(z.literal('')),
});

export type UserFormValues = z.infer<typeof userFormSchema>;

interface UserFormProps {
    initialData?: any;
    onSubmit: (values: UserFormValues) => void;
    onCancel: () => void;
    isLoading: boolean;
}

export default function UserForm({
    initialData,
    onSubmit,
    onCancel,
    isLoading,
}: UserFormProps) {
    const [step, setStep] = React.useState(1);
    const [showPassword, setShowPassword] = React.useState(false);
    const [imagePreview, setImagePreview] = React.useState<string | null>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const isEditing = !!initialData;

    const form = useForm<UserFormValues>({
        resolver: zodResolver(userFormSchema),
        defaultValues: {
            username: '',
            email: '',
            password: '',
            role: '',
            confirmed: true,
            blocked: false,
            profilePicture: null,
            firstName: '',
            middleName: '',
            lastName: '',
            dateOfBirth: '',
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
    const isStudent =
        String(selectedRole) === '4' ||
        String(selectedRole).toLowerCase().includes('student');

    const STEPS = React.useMemo(() => {
        const baseSteps = [
            { id: 1, title: 'Account' },
            { id: 2, title: 'Personal' },
            { id: 3, title: 'Address' },
        ];
        if (isStudent) baseSteps.push({ id: 4, title: 'Guardian' });
        return baseSteps;
    }, [isStudent]);

    React.useEffect(() => {
        if (initialData) {
            form.reset({
                ...form.getValues(),
                username: initialData.username || '',
                email: initialData.email || '',
                role:
                    initialData.role?.id?.toString() || initialData.role || '',
                confirmed: initialData.confirmed ?? true,
                blocked: initialData.blocked ?? false,
                firstName: initialData.firstName || '',
                lastName: initialData.lastName || '',
                dateOfBirth: initialData.dateOfBirth || '',
                gender: initialData.gender || undefined,
            });
            if (initialData.profilePicture?.url)
                setImagePreview(initialData.profilePicture.url);
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
        if (step === 3) {
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
        } else if (step === 4) {
            form.setValue('guardianName', '');
            form.setValue('guardianRelationship', '');
            form.setValue('guardianContact', '');
            form.setValue('guardianEmail', '');
            form.clearErrors([
                'guardianName',
                'guardianRelationship',
                'guardianContact',
                'guardianEmail',
            ]);
        }

        if (step < STEPS.length) {
            setStep((prev) => prev + 1);
        } else {
            await form.handleSubmit(onSubmit)();
        }
    };

    const handleSmartSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (step < STEPS.length) {
            let fieldsToValidate: (keyof UserFormValues)[] = [];
            if (step === 1)
                fieldsToValidate = ['username', 'email', 'password', 'role'];
            if (step === 2)
                fieldsToValidate = [
                    'firstName',
                    'lastName',
                    'dateOfBirth',
                    'gender',
                ];
            if (step === 3)
                fieldsToValidate = [
                    'streetAddress',
                    'city',
                    'stateProvince',
                    'postalCode',
                    'countryCode',
                ];

            const isStepValid = await form.trigger(fieldsToValidate);
            if (isStepValid) {
                setStep((prev) => prev + 1);
            }
        } else {
            await form.handleSubmit(onSubmit)(e);
        }
    };

    // --- REUSABLE CLASSNAMES FOR ANTI-JUMPING ---
    const formItemClass = 'relative pb-4 space-y-1';
    const formLabelClass =
        'text-[9px] font-bold text-slate-500 uppercase tracking-wider ml-1';
    const formInputClass =
        'h-9 rounded-xl border-slate-200 bg-slate-50/30 text-sm shadow-sm';
    const formMessageClass =
        'text-[9px] font-medium text-red-500 absolute bottom-0 left-1 leading-none';

    return (
        <div className="flex flex-col w-full">
            {/* --- ULTRA-COMPACT WIZARD PROGRESS BAR --- */}
            <div className="mb-4 relative px-4">
                <div className="absolute top-1/2 left-6 right-6 h-0.5 bg-slate-100 -translate-y-1/2 z-0" />
                <div
                    className="absolute top-1/2 left-6 h-0.5 bg-indigo-600 -translate-y-1/2 z-0 transition-all duration-500 ease-in-out"
                    style={{
                        width: `calc(${((step - 1) / (STEPS.length - 1)) * 100}% - 1.5rem)`,
                    }}
                />

                <div className="relative z-10 flex justify-between">
                    {STEPS.map((s) => (
                        <div
                            key={s.id}
                            className="flex flex-col items-center gap-1 bg-white px-2"
                        >
                            <div
                                className={cn(
                                    'h-5 w-5 rounded-full flex items-center justify-center text-[8px] font-bold transition-all duration-300 border-2',
                                    step > s.id
                                        ? 'bg-indigo-600 border-indigo-600 text-white'
                                        : step === s.id
                                          ? 'bg-white border-indigo-600 text-indigo-600 shadow-sm'
                                          : 'bg-white border-slate-200 text-slate-400',
                                )}
                            >
                                {step > s.id ? (
                                    <Check size={10} strokeWidth={3} />
                                ) : (
                                    s.id
                                )}
                            </div>
                            <span
                                className={cn(
                                    'text-[7px] uppercase tracking-widest font-bold',
                                    step >= s.id
                                        ? 'text-indigo-900'
                                        : 'text-slate-400',
                                )}
                            >
                                {s.title}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            <Form {...form}>
                <form onSubmit={handleSmartSubmit} className="flex flex-col">
                    {/* Fixed Height Container prevents form from jumping between steps */}
                    <div className="min-h-[260px] md:min-h-[280px] flex flex-col justify-start">
                        {/* --- STEP 1: ACCOUNT INFO --- */}
                        <div
                            className={cn(
                                'animate-in fade-in duration-300',
                                step === 1 ? 'block' : 'hidden',
                            )}
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-0">
                                <FormField
                                    control={form.control}
                                    name="username"
                                    render={({ field }) => (
                                        <FormItem className={formItemClass}>
                                            <FormLabel
                                                className={formLabelClass}
                                            >
                                                Username *
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    className={formInputClass}
                                                    {...field}
                                                    disabled={isLoading}
                                                />
                                            </FormControl>
                                            <FormMessage
                                                className={formMessageClass}
                                            />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem className={formItemClass}>
                                            <FormLabel
                                                className={formLabelClass}
                                            >
                                                Email *
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="email"
                                                    className={formInputClass}
                                                    {...field}
                                                    disabled={isLoading}
                                                />
                                            </FormControl>
                                            <FormMessage
                                                className={formMessageClass}
                                            />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="password"
                                    render={({ field }) => (
                                        <FormItem className={formItemClass}>
                                            <FormLabel
                                                className={formLabelClass}
                                            >
                                                {isEditing
                                                    ? 'New Password'
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
                                                            formInputClass,
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
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                                                >
                                                    <EyeIcon size={14} />
                                                </button>
                                            </div>
                                            <FormMessage
                                                className={formMessageClass}
                                            />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="role"
                                    render={({ field }) => (
                                        <FormItem className={formItemClass}>
                                            <FormLabel
                                                className={formLabelClass}
                                            >
                                                Role *
                                            </FormLabel>
                                            <Select
                                                onValueChange={field.onChange}
                                                defaultValue={field.value}
                                                disabled={isLoading}
                                            >
                                                <FormControl>
                                                    <SelectTrigger
                                                        className={
                                                            formInputClass
                                                        }
                                                    >
                                                        <SelectValue placeholder="Select role" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="1">
                                                        Admin
                                                    </SelectItem>
                                                    <SelectItem value="2">
                                                        Therapist
                                                    </SelectItem>
                                                    <SelectItem value="3">
                                                        Secretary
                                                    </SelectItem>
                                                    <SelectItem value="4">
                                                        Student
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage
                                                className={formMessageClass}
                                            />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        {/* --- STEP 2: PERSONAL INFO --- */}
                        <div
                            className={cn(
                                'animate-in fade-in duration-300',
                                step === 2 ? 'block' : 'hidden',
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
                                    <Avatar className="h-16 w-16 border-4 border-white shadow-sm bg-slate-50">
                                        {imagePreview && (
                                            <AvatarImage
                                                src={imagePreview}
                                                className="object-cover"
                                            />
                                        )}
                                        <AvatarFallback className="bg-indigo-50">
                                            <Camera
                                                className="text-indigo-300"
                                                size={20}
                                            />
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="absolute inset-0 bg-slate-900/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <Camera
                                            size={14}
                                            className="text-white"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-0 mt-1">
                                <FormField
                                    control={form.control}
                                    name="firstName"
                                    render={({ field }) => (
                                        <FormItem className={formItemClass}>
                                            <FormLabel
                                                className={formLabelClass}
                                            >
                                                First Name *
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    className={formInputClass}
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage
                                                className={formMessageClass}
                                            />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="middleName"
                                    render={({ field }) => (
                                        <FormItem className={formItemClass}>
                                            <FormLabel
                                                className={formLabelClass}
                                            >
                                                Middle Name
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    className={formInputClass}
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage
                                                className={formMessageClass}
                                            />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="lastName"
                                    render={({ field }) => (
                                        <FormItem className={formItemClass}>
                                            <FormLabel
                                                className={formLabelClass}
                                            >
                                                Last Name *
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    className={formInputClass}
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage
                                                className={formMessageClass}
                                            />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-0">
                                <FormField
                                    control={form.control}
                                    name="dateOfBirth"
                                    render={({ field }) => (
                                        <FormItem className={formItemClass}>
                                            <FormLabel
                                                className={formLabelClass}
                                            >
                                                Date of Birth *
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="date"
                                                    className={formInputClass}
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage
                                                className={formMessageClass}
                                            />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="gender"
                                    render={({ field }) => (
                                        <FormItem className={formItemClass}>
                                            <FormLabel
                                                className={formLabelClass}
                                            >
                                                Gender *
                                            </FormLabel>
                                            <Select
                                                onValueChange={field.onChange}
                                                defaultValue={field.value}
                                                disabled={isLoading}
                                            >
                                                <FormControl>
                                                    <SelectTrigger
                                                        className={
                                                            formInputClass
                                                        }
                                                    >
                                                        <SelectValue placeholder="Select gender" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="male">
                                                        Male
                                                    </SelectItem>
                                                    <SelectItem value="female">
                                                        Female
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage
                                                className={formMessageClass}
                                            />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        {/* --- STEP 3: ADDRESS --- */}
                        <div
                            className={cn(
                                'animate-in fade-in duration-300',
                                step === 3 ? 'block' : 'hidden',
                            )}
                        >
                            <FormField
                                control={form.control}
                                name="streetAddress"
                                render={({ field }) => (
                                    <FormItem className={formItemClass}>
                                        <FormLabel className={formLabelClass}>
                                            Street Address
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                className={formInputClass}
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage
                                            className={formMessageClass}
                                        />
                                    </FormItem>
                                )}
                            />
                            <div className="grid grid-cols-2 gap-x-4 gap-y-0">
                                <FormField
                                    control={form.control}
                                    name="city"
                                    render={({ field }) => (
                                        <FormItem className={formItemClass}>
                                            <FormLabel
                                                className={formLabelClass}
                                            >
                                                City
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    className={formInputClass}
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage
                                                className={formMessageClass}
                                            />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="stateProvince"
                                    render={({ field }) => (
                                        <FormItem className={formItemClass}>
                                            <FormLabel
                                                className={formLabelClass}
                                            >
                                                State
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    className={formInputClass}
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage
                                                className={formMessageClass}
                                            />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="postalCode"
                                    render={({ field }) => (
                                        <FormItem className={formItemClass}>
                                            <FormLabel
                                                className={formLabelClass}
                                            >
                                                Zip Code
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    className={formInputClass}
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage
                                                className={formMessageClass}
                                            />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="countryCode"
                                    render={({ field }) => (
                                        <FormItem className={formItemClass}>
                                            <FormLabel
                                                className={formLabelClass}
                                            >
                                                Country
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="US"
                                                    className={cn(
                                                        formInputClass,
                                                        'uppercase',
                                                    )}
                                                    maxLength={2}
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage
                                                className={formMessageClass}
                                            />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        {/* --- STEP 4: GUARDIAN (CONDITIONAL) --- */}
                        {isStudent && (
                            <div
                                className={cn(
                                    'animate-in fade-in duration-300',
                                    step === 4 ? 'block' : 'hidden',
                                )}
                            >
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-0">
                                    <FormField
                                        control={form.control}
                                        name="guardianName"
                                        render={({ field }) => (
                                            <FormItem className={formItemClass}>
                                                <FormLabel
                                                    className={formLabelClass}
                                                >
                                                    Guardian Name
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        className={
                                                            formInputClass
                                                        }
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage
                                                    className={formMessageClass}
                                                />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="guardianRelationship"
                                        render={({ field }) => (
                                            <FormItem className={formItemClass}>
                                                <FormLabel
                                                    className={formLabelClass}
                                                >
                                                    Relationship
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="e.g. Mother, Father"
                                                        className={
                                                            formInputClass
                                                        }
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage
                                                    className={formMessageClass}
                                                />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="guardianContact"
                                        render={({ field }) => (
                                            <FormItem className={formItemClass}>
                                                <FormLabel
                                                    className={formLabelClass}
                                                >
                                                    Contact Number
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="tel"
                                                        className={
                                                            formInputClass
                                                        }
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage
                                                    className={formMessageClass}
                                                />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="guardianEmail"
                                        render={({ field }) => (
                                            <FormItem className={formItemClass}>
                                                <FormLabel
                                                    className={formLabelClass}
                                                >
                                                    Email Address
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="email"
                                                        className={
                                                            formInputClass
                                                        }
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage
                                                    className={formMessageClass}
                                                />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* --- ACTIONS --- */}
                    <div className="flex gap-2 pt-2 border-t border-slate-100 mt-auto">
                        {step === 1 ? (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onCancel}
                                className="flex-1 h-10 rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-sm"
                            >
                                Cancel
                            </Button>
                        ) : (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setStep(step - 1)}
                                className="flex-1 h-10 rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-sm"
                            >
                                <ChevronLeft className="w-3.5 h-3.5 mr-1" />{' '}
                                Back
                            </Button>
                        )}

                        {(step === 3 || step === 4) && (
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={handleSkip}
                                disabled={isLoading}
                                className="flex-1 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-bold uppercase tracking-widest"
                            >
                                Skip
                            </Button>
                        )}

                        {step < STEPS.length ? (
                            <Button
                                type="submit"
                                className="flex-1 h-10 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold uppercase tracking-widest shadow-sm"
                            >
                                Continue{' '}
                                <ChevronRight className="w-3.5 h-3.5 ml-1" />
                            </Button>
                        ) : (
                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="flex-[1.5] h-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold uppercase tracking-widest shadow-md shadow-indigo-100"
                            >
                                {isLoading ? (
                                    <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
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
