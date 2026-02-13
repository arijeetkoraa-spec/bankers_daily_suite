import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { ShieldCheck, Info, Percent, ArrowRight, FileDown } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { exportToPDF } from '../../lib/pdf-export';
import { cn, formatPdfCurrency } from '../../lib/utils';

// Simple Premium Switch Component
const SimpleSwitch = ({ checked, onCheckedChange, id }: { checked: boolean; onCheckedChange: (c: boolean) => void; id: string }) => (
    <button
        type="button"
        role="switch"
        aria-checked={checked}
        id={id}
        onClick={() => onCheckedChange(!checked)}
        className={cn(
            "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-600 shadow-inner",
            checked ? 'bg-purple-600' : 'bg-muted'
        )}
    >
        <span
            className={cn(
                "pointer-events-none block h-5 w-5 rounded-full bg-white shadow-xl ring-0 transition-transform duration-300 ease-in-out",
                checked ? 'translate-x-5' : 'translate-x-0'
            )}
        />
    </button>
);

export const FeesCalculator: React.FC = () => {
    const [loanAmount, setLoanAmount] = useLocalStorage<string>('cgtmse_loan', '1500000');
    const [isSocialCategory, setIsSocialCategory] = useState<boolean>(false);

    const [fee, setFee] = useState<number>(0);
    const [rate, setRate] = useState<number>(0);

    const calculate = React.useCallback(() => {
        const amt = parseFloat(loanAmount);
        if (isNaN(amt) || amt <= 0) {
            setFee(0);
            setRate(0);
            return;
        }

        let baseRate = 0;
        if (amt <= 1000000) baseRate = 0.37;
        else if (amt <= 5000000) baseRate = 0.55;
        else if (amt <= 20000000) {
            if (amt <= 10000000) baseRate = 0.60;
            else baseRate = 1.20;
        } else {
            baseRate = 1.35;
        }

        if (isSocialCategory) {
            baseRate = baseRate * 0.90;
        }

        setRate(baseRate);
        setFee(amt * (baseRate / 100));

    }, [loanAmount, isSocialCategory]);

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(val);
    };

    useEffect(() => {
        calculate();
    }, [calculate]);

    const downloadPDF = () => {
        const f = formatPdfCurrency;

        exportToPDF({
            title: "CGTMSE Fee Assessment",
            subtitle: "Credit Guarantee Fund Trust for Micro and Small Enterprises",
            details: [
                { label: "Loan Amount", value: f(parseFloat(loanAmount)) },
                { label: "Entrepreneur Category", value: isSocialCategory ? "Special (Women/SC/ST/Aspirational)" : "General" },
                { label: "Calculated Annual Fee Rate", value: `${rate.toFixed(3)}%` },
                { label: "--- Assessment Results ---", value: "" },
                { label: "Annual Guarantee Fee", value: f(fee) },
                { label: "Quarterly Equivalent", value: f(fee / 4) }
            ]
        }, `CGTMSE_Fee_Summary.pdf`);
    };

    return (
        <Card className="premium-card w-full max-w-4xl mx-auto overflow-hidden">
            <CardHeader className="bg-slate-950 border-b-2 border-slate-900 p-4 md:px-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full -mr-16 -mt-16" />
                <div className="flex justify-between items-center relative z-10">
                    <div className="flex items-center gap-3">
                        <ShieldCheck className="w-6 h-6 text-purple-400" />
                        <div>
                            <CardTitle className="text-xl font-black text-white">CGTMSE Fees</CardTitle>
                            <CardDescription className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-400/80">
                                Annual Guarantee Fee Assessment
                            </CardDescription>
                        </div>
                    </div>
                    <Button onClick={downloadPDF} size="sm" className="h-10 gap-2 bg-primary text-primary-foreground hover:bg-primary/90 hidden md:flex text-xs font-black px-4 shadow-xl border-none">
                        <FileDown className="w-5 h-5" />
                        EXPORT PDF
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
                    {/* Inputs Section */}
                    <div className="lg:col-span-7 p-4 md:p-6 space-y-6 border-r-2 border-border/20 bg-background dark:bg-slate-950">
                        <div className="space-y-6">
                            <div className="space-y-2 share-row">
                                <Label htmlFor="cgtmse-loan" className="text-[10px] font-black text-foreground uppercase tracking-widest share-label">Loan Amount (₹)</Label>
                                <Input
                                    id="cgtmse-loan"
                                    type="number"
                                    value={loanAmount}
                                    onChange={(e) => setLoanAmount(e.target.value)}
                                    className="text-3xl font-black h-14 bg-accent/30 dark:bg-slate-900 border-2 border-border/50 px-4 text-foreground focus:border-purple-600 focus:ring-4 focus:ring-purple-500/10 transition-all shadow-inner share-value"
                                />
                            </div>

                            <div className="p-5 bg-card border-2 border-border/50 rounded-2xl flex items-center justify-between group transition-all duration-300 hover:border-purple-200 shadow-sm share-row">
                                <div className="space-y-1.5">
                                    <Label htmlFor="social-toggle" className="text-[10px] font-black uppercase text-foreground flex items-center gap-1.5 leading-none tracking-widest share-label">
                                        Special Category
                                        <Info className="w-4 h-4 text-purple-600" />
                                    </Label>
                                    <p className="text-[10px] font-black text-purple-700 dark:text-purple-400 uppercase tracking-tighter leading-none bg-purple-50 dark:bg-purple-950/30 px-2 py-1 rounded inline-block">
                                        Women / SC / ST / Aspirational
                                    </p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className={cn("text-[10px] font-black px-3 py-1.5 rounded-xl transition-all shadow-md uppercase tracking-widest share-value", isSocialCategory ? "bg-purple-600 text-white" : "bg-accent text-muted-foreground border-2 border-border/50")}>
                                        {isSocialCategory ? "YES (-10% Benefit)" : "NO"}
                                    </span>
                                    <SimpleSwitch
                                        id="social-toggle"
                                        checked={isSocialCategory}
                                        onCheckedChange={setIsSocialCategory}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="pt-2">
                            <div className="flex items-center gap-3 text-[11px] font-black text-foreground uppercase tracking-widest bg-accent/30 p-3 rounded-xl border-2 border-border/50">
                                <ShieldCheck className="w-5 h-5 text-emerald-600" /> Standard MSE Coverage norms applied
                            </div>
                        </div>
                    </div>

                    {/* Results Section */}
                    <div className="lg:col-span-5 p-4 md:p-6 bg-accent/20 dark:bg-slate-900/50 flex flex-col justify-center space-y-6">
                        <div className="space-y-6">
                            <div className="bg-slate-950 rounded-2xl p-6 shadow-2xl border-2 border-slate-900 relative overflow-hidden ring-4 ring-purple-600/5 share-row">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full -mr-16 -mt-16" />
                                <div className="relative z-10 space-y-2 text-center">
                                    <span className="text-[10px] font-black uppercase text-purple-400 tracking-[0.3em] share-label">Annual Fee</span>
                                    <div className="text-4xl font-black text-white leading-tight share-value">
                                        {formatCurrency(fee)}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                <div className="bg-card border-2 border-border/50 p-5 rounded-2xl flex justify-between items-center group shadow-sm share-row">
                                    <div className="flex flex-col">
                                        <span className="text-[11px] font-black text-foreground uppercase tracking-widest share-label">Fee Rate</span>
                                        <span className="text-2xl font-black text-purple-600 dark:text-purple-400 share-value">
                                            {rate.toFixed(3)}%
                                        </span>
                                    </div>
                                    <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-xl">
                                        <Percent className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                                    </div>
                                </div>

                                <div className="p-5 rounded-2xl bg-emerald-600 text-white shadow-xl shadow-emerald-600/20 flex items-center justify-between share-row">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black uppercase tracking-widest opacity-80 share-label">Quarterly Equivalent</span>
                                        <span className="text-xl font-black share-value">{formatCurrency(fee / 4)}</span>
                                    </div>
                                    <ArrowRight className="w-6 h-6" />
                                </div>
                            </div>
                        </div>

                        <p className="text-[10px] text-foreground font-black text-center uppercase tracking-widest italic bg-accent/30 py-3 rounded-xl border border-border/50">
                            *Upfront on sanction, then annual on balance.
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
