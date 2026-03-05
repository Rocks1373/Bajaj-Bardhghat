'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft, ChevronRight, Bike, Zap, Shield, Fuel, Gauge, Cpu,
    MessageCircle, Download, Star, MapPin, Palette, Wrench,
    Calendar, Tag, Eye, ArrowRightLeft, Wallet, Box, Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatPrice, formatEMI } from '@/lib/utils';
import EMICalculator from '@/components/EMICalculator';
import BikeViewer360 from '@/components/BikeViewer360';
import ThreeDViewer from '@/components/ThreeDViewer';
import entryConfig from '@/data/entry-config.json';
import { api } from '@/lib/api';

interface BikeData {
    name: string;
    slug: string;
    official_url: string;
    images: string[];
    specs: Record<string, string>;
    engine: Record<string, string>;
    features: string[];
    colors: string[];
    price: number;
    description: string;
    fetched_at: string;
}

export default function ModelPage() {
    const params = useParams();
    const slug = params?.slug as string;
    const [bikeData, setBikeData] = useState<BikeData | null>(null);
    const [productData, setProductData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'overview' | 'specs' | 'engine' | '360view' | '3dview'>('overview');
    const [selectedColor, setSelectedColor] = useState(0);

    // Get model info from entry config
    const configModel = entryConfig.models.find(m => m.slug === slug);

    useEffect(() => {
        if (!slug) return;

        async function fetchData() {
            setLoading(true);
            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

                // Fetch both scraper data and DB product data in parallel
                const [scraperResult] = await Promise.allSettled([
                    fetch(`${apiUrl}/api/scraper/model/${slug}`).then(r => r.json()),
                ]);

                if (scraperResult.status === 'fulfilled' && scraperResult.value?.success) {
                    setBikeData(scraperResult.value.data);
                }

                // Fetch our own product data from InsForge DB (has our prices, 3D model, etc.)
                api.getProductBySlug(slug)
                    .then(data => setProductData(data))
                    .catch(() => null);

            } catch {
                setError('Unable to load model data. Please try again.');
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [slug]);

    if (loading) {
        return (
            <div className="min-h-screen bg-bajaj-darker flex items-center justify-center">
                <div className="text-center">
                    <div className="relative w-20 h-20 mx-auto mb-4">
                        <div className="w-20 h-20 rounded-full border-4 border-white/10 border-t-bajaj-orange animate-spin" />
                    </div>
                    <p className="text-white/50">Loading {configModel?.model_name || slug}...</p>
                </div>
            </div>
        );
    }

    const bike = bikeData;

    // Use DB price as primary (admin-set), fallback to scraper or config
    const price = productData?.discounted_price || productData?.price || bike?.price || (configModel as any)?.price || 0;
    const originalPrice = productData?.price && productData?.discounted_price ? productData.price : null;
    const bikeName = bike?.name || productData?.name || configModel?.model_name || slug.replace(/-/g, ' ');

    // Use DB images_360 if available, else fall back to scraper images
    const viewerImages: string[] = (productData?.images_360?.length > 0)
        ? productData.images_360
        : (bike?.images || []);

    const has3dModel = !!(productData?.model_3d_url);
    const isUpcoming = productData?.availability === 'PRE_ORDER';
    const launchDate = productData?.launch_date;

    const whatsappBaseUrl = `https://wa.me/${entryConfig.showroom.whatsapp}`;

    return (
        <main className="min-h-screen bg-bajaj-darker pattern-bg noise-overlay relative">
            {/* Sticky header */}
            <motion.div
                initial={{ y: -100 }} animate={{ y: 0 }}
                className="fixed top-0 left-0 right-0 z-50 bg-bajaj-dark/90 backdrop-blur-xl border-b border-white/5"
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="flex items-center gap-2 text-white/60 hover:text-white transition-colors">
                            <ChevronLeft className="w-5 h-5" /> Back
                        </Link>
                        <div className="h-6 w-px bg-white/10" />
                        <div>
                            <span className="text-white font-display font-bold">{bikeName}</span>
                            {configModel?.category && (
                                <Badge className="ml-2 bg-bajaj-orange/20 text-bajaj-orange border-none text-[10px]">{configModel.category}</Badge>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-2xl font-display font-bold gradient-text">{formatPrice(price)}</span>
                        <a href={`${whatsappBaseUrl}?text=Hi! I'm interested in the ${encodeURIComponent(bikeName)}. Please share details.`}
                            target="_blank" rel="noopener noreferrer">
                            <Button variant="glow" size="sm">
                                <MessageCircle className="w-4 h-4 mr-1.5" /> Enquire
                            </Button>
                        </a>
                    </div>
                </div>
            </motion.div>

            <div className="pt-20 pb-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                    {/* Hero section */}
                    <section className="py-12">
                        <div className="grid lg:grid-cols-2 gap-12 items-start">
                            {/* Left: Bike visual */}
                            <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
                                <div className="glass-card rounded-2xl overflow-hidden">
                                    <div className="h-[400px] bg-gradient-to-br from-white/[0.03] to-transparent flex items-center justify-center relative overflow-hidden">
                                        {(configModel as any)?.image ? (
                                            <img
                                                src={(configModel as any).image}
                                                alt={bikeName}
                                                className="w-full h-full object-contain p-6"
                                            />
                                        ) : (
                                            <Bike className="w-48 h-48 text-white/[0.06]" />
                                        )}
                                        {isUpcoming && (
                                            <Badge className="absolute top-4 left-4 bg-amber-500 text-white border-none animate-pulse">
                                                <Clock className="w-3 h-3 mr-1" />
                                                {launchDate ? `Launching ${new Date(launchDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}` : 'Coming Soon'}
                                            </Badge>
                                        )}
                                        {configModel?.tag && !isUpcoming && (
                                            <Badge className="absolute top-4 right-4 bg-bajaj-orange text-white border-none">{configModel.tag}</Badge>
                                        )}
                                        {(configModel as any)?.cc && (
                                            <span className="absolute bottom-4 left-4 text-white/20 text-sm font-bold">{(configModel as any).cc}cc Engine</span>
                                        )}
                                        {has3dModel && (
                                            <button
                                                onClick={() => setActiveTab('3dview')}
                                                className="absolute bottom-4 right-4 flex items-center gap-1.5 bg-bajaj-orange/90 hover:bg-bajaj-orange text-white text-xs font-medium px-3 py-1.5 rounded-full transition-colors"
                                            >
                                                <Box className="w-3.5 h-3.5" /> View in 3D
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Color selector */}
                                {bike?.colors && bike.colors.length > 0 && (
                                    <div className="mt-6">
                                        <h4 className="text-sm text-white/40 flex items-center gap-2 mb-3">
                                            <Palette className="w-4 h-4" /> Available Colors
                                        </h4>
                                        <div className="flex flex-wrap gap-3">
                                            {bike.colors.map((color, i) => (
                                                <button
                                                    key={color}
                                                    onClick={() => setSelectedColor(i)}
                                                    className={`px-4 py-2 rounded-full text-sm transition-all ${selectedColor === i
                                                        ? 'bg-bajaj-orange text-white'
                                                        : 'bg-white/5 text-white/50 hover:bg-white/10'
                                                        }`}
                                                >
                                                    {color}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </motion.div>

                            {/* Right: Details */}
                            <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.2 }}>
                                <Badge variant="outline" className="border-bajaj-orange/30 text-bajaj-orange mb-4">
                                    <Zap className="w-3 h-3 mr-1" /> {configModel?.model_family || 'Bajaj'}
                                </Badge>

                                <h1 className="text-4xl md:text-5xl font-display font-black text-white mb-4">{bikeName}</h1>

                                {bike?.description && (
                                    <p className="text-white/50 leading-relaxed mb-6">{bike.description}</p>
                                )}

                                {/* Price & EMI — uses admin-set DB price */}
                                <div className="glass-card rounded-xl p-6 mb-6">
                                    <div className="flex items-baseline gap-4 mb-3">
                                        <span className="text-3xl font-display font-black gradient-text">{formatPrice(price)}</span>
                                        {originalPrice && originalPrice > price && (
                                            <span className="text-white/30 text-sm line-through">{formatPrice(originalPrice)}</span>
                                        )}
                                        <span className="text-white/30 text-sm">Ex-showroom</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-white/40 text-sm">
                                        <Wallet className="w-4 h-4" />
                                        EMI from <span className="text-bajaj-orange font-bold ml-1">{formatPrice(formatEMI(price))}/month</span>
                                    </div>
                                    {isUpcoming && (
                                        <div className="mt-3 pt-3 border-t border-white/5 flex items-center gap-2 text-amber-400/70 text-xs">
                                            <Clock className="w-3.5 h-3.5" /> Pre-order price — subject to change on launch
                                        </div>
                                    )}
                                </div>

                                {/* Feature highlights */}
                                {bike?.features && bike.features.length > 0 && (
                                    <div className="mb-6">
                                        <h3 className="text-white font-bold mb-3">Key Features</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {bike.features.map((f) => (
                                                <Badge key={f} variant="outline" className="border-white/10 text-white/60 bg-white/[0.03]">
                                                    {f}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Action buttons — WhatsApp only */}
                                <div className="flex flex-wrap gap-3">
                                    <a href={`${whatsappBaseUrl}?text=Hi! I want to book a test ride for the ${encodeURIComponent(bikeName)}.`}
                                        target="_blank" rel="noopener noreferrer">
                                        <Button variant="glow" size="lg" className="group">
                                            <MessageCircle className="w-4 h-4 mr-2" /> Book Test Ride
                                            <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                        </Button>
                                    </a>
                                    <a href={`${whatsappBaseUrl}?text=Hi! I want to enquire about the ${encodeURIComponent(bikeName)}.`}
                                        target="_blank" rel="noopener noreferrer">
                                        <Button variant="outline" size="lg" className="border-white/10 text-white hover:bg-white/5">
                                            <MessageCircle className="w-4 h-4 mr-2" /> WhatsApp
                                        </Button>
                                    </a>
                                    <a href="#emi-calc">
                                        <Button variant="outline" size="lg" className="border-white/10 text-white hover:bg-white/5">
                                            <Wallet className="w-4 h-4 mr-2" /> Calculate EMI
                                        </Button>
                                    </a>
                                </div>
                            </motion.div>
                        </div>
                    </section>

                    {/* Tabs */}
                    <section className="py-12">
                        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
                            {[
                                { key: 'overview', label: 'Overview', icon: Eye },
                                { key: 'specs', label: 'Specifications', icon: Gauge },
                                { key: 'engine', label: 'Engine Details', icon: Cpu },
                                { key: '360view', label: '360° View', icon: Bike },
                                ...(has3dModel ? [{ key: '3dview', label: '3D View', icon: Box }] : []),
                            ].map(tab => (
                                <button
                                    key={tab.key}
                                    onClick={() => setActiveTab(tab.key as any)}
                                    className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${activeTab === tab.key
                                        ? 'bg-bajaj-orange text-white'
                                        : tab.key === '3dview'
                                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                                            : 'bg-white/5 text-white/50 hover:bg-white/10'
                                        }`}
                                >
                                    <tab.icon className="w-4 h-4" /> {tab.label}
                                    {tab.key === '3dview' && (
                                        <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded-full ml-1">NEW</span>
                                    )}
                                </button>
                            ))}
                        </div>

                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.3 }}
                            >
                                {activeTab === 'overview' && (
                                    <div className="glass-card rounded-2xl p-8">
                                        <h2 className="text-2xl font-display font-bold text-white mb-4">About {bikeName}</h2>
                                        <p className="text-white/50 leading-relaxed mb-6">
                                            {bike?.description || `The ${bikeName} is part of Bajaj's ${configModel?.model_family || ''} lineup, delivering exceptional performance and value.`}
                                        </p>
                                        {bike?.features && bike.features.length > 0 && (
                                            <div className="grid md:grid-cols-2 gap-4">
                                                {bike.features.map((f, i) => (
                                                    <div key={f} className="flex items-center gap-3 py-3 px-4 rounded-lg bg-white/[0.02]">
                                                        <div className="w-8 h-8 rounded-lg bg-bajaj-orange/10 flex items-center justify-center flex-shrink-0">
                                                            <Zap className="w-4 h-4 text-bajaj-orange" />
                                                        </div>
                                                        <span className="text-white/70 text-sm">{f}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'specs' && (
                                    <div className="glass-card rounded-2xl p-8">
                                        <h2 className="text-2xl font-display font-bold text-white mb-6">Full Specifications</h2>
                                        {bike?.specs && Object.keys(bike.specs).length > 0 ? (
                                            <div className="space-y-0">
                                                {Object.entries(bike.specs).map(([key, value], i) => (
                                                    <div key={key} className={`grid grid-cols-2 gap-4 py-4 px-4 rounded-lg ${i % 2 === 0 ? 'bg-white/[0.02]' : ''}`}>
                                                        <span className="text-white/40 text-sm capitalize">{key}</span>
                                                        <span className="text-white text-sm font-medium">{value}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-white/40">Specifications loading... Visit the official page for details.</p>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'engine' && (
                                    <div className="glass-card rounded-2xl p-8">
                                        <h2 className="text-2xl font-display font-bold text-white mb-6">Engine Details</h2>
                                        {bike?.engine && Object.keys(bike.engine).length > 0 ? (
                                            <div className="grid md:grid-cols-2 gap-6">
                                                {Object.entries(bike.engine).map(([key, value]) => (
                                                    <div key={key} className="glass-card rounded-xl p-5">
                                                        <div className="text-xs text-white/30 uppercase tracking-wider mb-1 capitalize">{key}</div>
                                                        <div className="text-lg text-white font-bold">{value}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-white/40">Engine details loading...</p>
                                        )}
                                    </div>
                                )}

                                {activeTab === '360view' && (
                                    <div className="glass-card rounded-2xl p-8">
                                        <h2 className="text-2xl font-display font-bold text-white mb-6">360° Interactive View</h2>
                                        <BikeViewer360
                                            images={viewerImages}
                                            bikeName={bikeName}
                                            autoRotateSpeed={80}
                                            enableZoom={true}
                                            enableFullscreen={true}
                                        />
                                        <p className="text-white/30 text-xs mt-4 text-center">
                                            Drag to rotate • Scroll to zoom • Click fullscreen for immersive view
                                        </p>
                                    </div>
                                )}

                                {activeTab === '3dview' && has3dModel && (
                                    <div className="glass-card rounded-2xl p-8">
                                        <div className="flex items-center justify-between mb-6">
                                            <h2 className="text-2xl font-display font-bold text-white">Interactive 3D View</h2>
                                            <Badge className="bg-emerald-500/20 text-emerald-400 border-none">
                                                <Box className="w-3 h-3 mr-1" /> Full 3D Model
                                            </Badge>
                                        </div>
                                        <ThreeDViewer
                                            url={productData.model_3d_url}
                                            poster={(configModel as any)?.image || bike?.images?.[0]}
                                        />
                                        <p className="text-white/30 text-xs mt-4 text-center">
                                            Drag to rotate • Scroll to zoom • Full interactive 3D model
                                        </p>
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </section>

                    {/* EMI Calculator */}
                    <section id="emi-calc" className="py-12">
                        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                            <h2 className="text-3xl font-display font-bold text-white mb-8 text-center">
                                Finance Your <span className="gradient-text">{bikeName}</span>
                            </h2>
                            <EMICalculator defaultPrice={price} bikeName={bikeName} />
                        </motion.div>
                    </section>

                    {/* Enquiry Section — WhatsApp only */}
                    <section id="enquiry" className="py-12">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                            className="glass-card rounded-3xl p-8 md:p-12 animated-border overflow-hidden"
                        >
                            <div className="text-center max-w-2xl mx-auto">
                                <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">
                                    Interested in the <span className="gradient-text">{bikeName}</span>?
                                </h2>
                                <p className="text-white/50 mb-8">
                                    Book a test ride, get exchange valuation, or chat with our experts on WhatsApp. We&apos;re here to help.
                                </p>
                                <div className="flex flex-wrap gap-4 justify-center">
                                    <a href={`${whatsappBaseUrl}?text=Hi! I want to book a test ride for the ${encodeURIComponent(bikeName)}.`}
                                        target="_blank" rel="noopener noreferrer">
                                        <Button variant="glow" size="xl">
                                            <MessageCircle className="w-5 h-5 mr-2" /> Book Test Ride on WhatsApp
                                        </Button>
                                    </a>
                                    <a href={`${whatsappBaseUrl}?text=Hi! I want to enquire about the ${encodeURIComponent(bikeName)}.`}
                                        target="_blank" rel="noopener noreferrer">
                                        <Button variant="outline" size="xl" className="border-white/10 text-white hover:bg-white/5">
                                            <MessageCircle className="w-5 h-5 mr-2" /> WhatsApp Enquiry
                                        </Button>
                                    </a>
                                </div>
                                <div className="mt-6 flex flex-wrap gap-4 justify-center">
                                    <a href="#emi-calc">
                                        <Button variant="ghost" className="text-white/50 hover:text-white">
                                            <Wallet className="w-4 h-4 mr-2" /> EMI Calculator
                                        </Button>
                                    </a>
                                    <Link href="/inventory">
                                        <Button variant="ghost" className="text-white/50 hover:text-white">
                                            <ArrowRightLeft className="w-4 h-4 mr-2" /> Exchange Offer
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </motion.div>
                    </section>

                    {/* Back to home */}
                    <div className="text-center py-8">
                        <Link href="/">
                            <Button variant="outline" size="lg" className="border-white/10 text-white hover:bg-white/5">
                                <ChevronLeft className="w-4 h-4 mr-2" /> Back to Home
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </main>
    );
}
