'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
    Bluetooth,
    BluetoothOff,
    Heart,
    Square,
    Circle,
    Triangle,
    Star,
    Diamond,
    Zap,
    Ghost,
    Cloud,
    AlertCircle,
    CheckCircle2,
} from 'lucide-react';

const SHAPES = [
    {
        name: 'RED HEART',
        hex: '#ef4444',
        icon: <Heart size={64} fill="currentColor" />,
    },
    {
        name: 'BLUE SQUARE',
        hex: '#3b82f6',
        icon: <Square size={64} fill="currentColor" />,
    },
    {
        name: 'GREEN CIRCLE',
        hex: '#22c55e',
        icon: <Circle size={64} fill="currentColor" />,
    },
    {
        name: 'YELLOW STAR',
        hex: '#eab308',
        icon: <Star size={64} fill="currentColor" />,
    },
    {
        name: 'PURPLE GHOST',
        hex: '#a855f7',
        icon: <Ghost size={64} fill="currentColor" />,
    },
    {
        name: 'ORANGE TRIANGLE',
        hex: '#f97316',
        icon: <Triangle size={64} fill="currentColor" />,
    },
    {
        name: 'PINK DIAMOND',
        hex: '#db2777',
        icon: <Diamond size={64} fill="currentColor" />,
    },
    {
        name: 'WHITE CLOUD',
        hex: '#ffffff',
        icon: <Cloud size={64} fill="currentColor" />,
    },
];

const UUIDS = {
    service: '4fafc201-1fb5-459e-8fcc-c5c9c331914b',
    char: 'beb5483e-36e1-4688-b7f5-ea07361b26a8',
};

