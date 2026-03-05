'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calculator, IndianRupee, TrendingDown, Calendar, Percent } from 'lucide-react';

interface EMICalculatorProps {
    defaultPrice?: number;
    bikeName?: string;
}

export default function EMICalculator({ defaultPrice = 150000, bikeName }: EMICalculatorProps) {
    const [loanAmount, setLoanAmount] = useState(defaultPrice * 0.85); // 85% financing
    const [interestRate, setInterestRate] = useState(9.5);
    const [tenure, setTenure] = useState(36);

    const { emi, totalPayable, totalInterest } = useMemo(() => {
        const monthlyRate = interestRate / 12 / 100;
        const emi = (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, tenure)) /
            (Math.pow(1 + monthlyRate, tenure) - 1);
        const totalPayable = emi * tenure;
        const totalInterest = totalPayable - loanAmount;
        return {
            emi: Math.round(emi),
            totalPayable: Math.round(totalPayable),
            totalInterest: Math.round(totalInterest),
        };
    }, [loanAmount, interestRate, tenure]);

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

    // Pie chart data for visualization
    const principalPercent = Math.round((loanAmount / totalPayable) * 100);
    const interestPercent = 100 - principalPercent;

    return (
        <div className="glass-card rounded-2xl p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-bajaj-orange/10 flex items-center justify-center">
                    <Calculator className="w-5 h-5 text-bajaj-orange" />
                </div>
                <div>
                    <h3 className="text-lg font-display font-bold text-white">EMI Calculator</h3>
                    {bikeName && <p className="text-xs text-white/40">for {bikeName}</p>}
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                {/* Sliders */}
                <div className="space-y-6">
                    {/* Loan Amount */}
                    <div>
                        <div className="flex justify-between mb-2">
                            <label className="text-sm text-white/60 flex items-center gap-1.5">
                                <IndianRupee className="w-3.5 h-3.5" /> Loan Amount
                            </label>
                            <span className="text-sm font-bold text-white">{formatCurrency(loanAmount)}</span>
                        </div>
                        <input
                            type="range"
                            min={20000}
                            max={500000}
                            step={5000}
                            value={loanAmount}
                            onChange={(e) => setLoanAmount(Number(e.target.value))}
                            className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-bajaj-orange
                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-bajaj-orange [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(255,107,0,0.4)] [&::-webkit-slider-thumb]:cursor-pointer"
                        />
                        <div className="flex justify-between mt-1 text-[10px] text-white/20">
                            <span>₹20,000</span>
                            <span>₹5,00,000</span>
                        </div>
                    </div>

                    {/* Interest Rate */}
                    <div>
                        <div className="flex justify-between mb-2">
                            <label className="text-sm text-white/60 flex items-center gap-1.5">
                                <Percent className="w-3.5 h-3.5" /> Interest Rate (%)
                            </label>
                            <span className="text-sm font-bold text-white">{interestRate}%</span>
                        </div>
                        <input
                            type="range"
                            min={5}
                            max={20}
                            step={0.25}
                            value={interestRate}
                            onChange={(e) => setInterestRate(Number(e.target.value))}
                            className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-bajaj-orange
                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-bajaj-orange [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(255,107,0,0.4)] [&::-webkit-slider-thumb]:cursor-pointer"
                        />
                        <div className="flex justify-between mt-1 text-[10px] text-white/20">
                            <span>5%</span>
                            <span>20%</span>
                        </div>
                    </div>

                    {/* Tenure */}
                    <div>
                        <div className="flex justify-between mb-2">
                            <label className="text-sm text-white/60 flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5" /> Tenure (Months)
                            </label>
                            <span className="text-sm font-bold text-white">{tenure} months</span>
                        </div>
                        <input
                            type="range"
                            min={6}
                            max={60}
                            step={6}
                            value={tenure}
                            onChange={(e) => setTenure(Number(e.target.value))}
                            className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-bajaj-orange
                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-bajaj-orange [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(255,107,0,0.4)] [&::-webkit-slider-thumb]:cursor-pointer"
                        />
                        <div className="flex justify-between mt-1 text-[10px] text-white/20">
                            <span>6 months</span>
                            <span>60 months</span>
                        </div>
                    </div>

                    {/* Tenure Quick Select */}
                    <div className="flex gap-2">
                        {[12, 24, 36, 48, 60].map((m) => (
                            <button
                                key={m}
                                onClick={() => setTenure(m)}
                                className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${tenure === m
                                        ? 'bg-bajaj-orange text-white'
                                        : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/60'
                                    }`}
                            >
                                {m}M
                            </button>
                        ))}
                    </div>
                </div>

                {/* Results */}
                <div className="flex flex-col items-center justify-center">
                    {/* Donut chart */}
                    <div className="relative w-44 h-44 mb-6">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
                            <circle cx="80" cy="80" r="65" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="14" />
                            <circle
                                cx="80" cy="80" r="65" fill="none" stroke="#FF6B00" strokeWidth="14"
                                strokeDasharray={`${principalPercent * 4.08} ${interestPercent * 4.08}`}
                                strokeLinecap="round"
                                className="transition-all duration-700"
                            />
                            <circle
                                cx="80" cy="80" r="65" fill="none" stroke="#D4A843" strokeWidth="14"
                                strokeDasharray={`${interestPercent * 4.08} ${principalPercent * 4.08}`}
                                strokeDashoffset={`-${principalPercent * 4.08}`}
                                strokeLinecap="round"
                                className="transition-all duration-700"
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-[10px] text-white/30 uppercase tracking-wider">Monthly EMI</span>
                            <motion.span
                                key={emi}
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="text-2xl font-display font-bold text-white"
                            >
                                {formatCurrency(emi)}
                            </motion.span>
                        </div>
                    </div>

                    {/* Legend */}
                    <div className="flex gap-6 mb-6">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-bajaj-orange" />
                            <span className="text-xs text-white/50">Principal</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-bajaj-gold" />
                            <span className="text-xs text-white/50">Interest</span>
                        </div>
                    </div>

                    {/* Breakdown */}
                    <div className="w-full space-y-3">
                        <div className="flex justify-between items-center py-2 px-4 rounded-lg bg-white/[0.03]">
                            <span className="text-sm text-white/50">Total Payable</span>
                            <span className="text-sm font-bold text-white">{formatCurrency(totalPayable)}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 px-4 rounded-lg bg-white/[0.03]">
                            <span className="text-sm text-white/50 flex items-center gap-1">
                                <TrendingDown className="w-3 h-3 text-bajaj-gold" /> Total Interest
                            </span>
                            <span className="text-sm font-bold text-bajaj-gold">{formatCurrency(totalInterest)}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 px-4 rounded-lg bg-bajaj-orange/5 border border-bajaj-orange/10">
                            <span className="text-sm text-white/50">Down Payment (15%)</span>
                            <span className="text-sm font-bold text-bajaj-orange">{formatCurrency(defaultPrice - loanAmount > 0 ? defaultPrice - loanAmount : defaultPrice * 0.15)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
