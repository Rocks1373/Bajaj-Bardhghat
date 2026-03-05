'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronLeft, Bike, Zap, Star, Phone, MessageCircle, Check, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';
import { formatPrice, formatEMI } from '@/lib/utils';
import ThreeDViewer from '@/components/ThreeDViewer';

export default function ProductDetailPage() {
    const params = useParams();
    const [product, setProduct] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [formSubmitted, setFormSubmitted] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [viewMode, setViewMode] = useState<'3d' | 'image'>('image');

    useEffect(() => {
        async function load() {
            try {
                const data = await api.getProductBySlug(params.slug as string);
                setProduct(data);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [params.slug]);

    const handleEnquiry = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSubmitting(true);
        const form = new FormData(e.currentTarget);
        try {
            await api.submitLead({
                fullName: form.get('fullName') as string,
                phone: form.get('phone') as string,
                email: (form.get('email') as string) || undefined,
                interestedModel: product?.name,
                budget: product?.price ? Number(product.price) : undefined,
                downPayment: form.get('downPayment') ? Number(form.get('downPayment')) : undefined,
                tenureMonths: form.get('tenure') ? Number(form.get('tenure')) : undefined,
                city: form.get('city') as string,
                message: form.get('message') as string,
            });
            setFormSubmitted(true);
        } catch (err) {
            alert('Failed to submit. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-bajaj-darker flex items-center justify-center">
                <div className="animate-pulse text-white/30">Loading...</div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="min-h-screen bg-bajaj-darker flex flex-col items-center justify-center gap-4">
                <h2 className="text-2xl text-white">Product not found</h2>
                <Link href="/inventory"><Button variant="outline" className="border-white/10 text-white">Back to Inventory</Button></Link>
            </div>
        );
    }

    const specs = typeof product.specs === 'string' ? JSON.parse(product.specs) : product.specs;
    const emi = formatEMI(product.discountedPrice || product.price);

    return (
        <main className="min-h-screen bg-transparent noise-overlay">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
                <Link href="/inventory" className="inline-flex items-center gap-2 text-white/40 hover:text-white text-sm mb-8 transition-colors">
                    <ChevronLeft className="w-4 h-4" /> Back to Inventory
                </Link>

                <div className="grid lg:grid-cols-5 gap-8">
                    {/* Left: Gallery + Details */}
                    <div className="lg:col-span-3 space-y-8">
                        {/* Hero image or 3D view */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="glass-card rounded-2xl overflow-hidden relative"
                        >
                            <div className="absolute top-4 right-4 z-20 flex gap-2">
                                {product.model_3d_url && (
                                    <Button
                                        variant={viewMode === '3d' ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => setViewMode('3d')}
                                        className={viewMode === '3d' ? 'bg-bajaj-orange hover:bg-bajaj-orange/90 text-white border-transparent' : 'bg-black/50 backdrop-blur border-white/10 text-white hover:bg-white/10'}
                                    >
                                        <Layers className="w-4 h-4 mr-2" /> 3D View
                                    </Button>
                                )}
                                <Button
                                    variant={viewMode === 'image' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setViewMode('image')}
                                    className={viewMode === 'image' ? 'bg-bajaj-orange hover:bg-bajaj-orange/90 text-white border-transparent' : 'bg-black/50 backdrop-blur border-white/10 text-white hover:bg-white/10'}
                                >
                                    Image
                                </Button>
                            </div>

                            {viewMode === '3d' && product.model_3d_url ? (
                                <ThreeDViewer url={product.model_3d_url} />
                            ) : (
                                <div className="h-64 md:h-96 relative bg-gradient-to-br from-white/5 to-white/[0.02] flex items-center justify-center">
                                    {product.images?.[0] ? (
                                        <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <Bike className="w-40 h-40 text-white/10" />
                                    )}
                                    <div className="absolute top-4 left-4 flex gap-2 z-10">
                                        {product.tags?.map((tag: string) => (
                                            <Badge key={tag} className="bg-bajaj-orange/90 text-white border-none">{tag}</Badge>
                                        ))}
                                    </div>
                                    {product.availability === 'PRE_ORDER' && (
                                        <Badge className="absolute top-14 left-4 bg-blue-500/90 text-white border-none z-10">Pre-order</Badge>
                                    )}
                                </div>
                            )}
                        </motion.div>

                        {/* Details */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                        >
                            <h1 className="text-3xl md:text-4xl font-display font-bold text-white mb-2">{product.name}</h1>
                            <p className="text-white/40 text-lg mb-4">
                                {product.cc > 0 ? `${product.cc}cc` : 'Electric'} • {product.modelFamily} • {product.year}
                            </p>

                            <div className="flex items-baseline gap-3 mb-6">
                                <span className="text-4xl font-bold text-white">{formatPrice(product.discountedPrice || product.price)}</span>
                                {product.discountedPrice && (
                                    <span className="text-xl text-white/30 line-through">{formatPrice(product.price)}</span>
                                )}
                                <span className="text-sm text-bajaj-orange">EMI from {formatPrice(emi)}/mo</span>
                            </div>

                            <p className="text-white/50 leading-relaxed mb-8">{product.description}</p>
                        </motion.div>

                        {/* Key Features */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <Card className="glass-card border-white/5">
                                <CardHeader><CardTitle className="text-white text-lg">Key Features</CardTitle></CardHeader>
                                <CardContent>
                                    <div className="grid sm:grid-cols-2 gap-3">
                                        {product.keyFeatures?.map((f: string, i: number) => (
                                            <div key={i} className="flex items-center gap-3 text-white/60">
                                                <div className="w-6 h-6 rounded-full bg-bajaj-orange/10 flex items-center justify-center flex-shrink-0">
                                                    <Check className="w-3 h-3 text-bajaj-orange" />
                                                </div>
                                                {f}
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>

                        {/* Specifications */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            <Card className="glass-card border-white/5">
                                <CardHeader><CardTitle className="text-white text-lg">Specifications</CardTitle></CardHeader>
                                <CardContent>
                                    <div className="divide-y divide-white/5">
                                        {Object.entries(specs).map(([key, value]) => (
                                            <div key={key} className="flex justify-between py-3">
                                                <span className="text-white/40 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                                                <span className="text-white font-medium">{String(value)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>

                        {/* Finance teaser */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                        >
                            <div className="glass-card rounded-2xl p-6 animated-border overflow-hidden">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-12 h-12 rounded-xl bg-bajaj-orange/10 flex items-center justify-center">
                                        <Zap className="w-6 h-6 text-bajaj-orange" />
                                    </div>
                                    <div>
                                        <h3 className="text-white font-bold">Easy Finance Available</h3>
                                        <p className="text-white/40 text-sm">Starting from 8.99% p.a. | 12-60 months</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-4 text-center">
                                    <div className="bg-white/5 rounded-xl p-3">
                                        <div className="text-bajaj-orange font-bold text-lg">{formatPrice(emi)}</div>
                                        <div className="text-white/30 text-xs">EMI/month*</div>
                                    </div>
                                    <div className="bg-white/5 rounded-xl p-3">
                                        <div className="text-white font-bold text-lg">8.99%</div>
                                        <div className="text-white/30 text-xs">Interest from</div>
                                    </div>
                                    <div className="bg-white/5 rounded-xl p-3">
                                        <div className="text-white font-bold text-lg">60</div>
                                        <div className="text-white/30 text-xs">Max months</div>
                                    </div>
                                </div>
                                <p className="text-[10px] text-white/15 mt-3">*Indicative EMI for 36 months at 9.5%. Actual may vary.</p>
                            </div>
                        </motion.div>
                    </div>

                    {/* Right: Enquiry form */}
                    <div className="lg:col-span-2">
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                            className="sticky top-24"
                        >
                            <Card className="glass-card border-white/5">
                                <CardHeader>
                                    <CardTitle className="text-white text-lg">
                                        {formSubmitted ? '✅ Enquiry Submitted!' : 'Request Callback / EMI Quote'}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {formSubmitted ? (
                                        <div className="text-center py-8">
                                            <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                                                <Check className="w-8 h-8 text-emerald-500" />
                                            </div>
                                            <p className="text-white/60 mb-4">We&apos;ll contact you shortly with the best offer for the {product.name}.</p>
                                            <div className="flex gap-2 justify-center">
                                                <a href="https://wa.me/9779801234567" target="_blank" rel="noopener noreferrer">
                                                    <Button variant="outline" size="sm" className="border-white/10 text-white/60">
                                                        <MessageCircle className="w-4 h-4 mr-2" /> WhatsApp
                                                    </Button>
                                                </a>
                                                <a href="tel:+9779801234567">
                                                    <Button variant="outline" size="sm" className="border-white/10 text-white/60">
                                                        <Phone className="w-4 h-4 mr-2" /> Call
                                                    </Button>
                                                </a>
                                            </div>
                                        </div>
                                    ) : (
                                        <form onSubmit={handleEnquiry} className="space-y-4">
                                            <div>
                                                <Label className="text-white/60">Full Name *</Label>
                                                <Input name="fullName" required className="mt-1 bg-white/5 border-white/10 text-white" />
                                            </div>
                                            <div>
                                                <Label className="text-white/60">Phone *</Label>
                                                <Input name="phone" type="tel" required className="mt-1 bg-white/5 border-white/10 text-white" />
                                            </div>
                                            <div>
                                                <Label className="text-white/60">Email</Label>
                                                <Input name="email" type="email" className="mt-1 bg-white/5 border-white/10 text-white" />
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <Label className="text-white/60">Down Payment (₹)</Label>
                                                    <Input name="downPayment" type="number" className="mt-1 bg-white/5 border-white/10 text-white" />
                                                </div>
                                                <div>
                                                    <Label className="text-white/60">Tenure (months)</Label>
                                                    <select name="tenure" className="mt-1 w-full h-10 rounded-md bg-white/5 border border-white/10 text-white/70 px-3 text-sm">
                                                        <option value="">Select</option>
                                                        {[12, 18, 24, 36, 48, 60].map(m => <option key={m} value={m}>{m} months</option>)}
                                                    </select>
                                                </div>
                                            </div>
                                            <div>
                                                <Label className="text-white/60">City</Label>
                                                <Input name="city" className="mt-1 bg-white/5 border-white/10 text-white" />
                                            </div>
                                            <div>
                                                <Label className="text-white/60">Message</Label>
                                                <Textarea name="message" rows={3} className="mt-1 bg-white/5 border-white/10 text-white" placeholder="Any specific questions..." />
                                            </div>
                                            <Button type="submit" variant="glow" size="lg" className="w-full" disabled={submitting}>
                                                {submitting ? 'Submitting...' : 'Submit Enquiry'}
                                            </Button>
                                            <p className="text-[10px] text-white/20 text-center">We respect your privacy. No spam.</p>
                                        </form>
                                    )}
                                </CardContent>
                            </Card>
                        </motion.div>
                    </div>
                </div>
            </div>
        </main>
    );
}