export default function IotImmersiveShell() {
    const [gameState, setGameState] = useState({ target: SHAPES[0], score: 0 });
    const [status, setStatus] = useState({
        connected: false,
        feedback: null as any,
        error: '',
    });
    const charRef = useRef<any>(null);
    const audioCtx = useRef<AudioContext | null>(null);

    const playSuccessSound = () => {
        if (!audioCtx.current)
            audioCtx.current = new (
                window.AudioContext || (window as any).webkitAudioContext
            )();
        const ctx = audioCtx.current;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
    };

    const sendToESP32 = async (val: string) => {
        if (charRef.current) {
            try {
                await charRef.current.writeValue(new TextEncoder().encode(val));
            } catch (e) {
                console.error('BLE Write Error', e);
            }
        }
    };

    const generateRound = (score: number) => {
        const winningShape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
        const others = SHAPES.filter((s) => s.hex !== winningShape.hex).sort(
            () => 0.5 - Math.random(),
        );
        const padColors = [winningShape, others[0], others[1]].sort(
            () => 0.5 - Math.random(),
        );
        const winPos = padColors.findIndex((p) => p.hex === winningShape.hex);

        setGameState({ target: winningShape, score });
        const cmd = `Z0${padColors[0].hex},Z1${padColors[1].hex},Z2${padColors[2].hex}|${winPos}`;
        sendToESP32(cmd);
    };

    const handleHardwareData = (data: string) => {
        const [_, index, rt, press, mistake] = data.split('_');
        if (mistake === '0') {
            playSuccessSound();
            setStatus((s) => ({ ...s, feedback: 'correct' }));
            setTimeout(() => {
                setStatus((s) => ({ ...s, feedback: null }));
                setGameState((c) => {
                    generateRound(c.score + 1);
                    return { ...c, score: c.score + 1 };
                });
            }, 1000);
        } else {
            setStatus((s) => ({ ...s, feedback: 'wrong' }));
            setTimeout(() => setStatus((s) => ({ ...s, feedback: null })), 600);
        }
    };

    const connectBLE = async () => {
        try {
            setStatus((s) => ({ ...s, error: '' }));
            const nav = navigator as any;
            if (!nav.bluetooth)
                return setStatus((s) => ({
                    ...s,
                    error: 'Browser not supported',
                }));

            const device = await nav.bluetooth.requestDevice({
                acceptAllDevices: true,
                optionalServices: [UUIDS.service],
            });

            const server = await device.gatt.connect();
            const service = await server.getPrimaryService(UUIDS.service);
            charRef.current = await service.getCharacteristic(UUIDS.char);

            await charRef.current.startNotifications();
            charRef.current.addEventListener(
                'characteristicvaluechanged',
                (e: any) => {
                    const val = new TextDecoder().decode(e.target.value);
                    if (val.startsWith('PRES_')) handleHardwareData(val);
                },
            );

            setStatus((s) => ({ ...s, connected: true }));
            generateRound(0);
        } catch (err: any) {
            setStatus((s) => ({
                ...s,
                error:
                    err.name === 'NotFoundError' ? 'Cancelled' : 'Link Failed',
            }));
        }
    };

    return (
        <div className="min-h-screen bg-[#08080a] text-zinc-100 flex flex-col items-center justify-center p-12 font-mono overflow-hidden">
            {/* Control Bar */}
            <div className="absolute top-0 w-full max-w-7xl flex justify-between items-center py-10 border-b border-white/5 px-12">
                <div className="flex items-center gap-4">
                    <div
                        className={cn(
                            'w-3 h-3 rounded-full animate-pulse',
                            status.connected
                                ? 'bg-emerald-500 shadow-[0_0_15px_#10b981]'
                                : 'bg-rose-600',
                        )}
                    />
                    <span className="text-[11px] font-black tracking-[0.4em] uppercase opacity-40">
                        System Core: {status.connected ? 'Synced' : 'Offline'}
                    </span>
                </div>
                {status.error && (
                    <div className="text-rose-500 text-[10px] font-black uppercase">
                        <AlertCircle size={14} className="inline mr-2" />
                        {status.error}
                    </div>
                )}
                <Button
                    onClick={connectBLE}
                    variant="ghost"
                    className="border border-white/10 rounded-2xl px-10 h-16 text-xs font-black tracking-widest hover:bg-white/5 transition-all active:scale-95"
                >
                    {status.connected ? (
                        <Bluetooth className="mr-3 text-emerald-400" />
                    ) : (
                        <BluetoothOff className="mr-3 text-rose-500" />
                    )}
                    {status.connected ? 'LINK ACTIVE' : 'INITIALIZE HARDWARE'}
                </Button>
            </div>

            {/* Main Interface */}
            <div className="w-full max-w-6xl grid grid-cols-12 gap-16 items-center">
                {/* Left: Score Card */}
                <div className="col-span-3">
                    <div className="bg-zinc-900 border border-white/5 rounded-[50px] p-10 shadow-2xl relative overflow-hidden group">
                        <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Zap size={120} />
                        </div>
                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-4">
                            Successful Matches
                        </p>
                        <p className="text-9xl font-[1000] italic tracking-tighter tabular-nums">
                            {gameState.score}
                        </p>
                    </div>
                </div>

                {/* Center: Target Portal */}
                <div className="col-span-6 flex flex-col items-center">
                    <div
                        className={cn(
                            'w-[450px] h-[450px] rounded-[110px] border-[12px] transition-all duration-500 flex flex-col items-center justify-center gap-10 relative overflow-hidden',
                            status.feedback === 'correct'
                                ? 'border-emerald-500 bg-emerald-500/5 shadow-[0_0_100px_rgba(16,185,129,0.2)] scale-105'
                                : status.feedback === 'wrong'
                                  ? 'border-rose-600 bg-rose-600/5 animate-shake'
                                  : 'border-white/5 bg-zinc-900/50 shadow-inner',
                        )}
                    >
                        {status.feedback === 'correct' ? (
                            <CheckCircle2
                                size={200}
                                className="text-emerald-500 animate-in zoom-in duration-300"
                            />
                        ) : (
                            <>
                                <div
                                    className="absolute inset-0 opacity-10 blur-[100px] animate-pulse"
                                    style={{
                                        backgroundColor: gameState.target.hex,
                                    }}
                                />
                                <div
                                    className="relative z-10 flex flex-col items-center gap-6"
                                    style={{ color: gameState.target.hex }}
                                >
                                    <div className="drop-shadow-[0_0_30px_rgba(255,255,255,0.3)]">
                                        {gameState.target.icon}
                                    </div>
                                    <h2 className="text-5xl font-[1000] text-white tracking-tighter uppercase italic drop-shadow-md">
                                        FIND{' '}
                                        {gameState.target.name.split(' ')[0]}
                                    </h2>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Right: Zone Status */}
                <div className="col-span-3 flex flex-col gap-6">
                    {[0, 1, 2].map((i) => (
                        <div
                            key={i}
                            className="bg-zinc-900/30 border border-white/5 rounded-[35px] p-8 flex items-center gap-6 opacity-20 grayscale scale-95"
                        >
                            <div className="w-14 h-14 rounded-2xl bg-zinc-800 flex items-center justify-center text-zinc-500">
                                <Zap size={24} />
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest leading-none mb-1">
                                    Hardware Zone
                                </p>
                                <p className="text-3xl font-black italic">
                                    0{i + 1}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Footer Decal */}
            <div className="absolute bottom-12 flex items-center gap-8 text-white/5 font-black tracking-[2.5em] text-[11px] uppercase pointer-events-none">
                <div className="h-px w-40 bg-white/5" />
                Tactile Shell Interface V4.2
                <div className="h-px w-40 bg-white/5" />
            </div>
        </div>
    );
}
