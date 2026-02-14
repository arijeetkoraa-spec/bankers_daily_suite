import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { ArrowRightLeft, Sparkles, TrendingDown, FileDown, RotateCcw, Loader2 } from 'lucide-react';

import { cn, formatPdfCurrency } from '../../lib/utils';
import { exportToPDF } from '../../lib/pdf/export';
import { Button } from '../../components/ui/button';
import { AmortizationModal } from '../../components/AmortizationModal';
import { generateAmortizationSchedule } from '../../lib/amortization';
import { TableProperties } from 'lucide-react';

export const LoanCompare: React.FC = () => {
    // Loan A
    const [amountA, setAmountA] = useLocalStorage<string>('compare_amount_a', '1000000');
    const [rateA, setRateA] = useLocalStorage<string>('compare_rate_a', '9.50');
    const [tenureA, setTenureA] = useLocalStorage<string>('compare_tenure_a', '120');

    // Loan B
    const [amountB, setAmountB] = useLocalStorage<string>('compare_amount_b', '1000000');
    const [rateB, setRateB] = useLocalStorage<string>('compare_rate_b', '8.50');
    const [tenureB, setTenureB] = useLocalStorage<string>('compare_tenure_b', '120');

    const handleReset = () => {
        setAmountA('1000000');
        setRateA('9.50');
        setTenureA('120');
        setAmountB('1000000');
        setRateB('8.50');
        setTenureB('120');
    };

    const [resultA, setResultA] = useState({ emi: 0, interest: 0, total: 0 });
    const [resultB, setResultB] = useState({ emi: 0, interest: 0, total: 0 });

    const [isScheduleAOpen, setIsScheduleAOpen] = useState(false);
    const [isScheduleBOpen, setIsScheduleBOpen] = useState(false);
    const [scheduleA, setScheduleA] = useState<any[]>([]);
    const [scheduleB, setScheduleB] = useState<any[]>([]);
    const [isExporting, setIsExporting] = useState(false);


    const calculateLoan = (p: number, r: number, n: number) => {
        if (isNaN(p) || isNaN(r) || isNaN(n) || p <= 0 || n <= 0) return { emi: 0, interest: 0, total: 0 };
        const rate = r / 12 / 100;
        const emi = p * rate * Math.pow(1 + rate, n) / (Math.pow(1 + rate, n) - 1);
        const total = emi * n;
        const interest = total - p;
        return { emi, interest, total };
    };

    useEffect(() => {
        const resA = calculateLoan(parseFloat(amountA), parseFloat(rateA), parseFloat(tenureA));
        const resB = calculateLoan(parseFloat(amountB), parseFloat(rateB), parseFloat(tenureB));
        setResultA(resA);
        setResultB(resB);

        setScheduleA(generateAmortizationSchedule(parseFloat(amountA), parseFloat(rateA), parseFloat(tenureA), 'reducing'));
        setScheduleB(generateAmortizationSchedule(parseFloat(amountB), parseFloat(rateB), parseFloat(tenureB), 'reducing'));
    }, [amountA, rateA, tenureA, amountB, rateB, tenureB]);

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(val);
    };

    const isAWinner = resultA.total < resultB.total && resultA.total > 0;
    const isBWinner = resultB.total < resultA.total && resultB.total > 0;

    const downloadPDF = async () => {
        if (isExporting) return;
        setIsExporting(true);
        try {
            const f = formatPdfCurrency;

            await exportToPDF({
                title: "Loan Comparison Matrix",
                subtitle: "Multi-Entity Arbitrage Report | Professional Financial Review",
                details: [
                    { label: "--- Scenario ALPHA ---", value: "" },
                    { label: "Principal Corpus", value: f(parseFloat(amountA)) },
                    { label: "Rate of Interest", value: `${rateA}% p.a.` },
                    { label: "Tenure (Months)", value: `${tenureA}` },
                    { label: "Monthly EMI", value: f(resultA.emi) },
                    { label: "Total Cost of Borrowing", value: f(resultA.interest) },
                    { label: "Aggregate Cash Outflow", value: f(resultA.total) },
                    { label: "--- Scenario BETA ---", value: "" },
                    { label: "Principal Corpus", value: f(parseFloat(amountB)) },
                    { label: "Rate of Interest", value: `${rateB}% p.a.` },
                    { label: "Tenure (Months)", value: `${tenureB}` },
                    { label: "Monthly EMI", value: f(resultB.emi) },
                    { label: "Total Cost of Borrowing", value: f(resultB.interest) },
                    { label: "Aggregate Cash Outflow", value: f(resultB.total) },
                    { label: "--- Multi-Entity Delta ---", value: "" },
                    { label: "Monthly Liquidity Saving", value: f(Math.abs(resultA.emi - resultB.emi)) },
                    { label: "Interest Outflow Saving", value: f(Math.abs(resultA.interest - resultB.interest)) },
                    { label: "Optimal Strategic Choice", value: isAWinner ? "Scenario ALPHA" : (isBWinner ? "Scenario BETA" : "Statistically Neutral") }
                ]
            }, `Loan_Comparison_Analysis.pdf`);
        } finally {
            setIsExporting(false);
        }
    };


    return (
        <Card className="premium-card w-full max-w-6xl mx-auto overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-indigo-500/10 via-background to-background border-b border-border/10 p-4 md:px-6">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <ArrowRightLeft className="w-6 h-6 text-indigo-600" />
                        <div>
                            <CardTitle className="text-xl font-black">Loan Comparison</CardTitle>
                            <CardDescription className="text-[10px] font-bold uppercase tracking-wider text-foreground opacity-70">
                                Multi-Entity Arbitrage Assessment
                            </CardDescription>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            onClick={handleReset}
                            variant="outline"
                            size="sm"
                            className="h-10 px-4 rounded-xl border border-border/50 bg-card/60 hover:bg-accent/50 text-sm font-semibold flex items-center gap-2 transition"
                        >
                            <RotateCcw className="w-4 h-4" />
                            Reset
                        </Button>
                        <Button
                            onClick={downloadPDF}
                            disabled={isExporting}
                            variant="outline"
                            size="sm"
                            className="h-10 gap-2 border-primary/30 hover:bg-primary/10 hidden md:flex text-xs font-black px-4 shadow-sm"
                        >
                            {isExporting ? (
                                <Loader2 className="w-5 h-5 text-primary animate-spin" />
                            ) : (
                                <FileDown className="w-5 h-5 text-primary" />
                            )}
                            {isExporting ? "EXPORTING..." : "EXPORT PDF"}
                        </Button>

                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="grid grid-cols-1 lg:grid-cols-2 divide-x divide-border/50">
                    {/* Loan A */}
                    <div className={cn(
                        "p-4 md:p-6 space-y-4 transition-colors duration-500",
                        isAWinner ? "bg-emerald-500/5" : "bg-transparent"
                    )}>
                        <div className="flex justify-between items-center">
                            <div className="flex flex-col gap-1">
                                <h3 className="text-[11px] font-bold uppercase tracking-widest text-indigo-600/70">Structure Alpha</h3>
                                <button
                                    onClick={() => setIsScheduleAOpen(true)}
                                    className="text-[9px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-700 flex items-center gap-1 transition-colors"
                                >
                                    <TableProperties className="w-3 h-3" /> View Schedule
                                </button>
                            </div>
                            {isAWinner && (
                                <span className="px-2.5 py-1 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest rounded-lg flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 animate-pulse border border-emerald-400">
                                    <Sparkles className="w-3.5 h-3.5" /> Optimal Choice
                                </span>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2 space-y-1 share-row" data-share-key="loanAmountA" data-share-type="input">
                                <Label className="text-[10px] font-bold uppercase text-foreground opacity-70 share-label">Alpha Principal</Label>
                                <Input
                                    value={amountA}
                                    onChange={(e) => setAmountA(e.target.value)}
                                    type="number"
                                    className="h-10 text-xl font-black bg-accent border-none px-4 share-value"
                                />
                            </div>
                            <div className="space-y-1 share-row" data-share-key="roiA" data-share-type="input">
                                <Label className="text-[8px] font-black uppercase text-foreground share-label">Alpha Rate (%)</Label>
                                <Input
                                    value={rateA}
                                    onChange={(e) => setRateA(e.target.value)}
                                    type="number"
                                    step="0.01"
                                    className="h-10 text-xl font-black bg-accent border-none px-4 share-value"
                                />
                            </div>
                            <div className="space-y-1 share-row" data-share-key="tenureA" data-share-type="input">
                                <Label className="text-[8px] font-black uppercase text-foreground share-label">Alpha Months</Label>
                                <Input
                                    value={tenureA}
                                    onChange={(e) => setTenureA(e.target.value)}
                                    type="number"
                                    className="h-10 text-xl font-black bg-accent border-none px-4 share-value"
                                />
                            </div>
                        </div>

                        <div className="space-y-3 pt-2">
                            <div className="stat-card bg-indigo-500/5 p-3 share-row" data-share-key="emiA" data-share-type="result">
                                <span className="result-label text-indigo-600 share-label">Alpha Monthly EMI</span>
                                <div className="text-xl font-black text-foreground share-value">
                                    {formatCurrency(resultA.emi)}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="stat-card bg-accent/20 p-2 share-row" data-share-key="interestA" data-share-type="result">
                                    <span className="result-label share-label">Alpha Interest</span>
                                    <span className="text-xs font-black text-foreground share-value">{formatCurrency(resultA.interest)}</span>
                                </div>
                                <div className="stat-card bg-accent/20 p-2 share-row" data-share-key="totalPayableA" data-share-type="result">
                                    <span className="result-label share-label">Alpha Total</span>
                                    <span className="text-xs font-black text-foreground share-value">{formatCurrency(resultA.total)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Loan B */}
                    <div className={cn(
                        "p-4 md:p-6 space-y-4 transition-colors duration-500",
                        isBWinner ? "bg-emerald-500/5" : "bg-transparent"
                    )}>
                        <div className="flex justify-between items-center">
                            <div className="flex flex-col gap-1">
                                <h3 className="text-[11px] font-bold uppercase tracking-widest text-emerald-600/70">Structure Beta</h3>
                                <button
                                    onClick={() => setIsScheduleBOpen(true)}
                                    className="text-[9px] font-black uppercase tracking-widest text-emerald-600 hover:text-emerald-700 flex items-center gap-1 transition-colors"
                                >
                                    <TableProperties className="w-3 h-3" /> View Schedule
                                </button>
                            </div>
                            {isBWinner && (
                                <span className="px-2.5 py-1 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest rounded-lg flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 animate-pulse border border-emerald-400">
                                    <Sparkles className="w-3.5 h-3.5" /> Optimal Choice
                                </span>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2 space-y-1 share-row" data-share-key="loanAmountB" data-share-type="input">
                                <Label className="text-[10px] font-bold uppercase text-foreground opacity-70 share-label">Beta Principal</Label>
                                <Input
                                    value={amountB}
                                    onChange={(e) => setAmountB(e.target.value)}
                                    type="number"
                                    className="h-10 text-xl font-black bg-accent border-none px-4 share-value"
                                />
                            </div>
                            <div className="space-y-1 share-row" data-share-key="roiB" data-share-type="input">
                                <Label className="text-[8px] font-black uppercase text-foreground share-label">Beta Rate (%)</Label>
                                <Input
                                    value={rateB}
                                    onChange={(e) => setRateB(e.target.value)}
                                    type="number"
                                    step="0.01"
                                    className="h-10 text-xl font-black bg-accent border-none px-4 share-value"
                                />
                            </div>
                            <div className="space-y-1 share-row" data-share-key="tenureB" data-share-type="input">
                                <Label className="text-[8px] font-black uppercase text-foreground share-label">Beta Months</Label>
                                <Input
                                    value={tenureB}
                                    onChange={(e) => setTenureB(e.target.value)}
                                    type="number"
                                    className="h-10 text-xl font-black bg-accent border-none px-4 share-value"
                                />
                            </div>
                        </div>

                        <div className="space-y-3 pt-2">
                            <div className="stat-card bg-emerald-500/5 p-3 share-row" data-share-key="emiB" data-share-type="result">
                                <span className="result-label text-emerald-600 share-label">Beta Monthly EMI</span>
                                <div className="text-xl font-black text-foreground share-value">
                                    {formatCurrency(resultB.emi)}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="stat-card bg-accent/20 p-2 share-row" data-share-key="interestB" data-share-type="result">
                                    <span className="result-label share-label">Beta Interest</span>
                                    <span className="text-xs font-black text-foreground share-value">{formatCurrency(resultB.interest)}</span>
                                </div>
                                <div className="stat-card bg-accent/20 p-2 share-row" data-share-key="totalPayableB" data-share-type="result">
                                    <span className="result-label share-label">Beta Total</span>
                                    <span className="text-xs font-black text-foreground share-value">{formatCurrency(resultB.total)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Comparative Analytics */}
                <div className="p-4 md:p-6 border-t border-border/50 bg-accent/10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 p-1.5 px-3 rounded-lg border border-emerald-500/20 w-fit">
                                <TrendingDown className="w-4 h-4" /> Delta Analytics
                            </div>
                            <h4 className="text-[13px] font-black uppercase text-foreground mt-2">Comparative Advantage Analysis</h4>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-2 px-3 rounded-xl glass-panel border-emerald-600/20 bg-accent/40 share-row" data-share-key="monthlySaving" data-share-type="result">
                                <span className="text-[8px] font-black text-foreground uppercase share-label">Monthly Saving</span>
                                <div className="text-lg font-black text-emerald-600 share-value">{formatCurrency(Math.abs(resultA.emi - resultB.emi))}</div>
                            </div>
                            <div className="p-2 px-3 rounded-xl glass-panel border-emerald-600/20 bg-accent/40 share-row" data-share-key="interestDelta" data-share-type="result">
                                <span className="text-[8px] font-black text-foreground uppercase share-label">Interest Delta</span>
                                <div className="text-lg font-black text-emerald-600 share-value">{formatCurrency(Math.abs(resultA.interest - resultB.interest))}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>

            <AmortizationModal
                isOpen={isScheduleAOpen}
                onClose={() => setIsScheduleAOpen(false)}
                schedule={scheduleA}
                principal={parseFloat(amountA) || 0}
                totalInterest={resultA.interest}
                accentColor="indigo-600"
            />
            <AmortizationModal
                isOpen={isScheduleBOpen}
                onClose={() => setIsScheduleBOpen(false)}
                schedule={scheduleB}
                principal={parseFloat(amountB) || 0}
                totalInterest={resultB.interest}
                accentColor="emerald-600"
            />
        </Card>
    );
};
