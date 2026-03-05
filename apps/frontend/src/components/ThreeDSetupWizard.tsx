'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Upload, ImageIcon, Video, Box, ChevronRight, ChevronLeft,
    CheckCircle2, Loader2, X, ArrowUp, ArrowDown, Eye, Info,
    AlertCircle, Sparkles, ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { adminApi } from '@/lib/api';
import ThreeDViewer from './ThreeDViewer';
import Link from 'next/link';

interface ThreeDSetupWizardProps {
    token: string;
    products: any[];
}

const STEPS = [
    { id: 1, label: 'Select Bike', icon: Box },
    { id: 2, label: '360° Images', icon: ImageIcon },
    { id: 3, label: 'Video', icon: Video },
    { id: 4, label: '3D Model', icon: Box },
];

export default function ThreeDSetupWizard({ token, products }: ThreeDSetupWizardProps) {
    const [step, setStep] = useState(1);
    const [selectedProduct, setSelectedProduct] = useState<any>(null);
    const [images360Files, setImages360Files] = useState<File[]>([]);
    const [images360Previews, setImages360Previews] = useState<string[]>([]);
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [videoUrl, setVideoUrl] = useState('');
    const [videoPreview, setVideoPreview] = useState('');
    const [model3dFile, setModel3dFile] = useState<File | null>(null);
    const [model3dPreviewUrl, setModel3dPreviewUrl] = useState('');
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState('');
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState('');

    const handleImagesSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return;
        const files = Array.from(e.target.files);
        setImages360Files(prev => [...prev, ...files]);
        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = (ev) => {
                setImages360Previews(prev => [...prev, ev.target?.result as string]);
            };
            reader.readAsDataURL(file);
        });
    };

    const removeImage = (idx: number) => {
        setImages360Files(prev => prev.filter((_, i) => i !== idx));
        setImages360Previews(prev => prev.filter((_, i) => i !== idx));
    };

    const moveImage = (idx: number, dir: 'up' | 'down') => {
        const newFiles = [...images360Files];
        const newPreviews = [...images360Previews];
        const swapIdx = dir === 'up' ? idx - 1 : idx + 1;
        if (swapIdx < 0 || swapIdx >= newFiles.length) return;
        [newFiles[idx], newFiles[swapIdx]] = [newFiles[swapIdx], newFiles[idx]];
        [newPreviews[idx], newPreviews[swapIdx]] = [newPreviews[swapIdx], newPreviews[idx]];
        setImages360Files(newFiles);
        setImages360Previews(newPreviews);
    };

    const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0]) return;
        const file = e.target.files[0];
        setVideoFile(file);
        const url = URL.createObjectURL(file);
        setVideoPreview(url);
        setVideoUrl('');
    };

    const handleVideoUrlChange = (val: string) => {
        setVideoUrl(val);
        setVideoPreview(val);
        setVideoFile(null);
    };

    const handleModel3dSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0]) return;
        const file = e.target.files[0];
        setModel3dFile(file);
        // Create a temporary URL for preview
        const url = URL.createObjectURL(file);
        setModel3dPreviewUrl(url);
    };

    const handleSave = async () => {
        if (!selectedProduct) return;
        setUploading(true);
        setError('');

        try {
            let finalImages360Urls: string[] = [];
            let finalVideoUrl = videoUrl;
            let finalModel3dUrl = selectedProduct.model_3d_url || '';

            // Upload 360° images
            if (images360Files.length > 0) {
                setUploadProgress('Uploading 360° images...');
                const res = await adminApi.uploadMultipleFiles(images360Files, token);
                finalImages360Urls = res.urls;
            }

            // Upload video file
            if (videoFile) {
                setUploadProgress('Uploading video...');
                const res = await adminApi.uploadFile(videoFile, token);
                finalVideoUrl = res.url;
            }

            // Upload 3D model file
            if (model3dFile) {
                setUploadProgress('Uploading 3D model...');
                const res = await adminApi.uploadFile(model3dFile, token);
                finalModel3dUrl = res.url;
            }

            // Save to product
            setUploadProgress('Saving to product...');
            await adminApi.updateProduct(selectedProduct.id, {
                images360: finalImages360Urls.length > 0 ? finalImages360Urls : undefined,
                videoUrl: finalVideoUrl || undefined,
                model3dUrl: finalModel3dUrl || undefined,
            }, token);

            setSaved(true);
            setUploadProgress('');
        } catch (err: any) {
            setError(err.message || 'Failed to save. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    const resetWizard = () => {
        setStep(1);
        setSelectedProduct(null);
        setImages360Files([]);
        setImages360Previews([]);
        setVideoFile(null);
        setVideoUrl('');
        setVideoPreview('');
        setModel3dFile(null);
        setModel3dPreviewUrl('');
        setSaved(false);
        setError('');
    };

    if (saved) {
        return (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="glass-card rounded-2xl p-10 text-center max-w-lg mx-auto">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">3D Setup Complete!</h3>
                <p className="text-white/50 mb-6">
                    {selectedProduct?.name} now has a 3D viewing experience. Customers can interact with it on the model page.
                </p>
                <div className="flex gap-3 justify-center">
                    <Link href={`/models/${selectedProduct?.slug}`} target="_blank">
                        <Button variant="glow" className="gap-2">
                            <ExternalLink className="w-4 h-4" /> View on Site
                        </Button>
                    </Link>
                    <Button variant="outline" onClick={resetWizard} className="border-white/10 text-white/60">
                        Setup Another Bike
                    </Button>
                </div>
            </motion.div>
        );
    }

    return (
        <div className="space-y-6 max-w-3xl">
            {/* Step indicator */}
            <div className="flex items-center gap-2">
                {STEPS.map((s, i) => (
                    <div key={s.id} className="flex items-center gap-2">
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${step === s.id
                            ? 'bg-bajaj-orange text-white'
                            : step > s.id
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-white/5 text-white/30'
                            }`}>
                            {step > s.id ? <CheckCircle2 className="w-3.5 h-3.5" /> : <s.icon className="w-3.5 h-3.5" />}
                            <span className="hidden sm:inline">{s.label}</span>
                        </div>
                        {i < STEPS.length - 1 && <div className={`h-px w-6 ${step > s.id ? 'bg-emerald-500/40' : 'bg-white/10'}`} />}
                    </div>
                ))}
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={step}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                >
                    {/* ── Step 1: Select Bike ── */}
                    {step === 1 && (
                        <div className="glass-card rounded-2xl p-6 space-y-4">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 rounded-xl bg-bajaj-orange/10 flex items-center justify-center">
                                    <Box className="w-5 h-5 text-bajaj-orange" />
                                </div>
                                <div>
                                    <h3 className="text-white font-bold">Select a Bike</h3>
                                    <p className="text-white/40 text-sm">Choose which bike to configure 3D viewing for</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                {products.filter(p => !p.is_used).map(p => (
                                    <button
                                        key={p.id}
                                        onClick={() => setSelectedProduct(p)}
                                        className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all text-left ${selectedProduct?.id === p.id
                                            ? 'border-bajaj-orange bg-bajaj-orange/5'
                                            : 'border-white/5 bg-white/[0.02] hover:border-white/10'
                                            }`}
                                    >
                                        <div>
                                            <span className="text-white font-medium">{p.name}</span>
                                            <span className="text-white/40 text-sm ml-3">{p.cc > 0 ? `${p.cc}cc` : 'Electric'}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {p.model_3d_url && (
                                                <Badge className="bg-emerald-500/20 text-emerald-400 border-none text-xs">Has 3D</Badge>
                                            )}
                                            {(p.images_360?.length > 0) && (
                                                <Badge className="bg-blue-500/20 text-blue-400 border-none text-xs">Has 360°</Badge>
                                            )}
                                            {!p.model_3d_url && !p.images_360?.length && (
                                                <Badge className="bg-white/5 text-white/30 border-none text-xs">No 3D yet</Badge>
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </div>

                            <Button
                                variant="glow"
                                onClick={() => setStep(2)}
                                disabled={!selectedProduct}
                                className="w-full gap-2"
                            >
                                Continue <ChevronRight className="w-4 h-4" />
                            </Button>
                        </div>
                    )}

                    {/* ── Step 2: 360° Images ── */}
                    {step === 2 && (
                        <div className="glass-card rounded-2xl p-6 space-y-5">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                    <ImageIcon className="w-5 h-5 text-blue-400" />
                                </div>
                                <div>
                                    <h3 className="text-white font-bold">Upload 360° Images</h3>
                                    <p className="text-white/40 text-sm">Sequential photos for interactive rotation</p>
                                </div>
                            </div>

                            {/* Instructions panel */}
                            <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 space-y-2">
                                <div className="flex items-center gap-2 text-blue-400 text-sm font-medium">
                                    <Info className="w-4 h-4" /> Photography Guide
                                </div>
                                <ul className="text-white/50 text-sm space-y-1.5">
                                    <li className="flex items-start gap-2"><span className="text-bajaj-orange mt-0.5">•</span> Take <strong className="text-white">24 or 36 photos</strong> equally spaced around the bike</li>
                                    <li className="flex items-start gap-2"><span className="text-bajaj-orange mt-0.5">•</span> Start from the <strong className="text-white">front</strong>, rotate <strong className="text-white">clockwise</strong>, shoot every 10–15°</li>
                                    <li className="flex items-start gap-2"><span className="text-bajaj-orange mt-0.5">•</span> Keep the camera at the <strong className="text-white">same height and distance</strong> for all shots</li>
                                    <li className="flex items-start gap-2"><span className="text-bajaj-orange mt-0.5">•</span> Use <strong className="text-white">consistent lighting</strong> — preferably indoors or overcast</li>
                                    <li className="flex items-start gap-2"><span className="text-bajaj-orange mt-0.5">•</span> Upload photos <strong className="text-white">in sequence order</strong> (001, 002, ...)</li>
                                </ul>
                            </div>

                            {/* Upload button */}
                            <div>
                                <Label htmlFor="images360" className="text-white/60 text-sm">
                                    Select Images ({images360Files.length} uploaded
                                    {images360Files.length > 0 && (
                                        <span className={images360Files.length >= 24 ? ' text-emerald-400' : ' text-amber-400'}>
                                            {images360Files.length >= 24 ? ' ✓ Good' : ` — need ${24 - images360Files.length} more for minimum`}
                                        </span>
                                    )}
                                    )
                                </Label>
                                <label htmlFor="images360" className="mt-2 flex items-center justify-center gap-3 border-2 border-dashed border-white/10 rounded-xl p-6 cursor-pointer hover:border-bajaj-orange/40 transition-colors">
                                    <Upload className="w-5 h-5 text-white/30" />
                                    <span className="text-white/40 text-sm">Click to select multiple images</span>
                                </label>
                                <input
                                    id="images360"
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleImagesSelect}
                                />
                            </div>

                            {/* Image grid */}
                            {images360Previews.length > 0 && (
                                <div className="grid grid-cols-6 gap-2 max-h-64 overflow-y-auto pr-1">
                                    {images360Previews.map((src, i) => (
                                        <div key={i} className="relative group">
                                            <img src={src} alt={`Frame ${i + 1}`} className="w-full aspect-square object-cover rounded-lg" />
                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex flex-col items-center justify-center gap-1">
                                                <button onClick={() => moveImage(i, 'up')} className="text-white/70 hover:text-white" title="Move up">
                                                    <ArrowUp className="w-3 h-3" />
                                                </button>
                                                <span className="text-white text-[10px] font-bold">{i + 1}</span>
                                                <button onClick={() => moveImage(i, 'down')} className="text-white/70 hover:text-white" title="Move down">
                                                    <ArrowDown className="w-3 h-3" />
                                                </button>
                                            </div>
                                            <button
                                                onClick={() => removeImage(i)}
                                                className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X className="w-2.5 h-2.5 text-white" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="flex gap-2">
                                <Button variant="outline" onClick={() => setStep(1)} className="border-white/10 text-white/60 gap-2">
                                    <ChevronLeft className="w-4 h-4" /> Back
                                </Button>
                                <Button variant="glow" onClick={() => setStep(3)} className="flex-1 gap-2">
                                    Continue <ChevronRight className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* ── Step 3: Video ── */}
                    {step === 3 && (
                        <div className="glass-card rounded-2xl p-6 space-y-5">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                                    <Video className="w-5 h-5 text-purple-400" />
                                </div>
                                <div>
                                    <h3 className="text-white font-bold">Upload Promotional Video</h3>
                                    <p className="text-white/40 text-sm">Optional — shown alongside the 3D model</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <Label className="text-white/60 text-sm">Upload Video File (MP4/WebM)</Label>
                                    <label className="mt-2 flex items-center justify-center gap-3 border-2 border-dashed border-white/10 rounded-xl p-6 cursor-pointer hover:border-purple-400/30 transition-colors">
                                        <Video className="w-5 h-5 text-white/30" />
                                        <span className="text-white/40 text-sm">
                                            {videoFile ? videoFile.name : 'Click to select a video file'}
                                        </span>
                                        <input type="file" accept="video/mp4,video/webm" className="hidden" onChange={handleVideoSelect} />
                                    </label>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="h-px flex-1 bg-white/10" />
                                    <span className="text-white/30 text-xs">OR</span>
                                    <div className="h-px flex-1 bg-white/10" />
                                </div>

                                <div>
                                    <Label className="text-white/60 text-sm">Paste Video URL (YouTube / direct MP4)</Label>
                                    <Input
                                        value={videoUrl}
                                        onChange={e => handleVideoUrlChange(e.target.value)}
                                        placeholder="https://..."
                                        className="mt-1.5 bg-white/5 border-white/10 text-white"
                                    />
                                </div>
                            </div>

                            {videoPreview && (
                                <video src={videoPreview} controls className="w-full rounded-xl max-h-48 object-contain bg-black" />
                            )}

                            <div className="flex gap-2">
                                <Button variant="outline" onClick={() => setStep(2)} className="border-white/10 text-white/60 gap-2">
                                    <ChevronLeft className="w-4 h-4" /> Back
                                </Button>
                                <Button variant="outline" onClick={() => setStep(4)} className="flex-1 border-white/10 text-white/60">
                                    Skip this step
                                </Button>
                                <Button variant="glow" onClick={() => setStep(4)} className="flex-1 gap-2">
                                    Continue <ChevronRight className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* ── Step 4: 3D Model ── */}
                    {step === 4 && (
                        <div className="glass-card rounded-2xl p-6 space-y-5">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                                    <Box className="w-5 h-5 text-emerald-400" />
                                </div>
                                <div>
                                    <h3 className="text-white font-bold">Upload 3D Model</h3>
                                    <p className="text-white/40 text-sm">Optional — provides the best interactive experience</p>
                                </div>
                            </div>

                            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 space-y-2">
                                <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium">
                                    <Sparkles className="w-4 h-4" /> Pro Tip
                                </div>
                                <p className="text-white/50 text-sm">
                                    3D model files (<strong className="text-white">.glb or .gltf</strong>) provide the most immersive experience.
                                    You can request manufacturer assets from Bajaj, or create them using Blender / SketchUp.
                                </p>
                            </div>

                            <div>
                                <Label className="text-white/60 text-sm">Upload 3D Model File (.glb / .gltf)</Label>
                                <label className="mt-2 flex items-center justify-center gap-3 border-2 border-dashed border-white/10 rounded-xl p-6 cursor-pointer hover:border-emerald-400/30 transition-colors">
                                    <Box className="w-5 h-5 text-white/30" />
                                    <span className="text-white/40 text-sm">
                                        {model3dFile ? model3dFile.name : 'Click to select .glb or .gltf file'}
                                    </span>
                                    <input type="file" accept=".glb,.gltf" className="hidden" onChange={handleModel3dSelect} />
                                </label>
                            </div>

                            {/* Live 3D preview */}
                            {model3dPreviewUrl && (
                                <div>
                                    <Label className="text-white/60 text-sm mb-2 block">Live Preview</Label>
                                    <ThreeDViewer url={model3dPreviewUrl} />
                                </div>
                            )}

                            {/* Error */}
                            {error && (
                                <div className="flex items-center gap-2 text-red-400 bg-red-500/10 rounded-xl p-3 text-sm">
                                    <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
                                </div>
                            )}

                            <div className="flex gap-2">
                                <Button variant="outline" onClick={() => setStep(3)} className="border-white/10 text-white/60 gap-2">
                                    <ChevronLeft className="w-4 h-4" /> Back
                                </Button>
                                <Button
                                    variant="glow"
                                    onClick={handleSave}
                                    disabled={uploading || (images360Files.length === 0 && !videoFile && !videoUrl && !model3dFile)}
                                    className="flex-1 gap-2"
                                >
                                    {uploading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            {uploadProgress || 'Saving...'}
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 className="w-4 h-4" /> Save 3D Setup
                                        </>
                                    )}
                                </Button>
                            </div>

                            {uploading && images360Files.length === 0 && !videoFile && !videoUrl && !model3dFile && (
                                <p className="text-amber-400/70 text-xs text-center">
                                    Please upload at least one asset (images, video, or 3D model) before saving.
                                </p>
                            )}

                            {/* Quick save note */}
                            {!uploading && (
                                <p className="text-white/30 text-xs text-center">
                                    You can skip the 3D model and just save 360° images or video.
                                    <button className="text-white/50 hover:text-white ml-1 underline" onClick={handleSave}>
                                        Save what I have
                                    </button>
                                </p>
                            )}
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
