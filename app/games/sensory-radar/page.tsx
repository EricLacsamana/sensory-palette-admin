'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search,
    CheckCircle2,
    Trophy,
    Hammer,
    Sparkles,
    Zap,
    Package,
    ArrowRight,
    MousePointer2,
    AlertTriangle,
    Flame,
    RotateCcw,
    Target,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// MASSIVE TOY POOL: Grouped for confusing silhouettes
const TOYS = [
    // Dinosaurs & Dragons
    '🦖',
    '🦕',
    '🐉',
    '🐲',
    '🐊',
    // Vehicles
    '🚗',
    '🚕',
    '🚓',
    '🚑',
    '🚜',
    '🚁',
    '🛸',
    '🚀',
    '🚂',
    // Round animal faces
    '🧸',
    '🐵',
    '🐸',
    '🐯',
    '🐻',
    '🐼',
    '🐨',
    '🐷',
    // Spheres & Round objects
    '🍎',
    '🍊',
    '🍅',
    '🍑',
    '🔮',
    '⚽',
    '🏀',
    '🎱',
    '🧶',
    '🪙',
    // Stars & Spiky things
    '⭐',
    '🌟',
    '🍁',
    '💥',
    '☀️',
    '⚙️',
    // Long / Stick-like objects
    '🦴',
    '✏️',
    '🪄',
    '🏏',
    '🗡️',
    '🔑',
    '🥢',
    '🥄',
    // Winged / Symmetrical shapes
    '🦋',
    '🦇',
    '🎀',
    '🦅',
    '🕊️',
    '🦇',
    // Angular / Gem / Boxy shapes
    '💎',
    '🛡️',
    '🧊',
    '🎁',
    '📦',
    '🧽',
    '📱',
    // Irregular Blobs (Sweets & Food)
    '🍦',
    '🍧',
    '🍩',
    '🍪',
    '🥐',
    '🍗',
    '🥟',
    '🍔',
    // Tools & Gadgets
    '🎨',
    '🧩',
    '🎮',
    '🕹️',
    '🔍',
    '🔔',
    '⏳',
    '💡',
    '🔦',
    '🧲',
    '✂️',
];

interface SandboxItem {
    id: string;
    emoji: string;
    x: number;
    y: number;
    isMine: boolean;
}

