'use client';

import React, { useState, useMemo, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import { toast } from 'sonner';
import {
    Search,
    Plus,
    Edit2,
    Trash2,
    X,
    Database,
    Clock,
    Gamepad2,
    FileText,
    Link as LinkIcon,
    AlertTriangle,
    Save,
    RefreshCcw,
    Image as ImageIcon,
    Settings,
    Tag,
    Target,
    UploadCloud,
    File as FileIcon,
    XCircle,
    Type,
    Headphones,
    Layers,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/api';

// --- Hooks ---
import {
    useActivities,
    useCreateActivity,
    useUpdateActivity,
    useDeleteActivity,
} from '@/hooks/useActivities';

// --- Import React Quill Dynamically with Ref Forwarding ---
const ReactQuillWrapper = dynamic(
    async () => {
        const { default: RQ } = await import('react-quill-new');
        // eslint-disable-next-line react/display-name
        return function Comp({ forwardedRef, ...props }: any) {
            return <RQ ref={forwardedRef} {...props} />;
        };
    },
    {
        ssr: false,
        loading: () => (
            <div className="h-[400px] w-full flex items-center justify-center bg-slate-50 text-slate-400 text-sm font-bold animate-pulse">
                Loading Editor System...
            </div>
        ),
    },
);
import 'react-quill-new/dist/quill.snow.css';

// --- Constants ---
const STATUS_OPTIONS = ['active', 'disabled', 'coming_soon'];
const ACTIVITY_TYPES = ['game', 'video', 'image', 'visual', 'audio'];

// --- Components ---
const StatusBadge = ({ status }: { status: string }) => {
    const styles: Record<string, string> = {
        active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        disabled: 'bg-rose-50 text-rose-700 border-rose-200',
        coming_soon: 'bg-amber-50 text-amber-700 border-amber-200',
    };
    return (
        <span
            className={cn(
                'px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border',
                styles[status] ||
                    'bg-slate-100 text-slate-500 border-slate-200',
            )}
        >
            {status?.replace('_', ' ')}
        </span>
    );
};

// --- Helper: Auto-calculate media duration ---
const getMediaDuration = (file: File): Promise<number> => {
    return new Promise((resolve) => {
        const media = document.createElement(
            file.type.startsWith('video') ? 'video' : 'audio',
        );
        media.preload = 'metadata';
        media.onloadedmetadata = () => {
            window.URL.revokeObjectURL(media.src); // Free memory
            resolve(media.duration); // Returns total seconds
        };
        media.src = window.URL.createObjectURL(file);
    });
};

export default function ActivityManager() {
    const [searchTerm, setSearchTerm] = useState('');

    // --- Form & Modal State ---
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedActivity, setSelectedActivity] = useState<any>(null);
    const [formData, setFormData] = useState<any>({});
    const [errors, setErrors] = useState<Record<string, string>>({}); // Field-level errors

    // --- Upload State ---
    const [isUploading, setIsUploading] = useState(false);

    const [bannerFile, setBannerFile] = useState<File | null>(null);
    const [existingBanner, setExistingBanner] = useState<any>(null);
    const bannerInputRef = useRef<HTMLInputElement>(null);

    const [activityFiles, setActivityFiles] = useState<File[]>([]);
    const [existingActivityFiles, setExistingActivityFiles] = useState<any[]>(
        [],
    );
    const activityFileInputRef = useRef<HTMLInputElement>(null);

    // --- Wire up real hooks ---
    const { data: activities = [], isLoading, refetch } = useActivities();
    const createMutation = useCreateActivity();
    const updateMutation = useUpdateActivity();
    const deleteMutation = useDeleteActivity();

    // --- Fetch Categories ---
    const { data: categories = [] } = useQuery({
        queryKey: ['categories'],
        queryFn: async () => {
            const response = await api.get('/api/categories?populate=*');
            return response.data.data;
        },
    });

    // --- Quill Editor Setup ---
    const quillRef = useRef<any>(null);

    const imageHandler = () => {
        const input = document.createElement('input');
        input.setAttribute('type', 'file');
        input.setAttribute('accept', 'image/*');
        input.click();

        input.onchange = async () => {
            const file = input.files ? input.files[0] : null;
            if (!file) return;

            const uploadData = new FormData();
            uploadData.append('files', file);

            try {
                setIsUploading(true);
                toast.loading('Uploading image...', { id: 'quill-upload' });

                const response = await api.post('/api/upload', uploadData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });

                const uploadedImageUrl = `${process.env.NEXT_PUBLIC_API_URL}${response.data[0].url}`;

                if (quillRef.current) {
                    const editor = quillRef.current.getEditor();
                    const range = editor.getSelection();
                    editor.insertEmbed(
                        range ? range.index : 0,
                        'image',
                        uploadedImageUrl,
                    );
                }
                toast.success('Image injected into content', {
                    id: 'quill-upload',
                });
            } catch (error) {
                console.error('Failed to upload image to Strapi:', error);
                toast.error('Failed to upload image', { id: 'quill-upload' });
            } finally {
                setIsUploading(false);
            }
        };
    };

    const quillModules = useMemo(
        () => ({
            toolbar: {
                container: [
                    [{ header: [1, 2, 3, false] }],
                    ['bold', 'italic', 'underline', 'strike'],
                    [{ list: 'ordered' }, { list: 'bullet' }],
                    ['link', 'image', 'video'],
                    ['clean'],
                ],
                handlers: {
                    image: imageHandler,
                },
            },
        }),
        [],
    );

    // --- Handlers ---
    const handleOpenCreate = () => {
        setSelectedActivity(null);
        setErrors({});
        setFormData({
            activityStatus: 'coming_soon',
            activityType: 'game',
            durationMinutes: 15,
            padConfiguration: '{\n  "mode": "standard"\n}',
            description: '',
            visualContent: '',
            categories: [],
        });
        setBannerFile(null);
        setExistingBanner(null);
        setActivityFiles([]);
        setExistingActivityFiles([]);
        setIsModalOpen(true);
    };

    const handleOpenEdit = (activity: any) => {
        setSelectedActivity(activity);
        setErrors({});

        let parsedConfig = activity.padConfiguration;
        if (typeof parsedConfig === 'object') {
            parsedConfig = JSON.stringify(parsedConfig, null, 2);
        }

        const existingCategoryIds =
            activity.categories?.map((c: any) => c.documentId || c.id) || [];

        setFormData({
            ...activity,
            padConfiguration: parsedConfig || '',
            categories: existingCategoryIds,
        });

        setExistingBanner(activity.banner || null);
        setExistingActivityFiles(activity.activityFile || []);

        setBannerFile(null);
        setActivityFiles([]);

        setIsModalOpen(true);
    };

    const handleDeleteClick = (activity: any) => {
        setSelectedActivity(activity);
        setIsDeleteModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setTimeout(() => {
            setFormData({});
            setSelectedActivity(null);
            setBannerFile(null);
            setExistingBanner(null);
            setActivityFiles([]);
            setExistingActivityFiles([]);
            setErrors({});
        }, 200);
    };

    const toggleCategory = (categoryId: string | number) => {
        setErrors((prev) => ({ ...prev, categories: '' })); // Clear error on change
        setFormData((prev: any) => {
            const current = prev.categories || [];
            if (current.includes(categoryId)) {
                return {
                    ...prev,
                    categories: current.filter((id: any) => id !== categoryId),
                };
            } else {
                return { ...prev, categories: [...current, categoryId] };
            }
        });
    };

    const uploadFilesToStrapi = async (files: File | File[]) => {
        const formData = new FormData();
        const fileArray = Array.isArray(files) ? files : [files];

        fileArray.forEach((file) => {
            formData.append('files', file);
        });

        const response = await api.post('/api/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });

        return response.data;
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();

        // --- FIELD-LEVEL VALIDATION ---
        const newErrors: Record<string, string> = {};

        if (!formData.name?.trim()) {
            newErrors.name = 'Activity Name is required.';
        }
        if (!formData.activityType) {
            newErrors.activityType = 'Content Type is required.';
        }
        if (!formData.categories || formData.categories.length === 0) {
            newErrors.categories = 'Please select at least one category.';
        }

        // Validate Media presence for Audio and Video
        if (['video', 'audio'].includes(formData.activityType)) {
            const hasFiles =
                existingActivityFiles.length > 0 || activityFiles.length > 0;
            const hasUrl = !!formData.activityUrl?.trim();
            if (!hasFiles && !hasUrl) {
                newErrors.mediaSource =
                    'Upload a media file OR provide an external URL.';
            }
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return; // Stop execution if validation fails
        }

        // --- BEGIN SAVE PROCESS ---
        setIsUploading(true);
        toast.loading('Processing system commit...', { id: 'save-activity' });

        try {
            // Unconditionally parse or clear pad config based on type without throwing validation errors
            let finalConfig = formData.padConfiguration;
            if (formData.activityType === 'game' && finalConfig) {
                try {
                    finalConfig = JSON.parse(finalConfig);
                } catch (error) {
                    console.warn('Invalid JSON. Sending as string.');
                }
            } else if (formData.activityType !== 'game') {
                finalConfig = null;
            }

            let bannerId = existingBanner?.id || null;
            if (bannerFile) {
                const uploadedBanner = await uploadFilesToStrapi(bannerFile);
                bannerId = uploadedBanner[0].id;
            }

            let finalActivityFileIds = existingActivityFiles.map((f) => f.id);
            if (activityFiles.length > 0) {
                const uploadedFiles = await uploadFilesToStrapi(activityFiles);
                const newIds = uploadedFiles.map((f: any) => f.id);
                finalActivityFileIds = [...finalActivityFileIds, ...newIds];
            }
            const VALID_STATUSES = ['active', 'disabled', 'coming_soon'];
            const safeStatus = VALID_STATUSES.includes(formData.activityStatus)
                ? formData.activityStatus
                : 'coming_soon';

            const payload = {
                ...formData,
                activityStatus: safeStatus,

                durationMinutes:
                    formData.activityType === 'visual'
                        ? null
                        : formData.durationMinutes,
                padConfiguration: finalConfig,
                banner: bannerId,
                activityFile:
                    finalActivityFileIds.length > 0
                        ? finalActivityFileIds
                        : null,
            };

            if (selectedActivity) {
                const targetId = selectedActivity.documentId;

                updateMutation.mutate(
                    { id: targetId, payload },
                    {
                        onSuccess: () => {
                            toast.success('Activity updated successfully', {
                                id: 'save-activity',
                            });
                            closeModal();
                        },
                        onError: () => {
                            toast.error('Failed to update activity', {
                                id: 'save-activity',
                            });
                        },
                    },
                );
            } else {
                createMutation.mutate(payload, {
                    onSuccess: () => {
                        toast.success('New activity registered successfully', {
                            id: 'save-activity',
                        });
                        closeModal();
                    },
                    onError: () =>
                        toast.error('Failed to register activity', {
                            id: 'save-activity',
                        }),
                });
            }
        } catch (error) {
            toast.error('System failure during media upload', {
                id: 'save-activity',
            });
        } finally {
            setIsUploading(false);
        }
    };

    const confirmDelete = () => {
        const targetId = selectedActivity?.documentId || selectedActivity?.id;
        toast.loading('Purging activity...', { id: 'delete-activity' });
        deleteMutation.mutate(targetId, {
            onSuccess: () => {
                toast.success('Activity permanently deleted', {
                    id: 'delete-activity',
                });
                setIsDeleteModalOpen(false);
                setSelectedActivity(null);
            },
            onError: () =>
                toast.error('Failed to delete activity', {
                    id: 'delete-activity',
                }),
        });
    };

    const filteredActivities = useMemo(() => {
        return activities.filter(
            (a: any) =>
                a.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                a.activityId?.toLowerCase().includes(searchTerm.toLowerCase()),
        );
    }, [activities, searchTerm]);

    // --- Dynamic UI State ---
    const isVisual = formData.activityType === 'visual';
    const isGame = formData.activityType === 'game';
    const isMediaTracked = ['video', 'audio'].includes(formData.activityType);

    let fileAccept = undefined;
    let fileLabel = 'Activity Files (Multiple)';
    let fileDesc = 'Videos, Audios, Models, etc.';

    if (formData.activityType === 'audio') {
        fileAccept = 'audio/*';
        fileLabel = 'Audio Tracks (Multiple)';
        fileDesc = 'MP3, WAV, OGG up to 50MB';
    } else if (formData.activityType === 'video') {
        fileAccept = 'video/*';
        fileLabel = 'Video Files (Multiple)';
        fileDesc = 'MP4, WEBM up to 200MB';
    } else if (formData.activityType === 'image') {
        fileAccept = 'image/*';
        fileLabel = 'Image Assets (Multiple)';
        fileDesc = 'JPG, PNG, GIF up to 5MB';
    }

    return (
        <div className="h-screen w-full bg-[#F8FAFC] font-sans text-slate-900 flex flex-col overflow-hidden">
            <header className="shrink-0 z-30 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-md shadow-indigo-200">
                        <Database className="text-white" size={20} />
                    </div>
                    <div>
                        <h1 className="text-xl font-black tracking-tight text-slate-900 leading-none">
                            Content Manager
                        </h1>
                        <p className="text-[11px] font-bold text-slate-500 mt-1 uppercase tracking-widest">
                            Activity & Activity Registry
                        </p>
                    </div>
                </div>
                <button
                    onClick={handleOpenCreate}
                    className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all shadow-md shadow-indigo-200 active:scale-95"
                >
                    <Plus size={16} /> New Activity
                </button>
            </header>

            <main className="flex-1 flex flex-col min-h-0 max-w-[1600px] w-full mx-auto p-4 sm:p-6 lg:p-8">
                <div className="shrink-0 bg-white border border-slate-200 p-3 rounded-2xl mb-4 sm:mb-6 flex flex-col sm:flex-row gap-3 shadow-sm">
                    <div className="relative flex-1 group">
                        <Search
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors"
                            size={16}
                        />
                        <input
                            type="text"
                            placeholder="Search by Activity Name or UID..."
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-10 pr-4 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm font-medium transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={() => {
                            refetch();
                            toast.info('Syncing registry...');
                        }}
                        className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors flex items-center gap-2"
                    >
                        <RefreshCcw
                            size={14}
                            className={cn(
                                (isLoading ||
                                    createMutation.isPending ||
                                    updateMutation.isPending ||
                                    deleteMutation.isPending) &&
                                    'animate-spin',
                            )}
                        />{' '}
                        Sync
                    </button>
                </div>

                <div className="flex-1 min-h-0 flex flex-col bg-white border border-slate-200 rounded-[24px] shadow-sm overflow-hidden">
                    <div className="flex-1 overflow-auto custom-scrollbar">
                        <table className="w-full text-left text-sm whitespace-nowrap relative">
                            <thead className="sticky top-0 z-20 bg-slate-50/95 backdrop-blur-sm shadow-sm border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4 font-black text-[10px] uppercase tracking-widest text-slate-500">
                                        Activity Identity
                                    </th>
                                    <th className="px-6 py-4 font-black text-[10px] uppercase tracking-widest text-slate-500">
                                        Type & Status
                                    </th>
                                    <th className="px-6 py-4 font-black text-[10px] uppercase tracking-widest text-slate-500">
                                        Categories
                                    </th>
                                    <th className="px-6 py-4 font-black text-[10px] uppercase tracking-widest text-slate-500">
                                        Duration
                                    </th>
                                    <th className="px-6 py-4 font-black text-[10px] uppercase tracking-widest text-slate-500 text-right">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {isLoading ? (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="p-8 text-center text-slate-400 font-bold text-xs uppercase tracking-widest"
                                        >
                                            Loading Records...
                                        </td>
                                    </tr>
                                ) : filteredActivities.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="p-8 text-center text-slate-400 font-bold text-xs uppercase tracking-widest"
                                        >
                                            No Activities Found
                                        </td>
                                    </tr>
                                ) : (
                                    filteredActivities.map((activity: any) => (
                                        <tr
                                            key={activity.id}
                                            className="hover:bg-slate-50/50 transition-colors group"
                                        >
                                            <td className="px-6 py-4 flex items-center gap-3">
                                                <div className="h-10 w-10 bg-slate-100 rounded-lg flex items-center justify-center shrink-0 border border-slate-200 overflow-hidden">
                                                    {activity.banner?.url ? (
                                                        <img
                                                            src={`${process.env.NEXT_PUBLIC_API_URL}${activity.banner.url}`}
                                                            alt=""
                                                            className="h-full w-full object-cover"
                                                        />
                                                    ) : (
                                                        <ImageIcon
                                                            size={16}
                                                            className="text-slate-400"
                                                        />
                                                    )}
                                                </div>
                                                <div>
                                                    <div
                                                        className="font-bold text-slate-900 text-sm max-w-[200px] truncate"
                                                        title={activity.name}
                                                    >
                                                        {activity.name ||
                                                            'Unnamed Module'}
                                                    </div>
                                                    <div className="font-mono text-[10px] text-slate-400 mt-0.5">
                                                        {activity.activityId ||
                                                            `UID-${activity.id}`}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1.5 items-start">
                                                    <StatusBadge
                                                        status={
                                                            activity.activityStatus
                                                        }
                                                    />
                                                    <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded uppercase tracking-wider">
                                                        {activity.activityType ||
                                                            'Uncategorized'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-wrap gap-1 max-w-[180px]">
                                                    {activity.categories
                                                        ?.length > 0 ? (
                                                        activity.categories.map(
                                                            (cat: any) => (
                                                                <span
                                                                    key={cat.id}
                                                                    className="text-[9px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded uppercase tracking-wider truncate max-w-full"
                                                                >
                                                                    {cat.name}
                                                                </span>
                                                            ),
                                                        )
                                                    ) : (
                                                        <span className="text-[10px] text-slate-400 italic">
                                                            Uncategorized
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-[11px] text-slate-600 flex items-center gap-1.5 font-medium">
                                                    <Clock
                                                        size={12}
                                                        className="text-slate-400 shrink-0"
                                                    />
                                                    {[
                                                        'video',
                                                        'audio',
                                                    ].includes(
                                                        activity.activityType,
                                                    )
                                                        ? 'Media Tracked'
                                                        : activity.activityType ===
                                                            'visual'
                                                          ? 'Self-Paced'
                                                          : activity.durationMinutes
                                                            ? `${activity.durationMinutes}m`
                                                            : 'N/A'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() =>
                                                            handleOpenEdit(
                                                                activity,
                                                            )
                                                        }
                                                        className="h-8 w-8 flex items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"
                                                    >
                                                        <Edit2 size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            handleDeleteClick(
                                                                activity,
                                                            )
                                                        }
                                                        className="h-8 w-8 flex items-center justify-center rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>

            {/* --- CREATE / EDIT MODAL --- */}
            <AnimatePresence>
                {isModalOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40"
                            onClick={closeModal}
                        />
                        <motion.div
                            initial={{ x: '100%', opacity: 0.5 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: '100%', opacity: 0.5 }}
                            transition={{
                                type: 'spring',
                                damping: 25,
                                stiffness: 200,
                            }}
                            className="fixed right-0 top-0 bottom-0 w-full max-w-2xl bg-white shadow-2xl z-50 flex flex-col border-l border-slate-200"
                        >
                            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                <div>
                                    <h2 className="text-lg font-black text-slate-900 tracking-tight">
                                        {selectedActivity
                                            ? 'Modify Content Module'
                                            : 'Register New Content'}
                                    </h2>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                                        {selectedActivity
                                            ? `UID: ${selectedActivity.activityId || selectedActivity.id}`
                                            : 'Create Record'}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="h-8 w-8 rounded-full bg-slate-200/50 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            <form
                                onSubmit={handleSave}
                                className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar"
                            >
                                {/* Core Identity */}
                                <div className="space-y-4">
                                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 pb-2 flex items-center gap-2">
                                        <Tag size={14} /> Core Identity
                                    </h3>
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-bold text-slate-700 uppercase">
                                            Activity Name{' '}
                                            <span className="text-rose-500">
                                                *
                                            </span>
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.name || ''}
                                            onChange={(e) => {
                                                setFormData({
                                                    ...formData,
                                                    name: e.target.value,
                                                });
                                                setErrors((prev) => ({
                                                    ...prev,
                                                    name: '',
                                                }));
                                            }}
                                            placeholder="e.g., Shape Sorter Activity"
                                            className={cn(
                                                'w-full border rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none transition-colors',
                                                errors.name
                                                    ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                                                    : 'border-slate-200 focus:ring-2 focus:ring-indigo-500/20',
                                            )}
                                        />
                                        {errors.name && (
                                            <p className="text-[10px] font-bold text-rose-500 mt-0.5">
                                                {errors.name}
                                            </p>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-bold text-slate-700 uppercase">
                                                Deployment Status
                                            </label>
                                            <select
                                                value={
                                                    formData.activityStatus ||
                                                    ''
                                                }
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        activityStatus:
                                                            e.target.value,
                                                    })
                                                }
                                                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                                            >
                                                {STATUS_OPTIONS.map((opt) => (
                                                    <option
                                                        key={opt}
                                                        value={opt}
                                                    >
                                                        {opt
                                                            .replace('_', ' ')
                                                            .toUpperCase()}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-bold text-slate-700 uppercase">
                                                Content Type{' '}
                                                <span className="text-rose-500">
                                                    *
                                                </span>
                                            </label>
                                            <select
                                                value={
                                                    formData.activityType || ''
                                                }
                                                onChange={(e) => {
                                                    setFormData({
                                                        ...formData,
                                                        activityType:
                                                            e.target.value,
                                                    });
                                                    setErrors((prev) => ({
                                                        ...prev,
                                                        activityType: '',
                                                    }));
                                                }}
                                                className={cn(
                                                    'w-full bg-white border rounded-xl px-3 py-2 text-sm font-medium focus:outline-none transition-colors',
                                                    errors.activityType
                                                        ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                                                        : 'border-slate-200 focus:ring-2 focus:ring-indigo-500/20',
                                                )}
                                            >
                                                <option value="">
                                                    Select Type
                                                </option>
                                                {ACTIVITY_TYPES.map((opt) => (
                                                    <option
                                                        key={opt}
                                                        value={opt}
                                                    >
                                                        {opt.toUpperCase()}
                                                    </option>
                                                ))}
                                            </select>
                                            {errors.activityType && (
                                                <p className="text-[10px] font-bold text-rose-500 mt-0.5">
                                                    {errors.activityType}
                                                </p>
                                            )}
                                        </div>

                                        {/* Dynamic Category Selector */}
                                        <div className="space-y-1.5 col-span-2">
                                            <label className="text-[11px] font-bold text-slate-700 uppercase flex items-center gap-1.5">
                                                <Layers
                                                    size={12}
                                                    className="text-indigo-400"
                                                />{' '}
                                                Categories{' '}
                                                <span className="text-rose-500">
                                                    *
                                                </span>
                                            </label>
                                            <div
                                                className={cn(
                                                    'flex flex-wrap gap-2 p-3 bg-slate-50 border rounded-xl max-h-32 overflow-y-auto custom-scrollbar transition-colors',
                                                    errors.categories
                                                        ? 'border-rose-500 bg-rose-50/30'
                                                        : 'border-slate-200',
                                                )}
                                            >
                                                {categories.length === 0 && (
                                                    <span className="text-xs text-slate-400 font-medium">
                                                        No categories found in
                                                        registry...
                                                    </span>
                                                )}
                                                {categories.map((cat: any) => {
                                                    const catId =
                                                        cat.documentId ||
                                                        cat.id;
                                                    const isSelected =
                                                        formData.categories?.includes(
                                                            catId,
                                                        );
                                                    return (
                                                        <button
                                                            key={catId}
                                                            type="button"
                                                            onClick={() =>
                                                                toggleCategory(
                                                                    catId,
                                                                )
                                                            }
                                                            className={cn(
                                                                'px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all active:scale-95',
                                                                isSelected
                                                                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-200'
                                                                    : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-300 hover:text-indigo-600',
                                                            )}
                                                        >
                                                            {cat.name}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                            {errors.categories && (
                                                <p className="text-[10px] font-bold text-rose-500 mt-0.5">
                                                    {errors.categories}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Banner Upload (ALWAYS VISIBLE) */}
                                <div className="space-y-4">
                                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 pb-2 flex items-center gap-2">
                                        <ImageIcon size={14} /> Display Banner
                                    </h3>
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-bold text-slate-700 uppercase">
                                            Banner Image
                                        </label>
                                        <input
                                            type="file"
                                            ref={bannerInputRef}
                                            className="hidden"
                                            accept="image/*"
                                            onChange={(e) =>
                                                e.target.files &&
                                                setBannerFile(e.target.files[0])
                                            }
                                        />
                                        <div
                                            onClick={() =>
                                                bannerInputRef.current?.click()
                                            }
                                            className={cn(
                                                'w-full h-32 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-colors overflow-hidden relative group',
                                                bannerFile || existingBanner
                                                    ? 'border-indigo-200 bg-indigo-50/50'
                                                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300',
                                            )}
                                        >
                                            {bannerFile || existingBanner ? (
                                                <>
                                                    <img
                                                        src={
                                                            bannerFile
                                                                ? URL.createObjectURL(
                                                                      bannerFile,
                                                                  )
                                                                : `${process.env.NEXT_PUBLIC_API_URL}${existingBanner.url}`
                                                        }
                                                        className="w-full h-full object-cover"
                                                        alt="Banner preview"
                                                    />
                                                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                        <span className="text-white text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                                                            <Edit2 size={14} />{' '}
                                                            Change Banner
                                                        </span>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="text-center">
                                                    <UploadCloud
                                                        size={24}
                                                        className="mx-auto text-slate-400 mb-2"
                                                    />
                                                    <p className="text-xs font-bold text-slate-600">
                                                        Click or drag image to
                                                        upload
                                                    </p>
                                                    <p className="text-[10px] text-slate-400 mt-1">
                                                        JPG, PNG, GIF up to 5MB
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                        {(bannerFile || existingBanner) && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setBannerFile(null);
                                                    setExistingBanner(null);
                                                }}
                                                className="text-[10px] font-bold text-rose-500 uppercase tracking-wider hover:text-rose-600 flex items-center gap-1 mt-2"
                                            >
                                                <Trash2 size={10} /> Remove
                                                Banner
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* --- WYSIWYG Editor (ONLY for Visual Content) --- */}
                                {isVisual && (
                                    <div className="space-y-4">
                                        <h3 className="text-xs font-black text-indigo-400 uppercase tracking-[0.2em] border-b border-slate-100 pb-2 flex items-center gap-2">
                                            <Type size={14} /> Rich Content
                                            Editor
                                        </h3>
                                        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden relative">
                                            {isUploading && (
                                                <div className="absolute inset-0 z-10 bg-white/50 backdrop-blur-sm flex items-center justify-center">
                                                    <div className="flex flex-col items-center gap-2">
                                                        <RefreshCcw
                                                            className="animate-spin text-indigo-600"
                                                            size={24}
                                                        />
                                                        <span className="text-xs font-bold text-indigo-600 uppercase">
                                                            Uploading Asset...
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                            <ReactQuillWrapper
                                                forwardedRef={quillRef}
                                                theme="snow"
                                                modules={quillModules}
                                                value={
                                                    formData.visualContent || ''
                                                }
                                                onChange={(content: string) =>
                                                    setFormData({
                                                        ...formData,
                                                        visualContent: content,
                                                    })
                                                }
                                                className="h-[400px] border-none pb-[42px]"
                                                placeholder="Draft your visual content here..."
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* --- Normal Form Fields (HIDDEN for Visuals) --- */}
                                {!isVisual && (
                                    <>
                                        {/* Activity Files Upload (Hidden for games) */}
                                        {!isGame && (
                                            <div className="space-y-4">
                                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 pb-2 flex items-center gap-2">
                                                    <FileIcon size={14} />{' '}
                                                    Content Payload
                                                </h3>
                                                <div className="space-y-1.5 pt-2">
                                                    <label className="text-[11px] font-bold text-slate-700 uppercase">
                                                        {fileLabel}
                                                    </label>
                                                    <input
                                                        type="file"
                                                        ref={
                                                            activityFileInputRef
                                                        }
                                                        className="hidden"
                                                        multiple
                                                        accept={fileAccept}
                                                        onChange={async (e) => {
                                                            if (
                                                                e.target.files
                                                            ) {
                                                                const newFiles =
                                                                    Array.from(
                                                                        e.target
                                                                            .files as FileList,
                                                                    );
                                                                setActivityFiles(
                                                                    (prev) => [
                                                                        ...prev,
                                                                        ...newFiles,
                                                                    ],
                                                                );
                                                                setErrors(
                                                                    (prev) => ({
                                                                        ...prev,
                                                                        mediaSource:
                                                                            '',
                                                                    }),
                                                                );

                                                                // --- NEW: AUTO-CALCULATE DURATION ---
                                                                if (
                                                                    formData.activityType ===
                                                                        'video' ||
                                                                    formData.activityType ===
                                                                        'audio'
                                                                ) {
                                                                    toast.loading(
                                                                        'Calculating media length...',
                                                                        {
                                                                            id: 'calc-dur',
                                                                        },
                                                                    );
                                                                    try {
                                                                        let totalSeconds = 0;
                                                                        for (const file of newFiles) {
                                                                            totalSeconds +=
                                                                                await getMediaDuration(
                                                                                    file,
                                                                                );
                                                                        }
                                                                        const totalMinutes =
                                                                            Math.ceil(
                                                                                totalSeconds /
                                                                                    60,
                                                                            );

                                                                        setFormData(
                                                                            (
                                                                                prev: any,
                                                                            ) => ({
                                                                                ...prev,
                                                                                durationMinutes:
                                                                                    (prev.durationMinutes ||
                                                                                        0) +
                                                                                    totalMinutes,
                                                                            }),
                                                                        );
                                                                        toast.success(
                                                                            `Duration set to ${totalMinutes} minute(s)`,
                                                                            {
                                                                                id: 'calc-dur',
                                                                            },
                                                                        );
                                                                    } catch (err) {
                                                                        toast.error(
                                                                            'Could not read media length',
                                                                            {
                                                                                id: 'calc-dur',
                                                                            },
                                                                        );
                                                                    }
                                                                }
                                                            }
                                                        }}
                                                    />
                                                    <div
                                                        onClick={() =>
                                                            activityFileInputRef.current?.click()
                                                        }
                                                        className={cn(
                                                            'w-full py-6 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-colors',
                                                            errors.mediaSource
                                                                ? 'border-rose-500 bg-rose-50/50 hover:bg-rose-50'
                                                                : 'border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300',
                                                        )}
                                                    >
                                                        {formData.activityType ===
                                                        'audio' ? (
                                                            <Headphones
                                                                size={24}
                                                                className={cn(
                                                                    'mx-auto mb-2',
                                                                    errors.mediaSource
                                                                        ? 'text-rose-400'
                                                                        : 'text-slate-400',
                                                                )}
                                                            />
                                                        ) : (
                                                            <Plus
                                                                size={24}
                                                                className={cn(
                                                                    'mx-auto mb-2',
                                                                    errors.mediaSource
                                                                        ? 'text-rose-400'
                                                                        : 'text-slate-400',
                                                                )}
                                                            />
                                                        )}
                                                        <p
                                                            className={cn(
                                                                'text-xs font-bold',
                                                                errors.mediaSource
                                                                    ? 'text-rose-600'
                                                                    : 'text-slate-600',
                                                            )}
                                                        >
                                                            Add Content Files
                                                        </p>
                                                        <p
                                                            className={cn(
                                                                'text-[10px] mt-1',
                                                                errors.mediaSource
                                                                    ? 'text-rose-500'
                                                                    : 'text-slate-400',
                                                            )}
                                                        >
                                                            {fileDesc}
                                                        </p>
                                                    </div>
                                                    {errors.mediaSource && (
                                                        <p className="text-[10px] font-bold text-rose-500 mt-0.5">
                                                            {errors.mediaSource}
                                                        </p>
                                                    )}

                                                    {(existingActivityFiles.length >
                                                        0 ||
                                                        activityFiles.length >
                                                            0) && (
                                                        <div className="mt-3 space-y-2">
                                                            {existingActivityFiles.map(
                                                                (file, idx) => (
                                                                    <div
                                                                        key={`existing-${file.id}`}
                                                                        className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-lg shadow-sm"
                                                                    >
                                                                        <div className="flex items-center gap-3 overflow-hidden">
                                                                            <div className="h-8 w-8 bg-indigo-50 text-indigo-500 rounded flex items-center justify-center shrink-0">
                                                                                <FileIcon
                                                                                    size={
                                                                                        14
                                                                                    }
                                                                                />
                                                                            </div>
                                                                            <div className="truncate">
                                                                                <p className="text-[11px] font-bold text-slate-700 truncate">
                                                                                    {
                                                                                        file.name
                                                                                    }
                                                                                </p>
                                                                                <p className="text-[9px] text-slate-400 uppercase font-mono">
                                                                                    {file.size ||
                                                                                        0}{' '}
                                                                                    KB
                                                                                    •
                                                                                    Cloud
                                                                                </p>
                                                                            </div>
                                                                        </div>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() =>
                                                                                setExistingActivityFiles(
                                                                                    (
                                                                                        prev,
                                                                                    ) =>
                                                                                        prev.filter(
                                                                                            (
                                                                                                _,
                                                                                                i,
                                                                                            ) =>
                                                                                                i !==
                                                                                                idx,
                                                                                        ),
                                                                                )
                                                                            }
                                                                            className="text-slate-400 hover:text-rose-500 p-1"
                                                                        >
                                                                            <XCircle
                                                                                size={
                                                                                    16
                                                                                }
                                                                            />
                                                                        </button>
                                                                    </div>
                                                                ),
                                                            )}
                                                            {activityFiles.map(
                                                                (file, idx) => (
                                                                    <div
                                                                        key={`new-${idx}`}
                                                                        className="flex items-center justify-between p-2.5 bg-emerald-50/50 border border-emerald-100 rounded-lg shadow-sm"
                                                                    >
                                                                        <div className="flex items-center gap-3 overflow-hidden">
                                                                            <div className="h-8 w-8 bg-emerald-100 text-emerald-600 rounded flex items-center justify-center shrink-0">
                                                                                <UploadCloud
                                                                                    size={
                                                                                        14
                                                                                    }
                                                                                />
                                                                            </div>
                                                                            <div className="truncate">
                                                                                <p className="text-[11px] font-bold text-emerald-800 truncate">
                                                                                    {
                                                                                        file.name
                                                                                    }
                                                                                </p>
                                                                                <p className="text-[9px] text-emerald-500 uppercase font-mono">
                                                                                    {(
                                                                                        file.size /
                                                                                        1024
                                                                                    ).toFixed(
                                                                                        1,
                                                                                    )}{' '}
                                                                                    KB
                                                                                    •
                                                                                    Pending
                                                                                </p>
                                                                            </div>
                                                                        </div>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() =>
                                                                                setActivityFiles(
                                                                                    (
                                                                                        prev,
                                                                                    ) =>
                                                                                        prev.filter(
                                                                                            (
                                                                                                _,
                                                                                                i,
                                                                                            ) =>
                                                                                                i !==
                                                                                                idx,
                                                                                        ),
                                                                                )
                                                                            }
                                                                            className="text-emerald-400 hover:text-rose-500 p-1"
                                                                        >
                                                                            <XCircle
                                                                                size={
                                                                                    16
                                                                                }
                                                                            />
                                                                        </button>
                                                                    </div>
                                                                ),
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Details & Metrics */}
                                        <div className="space-y-4">
                                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 pb-2 flex items-center gap-2">
                                                <Target size={14} /> Details &
                                                Requirements
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <label className="text-[11px] font-bold text-slate-700 uppercase">
                                                        Duration (Minutes)
                                                    </label>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={
                                                            formData.durationMinutes ||
                                                            ''
                                                        }
                                                        onChange={(e) =>
                                                            setFormData({
                                                                ...formData,
                                                                durationMinutes:
                                                                    parseInt(
                                                                        e.target
                                                                            .value,
                                                                    ),
                                                            })
                                                        }
                                                        placeholder={
                                                            isMediaTracked
                                                                ? 'Auto-calculated'
                                                                : '15'
                                                        }
                                                        className={cn(
                                                            'w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none font-mono',
                                                            isMediaTracked &&
                                                                'bg-slate-50 text-slate-500',
                                                        )}
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-[11px] font-bold text-slate-700 uppercase">
                                                        External Source URL
                                                    </label>
                                                    <div className="relative">
                                                        <LinkIcon
                                                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                                                            size={14}
                                                        />
                                                        <input
                                                            type="url"
                                                            value={
                                                                formData.activityUrl ||
                                                                ''
                                                            }
                                                            onChange={(e) => {
                                                                setFormData({
                                                                    ...formData,
                                                                    activityUrl:
                                                                        e.target
                                                                            .value,
                                                                });
                                                                setErrors(
                                                                    (prev) => ({
                                                                        ...prev,
                                                                        mediaSource:
                                                                            '',
                                                                    }),
                                                                ); // Clear media error on typing URL
                                                            }}
                                                            placeholder="https://"
                                                            className={cn(
                                                                'w-full border rounded-xl pl-9 pr-3 py-2 text-sm outline-none transition-colors',
                                                                errors.mediaSource
                                                                    ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                                                                    : 'border-slate-200 focus:ring-2 focus:ring-indigo-500/20',
                                                            )}
                                                        />
                                                    </div>
                                                    {errors.mediaSource && (
                                                        <p className="text-[10px] font-bold text-rose-500 mt-0.5">
                                                            {errors.mediaSource}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[11px] font-bold text-slate-700 uppercase">
                                                    Standard Description
                                                </label>
                                                <textarea
                                                    value={
                                                        formData.description ||
                                                        ''
                                                    }
                                                    onChange={(e) =>
                                                        setFormData({
                                                            ...formData,
                                                            description:
                                                                e.target.value,
                                                        })
                                                    }
                                                    rows={3}
                                                    className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none resize-none custom-scrollbar"
                                                    placeholder="Detailed objective and instructions..."
                                                />
                                            </div>
                                        </div>

                                        {/* Configuration Payload (HIDDEN if not a game) */}
                                        {isGame && (
                                            <div className="space-y-4">
                                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 pb-2 flex items-center gap-2">
                                                    <Settings size={14} />{' '}
                                                    System Config
                                                </h3>
                                                <div className="space-y-1.5">
                                                    <label className="text-[11px] font-bold text-slate-700 uppercase flex justify-between">
                                                        <span>
                                                            Pad Configuration
                                                            (JSON)
                                                        </span>
                                                    </label>
                                                    <textarea
                                                        value={
                                                            formData.padConfiguration ||
                                                            ''
                                                        }
                                                        onChange={(e) =>
                                                            setFormData({
                                                                ...formData,
                                                                padConfiguration:
                                                                    e.target
                                                                        .value,
                                                            })
                                                        }
                                                        rows={6}
                                                        className="w-full border border-slate-200 bg-slate-900 text-emerald-400 rounded-xl p-3 text-xs focus:ring-2 focus:ring-indigo-500/20 outline-none resize-none font-mono custom-scrollbar shadow-inner"
                                                        placeholder='{\n  "mode": "standard"\n}'
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </form>

                            {/* Footer Actions */}
                            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-3 shrink-0">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    disabled={isUploading}
                                    className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={
                                        isUploading ||
                                        createMutation.isPending ||
                                        updateMutation.isPending
                                    }
                                    className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold uppercase tracking-widest shadow-md transition-all"
                                >
                                    {isUploading ||
                                    createMutation.isPending ||
                                    updateMutation.isPending ? (
                                        <>
                                            <RefreshCcw
                                                size={16}
                                                className="animate-spin"
                                            />{' '}
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <Save size={16} /> Commit Changes
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* --- DELETE CONFIRMATION MODAL --- */}
            <AnimatePresence>
                {isDeleteModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-[24px] shadow-2xl w-full max-w-sm p-6 overflow-hidden border border-slate-200"
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className="h-10 w-10 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center shrink-0">
                                    <AlertTriangle size={20} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-slate-900 leading-tight">
                                        Delete Content
                                    </h3>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                        Irreversible Action
                                    </p>
                                </div>
                            </div>
                            <p className="text-sm text-slate-600 mb-6 font-medium">
                                Are you sure you want to permanently delete{' '}
                                <span className="font-black text-slate-900">
                                    {selectedActivity?.name || 'this activity'}
                                </span>
                                ? It will be removed from all associated student
                                activitys.
                            </p>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setIsDeleteModalOpen(false)}
                                    className="flex-1 py-2.5 rounded-xl border border-slate-200 font-bold text-xs text-slate-600 hover:bg-slate-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase tracking-widest"
                                >
                                    {deleteMutation.isPending
                                        ? 'Deleting...'
                                        : 'Confirm Delete'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
