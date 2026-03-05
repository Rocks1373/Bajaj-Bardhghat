'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Bot, User, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import entryConfig from '@/data/entry-config.json';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

function generateSessionId() {
    return 'chat_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

export default function ChatAssistant() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            role: 'assistant',
            content: 'नमस्ते! 👋 I\'m the Ulhas Bajaj assistant. I can help you find the perfect Bajaj motorcycle or scooter, compare models, check NPR prices, or calculate EMIs. What are you looking for today?',
        },
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [sessionId] = useState(generateSessionId);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 300);
        }
    }, [isOpen]);

    const playAudio = async (text: string) => {
        try {
            const res = await fetch('/api/tts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text }),
            });
            if (!res.ok) throw new Error('TTS failed');
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const audio = new Audio(url);
            audio.play();
        } catch (err) {
            console.error('Error playing audio:', err);
        }
    };

    const sendMessage = async () => {
        if (!input.trim() || loading) return;

        const userMessage: Message = { role: 'user', content: input.trim() };
        const updatedMessages = [...messages, userMessage];
        setMessages(updatedMessages);
        setInput('');
        setLoading(true);

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: updatedMessages.map(m => ({ role: m.role, content: m.content })),
                    sessionId,
                }),
            });

            if (!res.ok) throw new Error('Failed to get response');

            const data = await res.json();
            setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);

            // Play voice response
            playAudio(data.reply);
        } catch (err) {
            const waLink = `https://wa.me/${(entryConfig as any).showroom?.whatsapp}?text=Hi%20Ulhas%20Bajaj!%20I%20need%20help.`;
            setMessages(prev => [
                ...prev,
                { role: 'assistant', content: `Sorry, I'm having trouble right now. Please [WhatsApp us](${waLink}) directly for instant help! 💬` },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const quickQuestions = [
        'Best bike under NPR 2L?',
        'Compare NS200 vs Dominar 400',
        'EMI for Pulsar N250?',
        'Exchange offer details',
    ];

    return (
        <>
            {/* Floating button */}
            <AnimatePresence>
                {!isOpen && (
                    <motion.button
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setIsOpen(true)}
                        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-bajaj-orange to-bajaj-gold shadow-2xl shadow-bajaj-orange/30 flex items-center justify-center text-white hover:shadow-bajaj-orange/50 transition-shadow"
                        aria-label="Open chat assistant"
                    >
                        <MessageCircle className="w-6 h-6" />
                        {/* Pulse ring */}
                        <span className="absolute inset-0 rounded-full bg-bajaj-orange/30 animate-ping" />
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Chat window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] h-[560px] max-h-[calc(100vh-6rem)] flex flex-col rounded-2xl overflow-hidden shadow-2xl shadow-black/40 border border-white/10"
                        style={{ background: 'rgba(10, 10, 15, 0.95)', backdropFilter: 'blur(24px)' }}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-bajaj-orange/20 to-bajaj-gold/10 border-b border-white/5">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-bajaj-orange to-bajaj-gold flex items-center justify-center">
                                    <Sparkles className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-white font-semibold text-sm">Ulhas Bajaj AI</h3>
                                    <div className="flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                        <span className="text-white/40 text-[10px]">Online • Live inventory context</span>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center transition-colors"
                                aria-label="Close chat"
                            >
                                <X className="w-4 h-4 text-white/60" />
                            </button>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
                            {messages.map((msg, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.05 }}
                                    className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    {msg.role === 'assistant' && (
                                        <div className="w-7 h-7 rounded-full bg-bajaj-orange/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <Bot className="w-4 h-4 text-bajaj-orange" />
                                        </div>
                                    )}
                                    <div
                                        className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${msg.role === 'user'
                                            ? 'bg-bajaj-orange text-white rounded-br-md'
                                            : 'bg-white/5 text-white/80 rounded-bl-md border border-white/5'
                                            }`}
                                    >
                                        {msg.content.split('\n').map((line, j) => (
                                            <span key={j}>
                                                {line}
                                                {j < msg.content.split('\n').length - 1 && <br />}
                                            </span>
                                        ))}
                                    </div>
                                    {msg.role === 'user' && (
                                        <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <User className="w-4 h-4 text-white/60" />
                                        </div>
                                    )}
                                </motion.div>
                            ))}

                            {loading && (
                                <div className="flex gap-2 items-start">
                                    <div className="w-7 h-7 rounded-full bg-bajaj-orange/10 flex items-center justify-center flex-shrink-0">
                                        <Bot className="w-4 h-4 text-bajaj-orange" />
                                    </div>
                                    <div className="bg-white/5 rounded-2xl rounded-bl-md px-4 py-3 border border-white/5">
                                        <div className="flex gap-1">
                                            <span className="w-2 h-2 rounded-full bg-bajaj-orange/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                                            <span className="w-2 h-2 rounded-full bg-bajaj-orange/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                                            <span className="w-2 h-2 rounded-full bg-bajaj-orange/40 animate-bounce" style={{ animationDelay: '300ms' }} />
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>

                        {/* Quick questions (show only at start) */}
                        {messages.length <= 1 && (
                            <div className="px-4 pb-2">
                                <p className="text-[10px] text-white/30 mb-2">Quick questions:</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {quickQuestions.map((q, i) => (
                                        <button
                                            key={i}
                                            onClick={() => { setInput(q); setTimeout(sendMessage, 100); }}
                                            className="text-[11px] px-2.5 py-1 rounded-full bg-white/5 text-white/50 hover:text-white hover:bg-white/10 border border-white/5 transition-all"
                                        >
                                            {q}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Input */}
                        <div className="p-3 border-t border-white/5">
                            <div className="flex gap-2">
                                <Input
                                    ref={inputRef}
                                    value={input}
                                    onChange={e => setInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Ask about bikes, prices, EMI..."
                                    className="flex-1 bg-white/5 border-white/10 text-white text-sm placeholder:text-white/25 focus:border-bajaj-orange/30"
                                    disabled={loading}
                                />
                                <Button
                                    onClick={sendMessage}
                                    disabled={!input.trim() || loading}
                                    size="icon"
                                    className="bg-bajaj-orange hover:bg-bajaj-orange/90 disabled:opacity-30 flex-shrink-0"
                                >
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
