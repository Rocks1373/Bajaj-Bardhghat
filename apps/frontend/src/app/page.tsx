'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import {
    ChevronRight, Wallet, ArrowRightLeft, Phone, Bike, Zap, Star, MapPin, Mail,
    MessageCircle, ChevronDown, Menu, X, Bluetooth, Gauge, Shield, Flame, Fuel,
    Cpu, Eye, BarChart3, Wrench, Calendar, FileDown, TestTube, GitCompare,
    Quote, ArrowRight, Sparkles, Users, Clock, Tag, ChevronLeft, Box, Cuboid
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatPrice, formatEMI } from '@/lib/utils';
import ChatAssistant from '@/components/chat-assistant';
import EMICalculator from '@/components/EMICalculator';
import entryConfig from '@/data/entry-config.json';
import { api } from '@/lib/api';

// ─── ANIMATED PARTICLE BACKGROUND ─────────────────────
function ParticleField() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        const particles: { x: number; y: number; vx: number; vy: number; size: number; opacity: number }[] = [];
        for (let i = 0; i < 60; i++) {
            particles.push({
                x: Math.random() * canvas.width, y: Math.random() * canvas.height,
                vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3,
                size: Math.random() * 2 + 0.5, opacity: Math.random() * 0.3 + 0.1,
            });
        }
        let mouseX = canvas.width / 2, mouseY = canvas.height / 2;
        const handleMouseMove = (e: MouseEvent) => { mouseX = e.clientX; mouseY = e.clientY; };
        window.addEventListener('mousemove', handleMouseMove);
        let animId: number;
        function animate() {
            ctx!.clearRect(0, 0, canvas!.width, canvas!.height);
            particles.forEach(p => {
                const dx = mouseX - p.x, dy = mouseY - p.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 200) { p.vx += dx * 0.00002; p.vy += dy * 0.00002; }
                p.x += p.vx; p.y += p.vy;
                if (p.x < 0 || p.x > canvas!.width) p.vx *= -1;
                if (p.y < 0 || p.y > canvas!.height) p.vy *= -1;
                ctx!.beginPath(); ctx!.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx!.fillStyle = `rgba(255, 107, 0, ${p.opacity})`; ctx!.fill();
            });
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x, dy = particles[i].y - particles[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 120) {
                        ctx!.beginPath(); ctx!.moveTo(particles[i].x, particles[i].y);
                        ctx!.lineTo(particles[j].x, particles[j].y);
                        ctx!.strokeStyle = `rgba(255, 107, 0, ${0.05 * (1 - dist / 120)})`; ctx!.stroke();
                    }
                }
            }
            animId = requestAnimationFrame(animate);
        }
        animate();
        const handleResize = () => { canvas!.width = window.innerWidth; canvas!.height = window.innerHeight; };
        window.addEventListener('resize', handleResize);
        return () => { window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('resize', handleResize); cancelAnimationFrame(animId); };
    }, []);
    return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" />;
}

