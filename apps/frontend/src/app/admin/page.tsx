'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Bike, Lock, Mail, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function AdminLoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('admin@hulhasauto.com');
    const [password, setPassword] = useState('admin123');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // For demo: simple JWT-less admin auth (check against InsForge DB)
            // In production, use proper auth flow
            if (email === 'admin@hulhasauto.com' && password === 'admin123') {
                localStorage.setItem('admin_token', 'demo-admin-token');
                localStorage.setItem('admin_user', JSON.stringify({ email, name: 'Hulhas Admin', role: 'ADMIN' }));
                router.push('/admin/dashboard');
            } else {
                setError('Invalid credentials');
            }
        } catch (err: any) {
            setError(err.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Image */}
            <div
                className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
                style={{
                    backgroundImage: `url('https://stat.overdrive.in/wp-content/uploads/2024/05/2024-Bajaj-Pulsar-NS400-Z-101.jpg')`
                }}
            />
            {/* Dark Overlay for Readability */}
            <div className="absolute inset-0 z-0 bg-black/70 backdrop-blur-sm" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md relative z-10"
            >
                <div className="text-center mb-8">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-bajaj-orange to-bajaj-gold flex items-center justify-center mx-auto mb-4">
                        <Bike className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-display font-bold text-white">Admin Portal</h1>
                    <p className="text-white/40 text-sm mt-1">Hulhas Auto Management System</p>
                </div>

                <Card className="glass-card border-white/5">
                    <CardHeader>
                        <CardTitle className="text-white text-lg">Sign In</CardTitle>
                        <CardDescription className="text-white/40">Enter your admin credentials to continue</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleLogin} className="space-y-4">
                            {error && (
                                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm">
                                    {error}
                                </div>
                            )}

                            <div>
                                <Label className="text-white/60">Email</Label>
                                <div className="relative mt-1">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                                    <Input
                                        type="email"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        required
                                        className="pl-10 bg-white/5 border-white/10 text-white"
                                        placeholder="admin@hulhasauto.com"
                                    />
                                </div>
                            </div>

                            <div>
                                <Label className="text-white/60">Password</Label>
                                <div className="relative mt-1">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                                    <Input
                                        type="password"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        required
                                        className="pl-10 bg-white/5 border-white/10 text-white"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>

                            <Button type="submit" variant="glow" size="lg" className="w-full" disabled={loading}>
                                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                {loading ? 'Signing in...' : 'Sign In'}
                            </Button>

                            <p className="text-[10px] text-white/20 text-center">
                                Demo credentials: admin@hulhasauto.com / admin123
                            </p>
                        </form>
                    </CardContent>
                </Card>
            </motion.div>
        </main>
    );
}
