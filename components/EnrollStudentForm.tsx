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
export const studentFormSchema = z.object({
    // Account
    username: z.string().min(3, 'Minimum 3 characters.'),
    email: z.string().email('Invalid email address.').min(6),
    password: z
        .string()
        .min(6, 'Minimum 6 characters.')
        .optional()
        .or(z.literal('')),
    confirmed: z.boolean().default(true),
    blocked: z.boolean().default(false),

    // Personal
    // ✨ FIX: Use proper typing for File instead of z.any() to resolve the TS Control error
    profilePicture: z.custom<File>().optional().nullable(),
    firstName: z.string().min(1, 'First name is required.'),
    middleName: z.string().optional(),
    lastName: z.string().min(1, 'Last name is required.'),
    dateOfBirth: z.string().min(1, 'Date of birth is required.'),
    gender: z.enum(['male', 'female'], {
        required_error: 'Please select a gender.',
    }),

    // Address
    addressLabel: z.string().optional(),
    streetAddress: z.string().optional(),
    city: z.string().optional(),
    stateProvince: z.string().optional(),
    postalCode: z.string().optional(),
    countryCode: z.string().max(2, 'Max 2 chars').optional(),
    isDefault: z.boolean().optional(),

    // Guardian
    guardianName: z.string().min(1, 'Guardian name is required.'),
    guardianRelationship: z.string().min(1, 'Relationship is required.'),
    guardianContact: z.string().min(1, 'Contact number is required.'),
    guardianEmail: z
        .string()
        .email('Invalid email.')
        .optional()
        .or(z.literal('')),
});

export type StudentFormValues = z.infer<typeof studentFormSchema>;

interface EnrollStudentFormProps {
    onSubmit: (values: StudentFormValues) => void;
    onCancel: () => void;
    isLoading: boolean;
}

const STEPS = [
    { id: 1, title: 'Account' },
    { id: 2, title: 'Personal' },
    { id: 3, title: 'Address' },
    { id: 4, title: 'Guardian' },
];

// --- REUSABLE STYLES FOR PREMIUM LOOK ---
const styles = {
    formItem: 'space-y-1.5',
    formLabel:
        'text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1',
    formInput:
        'h-11 rounded-xl border-slate-200 bg-slate-50/50 text-sm shadow-inner focus-visible:ring-4 focus-visible:ring-indigo-500/10 focus-visible:border-indigo-400 transition-all font-medium placeholder:text-slate-400',
    formMessage: 'text-[10px] font-bold text-rose-500 ml-1 mt-1',
};