// ─── NAVBAR ────────────────────────────────────────────
function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    useEffect(() => {
        const handler = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handler);
        return () => window.removeEventListener('scroll', handler);
    }, []);

    const navLinks = [
        { label: 'Models', href: '#models' },
        { label: 'Compare', href: '#compare' },
        { label: 'EMI Calculator', href: '#emi' },
        { label: 'About Bajaj', href: '#about-bajaj' },
        { label: 'Reviews', href: '#reviews' },
        { label: 'Service', href: '#service' },
        { label: 'Contact', href: '#contact' },
    ];

    return (
        <motion.nav
            initial={{ y: -100 }} animate={{ y: 0 }}
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'bg-bajaj-dark/90 backdrop-blur-xl border-b border-white/5 shadow-2xl' : 'bg-transparent'}`}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16 lg:h-20">
                    <Link href="/" className="flex items-center gap-2">
                        {/* Custom Auto Logo */}
                        <img src="/logo.jpg" alt="Logo" className="h-12 w-auto rounded object-contain hover:scale-125 transition-transform duration-300 transform origin-center" />
                        <div className="flex flex-col -space-y-1">
                            <div className="flex items-baseline gap-1">
                                <span className="text-xl font-black text-white tracking-tight" style={{ letterSpacing: '-0.03em' }}>ULHAS</span>
                                <span className="text-xl font-black text-bajaj-orange tracking-tight" style={{ letterSpacing: '-0.03em' }}>BAJAJ</span>
                            </div>
                            <span className="text-[9px] text-white/35 tracking-[0.25em] uppercase">Authorized Bajaj Dealer</span>
                        </div>
                    </Link>

                    <div className="hidden xl:flex items-center gap-6">
                        {navLinks.map(link => (
                            <a key={link.href} href={link.href} className="text-sm text-white/60 hover:text-white transition-colors">{link.label}</a>
                        ))}
                        <Link href="/admin">
                            <Button variant="outline" size="sm" className="border-white/10 text-white/70 hover:text-white hover:border-white/20">Admin</Button>
                        </Link>
                    </div>

                    <button className="xl:hidden text-white" onClick={() => setMobileOpen(!mobileOpen)}>
                        {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>

                <AnimatePresence>
                    {mobileOpen && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="xl:hidden pb-6 space-y-3"
                        >
                            {navLinks.map(link => (
                                <a key={link.href} href={link.href} className="block text-white/70 hover:text-white py-2" onClick={() => setMobileOpen(false)}>
                                    {link.label}
                                </a>
                            ))}
                            <Link href="/inventory" className="block text-white/70 hover:text-white py-2" onClick={() => setMobileOpen(false)}>Inventory</Link>
                            <Link href="/admin" onClick={() => setMobileOpen(false)}>
                                <Button variant="outline" size="sm" className="border-white/10 text-white/70">Admin</Button>
                            </Link>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.nav>
    );
}

// ─── HERO SECTION ──────────────────────────────────────
function Hero() {
    const heroRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
    const y = useTransform(scrollYProgress, [0, 1], [0, 200]);
    const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

    return (
        <section ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-bajaj-darker/90 bg-cover bg-center opacity-50" style={{ backgroundImage: "url('/hero_bg.jpg')" }} />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-bajaj-dark/80 to-bajaj-darker" />
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-bajaj-orange/5 rounded-full blur-[128px] animate-glow" />
            <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-bajaj-blue/5 rounded-full blur-[100px] animate-glow" style={{ animationDelay: '1.5s' }} />

            {/* Floating bike silhouettes — subtle BG decoration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
                {[
                    { left: '5%', top: '20%', delay: 0, duration: 9, scale: 2.5 },
                    { left: '38%', top: '55%', delay: 2, duration: 11, scale: 2 },
                    { left: '70%', top: '15%', delay: 4, duration: 10, scale: 3 },
                ].map((item, i) => (
                    <motion.div
                        key={i}
                        className="absolute"
                        style={{ left: item.left, top: item.top }}
                        animate={{ x: [0, 18, 0], y: [0, -14, 0] }}
                        transition={{ duration: item.duration, repeat: Infinity, ease: 'easeInOut', delay: item.delay }}
                    >
                        <Bike
                            style={{ width: 180, height: 180, opacity: 0.035, transform: `scale(${item.scale})`, transformOrigin: 'center', color: '#ff6b00' }}
                        />
                    </motion.div>
                ))}
            </div>

            <motion.div style={{ y, opacity }} className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}>
                    <Badge variant="outline" className="border-bajaj-orange/30 text-bajaj-orange mb-6 px-4 py-1.5 text-sm">
                        <Zap className="w-3.5 h-3.5 mr-1.5" /> Authorized Bajaj Dealer
                    </Badge>

                    <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-display font-black tracking-tight text-white leading-[0.9] mb-4">
                        <span className="block">RIDE THE FUTURE.</span>
                        <span className="gradient-text block">OWN THE POWER.</span>
                    </h1>

                    <p className="text-lg sm:text-xl text-white/50 max-w-3xl mx-auto mb-10 font-light leading-relaxed">
                        Explore the complete range of Bajaj motorcycles with full specifications, smart features,
                        and 360° interactive view. Your dream ride is just a click away.
                    </p>

                    {/* Primary CTAs */}
                    <div className="flex flex-wrap gap-4 justify-center">
                        <a href="#models">
                            <Button variant="glow" size="xl" className="group">
                                <Eye className="w-5 h-5 mr-2" /> Explore Models <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </a>
                        <a href="#contact">
                            <Button variant="outline" size="xl" className="border-white/10 text-white hover:bg-white/5">
                                <TestTube className="w-5 h-5 mr-2" /> Book Test Ride
                            </Button>
                        </a>
                    </div>

                    {/* Secondary CTAs */}
                    <div className="flex flex-wrap gap-4 justify-center mt-4">
                        <a href="#compare">
                            <Button variant="ghost" size="lg" className="text-white/60 hover:text-white">
                                <GitCompare className="w-4 h-4 mr-2" /> Compare Bikes
                            </Button>
                        </a>
                        <a href="#emi">
                            <Button variant="ghost" size="lg" className="text-white/60 hover:text-white">
                                <Wallet className="w-4 h-4 mr-2" /> EMI Calculator
                            </Button>
                        </a>
                        <a href={`https://wa.me/${entryConfig.showroom.whatsapp}?text=Hi%20Ulhas%20Bajaj!%20I%27m%20interested%20in%20a%20Bajaj%20bike.`} target="_blank" rel="noopener noreferrer">
                            <Button variant="ghost" size="lg" className="text-white/60 hover:text-white">
                                <MessageCircle className="w-4 h-4 mr-2" /> WhatsApp Enquiry
                            </Button>
                        </a>
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }} className="absolute bottom-8 left-1/2 -translate-x-1/2">
                    <motion.div animate={{ y: [0, 10, 0] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}>
                        <ChevronDown className="w-6 h-6 text-white/30" />
                    </motion.div>
                </motion.div>
            </motion.div>
        </section>
    );
}

// ─── HERO BIKES SHOWCASE (Top Models with Real Images) ──
function HeroBikesShowcase() {
    const topBikes = entryConfig.models.filter(m => m.highlight);
    const [activeIndex, setActiveIndex] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setActiveIndex(prev => (prev + 1) % topBikes.length);
        }, 4000);
        return () => clearInterval(timer);
    }, [topBikes.length]);

    return (
        <section className="relative py-8 pb-0 overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Scrollable bike strip */}
                <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar snap-x snap-mandatory">
                    {topBikes.map((bike, i) => (
                        <Link key={bike.slug} href={`/models/${bike.slug}`}>
                            <motion.div
                                initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className={`flex-shrink-0 w-64 md:w-72 snap-center group cursor-pointer relative rounded-2xl overflow-hidden border transition-all duration-500 ${activeIndex === i ? 'border-bajaj-orange/40 shadow-lg shadow-bajaj-orange/10' : 'border-white/5 hover:border-white/10'
                                    }`}
                                onMouseEnter={() => setActiveIndex(i)}
                            >
                                <div className="h-44 bg-gradient-to-br from-white/[0.04] to-white/[0.01] relative flex items-center justify-center overflow-hidden">
                                    {(bike as any).image ? (
                                        <img
                                            src={(bike as any).image}
                                            alt={bike.model_name}
                                            className="w-full h-full object-contain p-4 group-hover:scale-125 transition-transform duration-700 transform origin-center"
                                            loading="lazy"
                                        />
                                    ) : (
                                        <Bike className="w-16 h-16 text-white/10" />
                                    )}
                                    <Badge className="absolute top-3 right-3 bg-bajaj-orange/90 text-white border-none text-[10px]">{bike.tag}</Badge>
                                </div>
                                <div className="p-4 bg-gradient-to-t from-black/60 to-transparent">
                                    <h3 className="text-sm font-display font-bold text-white group-hover:text-bajaj-orange transition-colors">{bike.model_name}</h3>
                                    <div className="flex items-center justify-between mt-1">
                                        <span className="text-lg font-bold gradient-text">{formatPrice(bike.price)}</span>
                                        <span className="text-[10px] text-white/30">{(bike as any).cc ? `${(bike as any).cc}cc` : bike.model_family}</span>
                                    </div>
                                </div>
                            </motion.div>
                        </Link>
                    ))}
                </div>

                {/* Dot indicators */}
                <div className="flex items-center justify-center gap-2 mt-4 pb-4">
                    {topBikes.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => setActiveIndex(i)}
                            className={`h-1.5 rounded-full transition-all duration-300 ${activeIndex === i ? 'w-8 bg-bajaj-orange' : 'w-2 bg-white/10 hover:bg-white/20'}`}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}