export default function SensoryRadarGame() {
    const [hasMounted, setHasMounted] = useState(false);
    const [gameStarted, setGameStarted] = useState(false);

    // --- PROGRESSION & ECONOMY ---
    const [level, setLevel] = useState(1);
    const [score, setScore] = useState(0);
    const [pickaxes, setPickaxes] = useState(7);
    const MAX_PICKAXES = 10;

    // --- MISSION STATE ---
    const [items, setItems] = useState<SandboxItem[]>([]);
    const [targetsInRound, setTargetsInRound] = useState<string[]>([]);
    const [foundInRound, setFoundInRound] = useState<string[]>([]);
    const [dugSpots, setDugSpots] = useState<
        { x: number; y: number; type: 'hit' | 'miss' | 'mine' }[]
    >([]);
    const [isRoundComplete, setIsRoundComplete] = useState(false);
    const [isGameOver, setIsGameOver] = useState(false);
    const [collection, setCollection] = useState<
        { emoji: string; count: number }[]
    >([]);

    // --- INTERACTION ---
    const [activeId, setActiveId] = useState<string | null>(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [scannerPos, setScannerPos] = useState({ x: 50, y: 50 });
    const [isDigging, setIsDigging] = useState(false);
    const [digLocation, setDigLocation] = useState<{
        x: number;
        y: number;
    } | null>(null);
    const [revealedItem, setRevealedItem] = useState<SandboxItem | null>(null);
    const [proximity, setProximity] = useState<
        'none' | 'near' | 'hot' | 'danger'
    >('none');
    const [explosionPos, setExplosionPos] = useState<{
        x: number;
        y: number;
    } | null>(null);
    const [floatingText, setFloatingText] = useState<{
        x: number;
        y: number;
        text: string;
        color: string;
    } | null>(null);

    // --- TELEMETRY STATE ---
    const correctCountRef = useRef(0);
    const totalCountRef = useRef(0);
    const telemetryRef = useRef<any[]>([]);
    const lastActionTimeRef = useRef<number>(Date.now());

    const sandboxRef = useRef<HTMLDivElement>(null);
    const radarSfx = useRef<HTMLAudioElement | null>(null);
    const snapSfx = useRef<HTMLAudioElement | null>(null);
    const foundSfx = useRef<HTMLAudioElement | null>(null);
    const errorSfx = useRef<HTMLAudioElement | null>(null);
    const explosionSfx = useRef<HTMLAudioElement | null>(null);
    const winSfx = useRef<HTMLAudioElement | null>(null);

    // EXACT TELEMETRY IMPLEMENTATION
    const logGameAction = useCallback(
        (
            actionName: string,
            targetId: string,
            isCorrect: boolean,
            currentPickaxes: number,
            extraMetadata: any = {},
        ) => {
            const responseTimeMs = Date.now() - lastActionTimeRef.current;
            lastActionTimeRef.current = Date.now();

            totalCountRef.current += 1;
            if (isCorrect) correctCountRef.current += 1;

            const accuracy = Math.round(
                (correctCountRef.current / totalCountRef.current) * 100,
            );

            const logEntry = {
                timestamp: new Date().toISOString(),
                action: actionName,
                targetId: targetId,
                isCorrect,
                responseTimeMs,
                metadata: {
                    gameType: 'sensory_radar',
                    currentLevel: level,
                    pickaxesRemaining: currentPickaxes,
                    expectedTargets: targetsInRound,
                    ...extraMetadata,
                },
            };

            telemetryRef.current = [...telemetryRef.current, logEntry];

            window.parent.postMessage(
                {
                    type: 'GAME_SCORE_UPDATE',
                    score: correctCountRef.current,
                    rounds: totalCountRef.current,
                    accuracy: accuracy,
                    rawTelemetry: telemetryRef.current,
                },
                '*',
            );
        },
        [level, targetsInRound],
    );

    const startNewRound = useCallback(
        (lvl: number, isRetry: boolean = false) => {
            setIsRoundComplete(false);
            setIsGameOver(false);
            setIsDigging(false);
            setIsMenuOpen(false);
            setIsScanning(false);
            setActiveId(null);
            setRevealedItem(null);
            setDigLocation(null);
            setDugSpots([]);
            setFoundInRound([]);
            setProximity('none');
            setScannerPos({ x: 50, y: 50 });

            if (isRetry) setPickaxes(7);

            const pool = [...TOYS].sort(() => Math.random() - 0.5);
            const targetCount = Math.min(lvl, 5);
            const roundTargets = pool.slice(0, targetCount);

            const decoyCount = 5 + Math.floor(lvl / 2);
            const totalToysInSand = targetCount + decoyCount;
            const mineCount = Math.min(Math.floor(lvl / 2), 4);
            const newItems: SandboxItem[] = [];

            for (let i = 0; i < totalToysInSand; i++) {
                let x = 0,
                    y = 0,
                    safe = false,
                    attempts = 0;
                while (!safe && attempts < 50) {
                    x = 15 + Math.random() * 70;
                    y = 15 + Math.random() * 70;
                    safe = newItems.every(
                        (it) =>
                            Math.sqrt(
                                Math.pow(x - it.x, 2) + Math.pow(y - it.y, 2),
                            ) > 15,
                    );
                    attempts++;
                }
                newItems.push({
                    id: `item-${Date.now()}-${i}`,
                    emoji: pool[i],
                    x,
                    y,
                    isMine: false,
                });
            }

            for (let m = 0; m < mineCount; m++) {
                let x = 0,
                    y = 0,
                    safe = false,
                    attempts = 0;
                while (!safe && attempts < 50) {
                    x = 15 + Math.random() * 70;
                    y = 15 + Math.random() * 70;
                    safe = newItems.every(
                        (it) =>
                            Math.sqrt(
                                Math.pow(x - it.x, 2) + Math.pow(y - it.y, 2),
                            ) > 15,
                    );
                    attempts++;
                }
                newItems.push({
                    id: `mine-${Date.now()}-${m}`,
                    emoji: '💣',
                    x,
                    y,
                    isMine: true,
                });
            }

            setItems(newItems);
            setTargetsInRound(roundTargets);
            lastActionTimeRef.current = Date.now(); // Reset interaction timer on start
        },
        [],
    );

    useEffect(() => {
        setHasMounted(true);
        radarSfx.current = new Audio(
            'https://cdnjs.cloudflare.com/ajax/libs/ion-sound/3.0.7/sounds/button_tiny.mp3',
        );
        snapSfx.current = new Audio(
            'https://cdnjs.cloudflare.com/ajax/libs/ion-sound/3.0.7/sounds/snap.mp3',
        );
        foundSfx.current = new Audio(
            'https://cdnjs.cloudflare.com/ajax/libs/ion-sound/3.0.7/sounds/pop_cork.mp3',
        );
        errorSfx.current = new Audio(
            'https://cdnjs.cloudflare.com/ajax/libs/ion-sound/3.0.7/sounds/glitch.mp3',
        );
        explosionSfx.current = new Audio(
            'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3',
        );
        winSfx.current = new Audio(
            'https://assets.mixkit.co/active_storage/sfx/2014/2014-preview.mp3',
        );
    }, []);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (
            proximity !== 'none' &&
            gameStarted &&
            isScanning &&
            !isMenuOpen &&
            !isDigging &&
            !isRoundComplete &&
            !isGameOver &&
            !revealedItem
        ) {
            const isDanger = proximity === 'danger';
            const ms =
                proximity === 'hot' || isDanger
                    ? 200
                    : proximity === 'near'
                      ? 450
                      : 550;

            interval = setInterval(() => {
                if (radarSfx.current) {
                    radarSfx.current.currentTime = 0;
                    radarSfx.current.volume =
                        proximity === 'hot' || isDanger ? 0.3 : 0.1;
                    radarSfx.current.playbackRate = isDanger ? 0.6 : 1.0;
                    radarSfx.current.play().catch(() => {});
                }
                if (navigator.vibrate)
                    navigator.vibrate(
                        proximity === 'hot' || isDanger ? 60 : 20,
                    );
            }, ms);
        }
        return () => clearInterval(interval);
    }, [
        proximity,
        gameStarted,
        isScanning,
        isMenuOpen,
        isDigging,
        isRoundComplete,
        isGameOver,
        revealedItem,
    ]);

    const updateScannerPos = (clientX: number, clientY: number) => {
        if (!sandboxRef.current) return;
        const box = sandboxRef.current.getBoundingClientRect();

        const px = Math.max(
            0,
            Math.min(100, ((clientX - box.left) / box.width) * 100),
        );
        const py = Math.max(
            0,
            Math.min(100, ((clientY - box.top) / box.height) * 100),
        );
        setScannerPos({ x: px, y: py });

        let foundItem: SandboxItem | null = null;
        let minD = 999;

        items.forEach((item) => {
            const tx = box.left + (item.x / 100) * box.width;
            const ty = box.top + (item.y / 100) * box.height;
            const d = Math.sqrt(
                Math.pow(clientX - tx, 2) + Math.pow(clientY - ty, 2),
            );
            if (d < minD) {
                minD = d;
                foundItem = item;
            }
        });

        const bw = box.width;
        if (minD < bw * 0.12) {
            setActiveId(foundItem?.id || null);
            setProximity(foundItem?.isMine ? 'danger' : 'hot');
        } else if (minD < bw * 0.35) {
            setActiveId(null);
            setProximity('near');
        } else {
            setActiveId(null);
            setProximity('none');
        }
    };

    const handlePointerDown = (e: React.PointerEvent) => {
        if (isDigging || isRoundComplete || isGameOver || revealedItem) return;
        if (isMenuOpen) setIsMenuOpen(false);
        setIsScanning(true);
        updateScannerPos(e.clientX, e.clientY);
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isScanning) return;
        updateScannerPos(e.clientX, e.clientY);
    };

    const handlePointerUp = () => {
        if (!isScanning) return;
        setIsScanning(false);
        setIsMenuOpen(true);
    };

    const triggerFloatingText = (
        x: number,
        y: number,
        text: string,
        color: string,
    ) => {
        setFloatingText({ x, y, text, color });
        setTimeout(() => setFloatingText(null), 1500);
    };

    const confirmDig = (e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        if (pickaxes <= 0) return;

        const hit = items.find((i) => i.id === activeId);

        const digX = hit ? hit.x : scannerPos.x;
        const digY = hit ? hit.y : scannerPos.y;

        setDigLocation({ x: digX, y: digY });
        setIsDigging(true);
        setIsMenuOpen(false);

        const cost = hit?.isMine ? 2 : 1;
        setPickaxes((prev) => Math.max(0, prev - cost));

        const playSnap = (v: number) => {
            if (snapSfx.current) {
                const c = snapSfx.current.cloneNode() as HTMLAudioElement;
                c.volume = v;
                c.play().catch(() => {});
            }
        };
        setTimeout(() => playSnap(0.4), 100);
        setTimeout(() => playSnap(0.7), 450);
        setTimeout(() => playSnap(1.0), 800);

        setTimeout(() => {
            setIsDigging(false);
            setDigLocation(null);

            const remainingPickaxes = pickaxes - cost;

            if (!hit) {
                setDugSpots((prev) => [
                    ...prev,
                    { x: digX, y: digY, type: 'miss' },
                ]);
                errorSfx.current?.play().catch(() => {});
                triggerFloatingText(digX, digY, '-1', 'text-red-500');
                if (navigator.vibrate) navigator.vibrate([100, 50, 100]);

                logGameAction('dig_miss', 'sand', false, remainingPickaxes, {
                    digX,
                    digY,
                });
                setActiveId(null);

                if (remainingPickaxes <= 0)
                    setTimeout(() => setIsGameOver(true), 800);
                return;
            }

            if (hit.isMine) {
                setDugSpots((prev) => [
                    ...prev,
                    { x: digX, y: digY, type: 'mine' },
                ]);
                explosionSfx.current?.play().catch(() => {});
                triggerFloatingText(
                    digX,
                    digY,
                    '-2 Pickaxes!',
                    'text-red-500 font-black',
                );
                if (navigator.vibrate) navigator.vibrate([300, 100, 300]);

                setExplosionPos({ x: digX, y: digY });
                setTimeout(() => setExplosionPos(null), 1200);

                logGameAction('dig_mine', '💣', false, remainingPickaxes, {
                    digX,
                    digY,
                });
                setItems((prev) => prev.filter((i) => i.id !== hit.id));
                setActiveId(null);

                if (remainingPickaxes <= 0)
                    setTimeout(() => setIsGameOver(true), 1200);
            } else {
                setDugSpots((prev) => [
                    ...prev,
                    { x: digX, y: digY, type: 'hit' },
                ]);
                setItems((prev) => prev.filter((i) => i.id !== hit.id));
                setActiveId(null);

                setRevealedItem(hit);
                foundSfx.current?.play().catch(() => {});

                setTimeout(() => {
                    const isTarget = targetsInRound.includes(hit.emoji);

                    if (isTarget) {
                        const nextFound = [...foundInRound, hit.emoji];
                        setFoundInRound(nextFound);

                        logGameAction(
                            'dig_target',
                            hit.emoji,
                            true,
                            remainingPickaxes,
                            { digX, digY },
                        );

                        if (nextFound.length === targetsInRound.length) {
                            setScore((s) => s + 1);
                            setTimeout(() => {
                                setIsRoundComplete(true);
                                winSfx.current?.play().catch(() => {});
                            }, 800);
                            setRevealedItem(null);
                            return;
                        }
                    } else {
                        logGameAction(
                            'dig_decoy',
                            hit.emoji,
                            false,
                            remainingPickaxes,
                            { digX, digY, addedToStash: true },
                        );

                        setCollection((prev) => {
                            const ex = prev.find((t) => t.emoji === hit.emoji);
                            if (ex)
                                return prev.map((t) =>
                                    t.emoji === hit.emoji
                                        ? { ...t, count: t.count + 1 }
                                        : t,
                                );
                            return [{ emoji: hit.emoji, count: 1 }, ...prev];
                        });
                    }

                    setRevealedItem(null);

                    if (remainingPickaxes <= 0) {
                        setTimeout(() => setIsGameOver(true), 800);
                    }
                }, 1200);
            }
        }, 1200);
    };

    const redeemStashTreasure = (emoji: string) => {
        if (foundInRound.includes(emoji) || isRoundComplete || isGameOver)
            return;
        if (!targetsInRound.includes(emoji)) return;

        setCollection((prev) => {
            const item = prev.find((t) => t.emoji === emoji);
            if (!item) return prev;
            if (item.count > 1)
                return prev.map((t) =>
                    t.emoji === emoji ? { ...t, count: t.count - 1 } : t,
                );
            return prev.filter((t) => t.emoji !== emoji);
        });

        const nextFound = [...foundInRound, emoji];
        setFoundInRound(nextFound);
        foundSfx.current?.play().catch(() => {});

        logGameAction('redeem_stash', emoji, true, pickaxes);

        if (nextFound.length === targetsInRound.length) {
            setScore((s) => s + 1);
            setIsRoundComplete(true);
            winSfx.current?.play().catch(() => {});
        }
    };

    if (!hasMounted) return null;

    return (
        <div className="fixed inset-0 bg-[#020617] flex flex-col items-center p-2 sm:p-4 touch-none select-none z-[9999] text-white overflow-hidden">
            <div className="shrink-0 w-full max-w-md bg-white rounded-[1.5rem] sm:rounded-[2rem] p-3 sm:p-4 shadow-xl border-b-[6px] sm:border-b-8 border-slate-300 relative z-20">
                <div className="flex justify-between items-center mb-2 px-1 sm:px-2">
                    <div className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest">
                        Mission {level}:
                    </div>
                    <div className="flex items-center gap-1 bg-slate-100 px-2 sm:px-3 py-1 rounded-full border border-slate-200 shadow-inner">
                        <span className="text-[8px] sm:text-[10px] font-black text-slate-500 mr-1">
                            PICKAXES:
                        </span>
                        {Array.from({ length: MAX_PICKAXES }).map((_, i) => (
                            <Hammer
                                key={i}
                                size={12}
                                className={cn(
                                    'transition-all duration-300 sm:w-3.5 sm:h-3.5',
                                    i < pickaxes
                                        ? 'text-cyan-600 drop-shadow-md'
                                        : 'text-slate-300 opacity-30 grayscale scale-75',
                                )}
                            />
                        ))}
                    </div>
                </div>

                <div className="flex justify-around items-center h-10 sm:h-14">
                    {targetsInRound.map((emoji, i) => {
                        const isFound = foundInRound.includes(emoji);
                        return (
                            <div
                                key={i}
                                className="relative w-10 h-10 sm:w-14 sm:h-14 flex items-center justify-center"
                            >
                                <div
                                    className={cn(
                                        'absolute text-3xl sm:text-4xl transition-all opacity-30 grayscale brightness-0',
                                        isFound ? 'scale-0' : 'scale-100',
                                    )}
                                >
                                    {emoji}
                                </div>
                                {isFound && (
                                    <motion.div
                                        layoutId={`toy-${emoji}`}
                                        className="absolute text-3xl sm:text-4xl z-50"
                                    >
                                        {emoji}
                                    </motion.div>
                                )}
                                {isFound && (
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="absolute -top-1 -right-1 z-50 text-emerald-500 bg-white rounded-full shadow-sm"
                                    >
                                        <CheckCircle2
                                            size={14}
                                            className="sm:w-4 sm:h-4"
                                        />
                                    </motion.div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="flex-1 w-full min-h-0 flex items-center justify-center relative py-2 sm:py-4 z-10">
                <div className="w-full h-full max-w-[min(100%,_500px)] max-h-[min(100vw,_500px)] aspect-square bg-[#050a18] rounded-[2rem] sm:rounded-[3rem] border-8 sm:border-[12px] border-slate-800 shadow-[inset_0_0_100px_rgba(0,0,0,0.8)] relative">
                    <div className="absolute inset-0 rounded-[1.5rem] sm:rounded-[2.25rem] overflow-hidden pointer-events-none">
                        <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(rgba(255,255,255,1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,1)_1px,transparent_1px)] [background-size:15px_15px] sm:[background-size:20px_20px] pointer-events-none" />

                        {gameStarted &&
                            isScanning &&
                            !isMenuOpen &&
                            !isDigging &&
                            !isRoundComplete &&
                            !isGameOver &&
                            !revealedItem && (
                                <div
                                    className="absolute pointer-events-none transition-all duration-100 ease-out z-0"
                                    style={{
                                        width: '200%',
                                        height: '200%',
                                        left: `calc(${scannerPos.x}% - 100%)`,
                                        top: `calc(${scannerPos.y}% - 100%)`,
                                        maskImage:
                                            'radial-gradient(circle at center, black 0%, transparent 25%)',
                                        WebkitMaskImage:
                                            'radial-gradient(circle at center, black 0%, transparent 25%)',
                                    }}
                                >
                                    <div
                                        className="absolute inset-0"
                                        style={{
                                            backgroundImage: `linear-gradient(${proximity === 'danger' ? 'rgba(239,68,68,0.4)' : 'rgba(34,211,238,0.4)'} 2px, transparent 2px), linear-gradient(90deg, ${proximity === 'danger' ? 'rgba(239,68,68,0.4)' : 'rgba(34,211,238,0.4)'} 2px, transparent 2px)`,
                                            backgroundSize: '30px 30px',
                                            backgroundPosition: 'center',
                                        }}
                                    />
                                    <div
                                        className={cn(
                                            'absolute inset-0 opacity-40 mix-blend-screen transition-colors duration-300',
                                            proximity === 'danger'
                                                ? 'bg-[radial-gradient(circle,rgba(239,68,68,1)_0%,transparent_30%)]'
                                                : 'bg-[radial-gradient(circle,rgba(34,211,238,1)_0%,transparent_30%)]',
                                        )}
                                    />
                                </div>
                            )}

                        {dugSpots.map((spot, i) => (
                            <div
                                key={i}
                                className={cn(
                                    'absolute w-12 h-10 sm:w-16 sm:h-12 rounded-full blur-lg sm:blur-xl -ml-6 -mt-5 sm:-ml-8 sm:-mt-6 z-10 pointer-events-none',
                                    spot.type === 'mine'
                                        ? 'bg-amber-900/80'
                                        : spot.type === 'miss'
                                          ? 'bg-red-950/60'
                                          : 'bg-black/80 shadow-[inset_0_0_20px_black]',
                                )}
                                style={{
                                    left: `${spot.x}%`,
                                    top: `${spot.y}%`,
                                }}
                            />
                        ))}

                        <AnimatePresence>
                            {(proximity === 'hot' || proximity === 'danger') &&
                                activeId &&
                                (isScanning || isMenuOpen) &&
                                !isDigging &&
                                !revealedItem && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.5 }}
                                        animate={{ opacity: 1, scale: 1.2 }}
                                        exit={{ opacity: 0 }}
                                        className={cn(
                                            'absolute w-20 h-20 sm:w-28 sm:h-28 -ml-10 -mt-10 sm:-ml-14 sm:-mt-14 rounded-full blur-[15px] sm:blur-[20px] pointer-events-none z-10',
                                            proximity === 'danger'
                                                ? 'bg-red-500'
                                                : 'bg-cyan-400',
                                        )}
                                        style={{
                                            left: `${items.find((it) => it.id === activeId)?.x}%`,
                                            top: `${items.find((it) => it.id === activeId)?.y}%`,
                                        }}
                                    />
                                )}
                        </AnimatePresence>
                    </div>

                    <div
                        ref={sandboxRef}
                        className="absolute inset-0 touch-none z-10"
                        onPointerDown={handlePointerDown}
                        onPointerMove={handlePointerMove}
                        onPointerUp={handlePointerUp}
                        onPointerLeave={handlePointerUp}
                        onPointerCancel={handlePointerUp}
                    >
                        {items.map((item) => {
                            const isBeingDug =
                                isDigging && activeId === item.id;
                            return (
                                <div
                                    key={item.id}
                                    className="absolute w-10 h-10 sm:w-12 sm:h-12 -ml-5 -mt-5 sm:-ml-6 sm:-mt-6 flex items-center justify-center z-20 pointer-events-none"
                                    style={{
                                        left: `${item.x}%`,
                                        top: `${item.y}%`,
                                    }}
                                >
                                    <AnimatePresence>
                                        {(activeId === item.id ||
                                            (isMenuOpen &&
                                                activeId === item.id)) &&
                                            !revealedItem && (
                                                <motion.div
                                                    initial={{
                                                        scale: 0,
                                                        filter: 'brightness(0) grayscale(1)',
                                                        opacity: 0.8,
                                                    }}
                                                    animate={{
                                                        scale: isBeingDug
                                                            ? 2.8
                                                            : 2.2,
                                                        filter: isBeingDug
                                                            ? 'brightness(1) grayscale(0)'
                                                            : 'brightness(0) grayscale(1)',
                                                        opacity: isBeingDug
                                                            ? 1
                                                            : 0.8,
                                                        y: isBeingDug ? -10 : 0,
                                                        rotate: isBeingDug
                                                            ? [
                                                                  0, -10, 10,
                                                                  -10, 10, -5,
                                                                  5, 0,
                                                              ]
                                                            : 0,
                                                    }}
                                                    transition={{
                                                        duration: isBeingDug
                                                            ? 1.2
                                                            : 0.2,
                                                        ease: 'easeInOut',
                                                    }}
                                                    className="text-3xl sm:text-4xl drop-shadow-[0_0_5px_rgba(0,0,0,0.8)]"
                                                >
                                                    {item.emoji}
                                                </motion.div>
                                            )}
                                    </AnimatePresence>
                                </div>
                            );
                        })}

                        <AnimatePresence>
                            {isMenuOpen &&
                                activeId &&
                                !isDigging &&
                                !revealedItem && (
                                    <motion.div
                                        initial={{
                                            scale: 0,
                                            opacity: 0,
                                            rotate: -90,
                                        }}
                                        animate={{
                                            scale: 1,
                                            opacity: 1,
                                            rotate: 0,
                                        }}
                                        exit={{
                                            scale: 0,
                                            opacity: 0,
                                            rotate: 90,
                                        }}
                                        className="absolute w-16 h-16 sm:w-20 sm:h-20 -ml-8 -mt-8 sm:-ml-10 sm:-mt-10 z-30 flex items-center justify-center pointer-events-none"
                                        style={{
                                            left: `${items.find((it) => it.id === activeId)?.x}%`,
                                            top: `${items.find((it) => it.id === activeId)?.y}%`,
                                        }}
                                    >
                                        <div
                                            className={cn(
                                                'absolute inset-0 rounded-full animate-ping opacity-40',
                                                proximity === 'danger'
                                                    ? 'bg-red-500'
                                                    : 'bg-cyan-400',
                                            )}
                                        />
                                        <Target
                                            size={40}
                                            className={cn(
                                                'sm:w-12 sm:h-12 drop-shadow-[0_0_10px_rgba(0,0,0,0.8)]',
                                                proximity === 'danger'
                                                    ? 'text-red-500'
                                                    : 'text-cyan-400',
                                            )}
                                        />
                                    </motion.div>
                                )}
                        </AnimatePresence>

                        <AnimatePresence>
                            {revealedItem && (
                                <motion.div
                                    initial={{
                                        left: `${revealedItem.x}%`,
                                        top: `${revealedItem.y}%`,
                                    }}
                                    animate={{ left: '50%', top: '50%' }}
                                    transition={{
                                        type: 'spring',
                                        bounce: 0.5,
                                        duration: 0.8,
                                    }}
                                    className="absolute w-10 h-10 sm:w-12 sm:h-12 -ml-5 -mt-5 sm:-ml-6 sm:-mt-6 z-[300]"
                                >
                                    <motion.div
                                        layoutId={`toy-${revealedItem.emoji}`}
                                        initial={{
                                            scale: 2.8,
                                            opacity: 1,
                                            y: -10,
                                        }}
                                        animate={{
                                            scale: 5,
                                            opacity: 1,
                                            y: -20,
                                        }}
                                        transition={{
                                            type: 'spring',
                                            bounce: 0.6,
                                        }}
                                        className="text-4xl sm:text-5xl drop-shadow-[0_10px_40px_rgba(0,0,0,0.6)] flex items-center justify-center w-full h-full"
                                    >
                                        {revealedItem.emoji}
                                    </motion.div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <AnimatePresence>
                            {floatingText && (
                                <motion.div
                                    initial={{ opacity: 0, y: 0, scale: 0.5 }}
                                    animate={{ opacity: 1, y: -40, scale: 1.2 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    className={cn(
                                        'absolute z-[400] text-lg sm:text-2xl font-black drop-shadow-md pointer-events-none flex items-center justify-center -ml-10 -mt-10 w-20 h-20 text-center',
                                        floatingText.color,
                                    )}
                                    style={{
                                        left: `${floatingText.x}%`,
                                        top: `${floatingText.y}%`,
                                    }}
                                >
                                    {floatingText.text}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <AnimatePresence>
                            {isMenuOpen && !isDigging && !isGameOver && (
                                <motion.div
                                    initial={{ y: 120 }}
                                    animate={{ y: 0 }}
                                    exit={{ y: 120 }}
                                    onPointerDown={(e) => e.stopPropagation()}
                                    className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6 z-[100] h-20 sm:h-24 bg-slate-900/90 backdrop-blur-3xl rounded-[2rem] border border-slate-700 shadow-2xl flex items-center justify-around px-2"
                                >
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setIsMenuOpen(false);
                                        }}
                                        className="flex flex-col items-center gap-1 active:scale-90 transition-transform"
                                    >
                                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-800 rounded-xl sm:rounded-2xl flex items-center justify-center border border-white/10">
                                            <Search
                                                size={20}
                                                className="text-slate-300 sm:w-6 sm:h-6"
                                            />
                                        </div>
                                        <span className="text-[8px] sm:text-[10px] font-black uppercase text-slate-400">
                                            Keep Scanning
                                        </span>
                                    </button>
                                    <button
                                        onClick={confirmDig}
                                        className="flex flex-col items-center gap-1 active:scale-90 transition-transform"
                                    >
                                        <div className="w-12 h-12 sm:w-14 sm:h-14 bg-cyan-600 rounded-xl sm:rounded-2xl flex items-center justify-center border border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.4)]">
                                            <Hammer
                                                size={24}
                                                className="text-white sm:w-7 sm:h-7"
                                            />
                                        </div>
                                        <span className="text-[8px] sm:text-[10px] font-black uppercase text-cyan-400">
                                            Dig Here!
                                        </span>
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <AnimatePresence>
                            {explosionPos && (
                                <div
                                    className="absolute w-32 h-32 -ml-16 -mt-16 z-[150] pointer-events-none flex items-center justify-center"
                                    style={{
                                        left: `${explosionPos.x}%`,
                                        top: `${explosionPos.y}%`,
                                    }}
                                >
                                    <motion.div
                                        initial={{ scale: 0, opacity: 1 }}
                                        animate={{
                                            scale: [1, 4, 6],
                                            opacity: [1, 1, 0],
                                        }}
                                        transition={{ duration: 0.6 }}
                                        className="text-7xl sm:text-9xl drop-shadow-[0_0_40px_rgba(239,68,68,1)]"
                                    >
                                        💥
                                    </motion.div>
                                </div>
                            )}
                        </AnimatePresence>

                        <AnimatePresence>
                            {isDigging && digLocation && (
                                <div
                                    className="absolute w-32 h-32 -ml-16 -mt-16 z-[110] pointer-events-none flex items-center justify-center"
                                    style={{
                                        left: `${digLocation.x}%`,
                                        top: `${digLocation.y}%`,
                                    }}
                                >
                                    {Array.from({ length: 16 }).map((_, i) => {
                                        const angle = (i / 16) * Math.PI * 2;
                                        const seed = i + 1;
                                        const pseudoRandDist =
                                            Math.abs(Math.sin(seed * 123.45)) *
                                            50;
                                        const pseudoRandDuration =
                                            0.3 +
                                            Math.abs(Math.sin(seed * 678.9)) *
                                                0.2;
                                        const pseudoRandDelay =
                                            Math.abs(Math.cos(seed * 345.6)) *
                                            0.3;
                                        const dist = 50 + pseudoRandDist;

                                        return (
                                            <motion.div
                                                key={`spark-${i}`}
                                                initial={{
                                                    x: 0,
                                                    y: 0,
                                                    scale: 1,
                                                    opacity: 1,
                                                }}
                                                animate={{
                                                    x: [
                                                        0,
                                                        Math.cos(angle) * dist,
                                                    ],
                                                    y: [
                                                        0,
                                                        Math.sin(angle) * dist,
                                                    ],
                                                    scale: [1, 0],
                                                    opacity: [1, 0],
                                                }}
                                                transition={{
                                                    duration:
                                                        pseudoRandDuration,
                                                    ease: 'easeOut',
                                                    repeat: Infinity,
                                                    repeatDelay: 0.1,
                                                    delay: pseudoRandDelay,
                                                }}
                                                className={cn(
                                                    'absolute rounded-full z-0',
                                                    i % 3 === 0
                                                        ? 'bg-stone-500 w-2 h-2 sm:w-3 sm:h-3'
                                                        : i % 2 === 0
                                                          ? 'bg-amber-300 w-1.5 h-1.5 sm:w-2 sm:h-2 shadow-[0_0_8px_#fbbf24]'
                                                          : 'bg-orange-500 w-1 h-1 sm:w-1.5 sm:h-1.5',
                                                )}
                                            />
                                        );
                                    })}
                                    <motion.div
                                        initial={{ rotate: -60, y: -40 }}
                                        animate={{
                                            rotate: [0, -60, 0, -60, 0],
                                            y: [0, 25, 0, 25, 0],
                                        }}
                                        transition={{ duration: 1.1 }}
                                        className="text-7xl sm:text-8xl drop-shadow-2xl z-10"
                                    >
                                        ⛏️
                                    </motion.div>
                                </div>
                            )}
                        </AnimatePresence>

                        {gameStarted &&
                            isScanning &&
                            !isMenuOpen &&
                            !isDigging &&
                            !isRoundComplete &&
                            !isGameOver &&
                            !revealedItem && (
                                <motion.div
                                    className="absolute w-32 h-32 sm:w-44 sm:h-44 -ml-16 -mt-16 sm:-ml-22 sm:-mt-22 rounded-full pointer-events-none z-40 flex items-center justify-center"
                                    style={{
                                        left: `${scannerPos.x}%`,
                                        top: `${scannerPos.y}%`,
                                    }}
                                >
                                    <div className="absolute w-[140%] h-[140%] rounded-full border-[1.5px] border-dashed border-white/20 animate-[spin_10s_linear_infinite] pointer-events-none" />
                                    <div className="absolute inset-0 rounded-full border-[2px] border-white/20 bg-white/5 backdrop-blur-[1px] shadow-[inset_0_0_20px_rgba(255,255,255,0.05)] pointer-events-none" />
                                    <motion.div
                                        animate={
                                            proximity !== 'none'
                                                ? {
                                                      scale: [1, 1.15, 1],
                                                      opacity: [0.8, 1, 0.8],
                                                  }
                                                : { scale: 1 }
                                        }
                                        transition={{
                                            repeat: Infinity,
                                            duration:
                                                proximity === 'hot' ||
                                                proximity === 'danger'
                                                    ? 0.3
                                                    : 0.6,
                                        }}
                                        className="absolute inset-0 rounded-full border-2 border-white/30"
                                    />
                                    {proximity === 'danger' ? (
                                        <Flame
                                            size={28}
                                            className="text-red-500 opacity-90 animate-pulse drop-shadow-md sm:w-9 sm:h-9"
                                        />
                                    ) : proximity === 'hot' ? (
                                        <Target
                                            size={28}
                                            className="text-cyan-400 opacity-100 scale-125 transition-all duration-300 drop-shadow-md sm:w-9 sm:h-9"
                                        />
                                    ) : proximity === 'near' ? (
                                        <Search
                                            size={28}
                                            className="text-cyan-200 opacity-70 transition-all duration-300 sm:w-9 sm:h-9"
                                        />
                                    ) : (
                                        <Search
                                            size={28}
                                            className="text-white opacity-40 transition-all duration-300 sm:w-9 sm:h-9"
                                        />
                                    )}
                                </motion.div>
                            )}

                        <AnimatePresence>
                            {isGameOver && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="absolute inset-0 z-[200] bg-red-950/90 backdrop-blur-md flex items-center justify-center p-4 text-center pointer-events-auto rounded-[1.5rem] sm:rounded-[2.25rem] overflow-hidden"
                                >
                                    <motion.div
                                        initial={{ scale: 0.8 }}
                                        animate={{ scale: 1 }}
                                        className="bg-white p-6 sm:p-10 rounded-[2rem] sm:rounded-[3.5rem] shadow-2xl border-[6px] sm:border-8 border-red-100 w-full max-w-xs sm:max-w-sm"
                                    >
                                        <AlertTriangle
                                            size={48}
                                            className="text-red-500 mx-auto mb-3 sm:mb-4 sm:w-14 sm:h-14"
                                        />
                                        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 uppercase mb-2">
                                            Out of Pickaxes!
                                        </h2>
                                        <p className="text-red-500 font-bold mb-4 sm:mb-6 text-sm sm:text-base">
                                            Scan carefully next time!
                                        </p>
                                        <button
                                            onClick={() =>
                                                startNewRound(level, true)
                                            }
                                            className="w-full bg-red-500 py-4 sm:py-6 rounded-2xl sm:rounded-3xl text-white font-black text-lg sm:text-xl flex items-center justify-center gap-2 sm:gap-3 shadow-[0_6px_0_rgb(185,28,28)] sm:shadow-[0_8px_0_rgb(185,28,28)] active:translate-y-2 active:shadow-none transition-all"
                                        >
                                            <RotateCcw
                                                size={20}
                                                className="sm:w-6 sm:h-6"
                                            />{' '}
                                            TRY AGAIN
                                        </button>
                                    </motion.div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <AnimatePresence>
                            {isRoundComplete && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="absolute inset-0 z-[200] bg-cyan-950/90 backdrop-blur-md flex items-center justify-center p-4 text-center pointer-events-auto rounded-[1.5rem] sm:rounded-[2.25rem] overflow-hidden"
                                >
                                    <motion.div
                                        initial={{ scale: 0.8 }}
                                        animate={{ scale: 1 }}
                                        className="bg-white p-6 sm:p-10 rounded-[2rem] sm:rounded-[3.5rem] shadow-2xl border-[6px] sm:border-8 border-cyan-100 w-full max-w-xs sm:max-w-sm"
                                    >
                                        <Sparkles
                                            size={48}
                                            className="text-cyan-600 mx-auto mb-3 sm:mb-4 animate-bounce sm:w-14 sm:h-14"
                                        />
                                        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 uppercase mb-4">
                                            Level {level} Clear!
                                        </h2>
                                        <div className="text-sm sm:text-base font-bold text-cyan-700 mb-6 bg-cyan-50 py-2 rounded-xl border border-cyan-200">
                                            +3 Bonus Pickaxes!
                                        </div>
                                        <button
                                            onClick={() => {
                                                const nl = level + 1;
                                                setLevel(nl);
                                                setPickaxes((p) =>
                                                    Math.min(
                                                        MAX_PICKAXES,
                                                        p + 3,
                                                    ),
                                                );
                                                startNewRound(nl, false);
                                            }}
                                            className="w-full bg-cyan-600 py-4 sm:py-6 rounded-2xl sm:rounded-3xl text-white font-black text-lg sm:text-xl flex items-center justify-center gap-2 sm:gap-3 shadow-[0_6px_0_rgb(8,145,178)] sm:shadow-[0_8px_0_rgb(8,145,178)] active:translate-y-2 active:shadow-none transition-all"
                                        >
                                            NEXT LEVEL{' '}
                                            <ArrowRight
                                                size={20}
                                                className="sm:w-6 sm:h-6"
                                            />
                                        </button>
                                    </motion.div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {!gameStarted && (
                            <div className="absolute inset-0 z-[150] bg-slate-950 flex flex-col items-center justify-center pointer-events-auto rounded-[1.5rem] sm:rounded-[2.25rem] overflow-hidden">
                                <div className="text-cyan-500 mb-6 sm:mb-8">
                                    <Search
                                        size={60}
                                        className="animate-pulse sm:w-20 sm:h-20"
                                    />
                                </div>
                                <button
                                    onClick={() => {
                                        setGameStarted(true);
                                        startNewRound(1, true);
                                    }}
                                    className="bg-cyan-600 px-10 py-5 sm:px-16 sm:py-8 rounded-[2.5rem] sm:rounded-[3rem] text-white font-black text-xl sm:text-3xl shadow-[0_8px_0_rgb(8,145,178)] sm:shadow-[0_10px_0_rgb(8,145,178)] active:translate-y-2 active:shadow-none transition-all"
                                >
                                    START SCANNING
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="shrink-0 w-full max-w-md bg-white/5 rounded-[1.5rem] sm:rounded-[2rem] p-3 sm:p-4 border border-white/10 shadow-2xl relative z-20">
                <div className="absolute top-2 left-4 sm:left-6 text-[8px] sm:text-[10px] font-black text-cyan-400 uppercase tracking-widest flex items-center gap-1">
                    <Package size={10} className="sm:w-3 sm:h-3" /> Stash:{' '}
                    <span className="text-[7px] sm:text-[8px] text-white/40 ml-1 sm:ml-2">
                        (Tap useful items to fill list)
                    </span>
                </div>
                <div className="flex gap-2 sm:gap-4 overflow-x-auto pb-2 scrollbar-hide min-h-[45px] sm:min-h-[50px] mt-4 px-1 sm:px-2">
                    <AnimatePresence initial={false}>
                        {collection.length === 0 ? (
                            <div className="w-full text-center text-slate-600 text-[8px] sm:text-[10px] font-black uppercase py-2 tracking-widest">
                                Empty Stash
                            </div>
                        ) : (
                            collection.map((toy) => {
                                const isUseful =
                                    targetsInRound.includes(toy.emoji) &&
                                    !foundInRound.includes(toy.emoji);
                                return (
                                    <motion.button
                                        key={toy.emoji}
                                        layout
                                        onClick={() =>
                                            isUseful &&
                                            redeemStashTreasure(toy.emoji)
                                        }
                                        className={cn(
                                            'relative text-xl sm:text-2xl bg-white/5 p-2 sm:p-3 rounded-xl sm:rounded-2xl border transition-all shrink-0 active:scale-95',
                                            isUseful
                                                ? 'border-cyan-400 bg-cyan-400/20 shadow-[0_0_15px_rgba(34,211,238,0.3)]'
                                                : 'border-white/10 opacity-60',
                                        )}
                                    >
                                        <motion.div
                                            layoutId={`toy-${toy.emoji}`}
                                            className="relative z-10"
                                        >
                                            {toy.emoji}
                                        </motion.div>
                                        {isUseful && (
                                            <MousePointer2 className="absolute -top-1 -right-1 text-cyan-400 animate-pulse w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                        )}
                                        {toy.count > 1 && (
                                            <div className="absolute -bottom-1 -right-1 bg-cyan-500 text-white text-[8px] sm:text-[10px] font-black px-1.5 rounded-full">
                                                x{toy.count}
                                            </div>
                                        )}
                                    </motion.button>
                                );
                            })
                        )}
                    </AnimatePresence>
                </div>
            </div>

            <div className="shrink-0 mt-2 sm:mt-4 flex gap-4 sm:gap-6 opacity-40 text-[10px] sm:text-xs font-black z-20 pb-2">
                <div className="flex items-center gap-1 text-amber-400">
                    <Trophy size={12} className="sm:w-3.5 sm:h-3.5" /> SCORE:{' '}
                    {score}
                </div>
                <div className="flex items-center gap-1 text-cyan-400">
                    <Zap size={12} className="sm:w-3.5 sm:h-3.5" /> LEVEL{' '}
                    {level}
                </div>
            </div>
        </div>
    );
}
