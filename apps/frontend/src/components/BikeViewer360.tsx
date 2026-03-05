'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Maximize2, Minimize2, RotateCcw, ZoomIn, ZoomOut, Hand } from 'lucide-react';

interface BikeViewer360Props {
    /** Array of image URLs for 360° rotation (24-36 images recommended) */
    images: string[];
    /** Bike name for accessibility */
    bikeName: string;
    /** Auto-rotate speed in ms per frame (0 to disable) */
    autoRotateSpeed?: number;
    /** Enable zoom functionality */
    enableZoom?: boolean;
    /** Enable fullscreen */
    enableFullscreen?: boolean;
    /** Fallback image if no 360 images available */
    fallbackImage?: string;
}

export default function BikeViewer360({
    images,
    bikeName,
    autoRotateSpeed = 80,
    enableZoom = true,
    enableFullscreen = true,
    fallbackImage = '/images/fallback-bike.jpg',
}: BikeViewer360Props) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [currentFrame, setCurrentFrame] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [zoom, setZoom] = useState(1);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isAutoRotating, setIsAutoRotating] = useState(true);
    const [loadedImages, setLoadedImages] = useState<HTMLImageElement[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadProgress, setLoadProgress] = useState(0);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const autoRotateRef = useRef<NodeJS.Timeout | null>(null);

    const frameCount = images.length;

    // Preload all images
    useEffect(() => {
        if (images.length === 0) return;

        setIsLoading(true);
        let loaded = 0;
        const imgElements: HTMLImageElement[] = new Array(images.length);

        images.forEach((src, index) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                imgElements[index] = img;
                loaded++;
                setLoadProgress(Math.round((loaded / images.length) * 100));
                if (loaded === images.length) {
                    setLoadedImages(imgElements);
                    setIsLoading(false);
                }
            };
            img.onerror = () => {
                loaded++;
                setLoadProgress(Math.round((loaded / images.length) * 100));
                if (loaded === images.length) {
                    setLoadedImages(imgElements.filter(Boolean));
                    setIsLoading(false);
                }
            };
            img.src = src;
        });
    }, [images]);

    // Draw current frame
    const drawFrame = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas || loadedImages.length === 0) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const img = loadedImages[currentFrame % loadedImages.length];
        if (!img) return;

        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);

        ctx.clearRect(0, 0, rect.width, rect.height);

        // Apply zoom
        const scaledWidth = rect.width * zoom;
        const scaledHeight = rect.height * zoom;
        const offsetX = (rect.width - scaledWidth) / 2;
        const offsetY = (rect.height - scaledHeight) / 2;

        // Maintain aspect ratio
        const imgRatio = img.width / img.height;
        const canvasRatio = scaledWidth / scaledHeight;

        let drawW: number, drawH: number, drawX: number, drawY: number;

        if (imgRatio > canvasRatio) {
            drawW = scaledWidth;
            drawH = scaledWidth / imgRatio;
            drawX = offsetX;
            drawY = offsetY + (scaledHeight - drawH) / 2;
        } else {
            drawH = scaledHeight;
            drawW = scaledHeight * imgRatio;
            drawX = offsetX + (scaledWidth - drawW) / 2;
            drawY = offsetY;
        }

        ctx.drawImage(img, drawX, drawY, drawW, drawH);
    }, [currentFrame, loadedImages, zoom]);

    useEffect(() => {
        drawFrame();
    }, [drawFrame]);

    // Auto-rotate
    useEffect(() => {
        if (isAutoRotating && autoRotateSpeed > 0 && !isDragging && loadedImages.length > 0) {
            autoRotateRef.current = setInterval(() => {
                setCurrentFrame(prev => (prev + 1) % frameCount);
            }, autoRotateSpeed);
        }
        return () => {
            if (autoRotateRef.current) clearInterval(autoRotateRef.current);
        };
    }, [isAutoRotating, autoRotateSpeed, isDragging, frameCount, loadedImages.length]);

    // Mouse/touch handlers for dragging
    const handlePointerDown = (e: React.PointerEvent) => {
        setIsDragging(true);
        setStartX(e.clientX);
        setIsAutoRotating(false);
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isDragging) return;
        const delta = e.clientX - startX;
        const sensitivity = 5; // pixels per frame
        const frameDelta = Math.round(delta / sensitivity);

        if (Math.abs(frameDelta) >= 1) {
            setCurrentFrame(prev => {
                let next = prev - frameDelta;
                while (next < 0) next += frameCount;
                return next % frameCount;
            });
            setStartX(e.clientX);
        }
    };

    const handlePointerUp = () => {
        setIsDragging(false);
    };

    // Zoom with mouse wheel
    const handleWheel = (e: React.WheelEvent) => {
        if (!enableZoom) return;
        e.preventDefault();
        setZoom(prev => {
            const next = prev + (e.deltaY > 0 ? -0.1 : 0.1);
            return Math.max(0.5, Math.min(3, next));
        });
    };

    // Fullscreen toggle
    const toggleFullscreen = () => {
        if (!containerRef.current) return;
        if (!isFullscreen) {
            containerRef.current.requestFullscreen?.();
        } else {
            document.exitFullscreen?.();
        }
        setIsFullscreen(!isFullscreen);
    };

    // If no 360 images, show fallback
    if (images.length === 0) {
        return (
            <div className="relative w-full aspect-video bg-gradient-to-br from-white/[0.03] to-transparent rounded-2xl overflow-hidden flex items-center justify-center">
                <img
                    src={fallbackImage}
                    alt={bikeName}
                    className="max-w-full max-h-full object-contain"
                />
                <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full text-xs text-white/60">
                    360° view coming soon
                </div>
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            className={`relative w-full rounded-2xl overflow-hidden bg-gradient-to-br from-white/[0.02] to-transparent select-none ${isFullscreen ? 'fixed inset-0 z-50 rounded-none bg-bajaj-darker' : 'aspect-video'
                }`}
        >
            {/* Loading overlay */}
            <AnimatePresence>
                {isLoading && (
                    <motion.div
                        initial={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 flex flex-col items-center justify-center bg-bajaj-dark/95 z-20"
                    >
                        <div className="relative w-20 h-20 mb-4">
                            <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                                <circle cx="40" cy="40" r="35" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
                                <circle
                                    cx="40" cy="40" r="35" fill="none" stroke="#FF6B00" strokeWidth="4"
                                    strokeDasharray={`${(loadProgress / 100) * 220} 220`}
                                    strokeLinecap="round"
                                    className="transition-all duration-300"
                                />
                            </svg>
                            <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white">
                                {loadProgress}%
                            </span>
                        </div>
                        <p className="text-white/50 text-sm">Loading 360° view...</p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Canvas */}
            <canvas
                ref={canvasRef}
                className={`w-full h-full cursor-grab ${isDragging ? 'cursor-grabbing' : ''}`}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                onWheel={handleWheel}
            />

            {/* Controls overlay */}
            <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
                <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-medium text-white/70 flex items-center gap-2">
                    <Hand className="w-3.5 h-3.5" />
                    Drag to rotate
                </div>
                <div className="bg-bajaj-orange/80 px-3 py-1.5 rounded-full text-xs font-bold text-white">
                    360°
                </div>
            </div>

            {/* Frame indicator */}
            <div className="absolute bottom-4 left-4 z-10">
                <div className="bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[10px] text-white/40">
                    Frame {currentFrame + 1}/{frameCount}
                </div>
            </div>

            {/* Control buttons */}
            <div className="absolute bottom-4 right-4 z-10 flex items-center gap-2">
                {enableZoom && (
                    <>
                        <button
                            onClick={() => setZoom(prev => Math.min(3, prev + 0.25))}
                            className="w-8 h-8 bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-black/80 transition-all"
                            title="Zoom In"
                        >
                            <ZoomIn className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setZoom(prev => Math.max(0.5, prev - 0.25))}
                            className="w-8 h-8 bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-black/80 transition-all"
                            title="Zoom Out"
                        >
                            <ZoomOut className="w-4 h-4" />
                        </button>
                    </>
                )}
                <button
                    onClick={() => { setIsAutoRotating(!isAutoRotating); setZoom(1); }}
                    className="w-8 h-8 bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-black/80 transition-all"
                    title="Reset / Auto Rotate"
                >
                    <RotateCcw className={`w-4 h-4 ${isAutoRotating ? 'animate-spin' : ''}`} style={{ animationDuration: '3s' }} />
                </button>
                {enableFullscreen && (
                    <button
                        onClick={toggleFullscreen}
                        className="w-8 h-8 bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-black/80 transition-all"
                        title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                    >
                        {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                    </button>
                )}
            </div>

            {/* Rotation progress bar */}
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/5">
                <div
                    className="h-full bg-gradient-to-r from-bajaj-orange to-bajaj-gold transition-all duration-100"
                    style={{ width: `${((currentFrame + 1) / frameCount) * 100}%` }}
                />
            </div>
        </div>
    );
}