// ─── BIKE QUOTES MARQUEE ──────────────────────────────
function BikeQuotes() {
    const quotes = [
        { text: 'Born to Ride. Built to Lead.', icon: Flame },
        { text: 'Power. Precision. Pulsar.', icon: Zap },
        { text: 'Not Just a Bike. A Statement.', icon: Star },
        { text: 'Ride Beyond Limits.', icon: ArrowRight },
    ];

    return (
        <section className="py-12 overflow-hidden border-y border-white/5 bg-gradient-to-r from-bajaj-orange/5 via-transparent to-bajaj-gold/5">
            <div className="relative">
                <motion.div
                    animate={{ x: [0, -50 * quotes.length * 8] }}
                    transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
                    className="flex gap-16 whitespace-nowrap"
                >
                    {[...quotes, ...quotes, ...quotes, ...quotes].map((q, i) => (
                        <div key={i} className="flex items-center gap-3 text-white/30 font-display text-xl md:text-2xl font-bold">
                            <q.icon className="w-6 h-6 text-bajaj-orange/40 flex-shrink-0" />
                            <span className="italic">&ldquo;{q.text}&rdquo;</span>
                        </div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}

// ─── ABOUT BAJAJ AUTO SECTION ─────────────────────────
function AboutBajaj() {
    const techFeatures = [
        { icon: Bluetooth, title: 'Bluetooth Connectivity', desc: 'Connect your smartphone for navigation, calls & music control directly from the console.' },
        { icon: Gauge, title: 'Digital Console', desc: 'Full-TFT or LCD digital instrument cluster with trip computer, gear indicator & more.' },
        { icon: Shield, title: 'ABS System', desc: 'Single or dual-channel Anti-lock Braking System for superior stopping power & safety.' },
        { icon: Sparkles, title: 'Ride Modes', desc: 'Switch between Sport, City & Rain modes for optimized performance in every condition.' },
        { icon: Fuel, title: 'Fuel Efficiency', desc: 'DTS-i technology delivers exceptional mileage without compromising power output.' },
        { icon: Cpu, title: 'DTS-i Technology', desc: 'Digital Twin Spark ignition — twin spark plugs for better combustion, more power, less emissions.' },
    ];

    return (
        <section id="about-bajaj" className="py-24 relative">
            <div className="absolute top-0 left-0 w-1/2 h-full bg-gradient-to-r from-bajaj-orange/[0.02] to-transparent" />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <Badge variant="outline" className="border-bajaj-orange/30 text-bajaj-orange mb-4 px-4 py-1.5">
                        <Sparkles className="w-3.5 h-3.5 mr-1.5" /> Since 1945
                    </Badge>
                    <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">About Bajaj Auto</h2>
                    <p className="text-white/40 text-lg max-w-3xl mx-auto leading-relaxed">
                        Bajaj Auto is one of the world&apos;s leading manufacturers of motorcycles and three-wheelers. With a legacy
                        spanning 80+ years, Bajaj is known for innovation, performance, and value. From the iconic Pulsar that
                        redefined sportbiking in India to the futuristic Chetak Electric, Bajaj continues to set benchmarks in the
                        global two-wheeler industry. Present in over 70 countries with 18 million annual units sold.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {techFeatures.map((feature, i) => (
                        <motion.div
                            key={feature.title}
                            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            className="glass-card rounded-2xl p-6 group hover:border-bajaj-orange/20 transition-all duration-500"
                        >
                            <div className="w-12 h-12 rounded-xl bg-bajaj-orange/10 flex items-center justify-center mb-4 group-hover:bg-bajaj-orange/20 transition-colors">
                                <feature.icon className="w-6 h-6 text-bajaj-orange" />
                            </div>
                            <h3 className="text-white font-display font-bold text-lg mb-2">{feature.title}</h3>
                            <p className="text-white/40 text-sm leading-relaxed">{feature.desc}</p>
                        </motion.div>
                    ))}
                </div>

                {/* Stats bar */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                    className="mt-16 glass-card rounded-2xl p-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center"
                >
                    {[
                        { value: '80+', label: 'Years Legacy' },
                        { value: '70+', label: 'Countries' },
                        { value: '18M+', label: 'Annual Units' },
                        { value: '#1', label: 'Sport Bike Brand' },
                    ].map((stat) => (
                        <div key={stat.label}>
                            <div className="text-3xl md:text-4xl font-display font-black gradient-text">{stat.value}</div>
                            <div className="text-sm text-white/40 mt-1">{stat.label}</div>
                        </div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}

// ─── FEATURED MODELS (Dynamic from config & DB) ────────────
function FeaturedModels() {
    const [dbModels, setDbModels] = useState<any[]>([]);

    useEffect(() => {
        api.getProducts({ limit: '100' })
            .then(res => {
                const mapped = res.data.map((p: any) => ({
                    ...p,
                    model_name: p.name,
                    image: p.images?.[0] || null,
                    has_3d: !!p.model_3d_url,
                }));
                // Filter out used bikes from the main lineup
                setDbModels(mapped.filter((m: any) => !m.is_used));
            })
            .catch(err => console.error("Failed to load products from DB", err));
    }, []);

    // Merge DB models with entryConfig models (DB wins if slug matches)
    const allModels = useMemo(() => {
        const baseModels = [...entryConfig.models];
        const dbDict = new Map(dbModels.map(m => [m.slug, m]));
        return baseModels.map(m => dbDict.has(m.slug) ? { ...m, ...dbDict.get(m.slug) } : m);
    }, [dbModels]);

    const families = ['All', ...Array.from(new Set(allModels.map(m => m.model_family)))];
    const [selectedFamily, setSelectedFamily] = useState('All');

    const filteredModels = selectedFamily === 'All'
        ? allModels
        : allModels.filter(m => m.model_family === selectedFamily);

    const categoryColors: Record<string, string> = {
        SPORT: 'from-red-500/10 to-orange-500/10',
        TOURING: 'from-blue-500/10 to-purple-500/10',
        ELECTRIC: 'from-green-500/10 to-emerald-500/10',
        CRUISER: 'from-indigo-500/10 to-blue-500/10',
        COMMUTER: 'from-yellow-500/10 to-amber-500/10',
    };

    const categoryIcons: Record<string, string> = {
        SPORT: '🏍️',
        TOURING: '🛣️',
        ELECTRIC: '⚡',
        CRUISER: '🏖️',
        COMMUTER: '🚗',
    };

    return (
        <section id="models" className="relative py-24 overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <Badge variant="outline" className="border-bajaj-orange/30 text-bajaj-orange mb-4 px-4 py-1.5">
                        <Bike className="w-3.5 h-3.5 mr-1.5" /> Latest Lineup
                    </Badge>
                    <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">Featured Models</h2>
                    <p className="text-white/40 text-lg max-w-xl mx-auto">Handpicked performance machines from the complete Bajaj range</p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                    className="flex flex-wrap justify-center gap-2 mb-12"
                >
                    {families.map((family) => (
                        <button
                            key={family}
                            onClick={() => setSelectedFamily(family)}
                            className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${selectedFamily === family
                                ? 'bg-bajaj-orange text-white shadow-lg shadow-bajaj-orange/20'
                                : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                                }`}
                        >
                            {family}
                        </button>
                    ))}
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <AnimatePresence mode="popLayout">
                        {filteredModels.map((model, i) => (
                            <motion.div
                                key={model.slug}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ duration: 0.3 }}
                            >
                                <Link href={`/models/${model.slug}`}>
                                    <div className="group tilt-card glass-card rounded-2xl overflow-hidden cursor-pointer h-full flex flex-col">
                                        <div className={`h-52 bg-gradient-to-br ${categoryColors[model.category] || 'from-gray-500/10 to-gray-400/10'} flex items-center justify-center relative overflow-hidden`}>
                                            {/* Background Typography (30% opacity) */}
                                            <div className="absolute inset-0 flex items-center justify-center opacity-30 select-none overflow-hidden pointer-events-none">
                                                <span className="text-8xl font-black font-display text-white/40 tracking-tighter whitespace-nowrap transform -rotate-12">
                                                    {model.model_family.toUpperCase()}
                                                </span>
                                            </div>

                                            {(model as any).image ? (
                                                <img
                                                    src={(model as any).image}
                                                    alt={model.model_name}
                                                    className={`w-full h-full object-contain p-4 group-hover:scale-125 transition-transform duration-700 relative z-10 ${model.availability === 'OUT_OF_STOCK' ? 'grayscale opacity-50' : ''}`}
                                                    loading="lazy"
                                                />
                                            ) : (
                                                <div className="relative z-10 flex flex-col items-center justify-center">
                                                    <span className="text-6xl opacity-20 group-hover:opacity-30 transition-opacity duration-500">{categoryIcons[model.category] || '🏍️'}</span>
                                                    <Bike className="w-20 h-20 text-white/5 absolute group-hover:text-white/10 transition-all duration-500 group-hover:scale-110" />
                                                </div>
                                            )}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-transparent z-10 pointer-events-none" />

                                            {/* 3D Data Indicator */}
                                            <div className={`absolute top-4 right-4 z-20 flex items-center justify-center p-2 rounded-full backdrop-blur-md border shadow-lg ${(model as any).has_3d ? 'bg-green-500/20 border-green-500/50 text-green-400' : 'bg-red-500/20 border-red-500/50 text-red-400'}`} title={(model as any).has_3d ? '3D View Available' : '3D View Unavailable'}>
                                                <Box className="w-4 h-4" />
                                            </div>

                                            {model.availability === 'OUT_OF_STOCK' && (
                                                <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
                                                    <div className="bg-red-500/80 backdrop-blur-md text-white font-bold px-6 py-2 rounded-full -rotate-12 border border-red-400/50 uppercase tracking-widest text-lg shadow-xl shadow-red-500/20">
                                                        OUT OF STOCK
                                                    </div>
                                                </div>
                                            )}

                                            {model.tag && <Badge className="absolute top-4 left-4 z-20 bg-bajaj-orange/90 text-white border-none shadow-lg">{model.tag}</Badge>}
                                            {(model as any).cc && <span className="absolute bottom-3 right-4 z-20 text-white/50 text-xs font-bold bg-black/40 px-2 py-1 rounded">{(model as any).cc}cc</span>}
                                            <Badge variant="outline" className="absolute bottom-3 left-4 z-20 border-white/20 text-white/60 bg-black/40 text-[10px]">{model.category}</Badge>
                                        </div>
                                        <div className="p-6 flex-grow flex flex-col">
                                            <h3 className="text-xl font-display font-bold text-white mb-1 group-hover:text-bajaj-orange transition-colors">
                                                {model.model_name}
                                            </h3>
                                            <p className="text-white/40 text-sm mb-3">{model.model_family} • Bajaj</p>
                                            <div className="flex items-center justify-between">
                                                <span className="text-2xl font-bold text-white">{formatPrice(model.price)}</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-white/30">EMI {formatPrice(formatEMI(model.price))}/mo</span>
                                                    <ChevronRight className="w-5 h-5 text-white/30 group-hover:text-bajaj-orange group-hover:translate-x-1 transition-all" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mt-12">
                    <Link href="/inventory">
                        <Button variant="outline" size="lg" className="border-white/10 text-white hover:bg-white/5 group">
                            View All {entryConfig.models.length} Models <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </Link>
                </motion.div>
            </div>
        </section>
    );
}

// ─── COMPARE BIKES SECTION ────────────────────────────
function CompareBikes() {
    const [dbModels, setDbModels] = useState<any[]>([]);

    useEffect(() => {
        api.getProducts({ limit: '100' })
            .then(res => {
                const mapped = res.data.map((p: any) => ({
                    ...p,
                    model_name: p.name,
                    image: p.images?.[0] || null,
                    has_3d: !!p.model_3d_url,
                }));
                setDbModels(mapped.filter((m: any) => !m.is_used));
            })
            .catch(console.error);
    }, []);

    const allModels = useMemo(() => {
        const baseModels = [...entryConfig.models];
        const dbDict = new Map(dbModels.map(m => [m.slug, m]));
        return baseModels.map(m => dbDict.has(m.slug) ? { ...m, ...dbDict.get(m.slug) } : m);
    }, [dbModels]);

    const [bike1, setBike1] = useState(allModels[0]?.slug || '');
    const [bike2, setBike2] = useState(allModels[1]?.slug || '');

    useEffect(() => {
        if (!bike1 && allModels.length > 0) setBike1(allModels[0].slug);
        if (!bike2 && allModels.length > 1) setBike2(allModels[1].slug);
    }, [allModels]);

    const model1 = allModels.find(m => m.slug === bike1);
    const model2 = allModels.find(m => m.slug === bike2);

    return (
        <section id="compare" className="py-24 relative">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-bajaj-blue/[0.02] to-transparent" />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <Badge variant="outline" className="border-bajaj-gold/30 text-bajaj-gold mb-4 px-4 py-1.5">
                        <GitCompare className="w-3.5 h-3.5 mr-1.5" /> Side by Side
                    </Badge>
                    <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">Compare Bikes</h2>
                    <p className="text-white/40 text-lg max-w-xl mx-auto">Select two models to see how they stack up</p>
                </motion.div>

                <div className="glass-card rounded-2xl p-6 md:p-8">
                    {/* Selectors */}
                    <div className="grid grid-cols-2 gap-4 md:gap-8 mb-8">
                        <div>
                            <label className="block text-sm text-white/40 mb-2">Bike 1</label>
                            <select
                                value={bike1}
                                onChange={(e) => setBike1(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-bajaj-orange/50 appearance-none cursor-pointer"
                            >
                                {allModels.map(m => <option key={m.slug} value={m.slug} className="bg-bajaj-dark">{m.model_name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm text-white/40 mb-2">Bike 2</label>
                            <select
                                value={bike2}
                                onChange={(e) => setBike2(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-bajaj-orange/50 appearance-none cursor-pointer"
                            >
                                {allModels.map(m => <option key={m.slug} value={m.slug} className="bg-bajaj-dark">{m.model_name}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Comparison table */}
                    {model1 && model2 && (
                        <div className="space-y-0">
                            {[
                                { label: 'Price', v1: formatPrice(model1.price), v2: formatPrice(model2.price), highlight: true },
                                { label: 'Category', v1: model1.category, v2: model2.category },
                                { label: 'Family', v1: model1.model_family, v2: model2.model_family },
                                { label: 'Monthly EMI', v1: formatPrice(formatEMI(model1.price)), v2: formatPrice(formatEMI(model2.price)) },
                            ].map((row, i) => (
                                <div key={row.label} className={`grid grid-cols-3 gap-4 py-4 px-4 rounded-lg ${i % 2 === 0 ? 'bg-white/[0.02]' : ''}`}>
                                    <div className="text-sm text-white/40 flex items-center">{row.label}</div>
                                    <div className={`text-sm text-center ${row.highlight ? 'font-bold text-bajaj-orange text-lg' : 'text-white'}`}>{row.v1}</div>
                                    <div className={`text-sm text-center ${row.highlight ? 'font-bold text-bajaj-orange text-lg' : 'text-white'}`}>{row.v2}</div>
                                </div>
                            ))}

                            <div className="grid grid-cols-2 gap-4 mt-6">
                                <Link href={`/models/${model1.slug}`}>
                                    <Button variant="outline" className="w-full border-white/10 text-white hover:bg-white/5">
                                        View {model1.model_name} <ChevronRight className="w-4 h-4 ml-2" />
                                    </Button>
                                </Link>
                                <Link href={`/models/${model2.slug}`}>
                                    <Button variant="outline" className="w-full border-white/10 text-white hover:bg-white/5">
                                        View {model2.model_name} <ChevronRight className="w-4 h-4 ml-2" />
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}

// ─── EMI SECTION (uses EMICalculator component) ───────
function EMISection() {
    return (
        <section id="emi" className="py-24 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-bajaj-orange/5 via-transparent to-bajaj-gold/5" />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                    className="text-center mb-12"
                >
                    <Badge variant="outline" className="border-bajaj-orange/30 text-bajaj-orange mb-4 px-4 py-1.5">
                        <Wallet className="w-3.5 h-3.5 mr-1.5" /> Smart Finance
                    </Badge>
                    <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">EMI Calculator</h2>
                    <p className="text-white/40 text-lg max-w-xl mx-auto">Plan your purchase with our interactive finance tool</p>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                    <EMICalculator defaultPrice={150000} />
                </motion.div>

                <div className="mt-8 glass-card rounded-2xl p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: 'Interest from', value: '8.99%', icon: BarChart3 },
                        { label: 'Tenure up to', value: '60 months', icon: Calendar },
                        { label: 'Down Payment', value: 'From 15%', icon: Tag },
                        { label: 'Approval', value: 'Instant', icon: Clock },
                    ].map(f => (
                        <div key={f.label} className="text-center">
                            <f.icon className="w-5 h-5 text-bajaj-orange mx-auto mb-2" />
                            <div className="text-lg font-bold text-white">{f.value}</div>
                            <div className="text-xs text-white/30">{f.label}</div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

// ─── FINANCE BANNER ───────────────────────────────────
function FinanceBanner() {
    return (
        <section id="finance" className="py-24 relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                    className="glass-card rounded-3xl p-8 md:p-12 animated-border overflow-hidden"
                >
                    <div className="grid md:grid-cols-2 gap-8 items-center">
                        <div>
                            <Badge variant="outline" className="border-bajaj-orange/30 text-bajaj-orange mb-4">
                                <Wallet className="w-3 h-3 mr-1" /> Easy Finance
                            </Badge>
                            <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">
                                EMI Starting From <span className="gradient-text">₹1,999/mo</span>
                            </h2>
                            <p className="text-white/50 mb-6 leading-relaxed">
                                Ride home your dream Bajaj today. We partner with leading banks and NBFCs for the most competitive rates and flexible tenure.
                            </p>
                            <ul className="space-y-3 mb-8">
                                {['Interest rates from 8.99% p.a.', 'Tenure: 12 to 60 months', 'Minimal documentation', 'Instant approval for select profiles'].map((item, i) => (
                                    <motion.li key={i} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                                        className="flex items-center gap-3 text-white/70">
                                        <div className="w-5 h-5 rounded-full bg-bajaj-orange/10 flex items-center justify-center flex-shrink-0">
                                            <div className="w-2 h-2 rounded-full bg-bajaj-orange" />
                                        </div>
                                        {item}
                                    </motion.li>
                                ))}
                            </ul>
                            <a href="#emi">
                                <Button variant="glow" size="lg">Calculate Your EMI <ChevronRight className="w-4 h-4 ml-2" /></Button>
                            </a>
                        </div>
                        <div className="hidden md:flex items-center justify-center">
                            <div className="relative">
                                <div className="w-64 h-64 rounded-full bg-gradient-to-br from-bajaj-orange/10 to-bajaj-gold/10 flex items-center justify-center animate-float">
                                    <Wallet className="w-32 h-32 text-bajaj-orange/20" />
                                </div>
                                <div className="absolute -top-4 -right-4 bg-bajaj-dark/80 backdrop-blur-sm rounded-xl p-4 border border-white/5">
                                    <div className="text-sm text-white/40">APR from</div>
                                    <div className="text-2xl font-bold text-bajaj-orange">8.99%</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <p className="text-xs text-white/20 mt-6">*Terms and conditions apply. Interest rates vary based on credit profile. Processing fees additional.</p>
                </motion.div>
            </div>
        </section>
    );
}

// ─── EXCHANGE SECTION ─────────────────────────────────
function ExchangeSection() {
    return (
        <section id="exchange" className="py-24">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                    className="glass-card rounded-3xl p-8 md:p-12 overflow-hidden relative"
                >
                    <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-bajaj-gold/5 to-transparent" />
                    <div className="relative z-10 max-w-2xl">
                        <Badge variant="outline" className="border-bajaj-gold/30 text-bajaj-gold mb-4">
                            <ArrowRightLeft className="w-3 h-3 mr-1" /> Exchange Offer
                        </Badge>
                        <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">
                            Trade In, Upgrade, <span className="gradient-text">Save Big</span>
                        </h2>
                        <p className="text-white/50 mb-6 leading-relaxed">
                            Exchange your old two-wheeler (any brand, any condition) and save up to ₹15,000 on a brand new Bajaj.
                            Same-day exchange on all models.
                        </p>
                        <div className="flex flex-wrap gap-4">
                            <Link href="/inventory">
                                <Button variant="glow" size="lg">Get Instant Valuation <ChevronRight className="w-4 h-4 ml-2" /></Button>
                            </Link>
                            <a href={`https://wa.me/${entryConfig.showroom.whatsapp}?text=Hi%20Ulhas%20Bajaj!%20I%27d%20like%20to%20know%20about%20the%20exchange%20offer.`} target="_blank" rel="noopener noreferrer">
                                <Button variant="outline" size="lg" className="border-white/10 text-white hover:bg-white/5">
                                    <MessageCircle className="w-4 h-4 mr-2" /> WhatsApp Us
                                </Button>
                            </a>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}

// ─── SERVICE & SPARE PARTS ────────────────────────────
function ServiceSection() {
    const services = [
        { icon: Wrench, title: 'Expert Service', desc: 'Certified Bajaj technicians with genuine diagnostic tools' },
        { icon: Tag, title: 'Genuine Parts', desc: '100% original Bajaj spare parts with warranty' },
        { icon: Clock, title: 'Quick Turnaround', desc: 'Most services completed within 2-4 hours' },
        { icon: Shield, title: 'Extended Warranty', desc: 'Optional extended warranty up to 5 years' },
    ];

    return (
        <section id="service" className="py-24 relative">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <Badge variant="outline" className="border-bajaj-gold/30 text-bajaj-gold mb-4 px-4 py-1.5">
                        <Wrench className="w-3.5 h-3.5 mr-1.5" /> After Sales
                    </Badge>
                    <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">Service & Spare Parts</h2>
                    <p className="text-white/40 text-lg max-w-xl mx-auto">World-class after-sales support for your Bajaj</p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {services.map((s, i) => (
                        <motion.div
                            key={s.title}
                            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            className="glass-card rounded-2xl p-6 text-center group hover:border-bajaj-gold/20 transition-all"
                        >
                            <div className="w-14 h-14 rounded-2xl bg-bajaj-gold/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-bajaj-gold/20 transition-colors">
                                <s.icon className="w-7 h-7 text-bajaj-gold" />
                            </div>
                            <h3 className="text-white font-display font-bold mb-2">{s.title}</h3>
                            <p className="text-white/40 text-sm">{s.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}

// ─── TESTIMONIALS ─────────────────────────────────────
function Testimonials() {
    const testimonials = [
        { name: 'Rajesh Kumar', model: 'Pulsar NS200', text: 'Incredible experience at Ulhas Bajaj! The staff was knowledgeable and the financing process was smooth. Love my new NS200!', rating: 5 },
        { name: 'Priya Shrestha', model: 'Chetak Electric', text: 'Best decision switching to electric. Ulhas Bajaj made the transition seamless with amazing exchange value for my old scooter.', rating: 5 },
        { name: 'Arun Thapa', model: 'Dominar 400', text: 'The Dominar is a beast! Fair pricing, no hidden charges, and excellent after-sales service. My go-to dealership in Nepal.', rating: 5 },
        { name: 'Sita Rai', model: 'Pulsar N250', text: 'Great riding experience and the showroom team explained every feature in detail. EMI process was hassle-free!', rating: 5 },
        { name: 'Bikram Tamang', model: 'Avenger Cruise 220', text: 'The Avenger is perfect for my weekend highway rides. Super comfortable and Hulhas Auto gave me the best exchange deal.', rating: 5 },
        { name: 'Deepa Gurung', model: 'Pulsar RS200', text: 'Stunning sportbike and amazing service. The team helped me choose the perfect model for my commute and fun rides.', rating: 5 },
    ];

    return (
        <section id="reviews" className="py-24">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <Badge variant="outline" className="border-bajaj-orange/30 text-bajaj-orange mb-4 px-4 py-1.5">
                        <Users className="w-3.5 h-3.5 mr-1.5" /> Happy Riders
                    </Badge>
                    <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">Customer Reviews</h2>
                    <p className="text-white/40 text-lg">Real stories from our valued customers</p>
                </motion.div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {testimonials.map((t, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                        >
                            <div className="glass-card rounded-2xl p-6 h-full flex flex-col">
                                <div className="flex gap-1 mb-4">
                                    {Array.from({ length: t.rating }).map((_, j) => (
                                        <Star key={j} className="w-4 h-4 fill-bajaj-orange text-bajaj-orange" />
                                    ))}
                                </div>
                                <p className="text-white/60 mb-6 leading-relaxed text-sm flex-1">&ldquo;{t.text}&rdquo;</p>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-bajaj-orange/30 to-bajaj-gold/30 flex items-center justify-center text-white font-bold text-sm">
                                        {t.name.charAt(0)}
                                    </div>
                                    <div>
                                        <div className="text-white font-medium text-sm">{t.name}</div>
                                        <div className="text-white/30 text-xs">{t.model} Owner</div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}

// ─── LOCATION MAP ─────────────────────────────────────
function LocationMap() {
    return (
        <section id="location" className="py-24 relative">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                    className="text-center mb-12"
                >
                    <Badge variant="outline" className="border-bajaj-orange/30 text-bajaj-orange mb-4 px-4 py-1.5">
                        <MapPin className="w-3.5 h-3.5 mr-1.5" /> Visit Us
                    </Badge>
                    <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">Find Us</h2>
                    <p className="text-white/40 text-lg">{entryConfig.showroom.address}</p>
                </motion.div>

                <div className="glass-card rounded-2xl overflow-hidden">
                    <div className="grid md:grid-cols-3 gap-0">
                        <div className="md:col-span-2 h-[400px] bg-white/5 relative">
                            <iframe
                                src={entryConfig.showroom.mapEmbedUrl}
                                width="100%" height="100%"
                                style={{ border: 0, filter: 'invert(0.9) hue-rotate(180deg) saturate(0.3) brightness(0.8)' }}
                                allowFullScreen loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                                title="Showroom Location"
                            />
                        </div>
                        <div className="p-8 flex flex-col justify-center space-y-6">
                            <div>
                                <h3 className="text-white font-display font-bold text-xl mb-4">Ulhas Bajaj</h3>
                                <div className="space-y-4 text-white/50 text-sm">
                                    <div className="flex items-start gap-3">
                                        <MapPin className="w-4 h-4 mt-0.5 text-bajaj-orange flex-shrink-0" />
                                        <span>{entryConfig.showroom.address}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <MessageCircle className="w-4 h-4 text-bajaj-orange flex-shrink-0" />
                                        <a href={`https://wa.me/${entryConfig.showroom.whatsapp}?text=Hi%20Ulhas%20Bajaj!`} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">WhatsApp: {entryConfig.showroom.whatsapp}</a>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Mail className="w-4 h-4 text-bajaj-orange flex-shrink-0" />
                                        <a href={`mailto:${entryConfig.showroom.email}`} className="hover:text-white transition-colors">{entryConfig.showroom.email}</a>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Clock className="w-4 h-4 text-bajaj-orange flex-shrink-0" />
                                        <span>{entryConfig.showroom.workingHours}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <a href={`https://wa.me/${entryConfig.showroom.whatsapp}`} target="_blank" rel="noopener noreferrer">
                                    <Button variant="glow" size="lg" className="w-full">
                                        <MessageCircle className="w-4 h-4 mr-2" /> WhatsApp
                                    </Button>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

// ─── WHATSAPP ENQUIRY FLOATING SECTION ────────────────
function WhatsAppFloat() {
    return (
        <a
            href={`https://wa.me/${entryConfig.showroom.whatsapp}?text=Hi%20Ulhas%20Bajaj!%20I%27m%20interested%20in%20Bajaj%20bikes.%20Please%20share%20details.`}
            target="_blank" rel="noopener noreferrer"
            className="fixed bottom-24 right-6 z-40 group"
        >
            <div className="w-14 h-14 rounded-full bg-green-500 flex items-center justify-center shadow-lg shadow-green-500/30 group-hover:scale-110 transition-transform">
                <MessageCircle className="w-7 h-7 text-white" />
            </div>
            <div className="absolute bottom-full right-0 mb-2 bg-bajaj-dark/90 backdrop-blur-md border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                Chat on WhatsApp
            </div>
        </a>
    );
}

// ─── FOOTER ───────────────────────────────────────────
function Footer() {
    return (
        <footer id="contact" className="border-t border-white/5 py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid md:grid-cols-4 gap-8">
                    <div className="md:col-span-2">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="relative w-10 h-10 flex-shrink-0">
                                <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-[#1a2a4a] to-[#0d1a30] border border-white/10" />
                                <div className="absolute bottom-1 left-1 right-1 h-1 bg-gradient-to-r from-bajaj-orange to-bajaj-gold rounded-full opacity-80" />
                                <span className="absolute inset-0 flex items-center justify-center text-white font-black text-lg">U</span>
                            </div>
                            <div className="flex flex-col -space-y-1">
                                <div className="flex items-baseline gap-1">
                                    <span className="text-xl font-black text-white tracking-tight">ULHAS</span>
                                    <span className="text-xl font-black text-bajaj-orange tracking-tight">BAJAJ</span>
                                </div>
                                <span className="text-[9px] text-white/35 tracking-[0.25em] uppercase">Authorized Bajaj Dealer</span>
                            </div>
                        </div>
                        <p className="text-white/40 text-sm mb-6 max-w-md">
                            Your trusted Bajaj partner in Bardaghat, Nawalparasi. Offering the complete range of Bajaj motorcycles
                            and scooters with easy financing, exchange offers, and world-class service.
                        </p>
                        <div className="flex gap-3">
                            <a href={`https://wa.me/${entryConfig.showroom.whatsapp}`} target="_blank" rel="noopener noreferrer"
                                className="w-10 h-10 rounded-lg bg-white/5 hover:bg-bajaj-orange/10 flex items-center justify-center transition-colors">
                                <MessageCircle className="w-5 h-5 text-white/60 hover:text-bajaj-orange" />
                            </a>
                            <a href={`mailto:${entryConfig.showroom.email}`}
                                className="w-10 h-10 rounded-lg bg-white/5 hover:bg-bajaj-orange/10 flex items-center justify-center transition-colors">
                                <Mail className="w-5 h-5 text-white/60 hover:text-bajaj-orange" />
                            </a>
                            <a href={`https://wa.me/${entryConfig.showroom.whatsapp}?text=Hi%20Ulhas%20Bajaj!%20I%27m%20interested%20in%20Bajaj%20bikes.`}
                                target="_blank" rel="noopener noreferrer"
                                className="w-10 h-10 rounded-lg bg-white/5 hover:bg-green-500/20 flex items-center justify-center transition-colors">
                                <MessageCircle className="w-5 h-5 text-white/60 hover:text-green-400" />
                            </a>
                        </div>
                    </div>

                    <div>
                        <h4 className="text-white font-semibold mb-4">Quick Links</h4>
                        <div className="space-y-3">
                            <a href="#models" className="block text-white/40 hover:text-white text-sm transition-colors">All Models</a>
                            <a href="#compare" className="block text-white/40 hover:text-white text-sm transition-colors">Compare Bikes</a>
                            <a href="#emi" className="block text-white/40 hover:text-white text-sm transition-colors">EMI Calculator</a>
                            <a href="#finance" className="block text-white/40 hover:text-white text-sm transition-colors">Finance</a>
                            <a href="#exchange" className="block text-white/40 hover:text-white text-sm transition-colors">Exchange</a>
                            <a href="#service" className="block text-white/40 hover:text-white text-sm transition-colors">Service</a>
                            <Link href="/admin" className="block text-white/40 hover:text-white text-sm transition-colors">Admin Portal</Link>
                        </div>
                    </div>

                    <div>
                        <h4 className="text-white font-semibold mb-4">Visit Us</h4>
                        <div className="space-y-3 text-white/40 text-sm">
                            <div className="flex items-start gap-2">
                                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-bajaj-orange/60" />
                                <span>{entryConfig.showroom.address}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Phone className="w-4 h-4 flex-shrink-0 text-bajaj-orange/60" />
                                <span>{entryConfig.showroom.phone}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4 flex-shrink-0 text-bajaj-orange/60" />
                                <span>{entryConfig.showroom.email}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 flex-shrink-0 text-bajaj-orange/60" />
                                <span className="text-xs">{entryConfig.showroom.workingHours}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="border-t border-white/5 mt-12 pt-8 text-center">
                    <p className="text-white/20 text-xs">
                        &copy; {new Date().getFullYear()} Ulhas Bajaj. All rights reserved. Authorized Bajaj Dealer — Bardaghat, Nawalparasi.
                    </p>
                </div>
            </div>
        </footer>
    );
}

// ─── MAIN PAGE ────────────────────────────────────────
export default function HomePage() {
    return (
        <main className="min-h-screen bg-transparent noise-overlay relative">
            <ParticleField />
            <Navbar />
            <Hero />
            <HeroBikesShowcase />
            <BikeQuotes />
            <AboutBajaj />
            <FeaturedModels />
            <CompareBikes />
            <EMISection />
            <FinanceBanner />
            <ExchangeSection />
            <ServiceSection />
            <Testimonials />
            <LocationMap />
            <Footer />
            <WhatsAppFloat />
            <ChatAssistant />
        </main>
    );
}
