'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    Bike, Package, Tag, Users, Settings, LogOut, BarChart3,
    Plus, Pencil, Trash2, Eye, ChevronLeft, Home, Menu, X, TrendingUp, Clock, CheckCircle2, Loader2,
    Box, Wrench, MessageCircle, Calendar, Image as ImageIcon, DollarSign, AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { adminApi, api } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import EMICalculator from '@/components/EMICalculator';
import ThreeDSetupWizard from '@/components/ThreeDSetupWizard';

type Tab = 'dashboard' | 'products' | 'used-bikes' | 'offers' | 'leads' | 'settings' | 'emi-calculator' | 'view3d-setup';

const AVAILABILITY_OPTIONS = [
    { value: 'IN_STOCK', label: '✅ In Stock' },
    { value: 'PRE_ORDER', label: '🔜 Upcoming / Pre-Order' },
    { value: 'OUT_OF_STOCK', label: '❌ Out of Stock' },
];

const OFFER_TYPES = ['FINANCE', 'EXCHANGE', 'GENERAL'];

export default function AdminDashboard() {
    const router = useRouter();
    const [tab, setTab] = useState<Tab>('dashboard');
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [token, setToken] = useState('');

    const [stats, setStats] = useState({ totalProducts: 0, inStock: 0, activeOffers: 0, totalLeads: 0, newToday: 0, pending: 0 });

    const [products, setProducts] = useState<any[]>([]);
    const [productForm, setProductForm] = useState<any>(null);
    const [isFetchingUrl, setIsFetchingUrl] = useState(false);
    const [fetchStatus, setFetchStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [productSaving, setProductSaving] = useState(false);

    // Used bikes
    const [usedBikes, setUsedBikes] = useState<any[]>([]);
    const [usedBikeForm, setUsedBikeForm] = useState<any>(null);
    const [usedBikeSaving, setUsedBikeSaving] = useState(false);
    const [usedBikeImagePreviews, setUsedBikeImagePreviews] = useState<string[]>([]);

    const [offers, setOffers] = useState<any[]>([]);
    const [offerForm, setOfferForm] = useState<any>(null);

    const [leads, setLeads] = useState<any[]>([]);
    const [leadsMeta, setLeadsMeta] = useState<any>({ total: 0 });
    const [leadsFilter, setLeadsFilter] = useState('');
    const [leadsPage, setLeadsPage] = useState(1);

    const [settings, setSettings] = useState<Record<string, any>>({});
    const [settingsJson, setSettingsJson] = useState('');

    useEffect(() => {
        const t = localStorage.getItem('admin_token');
        if (!t) { router.push('/admin'); return; }
        setToken(t);
        loadDashboard(t);
    }, [router]);

    const loadDashboard = async (t: string) => {
        try {
            const [productStats, offerStats, leadStats] = await Promise.all([
                adminApi.getProductStats(t),
                adminApi.getOfferStats(t),
                adminApi.getLeadStats(t),
            ]);
            setStats({
                totalProducts: productStats.total,
                inStock: productStats.inStock,
                activeOffers: offerStats.activeOffers,
                totalLeads: leadStats.total,
                newToday: leadStats.newToday,
                pending: leadStats.pending,
            });
        } catch (e) { console.error(e); }
    };

    const loadProducts = async () => {
        const res = await api.getProducts({ limit: '100' });
        setProducts(res.data.filter((p: any) => !p.is_used));
    };

    const loadUsedBikes = async () => {
        const res = await api.getProducts({ limit: '100' });
        setUsedBikes(res.data.filter((p: any) => p.is_used));
    };

    const loadOffers = async () => { const data = await adminApi.getOffers(token); setOffers(data); };
    const loadLeads = async () => {
        const params: Record<string, string> = { page: String(leadsPage), limit: '20' };
        if (leadsFilter) params.status = leadsFilter;
        const res = await adminApi.getLeads(params, token);
        setLeads(res.data);
        setLeadsMeta(res.meta);
    };
    const loadSettings = async () => {
        const data = await api.getSettings();
        setSettings(data);
        setSettingsJson(JSON.stringify(data, null, 2));
    };

    useEffect(() => {
        if (!token) return;
        if (tab === 'products') loadProducts();
        if (tab === 'used-bikes') loadUsedBikes();
        if (tab === 'offers') loadOffers();
        if (tab === 'leads') loadLeads();
        if (tab === 'settings') loadSettings();
        if (tab === 'view3d-setup') loadProducts();
    }, [tab, token, leadsFilter, leadsPage]);

    const handleLogout = () => {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
        router.push('/admin');
    };

    const handleFetchUrl = async () => {
        if (!productForm?.fetchUrl) return;
        setIsFetchingUrl(true);
        setFetchStatus('idle');
        try {
            const urlParts = productForm.fetchUrl.split('/');
            const slug = urlParts[urlParts.length - 1] || 'unknown';
            const ADMIN_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
            const res = await fetch(`${ADMIN_API_URL}/api/scraper/fetch?url=${encodeURIComponent(productForm.fetchUrl)}&slug=${encodeURIComponent(slug)}`, {
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            });
            const result = await res.json();
            if (result.success && result.data) {
                const data = result.data;
                setProductForm({
                    ...productForm,
                    name: data.name || productForm.name,
                    slug: data.slug || productForm.slug,
                    description: data.description || productForm.description,
                    keyFeatures: data.features || productForm.keyFeatures,
                    images: data.images && data.images.length > 0 ? data.images : productForm.images,
                    specs: data.specs || productForm.specs,
                });
                setFetchStatus('success');
            } else {
                setFetchStatus('error');
            }
        } catch { setFetchStatus('error'); }
        finally {
            setIsFetchingUrl(false);
            setTimeout(() => setFetchStatus('idle'), 3000);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, is3d = false) => {
        if (!e.target.files?.length) return;
        try {
            if (is3d) {
                const res = await adminApi.uploadFile(e.target.files[0], token);
                setProductForm({ ...productForm, model3dUrl: res.url });
            } else {
                const res = await adminApi.uploadMultipleFiles(e.target.files, token);
                const currentImages = productForm.images || [];
                setProductForm({ ...productForm, images: [...currentImages, ...res.urls] });
            }
        } catch { alert('Failed to upload file. Ensure it is under 50MB.'); }
    };

    const handleUsedBikeImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return;
        const currentCount = usedBikeForm?.usedBikeImages?.length || 0;
        const remaining = 15 - currentCount;
        if (remaining <= 0) { alert('Maximum 15 images allowed for used bikes.'); return; }
        const files = Array.from(e.target.files).slice(0, remaining);
        try {
            const res = await adminApi.uploadMultipleFiles(files as File[], token);
            const newUrls = [...(usedBikeForm.usedBikeImages || []), ...res.urls];
            setUsedBikeForm({ ...usedBikeForm, usedBikeImages: newUrls });
        } catch { alert('Failed to upload images.'); }
    };

    const handleDeleteProduct = async (id: string) => {
        if (!confirm('Delete this product?')) return;
        await adminApi.deleteProduct(id, token);
        loadProducts();
    };

    const handleDeleteUsedBike = async (id: string) => {
        if (!confirm('Delete this used bike listing?')) return;
        await adminApi.deleteProduct(id, token);
        loadUsedBikes();
    };

    const handleSaveProduct = async (formData: any) => {
        setProductSaving(true);
        try {
            if (formData.id) {
                await adminApi.updateProduct(formData.id, formData, token);
            } else {
                await adminApi.createProduct(formData, token);
            }
            setProductForm(null);
            loadProducts();
        } catch (e: any) {
            alert(e.message || 'Failed to save product');
        } finally { setProductSaving(false); }
    };

    const handleSaveUsedBike = async (formData: any) => {
        setUsedBikeSaving(true);
        try {
            const data = { ...formData, isUsed: true };
            if (data.id) {
                await adminApi.updateProduct(data.id, data, token);
            } else {
                await adminApi.createProduct(data, token);
            }
            setUsedBikeForm(null);
            loadUsedBikes();
        } catch (e: any) {
            alert(e.message || 'Failed to save used bike listing');
        } finally { setUsedBikeSaving(false); }
    };

    const handleDeleteOffer = async (id: string) => {
        if (!confirm('Delete this offer?')) return;
        await adminApi.deleteOffer(id, token);
        loadOffers();
    };

    const handleSaveOffer = async (formData: any) => {
        if (formData.id) {
            await adminApi.updateOffer(formData.id, formData, token);
        } else {
            await adminApi.createOffer(formData, token);
        }
        setOfferForm(null);
        loadOffers();
    };

    const handleUpdateLead = async (id: string, data: any) => {
        await adminApi.updateLead(id, data, token);
        loadLeads();
    };

    const handleSaveSettings = async () => {
        try {
            const parsed = JSON.parse(settingsJson);
            await adminApi.updateSettings(parsed, token);
            alert('Settings saved!');
            loadSettings();
        } catch { alert('Invalid JSON'); }
    };

    const newProductForm = {
        name: '', slug: '', category: 'BIKE', modelFamily: 'Pulsar',
        cc: 150, price: 0, discountedPrice: '', description: '',
        keyFeatures: [], tags: [], availability: 'IN_STOCK', year: new Date().getFullYear(),
        images: [], model3dUrl: '', fetchUrl: '', launchDate: '', emiStarting: '',
    };

    const navItems: { key: Tab; label: string; icon: React.ReactNode }[] = [
        { key: 'dashboard', label: 'Dashboard', icon: <BarChart3 className="w-4 h-4" /> },
        { key: 'products', label: 'New Bikes', icon: <Package className="w-4 h-4" /> },
        { key: 'used-bikes', label: 'Used Bikes', icon: <Wrench className="w-4 h-4" /> },
        { key: 'offers', label: 'Offers', icon: <Tag className="w-4 h-4" /> },
        { key: 'leads', label: 'Leads', icon: <Users className="w-4 h-4" /> },
        { key: 'view3d-setup', label: '3D Setup', icon: <Box className="w-4 h-4" /> },
        { key: 'emi-calculator', label: 'EMI Calc', icon: <DollarSign className="w-4 h-4" /> },
        { key: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
    ];

    return (
        <div className="min-h-screen bg-transparent flex overflow-hidden">
            {/* Sidebar */}
            <motion.aside className={`${sidebarOpen ? 'w-56' : 'w-14'} bg-bajaj-dark/60 backdrop-blur-xl border-r border-white/5 flex flex-col transition-all duration-300 fixed h-full z-40`}>
                <div className="p-3 flex items-center justify-between border-b border-white/5">
                    {sidebarOpen && (
                        <Link href="/" className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-bajaj-orange to-bajaj-gold flex items-center justify-center">
                                <Bike className="w-4 h-4 text-white" />
                            </div>
                            <div>
                                <span className="text-white font-display font-bold text-sm">ULHAS</span>
                                <span className="block text-[9px] text-white/30 tracking-wider -mt-0.5">Admin Panel</span>
                            </div>
                        </Link>
                    )}
                    <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-white/40 hover:text-white p-1">
                        {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
                    </button>
                </div>

                <nav className="flex-1 py-3 space-y-0.5 px-2 overflow-y-auto">
                    {navItems.map(item => (
                        <button
                            key={item.key}
                            onClick={() => setTab(item.key)}
                            className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-all ${tab === item.key
                                ? 'bg-bajaj-orange/15 text-bajaj-orange border border-bajaj-orange/20'
                                : 'text-white/40 hover:text-white hover:bg-white/5'
                                }`}
                            title={!sidebarOpen ? item.label : undefined}
                        >
                            {item.icon}
                            {sidebarOpen && <span className="truncate">{item.label}</span>}
                        </button>
                    ))}
                </nav>

                <div className="p-2 border-t border-white/5 space-y-0.5">
                    <Link href="/" target="_blank">
                        <button className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm text-white/40 hover:text-white hover:bg-white/5 transition-all">
                            <Eye className="w-4 h-4" />{sidebarOpen && <span>View Site</span>}
                        </button>
                    </Link>
                    <button onClick={handleLogout} className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm text-red-400/60 hover:text-red-400 hover:bg-red-500/5 transition-all">
                        <LogOut className="w-4 h-4" />{sidebarOpen && <span>Logout</span>}
                    </button>
                </div>
            </motion.aside>

            {/* Main content */}
            <main className={`flex-1 ${sidebarOpen ? 'ml-56' : 'ml-14'} p-6 transition-all duration-300 overflow-y-auto`}>

                {/* ── DASHBOARD ── */}
                {tab === 'dashboard' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                        <div>
                            <h2 className="text-2xl font-display font-bold text-white">Dashboard</h2>
                            <p className="text-white/40 text-sm mt-1">Welcome back! Here's what's happening at your showroom.</p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                            {[
                                { label: 'New Bikes', value: stats.totalProducts, icon: <Package className="w-5 h-5" />, color: 'text-blue-400', bg: 'bg-blue-500/10' },
                                { label: 'In Stock', value: stats.inStock, icon: <CheckCircle2 className="w-5 h-5" />, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                                { label: 'Active Offers', value: stats.activeOffers, icon: <Tag className="w-5 h-5" />, color: 'text-purple-400', bg: 'bg-purple-500/10' },
                                { label: 'New Leads Today', value: stats.newToday, icon: <TrendingUp className="w-5 h-5" />, color: 'text-bajaj-orange', bg: 'bg-bajaj-orange/10' },
                                { label: 'Pending Leads', value: stats.pending, icon: <Clock className="w-5 h-5" />, color: 'text-amber-400', bg: 'bg-amber-500/10' },
                                { label: 'Total Leads', value: stats.totalLeads, icon: <Users className="w-5 h-5" />, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
                            ].map((stat, i) => (
                                <Card key={i} className="glass-card border-white/5 col-span-1">
                                    <CardContent className="p-4">
                                        <div className={`w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center mb-3`}>
                                            <span className={stat.color}>{stat.icon}</span>
                                        </div>
                                        <div className="text-2xl font-bold text-white">{stat.value}</div>
                                        <div className="text-white/40 text-xs mt-0.5">{stat.label}</div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {/* Quick actions */}
                        <div>
                            <h3 className="text-white/60 text-sm font-medium mb-3">Quick Actions</h3>
                            <div className="flex flex-wrap gap-3">
                                {[
                                    { label: 'Add New Bike', tab: 'products' as Tab, icon: <Plus className="w-4 h-4" /> },
                                    { label: 'Add Used Bike', tab: 'used-bikes' as Tab, icon: <Wrench className="w-4 h-4" /> },
                                    { label: 'Add Offer', tab: 'offers' as Tab, icon: <Tag className="w-4 h-4" /> },
                                    { label: 'View Leads', tab: 'leads' as Tab, icon: <Users className="w-4 h-4" /> },
                                    { label: '3D Setup', tab: 'view3d-setup' as Tab, icon: <Box className="w-4 h-4" /> },
                                ].map(action => (
                                    <Button key={action.label} variant="outline" size="sm"
                                        onClick={() => setTab(action.tab)}
                                        className="border-white/10 text-white/60 hover:text-white gap-2">
                                        {action.icon} {action.label}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* ── NEW BIKES (Products) ── */}
                {tab === 'products' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-display font-bold text-white">New Bikes</h2>
                                <p className="text-white/40 text-sm mt-1">Manage your new bike inventory</p>
                            </div>
                            <Button variant="glow" onClick={() => setProductForm(newProductForm)} className="gap-2">
                                <Plus className="w-4 h-4" /> Add Bike
                            </Button>
                        </div>

                        {productForm && (
                            <Card className="glass-card border-white/5">
                                <CardHeader className="pb-4">
                                    <CardTitle className="text-white text-lg">{productForm.id ? 'Edit' : 'Add New'} Bike</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={e => { e.preventDefault(); handleSaveProduct(productForm); }} className="space-y-6">

                                        {/* Fetch from URL */}
                                        <div className="p-4 bg-bajaj-orange/5 border border-bajaj-orange/20 rounded-xl">
                                            <Label className="text-bajaj-orange font-medium text-sm">⚡ Auto-Fill from Official URL</Label>
                                            <div className="flex gap-2 mt-2">
                                                <Input
                                                    placeholder="https://www.bajajauto.com/bikes/pulsar-ns400z"
                                                    value={productForm.fetchUrl || ''}
                                                    onChange={e => setProductForm({ ...productForm, fetchUrl: e.target.value })}
                                                    className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-white/30"
                                                />
                                                <Button type="button" variant="glow" onClick={handleFetchUrl} disabled={!productForm.fetchUrl || isFetchingUrl} className="gap-2">
                                                    {isFetchingUrl ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Fetch'}
                                                </Button>
                                                {fetchStatus === 'success' && <div className="flex items-center text-emerald-400"><CheckCircle2 className="w-5 h-5" /></div>}
                                                {fetchStatus === 'error' && <div className="flex items-center text-red-400"><AlertCircle className="w-5 h-5" /></div>}
                                            </div>
                                            <p className="text-white/30 text-xs mt-1.5">Paste the official Bajaj URL to auto-fill specs and images. Then set your own price below.</p>
                                        </div>

                                        {/* Basic Info */}
                                        <div>
                                            <h4 className="text-white/50 text-xs uppercase tracking-widest mb-3 font-medium">Basic Info</h4>
                                            <div className="grid sm:grid-cols-2 gap-4">
                                                <div>
                                                    <Label className="text-white/60 text-sm">Bike Name *</Label>
                                                    <Input value={productForm.name} onChange={e => setProductForm({ ...productForm, name: e.target.value })} className="mt-1 bg-white/5 border-white/10 text-white" placeholder="e.g. Pulsar NS400Z" required />
                                                </div>
                                                <div>
                                                    <Label className="text-white/60 text-sm">Slug (URL) *</Label>
                                                    <Input value={productForm.slug} onChange={e => setProductForm({ ...productForm, slug: e.target.value })} className="mt-1 bg-white/5 border-white/10 text-white" placeholder="e.g. pulsar-ns400z" required />
                                                </div>
                                                <div>
                                                    <Label className="text-white/60 text-sm">Category</Label>
                                                    <select value={productForm.category} onChange={e => setProductForm({ ...productForm, category: e.target.value })} className="mt-1 w-full h-10 rounded-md bg-white/5 border border-white/10 text-white px-3 text-sm">
                                                        <option value="BIKE">Bike</option>
                                                        <option value="SCOOTER">Scooter</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <Label className="text-white/60 text-sm">Model Family</Label>
                                                    <Input value={productForm.modelFamily} onChange={e => setProductForm({ ...productForm, modelFamily: e.target.value })} className="mt-1 bg-white/5 border-white/10 text-white" placeholder="Pulsar, Dominar, Avenger..." />
                                                </div>
                                                <div>
                                                    <Label className="text-white/60 text-sm">Engine (CC)</Label>
                                                    <Input type="number" value={productForm.cc} onChange={e => setProductForm({ ...productForm, cc: Number(e.target.value) })} className="mt-1 bg-white/5 border-white/10 text-white" />
                                                </div>
                                                <div>
                                                    <Label className="text-white/60 text-sm">Year</Label>
                                                    <Input type="number" value={productForm.year} onChange={e => setProductForm({ ...productForm, year: Number(e.target.value) })} className="mt-1 bg-white/5 border-white/10 text-white" />
                                                </div>
                                                <div className="sm:col-span-2">
                                                    <Label className="text-white/60 text-sm">Description</Label>
                                                    <Textarea value={productForm.description} onChange={e => setProductForm({ ...productForm, description: e.target.value })} rows={3} className="mt-1 bg-white/5 border-white/10 text-white" />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Pricing */}
                                        <div>
                                            <h4 className="text-white/50 text-xs uppercase tracking-widest mb-3 font-medium">Your Showroom Pricing (NPR)</h4>
                                            <div className="grid sm:grid-cols-3 gap-4">
                                                <div>
                                                    <Label className="text-white/60 text-sm">Your Price (NPR) *</Label>
                                                    <Input type="number" value={productForm.price} onChange={e => setProductForm({ ...productForm, price: Number(e.target.value) })} className="mt-1 bg-white/5 border-white/10 text-white" placeholder="Your actual selling price" required />
                                                    <p className="text-white/20 text-xs mt-1">Set your own Nepal price, not India price</p>
                                                </div>
                                                <div>
                                                    <Label className="text-white/60 text-sm">Discounted Price (optional)</Label>
                                                    <Input type="number" value={productForm.discountedPrice || ''} onChange={e => setProductForm({ ...productForm, discountedPrice: e.target.value ? Number(e.target.value) : '' })} className="mt-1 bg-white/5 border-white/10 text-white" placeholder="Leave blank if no discount" />
                                                    {productForm.price && productForm.discountedPrice && productForm.discountedPrice < productForm.price && (
                                                        <p className="text-emerald-400 text-xs mt-1">Saving: {formatPrice(productForm.price - productForm.discountedPrice)}</p>
                                                    )}
                                                </div>
                                                <div>
                                                    <Label className="text-white/60 text-sm">EMI Starting From (NPR/month)</Label>
                                                    <Input type="number" value={productForm.emiStarting || ''} onChange={e => setProductForm({ ...productForm, emiStarting: e.target.value ? Number(e.target.value) : '' })} className="mt-1 bg-white/5 border-white/10 text-white" placeholder="e.g. 3500" />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Status & Availability */}
                                        <div>
                                            <h4 className="text-white/50 text-xs uppercase tracking-widest mb-3 font-medium">Status</h4>
                                            <div className="grid sm:grid-cols-2 gap-4">
                                                <div>
                                                    <Label className="text-white/60 text-sm">Availability</Label>
                                                    <select value={productForm.availability} onChange={e => setProductForm({ ...productForm, availability: e.target.value })} className="mt-1 w-full h-10 rounded-md bg-white/5 border border-white/10 text-white px-3 text-sm">
                                                        {AVAILABILITY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                                    </select>
                                                </div>
                                                {productForm.availability === 'PRE_ORDER' && (
                                                    <div>
                                                        <Label className="text-white/60 text-sm">Expected Launch Date</Label>
                                                        <Input type="date" value={productForm.launchDate || ''} onChange={e => setProductForm({ ...productForm, launchDate: e.target.value })} className="mt-1 bg-white/5 border-white/10 text-white" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Features & Tags */}
                                        <div>
                                            <h4 className="text-white/50 text-xs uppercase tracking-widest mb-3 font-medium">Features & Tags</h4>
                                            <div className="grid sm:grid-cols-2 gap-4">
                                                <div>
                                                    <Label className="text-white/60 text-sm">Key Features (comma separated)</Label>
                                                    <Input value={(productForm.keyFeatures || []).join(', ')} onChange={e => setProductForm({ ...productForm, keyFeatures: e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean) })} className="mt-1 bg-white/5 border-white/10 text-white" placeholder="LED lights, ABS, GPS, ..." />
                                                </div>
                                                <div>
                                                    <Label className="text-white/60 text-sm">Tags (comma separated)</Label>
                                                    <Input value={(productForm.tags || []).join(', ')} onChange={e => setProductForm({ ...productForm, tags: e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean) })} className="mt-1 bg-white/5 border-white/10 text-white" placeholder="Sport, Bestseller, New, ..." />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Media */}
                                        <div>
                                            <h4 className="text-white/50 text-xs uppercase tracking-widest mb-3 font-medium">Media</h4>
                                            <div className="space-y-4">
                                                <div>
                                                    <Label className="text-white/60 text-sm">Product Images (auto-filled from URL, or upload)</Label>
                                                    <div className="flex gap-2 mt-1">
                                                        <Input value={(productForm.images || []).join(', ')} onChange={e => setProductForm({ ...productForm, images: e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean) })} className="flex-1 bg-white/5 border-white/10 text-white" placeholder="Image URLs, comma separated" />
                                                        <label className="cursor-pointer">
                                                            <span className="flex items-center gap-1 bg-white/5 border border-white/10 text-white/60 hover:text-white text-sm px-3 py-2 rounded-md whitespace-nowrap">
                                                                <ImageIcon className="w-3.5 h-3.5" /> Upload
                                                            </span>
                                                            <input type="file" multiple accept="image/*" onChange={e => handleFileUpload(e, false)} className="hidden" />
                                                        </label>
                                                    </div>
                                                    {(productForm.images || []).length > 0 && (
                                                        <p className="text-white/30 text-xs mt-1">{productForm.images.length} image(s) set</p>
                                                    )}
                                                </div>
                                                <div>
                                                    <Label className="text-white/60 text-sm">3D Model URL (.glb / .gltf) — use <button type="button" onClick={() => setTab('view3d-setup')} className="text-bajaj-orange underline">3D Setup Wizard</button> for guided upload</Label>
                                                    <div className="flex gap-2 mt-1">
                                                        <Input value={productForm.model3dUrl || ''} onChange={e => setProductForm({ ...productForm, model3dUrl: e.target.value })} className="flex-1 bg-white/5 border-white/10 text-white" placeholder="https://... or upload below" />
                                                        <label className="cursor-pointer">
                                                            <span className="flex items-center gap-1 bg-white/5 border border-white/10 text-white/60 hover:text-white text-sm px-3 py-2 rounded-md whitespace-nowrap">
                                                                <Box className="w-3.5 h-3.5" /> Upload
                                                            </span>
                                                            <input type="file" accept=".glb,.gltf" onChange={e => handleFileUpload(e, true)} className="hidden" />
                                                        </label>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex gap-3 pt-2">
                                            <Button type="submit" variant="glow" disabled={productSaving} className="gap-2">
                                                {productSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                                {productForm.id ? 'Update Bike' : 'Add Bike'}
                                            </Button>
                                            <Button type="button" variant="outline" onClick={() => setProductForm(null)} className="border-white/10 text-white/60">Cancel</Button>
                                        </div>
                                    </form>
                                </CardContent>
                            </Card>
                        )}

                        <div className="space-y-2">
                            {products.length === 0 && !productForm && (
                                <div className="glass-card rounded-xl p-8 text-center text-white/30">
                                    <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                    <p>No bikes added yet. Click "Add Bike" to get started.</p>
                                </div>
                            )}
                            {products.map(p => (
                                <div key={p.id} className="glass-card rounded-xl p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        {p.images?.[0] ? (
                                            <img src={p.images[0]} alt={p.name} className="w-14 h-14 rounded-lg object-cover" />
                                        ) : (
                                            <div className="w-14 h-14 rounded-lg bg-white/5 flex items-center justify-center">
                                                <Bike className="w-6 h-6 text-white/20" />
                                            </div>
                                        )}
                                        <div>
                                            <h3 className="text-white font-semibold">{p.name}</h3>
                                            <p className="text-white/40 text-sm">{p.model_family} • {p.cc > 0 ? `${p.cc}cc` : 'Electric'} • {formatPrice(p.discounted_price || p.price)}</p>
                                            <div className="flex gap-1.5 mt-1">
                                                <Badge variant={p.availability === 'IN_STOCK' ? 'success' : p.availability === 'PRE_ORDER' ? 'warning' : 'secondary'} className="text-[10px]">
                                                    {AVAILABILITY_OPTIONS.find(o => o.value === p.availability)?.label || p.availability}
                                                </Badge>
                                                {p.model_3d_url && <Badge className="bg-emerald-500/20 text-emerald-400 border-none text-[10px]">3D</Badge>}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Link href={`/models/${p.slug}`} target="_blank">
                                            <Button size="icon" variant="ghost" className="text-white/30 hover:text-white">
                                                <Eye className="w-4 h-4" />
                                            </Button>
                                        </Link>
                                        <Button size="icon" variant="ghost" onClick={() => setProductForm({
                                            id: p.id, name: p.name, slug: p.slug, category: p.category,
                                            modelFamily: p.model_family, cc: p.cc, price: p.price,
                                            discountedPrice: p.discounted_price || '', description: p.description,
                                            keyFeatures: p.key_features || [], tags: p.tags || [],
                                            availability: p.availability, year: p.year, specs: p.specs,
                                            images: p.images || [], model3dUrl: p.model_3d_url || '',
                                            emiStarting: p.emi_starting || '', launchDate: p.launch_date ? p.launch_date.split('T')[0] : '',
                                        })} className="text-white/40 hover:text-white">
                                            <Pencil className="w-4 h-4" />
                                        </Button>
                                        <Button size="icon" variant="ghost" onClick={() => handleDeleteProduct(p.id)} className="text-red-400/40 hover:text-red-400">
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* ── USED BIKES ── */}
                {tab === 'used-bikes' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-display font-bold text-white">Used Bikes</h2>
                                <p className="text-white/40 text-sm mt-1">List pre-owned bikes for sale (up to 15 photos each)</p>
                            </div>
                            <Button variant="glow" onClick={() => setUsedBikeForm({
                                name: '', price: 0, cc: 150, description: '', year: new Date().getFullYear(),
                                availability: 'IN_STOCK', usedBikeImages: [], slug: '',
                                category: 'BIKE', modelFamily: '', keyFeatures: [], tags: [],
                            })} className="gap-2">
                                <Plus className="w-4 h-4" /> Add Used Bike
                            </Button>
                        </div>

                        {usedBikeForm && (
                            <Card className="glass-card border-white/5">
                                <CardHeader className="pb-4">
                                    <CardTitle className="text-white text-lg">{usedBikeForm.id ? 'Edit' : 'Add'} Used Bike Listing</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={e => { e.preventDefault(); handleSaveUsedBike(usedBikeForm); }} className="space-y-5">
                                        <div className="grid sm:grid-cols-2 gap-4">
                                            <div>
                                                <Label className="text-white/60 text-sm">Bike Name *</Label>
                                                <Input value={usedBikeForm.name} onChange={e => setUsedBikeForm({ ...usedBikeForm, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-used-' + Date.now() })} className="mt-1 bg-white/5 border-white/10 text-white" placeholder="e.g. Pulsar 150 (2020)" required />
                                            </div>
                                            <div>
                                                <Label className="text-white/60 text-sm">Asking Price (NPR) *</Label>
                                                <Input type="number" value={usedBikeForm.price} onChange={e => setUsedBikeForm({ ...usedBikeForm, price: Number(e.target.value) })} className="mt-1 bg-white/5 border-white/10 text-white" required />
                                            </div>
                                            <div>
                                                <Label className="text-white/60 text-sm">Engine (CC)</Label>
                                                <Input type="number" value={usedBikeForm.cc} onChange={e => setUsedBikeForm({ ...usedBikeForm, cc: Number(e.target.value) })} className="mt-1 bg-white/5 border-white/10 text-white" />
                                            </div>
                                            <div>
                                                <Label className="text-white/60 text-sm">Year</Label>
                                                <Input type="number" value={usedBikeForm.year} onChange={e => setUsedBikeForm({ ...usedBikeForm, year: Number(e.target.value) })} className="mt-1 bg-white/5 border-white/10 text-white" />
                                            </div>
                                            <div>
                                                <Label className="text-white/60 text-sm">Availability</Label>
                                                <select value={usedBikeForm.availability} onChange={e => setUsedBikeForm({ ...usedBikeForm, availability: e.target.value })} className="mt-1 w-full h-10 rounded-md bg-white/5 border border-white/10 text-white px-3 text-sm">
                                                    <option value="IN_STOCK">✅ Available</option>
                                                    <option value="OUT_OF_STOCK">❌ Sold</option>
                                                </select>
                                            </div>
                                            <div>
                                                <Label className="text-white/60 text-sm">Key Features (comma separated)</Label>
                                                <Input value={(usedBikeForm.keyFeatures || []).join(', ')} onChange={e => setUsedBikeForm({ ...usedBikeForm, keyFeatures: e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean) })} className="mt-1 bg-white/5 border-white/10 text-white" placeholder="Good condition, ABS, recent service..." />
                                            </div>
                                            <div className="sm:col-span-2">
                                                <Label className="text-white/60 text-sm">Description</Label>
                                                <Textarea value={usedBikeForm.description} onChange={e => setUsedBikeForm({ ...usedBikeForm, description: e.target.value })} rows={2} className="mt-1 bg-white/5 border-white/10 text-white" placeholder="Condition, mileage, any modifications..." />
                                            </div>
                                        </div>

                                        {/* Image upload — max 15 */}
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <Label className="text-white/60 text-sm">Photos ({(usedBikeForm.usedBikeImages || []).length} / 15)</Label>
                                                {(usedBikeForm.usedBikeImages || []).length < 15 && (
                                                    <label className="cursor-pointer">
                                                        <span className="flex items-center gap-1.5 text-xs bg-bajaj-orange/10 text-bajaj-orange border border-bajaj-orange/20 px-3 py-1.5 rounded-lg hover:bg-bajaj-orange/20 transition-colors">
                                                            <ImageIcon className="w-3.5 h-3.5" /> Add Photos
                                                        </span>
                                                        <input type="file" multiple accept="image/*" className="hidden" onChange={handleUsedBikeImageUpload} />
                                                    </label>
                                                )}
                                            </div>
                                            {(usedBikeForm.usedBikeImages || []).length > 0 ? (
                                                <div className="grid grid-cols-5 gap-2">
                                                    {usedBikeForm.usedBikeImages.map((url: string, i: number) => (
                                                        <div key={i} className="relative group">
                                                            <img src={url} alt={`Photo ${i + 1}`} className="w-full aspect-square object-cover rounded-lg" />
                                                            <button
                                                                type="button"
                                                                onClick={() => setUsedBikeForm({ ...usedBikeForm, usedBikeImages: usedBikeForm.usedBikeImages.filter((_: any, idx: number) => idx !== i) })}
                                                                className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                            >
                                                                <X className="w-3 h-3 text-white" />
                                                            </button>
                                                            <span className="absolute bottom-1 left-1 text-white/70 text-[10px] bg-black/50 px-1 rounded">{i + 1}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <label className="cursor-pointer block">
                                                    <div className="border-2 border-dashed border-white/10 rounded-xl p-8 text-center hover:border-white/20 transition-colors">
                                                        <ImageIcon className="w-8 h-8 text-white/20 mx-auto mb-2" />
                                                        <p className="text-white/30 text-sm">Click to upload photos (max 15)</p>
                                                    </div>
                                                    <input type="file" multiple accept="image/*" className="hidden" onChange={handleUsedBikeImageUpload} />
                                                </label>
                                            )}
                                        </div>

                                        <div className="flex gap-3">
                                            <Button type="submit" variant="glow" disabled={usedBikeSaving} className="gap-2">
                                                {usedBikeSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                                {usedBikeForm.id ? 'Update Listing' : 'Add Listing'}
                                            </Button>
                                            <Button type="button" variant="outline" onClick={() => setUsedBikeForm(null)} className="border-white/10 text-white/60">Cancel</Button>
                                        </div>
                                    </form>
                                </CardContent>
                            </Card>
                        )}

                        <div className="space-y-2">
                            {usedBikes.length === 0 && !usedBikeForm && (
                                <div className="glass-card rounded-xl p-8 text-center text-white/30">
                                    <Wrench className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                    <p>No used bike listings yet. Click "Add Used Bike" to start.</p>
                                </div>
                            )}
                            {usedBikes.map(p => (
                                <div key={p.id} className="glass-card rounded-xl p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        {p.used_bike_images?.[0] ? (
                                            <img src={p.used_bike_images[0]} alt={p.name} className="w-14 h-14 rounded-lg object-cover" />
                                        ) : (
                                            <div className="w-14 h-14 rounded-lg bg-white/5 flex items-center justify-center">
                                                <Wrench className="w-6 h-6 text-white/20" />
                                            </div>
                                        )}
                                        <div>
                                            <h3 className="text-white font-semibold">{p.name}</h3>
                                            <p className="text-white/40 text-sm">{p.year} • {p.cc}cc • {formatPrice(p.price)}</p>
                                            <div className="flex gap-1.5 mt-1">
                                                <Badge variant={p.availability === 'IN_STOCK' ? 'success' : 'secondary'} className="text-[10px]">
                                                    {p.availability === 'IN_STOCK' ? 'Available' : 'Sold'}
                                                </Badge>
                                                <span className="text-white/30 text-[10px]">{p.used_bike_images?.length || 0} photos</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-1.5">
                                        <Button size="icon" variant="ghost" onClick={() => setUsedBikeForm({
                                            id: p.id, name: p.name, slug: p.slug, price: p.price,
                                            cc: p.cc, year: p.year, description: p.description,
                                            availability: p.availability, usedBikeImages: p.used_bike_images || [],
                                            keyFeatures: p.key_features || [], category: p.category, modelFamily: p.model_family, tags: p.tags || [],
                                        })} className="text-white/40 hover:text-white">
                                            <Pencil className="w-4 h-4" />
                                        </Button>
                                        <Button size="icon" variant="ghost" onClick={() => handleDeleteUsedBike(p.id)} className="text-red-400/40 hover:text-red-400">
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* ── OFFERS ── */}
                {tab === 'offers' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-display font-bold text-white">Offers & Discounts</h2>
                                <p className="text-white/40 text-sm mt-1">Manage finance, exchange, and general offers</p>
                            </div>
                            <Button variant="glow" onClick={() => setOfferForm({ type: 'GENERAL', title: '', subtitle: '', details: '', active: true, aprFrom: '', discountPercent: '', validTill: '' })}>
                                <Plus className="w-4 h-4 mr-2" /> Add Offer
                            </Button>
                        </div>

                        {offerForm && (
                            <Card className="glass-card border-white/5">
                                <CardHeader><CardTitle className="text-white">{offerForm.id ? 'Edit' : 'New'} Offer</CardTitle></CardHeader>
                                <CardContent>
                                    <form onSubmit={e => { e.preventDefault(); handleSaveOffer(offerForm); }} className="grid sm:grid-cols-2 gap-4">
                                        <div>
                                            <Label className="text-white/60 text-sm">Offer Type</Label>
                                            <select value={offerForm.type} onChange={e => setOfferForm({ ...offerForm, type: e.target.value })} className="mt-1 w-full h-10 rounded-md bg-white/5 border border-white/10 text-white px-3 text-sm">
                                                <option value="FINANCE">💳 Finance</option>
                                                <option value="EXCHANGE">🔄 Exchange</option>
                                                <option value="GENERAL">🎁 General</option>
                                            </select>
                                        </div>
                                        <div>
                                            <Label className="text-white/60 text-sm">Title *</Label>
                                            <Input value={offerForm.title} onChange={e => setOfferForm({ ...offerForm, title: e.target.value })} className="mt-1 bg-white/5 border-white/10 text-white" required />
                                        </div>
                                        <div>
                                            <Label className="text-white/60 text-sm">Subtitle</Label>
                                            <Input value={offerForm.subtitle || ''} onChange={e => setOfferForm({ ...offerForm, subtitle: e.target.value })} className="mt-1 bg-white/5 border-white/10 text-white" />
                                        </div>
                                        <div>
                                            <Label className="text-white/60 text-sm">APR From (%)</Label>
                                            <Input type="number" step="0.01" value={offerForm.aprFrom || ''} onChange={e => setOfferForm({ ...offerForm, aprFrom: parseFloat(e.target.value) || null })} className="mt-1 bg-white/5 border-white/10 text-white" placeholder="e.g. 0 for 0% interest" />
                                        </div>
                                        <div>
                                            <Label className="text-white/60 text-sm">Discount %</Label>
                                            <Input type="number" step="0.1" value={offerForm.discountPercent || ''} onChange={e => setOfferForm({ ...offerForm, discountPercent: e.target.value })} className="mt-1 bg-white/5 border-white/10 text-white" placeholder="e.g. 5 for 5% off" />
                                        </div>
                                        <div>
                                            <Label className="text-white/60 text-sm">Valid Until</Label>
                                            <Input type="date" value={offerForm.validTill || ''} onChange={e => setOfferForm({ ...offerForm, validTill: e.target.value })} className="mt-1 bg-white/5 border-white/10 text-white" />
                                        </div>
                                        <div className="sm:col-span-2">
                                            <Label className="text-white/60 text-sm">Details / Terms</Label>
                                            <Textarea value={offerForm.details || ''} onChange={e => setOfferForm({ ...offerForm, details: e.target.value })} rows={2} className="mt-1 bg-white/5 border-white/10 text-white" />
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <input type="checkbox" id="offer-active" checked={offerForm.active} onChange={e => setOfferForm({ ...offerForm, active: e.target.checked })} className="w-4 h-4 accent-orange-500" />
                                            <label htmlFor="offer-active" className="text-white/60 text-sm cursor-pointer">Active (visible on public site)</label>
                                        </div>
                                        <div className="sm:col-span-2 flex gap-2">
                                            <Button type="submit" variant="glow">Save Offer</Button>
                                            <Button type="button" variant="outline" onClick={() => setOfferForm(null)} className="border-white/10 text-white/60">Cancel</Button>
                                        </div>
                                    </form>
                                </CardContent>
                            </Card>
                        )}

                        {/* Grouped by type */}
                        {OFFER_TYPES.map(type => {
                            const typeOffers = offers.filter(o => o.type === type);
                            if (typeOffers.length === 0) return null;
                            return (
                                <div key={type}>
                                    <h3 className="text-white/40 text-xs uppercase tracking-widest mb-2 flex items-center gap-2">
                                        {type === 'FINANCE' ? '💳' : type === 'EXCHANGE' ? '🔄' : '🎁'} {type}
                                    </h3>
                                    <div className="space-y-2">
                                        {typeOffers.map(o => (
                                            <div key={o.id} className="glass-card rounded-xl p-4 flex items-center justify-between">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <Badge variant={o.active ? 'success' : 'secondary'} className="text-[10px]">{o.active ? 'Active' : 'Inactive'}</Badge>
                                                        {o.apr_from !== null && <Badge className="bg-blue-500/20 text-blue-400 border-none text-[10px]">{o.apr_from}% APR</Badge>}
                                                    </div>
                                                    <h3 className="text-white font-semibold">{o.title}</h3>
                                                    {o.subtitle && <p className="text-white/40 text-sm">{o.subtitle}</p>}
                                                </div>
                                                <div className="flex gap-1.5">
                                                    <Button size="icon" variant="ghost" onClick={() => setOfferForm({
                                                        id: o.id, type: o.type, title: o.title, subtitle: o.subtitle,
                                                        details: o.details, aprFrom: o.apr_from, active: o.active,
                                                        discountPercent: '', validTill: '',
                                                    })} className="text-white/40 hover:text-white"><Pencil className="w-4 h-4" /></Button>
                                                    <Button size="icon" variant="ghost" onClick={() => handleDeleteOffer(o.id)} className="text-red-400/40 hover:text-red-400"><Trash2 className="w-4 h-4" /></Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                        {offers.length === 0 && !offerForm && (
                            <div className="glass-card rounded-xl p-8 text-center text-white/30">
                                <Tag className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                <p>No offers yet. Click "Add Offer" to create one.</p>
                            </div>
                        )}
                    </motion.div>
                )}

                {/* ── LEADS ── */}
                {tab === 'leads' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                        <div className="flex items-center justify-between flex-wrap gap-3">
                            <div>
                                <h2 className="text-2xl font-display font-bold text-white">Leads / Enquiries</h2>
                                <p className="text-white/40 text-sm mt-1">{leadsMeta.total || 0} total leads</p>
                            </div>
                            <div className="flex gap-2 flex-wrap">
                                {['', 'NEW', 'CONTACTED', 'CLOSED'].map(s => (
                                    <Button key={s} size="sm" onClick={() => { setLeadsFilter(s); setLeadsPage(1); }}
                                        className={leadsFilter === s ? 'bg-bajaj-orange text-white' : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10'}>
                                        {s || 'All'}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-3">
                            {leads.length === 0 && (
                                <div className="glass-card rounded-xl p-8 text-center text-white/30">
                                    <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                    <p>No leads found for this filter.</p>
                                </div>
                            )}
                            {leads.map(l => (
                                <div key={l.id} className="glass-card rounded-xl p-4">
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <h3 className="text-white font-semibold">{l.full_name}</h3>
                                            <p className="text-white/40 text-sm">{l.phone}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {/* WhatsApp button for this lead */}
                                            <a href={`https://wa.me/${l.phone.replace(/\D/g, '')}?text=Hi ${encodeURIComponent(l.full_name)}, this is from Ulhas Bajaj showroom. We're following up on your enquiry about ${encodeURIComponent(l.interested_model || 'a Bajaj bike')}.`}
                                                target="_blank" rel="noopener noreferrer">
                                                <Button size="sm" variant="ghost" className="text-emerald-400/60 hover:text-emerald-400 gap-1.5">
                                                    <MessageCircle className="w-4 h-4" /> WhatsApp
                                                </Button>
                                            </a>
                                            <select
                                                value={l.status}
                                                onChange={e => handleUpdateLead(l.id, { status: e.target.value })}
                                                className="bg-white/5 border border-white/10 rounded-md px-2 py-1 text-xs text-white/70"
                                            >
                                                <option value="NEW">🆕 New</option>
                                                <option value="CONTACTED">📞 Contacted</option>
                                                <option value="CLOSED">✅ Closed</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="grid sm:grid-cols-3 gap-2 text-sm">
                                        {l.interested_model && <div className="text-white/40">Model: <span className="text-white/70">{l.interested_model}</span></div>}
                                        {l.budget && <div className="text-white/40">Budget: <span className="text-white/70">{formatPrice(l.budget)}</span></div>}
                                        {l.city && <div className="text-white/40">City: <span className="text-white/70">{l.city}</span></div>}
                                    </div>
                                    {l.message && <p className="text-white/30 text-sm mt-2 italic">&ldquo;{l.message}&rdquo;</p>}
                                    <div className="mt-2 text-[10px] text-white/20">{new Date(l.created_at).toLocaleString()}</div>
                                </div>
                            ))}
                        </div>

                        {leadsMeta.totalPages > 1 && (
                            <div className="flex justify-center gap-2">
                                <Button size="sm" variant="outline" disabled={leadsPage <= 1} onClick={() => setLeadsPage(p => p - 1)} className="border-white/10 text-white/60">Prev</Button>
                                <span className="text-white/40 text-sm flex items-center">{leadsPage} / {leadsMeta.totalPages}</span>
                                <Button size="sm" variant="outline" disabled={leadsPage >= leadsMeta.totalPages} onClick={() => setLeadsPage(p => p + 1)} className="border-white/10 text-white/60">Next</Button>
                            </div>
                        )}
                    </motion.div>
                )}

                {/* ── 3D SETUP ── */}
                {tab === 'view3d-setup' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                        <div>
                            <h2 className="text-2xl font-display font-bold text-white">3D View Setup</h2>
                            <p className="text-white/40 text-sm mt-1">Set up interactive 3D viewing for any bike in your catalog</p>
                        </div>
                        <ThreeDSetupWizard token={token} products={products} />
                    </motion.div>
                )}

                {/* ── EMI CALCULATOR ── */}
                {tab === 'emi-calculator' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                        <h2 className="text-2xl font-display font-bold text-white">EMI Calculator</h2>
                        <EMICalculator defaultPrice={150000} />
                    </motion.div>
                )}

                {/* ── SETTINGS ── */}
                {tab === 'settings' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                        <div>
                            <h2 className="text-2xl font-display font-bold text-white">Settings</h2>
                            <p className="text-white/40 text-sm mt-1">Site configuration — changes reflect immediately</p>
                        </div>
                        <Card className="glass-card border-white/5">
                            <CardContent className="p-6">
                                <Textarea
                                    value={settingsJson}
                                    onChange={e => setSettingsJson(e.target.value)}
                                    rows={20}
                                    className="bg-white/5 border-white/10 text-white font-mono text-sm"
                                />
                                <Button onClick={handleSaveSettings} variant="glow" className="mt-4">Save Settings</Button>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
            </main>
        </div>
    );
}