export default function EnrollStudentForm({
    onSubmit,
    onCancel,
    isLoading,
}: EnrollStudentFormProps) {
    const [step, setStep] = React.useState(1);
    const [showPassword, setShowPassword] = React.useState(false);
    const [imagePreview, setImagePreview] = React.useState<string | null>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const form = useForm<StudentFormValues>({
        resolver: zodResolver(studentFormSchema),
        defaultValues: {
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
            let fieldsToValidate: (keyof StudentFormValues)[] = [];
            if (step === 1)
                fieldsToValidate = ['username', 'email', 'password'];
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
            if (isStepValid) setStep((prev) => prev + 1);
        } else {
            // Final step: validate entire form and submit
            await form.handleSubmit(onSubmit)(e);
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
                    {STEPS.map((s) => (
                        <div
                            key={s.id}
                            className="flex flex-col items-center gap-2 bg-white px-2"
                        >
                            <div
                                className={cn(
                                    'h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-black transition-all duration-500 border-2',
                                    step > s.id
                                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-200'
                                        : step === s.id
                                          ? 'bg-white border-indigo-600 text-indigo-600 shadow-sm ring-4 ring-indigo-50'
                                          : 'bg-white border-slate-200 text-slate-300',
                                )}
                            >
                                {step > s.id ? (
                                    <Check size={12} strokeWidth={4} />
                                ) : (
                                    s.id
                                )}
                            </div>
                            <span
                                className={cn(
                                    'text-[8px] uppercase tracking-widest font-black transition-colors duration-300',
                                    step >= s.id
                                        ? 'text-indigo-900'
                                        : 'text-slate-300',
                                )}
                            >
                                {s.title}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            <Form {...form}>
                <form
                    onSubmit={handleSmartSubmit}
                    className="flex flex-col flex-1"
                >
                    {/* FIXED HEIGHT CONTAINER TO PREVENT JUMPING */}
                    <div className="min-h-[340px] flex flex-col justify-start">
                        {/* STEP 1: ACCOUNT */}
                        <div
                            className={cn(
                                'space-y-5 animate-in slide-in-from-right-4 fade-in duration-500',
                                step === 1 ? 'block' : 'hidden',
                            )}
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <FormField
                                    control={form.control}
                                    name="username"
                                    render={({ field }) => (
                                        <FormItem className={styles.formItem}>
                                            <FormLabel
                                                className={styles.formLabel}
                                            >
                                                Student Username *
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    className={styles.formInput}
                                                    placeholder="johndoe123"
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
                                                Student Email *
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="email"
                                                    placeholder="john@example.com"
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
                                                Password (Optional)
                                            </FormLabel>
                                            <div className="relative">
                                                <FormControl>
                                                    <Input
                                                        type={
                                                            showPassword
                                                                ? 'text'
                                                                : 'password'
                                                        }
                                                        placeholder="••••••••"
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
                                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors"
                                                >
                                                    {showPassword ? (
                                                        <EyeOffIcon size={16} />
                                                    ) : (
                                                        <EyeIcon size={16} />
                                                    )}
                                                </button>
                                            </div>
                                            <FormMessage
                                                className={styles.formMessage}
                                            />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        {/* STEP 2: PERSONAL */}
                        <div
                            className={cn(
                                'space-y-5 animate-in slide-in-from-right-4 fade-in duration-500',
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

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                                                />
                                            </FormControl>
                                            <FormMessage
                                                className={styles.formMessage}
                                            />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                            <Select
                                                onValueChange={field.onChange}
                                                defaultValue={field.value}
                                                disabled={isLoading}
                                            >
                                                <FormControl>
                                                    <SelectTrigger
                                                        className={
                                                            styles.formInput
                                                        }
                                                    >
                                                        <SelectValue placeholder="Select gender" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent className="rounded-xl shadow-xl">
                                                    <SelectItem
                                                        value="male"
                                                        className="font-medium text-sm"
                                                    >
                                                        Male
                                                    </SelectItem>
                                                    <SelectItem
                                                        value="female"
                                                        className="font-medium text-sm"
                                                    >
                                                        Female
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage
                                                className={styles.formMessage}
                                            />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        {/* STEP 3: ADDRESS */}
                        <div
                            className={cn(
                                'space-y-5 animate-in slide-in-from-right-4 fade-in duration-500',
                                step === 3 ? 'block' : 'hidden',
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
                                            />
                                        </FormControl>
                                        <FormMessage
                                            className={styles.formMessage}
                                        />
                                    </FormItem>
                                )}
                            />
                            <div className="grid grid-cols-2 gap-4">
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
                                                    placeholder="US"
                                                    className={cn(
                                                        styles.formInput,
                                                        'uppercase',
                                                    )}
                                                    maxLength={2}
                                                    {...field}
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

                        {/* STEP 4: GUARDIAN */}
                        <div
                            className={cn(
                                'space-y-5 animate-in slide-in-from-right-4 fade-in duration-500',
                                step === 4 ? 'block' : 'hidden',
                            )}
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <FormField
                                    control={form.control}
                                    name="guardianName"
                                    render={({ field }) => (
                                        <FormItem className={styles.formItem}>
                                            <FormLabel
                                                className={styles.formLabel}
                                            >
                                                Guardian Name *
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    className={styles.formInput}
                                                    {...field}
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
                                    name="guardianRelationship"
                                    render={({ field }) => (
                                        <FormItem className={styles.formItem}>
                                            <FormLabel
                                                className={styles.formLabel}
                                            >
                                                Relationship *
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="e.g. Mother, Father"
                                                    className={styles.formInput}
                                                    {...field}
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
                                    name="guardianContact"
                                    render={({ field }) => (
                                        <FormItem className={styles.formItem}>
                                            <FormLabel
                                                className={styles.formLabel}
                                            >
                                                Contact Number *
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="tel"
                                                    className={styles.formInput}
                                                    {...field}
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
                                    name="guardianEmail"
                                    render={({ field }) => (
                                        <FormItem className={styles.formItem}>
                                            <FormLabel
                                                className={styles.formLabel}
                                            >
                                                Email Address
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="email"
                                                    className={styles.formInput}
                                                    {...field}
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
                    </div>

                    {/* ACTIONS */}
                    <div className="flex gap-3 pt-6 border-t border-slate-100 mt-auto">
                        {step === 1 ? (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onCancel}
                                className="flex-1 h-12 rounded-xl text-xs font-bold uppercase tracking-widest shadow-sm hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-colors"
                            >
                                Cancel
                            </Button>
                        ) : (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setStep(step - 1)}
                                className="flex-1 h-12 rounded-xl text-xs font-bold uppercase tracking-widest shadow-sm"
                            >
                                <ChevronLeft className="w-4 h-4 mr-1.5" /> Back
                            </Button>
                        )}

                        {step === 3 && (
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
                                className="flex-1 h-12 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-widest shadow-md transition-all active:scale-95"
                            >
                                Continue{' '}
                                <ChevronRight className="w-4 h-4 ml-1.5" />
                            </Button>
                        ) : (
                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="flex-[1.5] h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase tracking-widest shadow-lg shadow-indigo-200 transition-all active:scale-95"
                            >
                                {isLoading ? (
                                    <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    'Enroll Learner'
                                )}
                            </Button>
                        )}
                    </div>
                </form>
            </Form>
        </div>
    );
}
