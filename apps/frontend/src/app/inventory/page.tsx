'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, SlidersHorizontal, X, ChevronRight, Bike, ChevronLeft, ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';
import { formatPrice, formatEMI } from '@/lib/utils';

const MODEL_FAMILIES = ['Pulsar', 'Dominar', 'Avenger', 'Platina', 'Chetak', 'CT'];
const CC_OPTIONS = [0, 110, 150, 160, 200, 220, 250, 373];

export default function InventoryPage() {
    const [products, setProducts] = useState<any[]>([]);
    const [meta, setMeta] = useState<any>({ total: 0, page: 1, totalPages: 1 });
    const [loading, setLoading] = useState(true);
    const [filtersOpen, setFiltersOpen] = useState(false);

    // Filter state
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('');
    const [modelFamily, setModelFamily] = useState<string[]>([]);
    const [availability, setAvailability] = useState('');
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [selectedCc, setSelectedCc] = useState<number[]>([]);
    const [sort, setSort] = useState('newest');
    const [page, setPage] = useState(1);

    const fetchProducts = useCallback(async () => {
        setLoading(true);
        try {
            const params: Record<string, string> = { page: String(page), limit: '12', sort };
            if (search) params.search = search;
            if (category) params.category = category;
            if (modelFamily.length) params.modelFamily = modelFamily.join(',');
            if (availability) params.availability = availability;
            if (minPrice) params.minPrice = minPrice;
            if (maxPrice) params.maxPrice = maxPrice;
            if (selectedCc.length) params.cc = selectedCc.join(',');

            const res = await api.getProducts(params);
            setProducts(res.data);
            setMeta(res.meta);
        } catch (e) {
            console.error('Failed to fetch products:', e);
        } finally {
            setLoading(false);
        }
    }, [page, search, category, modelFamily, availability, minPrice, maxPrice, selectedCc, sort]);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    const toggleModelFamily = (fam: string) => {
        setModelFamily(prev => prev.includes(fam) ? prev.filter(f => f !== fam) : [...prev, fam]);
        setPage(1);
    };

    const toggleCc = (cc: number) => {
        setSelectedCc(prev => prev.includes(cc) ? prev.filter(c => c !== cc) : [...prev, cc]);
        setPage(1);
    };

    const clearFilters = () => {
        setSearch(''); setCategory(''); setModelFamily([]);
        setAvailability(''); setMinPrice(''); setMaxPrice('');
        setSelectedCc([]); setSort('newest'); setPage(1);
    };

    const hasFilters = search || category || modelFamily.length || availability || minPrice || maxPrice || selectedCc.length;

    return (
        <main className="min-h-screen bg-transparent noise-overlay pt-24 pb-12">
            {/* Header */}
            <div className="bg-gradient-to-b from-bajaj-dark to-bajaj-darker border-b border-white/5">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
                    <Link href="/" className="inline-flex items-center gap-2 text-white/40 hover:text-white text-sm mb-6 transition-colors">
                        <ChevronLeft className="w-4 h-4" /> Back to Home
                    </Link>
                    <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-2">Our Inventory</h1>
                    <p className="text-white/40 text-lg">Explore the complete Bajaj lineup</p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Search & filter bar */}
                <div className="flex flex-col sm:flex-row gap-4 mb-8">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                        <Input
                            placeholder="Search models..."
                            value={search}
                            onChange={e => { setSearch(e.target.value); setPage(1); }}
                            className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30"
                        />
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setFiltersOpen(!filtersOpen)}
                            className="border-white/10 text-white/70 hover:text-white"
                        >
                            <SlidersHorizontal className="w-4 h-4 mr-2" /> Filters
                            {hasFilters && <Badge className="ml-2 bg-bajaj-orange text-white border-none text-xs px-1.5">!</Badge>}
                        </Button>
                        <select
                            value={sort}
                            onChange={e => { setSort(e.target.value); setPage(1); }}
                            className="bg-white/5 border border-white/10 rounded-md px-3 text-sm text-white/70 outline-none cursor-pointer"
                        >
                            <option value="newest">Newest</option>
                            <option value="price_asc">Price: Low → High</option>
                            <option value="price_desc">Price: High → Low</option>
                        </select>
                    </div>
                </div>

                {/* Filter panel */}
                <AnimatePresence>
                    {filtersOpen && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden mb-8"
                        >
                            <div className="glass-card rounded-2xl p-6 space-y-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-white font-semibold">Filters</h3>
                                    {hasFilters && (
                                        <Button variant="ghost" size="sm" onClick={clearFilters} className="text-white/40 hover:text-white text-xs">
                                            Clear All <X className="w-3 h-3 ml-1" />
                                        </Button>
                                    )}
                                </div>

                                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                    {/* Category */}
                                    <div>
                                        <Label className="text-white/60 mb-2 block">Category</Label>
                                        <div className="flex gap-2">
                                            {['BIKE', 'SCOOTER'].map(c => (
                                                <Button
                                                    key={c}
                                                    variant={category === c ? 'default' : 'outline'}
                                                    size="sm"
                                                    onClick={() => { setCategory(category === c ? '' : c); setPage(1); }}
                                                    className={category === c ? 'bg-bajaj-orange hover:bg-bajaj-orange/90 text-white' : 'border-white/10 text-white/60'}
                                                >
                                                    {c === 'BIKE' ? '🏍️ Bike' : '🛵 Scooter'}
                                                </Button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Model Family */}
                                    <div>
                                        <Label className="text-white/60 mb-2 block">Model Family</Label>
                                        <div className="flex flex-wrap gap-1.5">
                                            {MODEL_FAMILIES.map(fam => (
                                                <Button
                                                    key={fam}
                                                    variant={modelFamily.includes(fam) ? 'default' : 'outline'}
                                                    size="sm"
                                                    onClick={() => toggleModelFamily(fam)}
                                                    className={`text-xs ${modelFamily.includes(fam) ? 'bg-bajaj-orange hover:bg-bajaj-orange/90 text-white' : 'border-white/10 text-white/60'}`}
                                                >
                                                    {fam}
                                                </Button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Price range */}
                                    <div>
                                        <Label className="text-white/60 mb-2 block">Price Range</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                type="number"
                                                placeholder="Min"
                                                value={minPrice}
                                                onChange={e => { setMinPrice(e.target.value); setPage(1); }}
                                                className="bg-white/5 border-white/10 text-white text-sm"
                                            />
                                            <Input
                                                type="number"
                                                placeholder="Max"
                                                value={maxPrice}
                                                onChange={e => { setMaxPrice(e.target.value); setPage(1); }}
                                                className="bg-white/5 border-white/10 text-white text-sm"
                                            />
                                        </div>
                                    </div>

                                    {/* Availability */}
                                    <div>
                                        <Label className="text-white/60 mb-2 block">Availability</Label>
                                        <div className="flex gap-2">
                                            {[{ v: 'IN_STOCK', l: 'In Stock' }, { v: 'PRE_ORDER', l: 'Pre-order' }].map(a => (
                                                <Button
                                                    key={a.v}
                                                    variant={availability === a.v ? 'default' : 'outline'}
                                                    size="sm"
                                                    onClick={() => { setAvailability(availability === a.v ? '' : a.v); setPage(1); }}
                                                    className={availability === a.v ? 'bg-bajaj-orange hover:bg-bajaj-orange/90 text-white' : 'border-white/10 text-white/60'}
                                                >
                                                    {a.l}
                                                </Button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* CC */}
                                <div>
                                    <Label className="text-white/60 mb-2 block">Engine Capacity (CC)</Label>
                                    <div className="flex flex-wrap gap-1.5">
                                        {CC_OPTIONS.map(cc => (
                                            <Button
                                                key={cc}
                                                variant={selectedCc.includes(cc) ? 'default' : 'outline'}
                                                size="sm"
                                                onClick={() => toggleCc(cc)}
                                                className={`text-xs ${selectedCc.includes(cc) ? 'bg-bajaj-orange hover:bg-bajaj-orange/90 text-white' : 'border-white/10 text-white/60'}`}
                                            >
                                                {cc === 0 ? 'Electric' : `${cc}cc`}
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Results count */}
                <div className="flex items-center justify-between mb-6">
                    <p className="text-white/40 text-sm">
                        {meta.total} {meta.total === 1 ? 'model' : 'models'} found
                    </p>
                </div>

                {/* Product grid */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="glass-card rounded-2xl overflow-hidden animate-pulse">
                                <div className="h-48 bg-white/5" />
                                <div className="p-6 space-y-3">
                                    <div className="h-5 bg-white/5 rounded w-3/4" />
                                    <div className="h-4 bg-white/5 rounded w-1/2" />
                                    <div className="h-6 bg-white/5 rounded w-1/3" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : products.length === 0 ? (
                    <div className="text-center py-20">
                        <Bike className="w-16 h-16 text-white/10 mx-auto mb-4" />
                        <h3 className="text-xl text-white/60 mb-2">No models found</h3>
                        <p className="text-white/30 mb-4">Try adjusting your search or filters</p>
                        <Button variant="outline" size="sm" onClick={clearFilters} className="border-white/10 text-white/60">
                            Clear Filters
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {products.map((product, i) => (
                            <motion.div
                                key={product.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                            >
                                <Link href={`/inventory/${product.slug}`}>
                                    <div className="group tilt-card glass-card rounded-2xl overflow-hidden cursor-pointer h-full">
                                        <div className="h-48 bg-gradient-to-br from-white/5 to-white/[0.02] flex items-center justify-center relative overflow-hidden">
                                            {product.images?.[0] ? (
                                                <img src={product.images[0]} alt={product.name} className="w-full h-full object-contain p-4 group-hover:scale-125 transition-transform duration-500" />
                                            ) : (
                                                <Bike className="w-20 h-20 text-white/10 group-hover:text-white/20 transition-all duration-500 group-hover:scale-110" />
                                            )}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                                            <div className="absolute top-3 right-3 flex gap-1.5">
                                                {product.tags?.slice(0, 2).map((tag: string) => (
                                                    <Badge key={tag} className="bg-bajaj-orange/90 text-white border-none text-[10px]">{tag}</Badge>
                                                ))}
                                            </div>
                                            {product.availability === 'PRE_ORDER' && (
                                                <Badge className="absolute top-3 left-3 bg-blue-500/90 text-white border-none text-[10px]">Pre-order</Badge>
                                            )}
                                        </div>
                                        <div className="p-5">
                                            <div className="flex items-start justify-between mb-1">
                                                <h3 className="text-lg font-display font-bold text-white group-hover:text-bajaj-orange transition-colors leading-tight">
                                                    {product.name}
                                                </h3>
                                            </div>
                                            <p className="text-white/40 text-sm mb-3">
                                                {product.cc > 0 ? `${product.cc}cc` : 'Electric'} • {product.modelFamily} • {product.year}
                                            </p>
                                            <div className="flex flex-wrap gap-1 mb-3">
                                                {product.keyFeatures?.slice(0, 3).map((f: string) => (
                                                    <span key={f} className="text-[10px] text-white/30 bg-white/5 px-2 py-0.5 rounded-full">{f}</span>
                                                ))}
                                            </div>
                                            <div className="flex items-end justify-between">
                                                <div>
                                                    <span className="text-2xl font-bold text-white">{formatPrice(product.discountedPrice || product.price)}</span>
                                                    {product.discountedPrice && (
                                                        <span className="text-sm text-white/30 line-through ml-2">{formatPrice(product.price)}</span>
                                                    )}
                                                </div>
                                                <ChevronRight className="w-5 h-5 text-white/20 group-hover:text-bajaj-orange group-hover:translate-x-1 transition-all" />
                                            </div>
                                            {product.emiStarting && (
                                                <p className="text-xs text-bajaj-orange/70 mt-2">EMI from {formatPrice(product.emiStarting)}/mo</p>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {meta.totalPages > 1 && (
                    <div className="flex items-center justify-center gap-4 mt-12">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page <= 1}
                            onClick={() => setPage(p => p - 1)}
                            className="border-white/10 text-white/60 disabled:opacity-30"
                        >
                            <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                        </Button>
                        <span className="text-white/40 text-sm">
                            Page {meta.page} of {meta.totalPages}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page >= meta.totalPages}
                            onClick={() => setPage(p => p + 1)}
                            className="border-white/10 text-white/60 disabled:opacity-30"
                        >
                            Next <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                    </div>
                )}
            </div>
        </main>
    );
}
