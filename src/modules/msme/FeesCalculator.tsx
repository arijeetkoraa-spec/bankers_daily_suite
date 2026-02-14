import React, { useMemo, useState } from 'react';

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { ShieldCheck, Info, Percent, ArrowRight, FileDown, RotateCcw, Loader2 } from 'lucide-react';

import { Button } from '../../components/ui/button';
import { exportToPDF } from '../../lib/pdf/export';
import { cn, formatPdfCurrency } from '../../lib/utils';
import { calculateCGTMSEFee } from '../../core/msmeEngine';


// Simple Premium Switch Component
const SimpleSwitch = ({ checked, onCheckedChange, id }: { checked: boolean; onCheckedChange: (c: boolean) => void; id: string }) => (
    <button
        type="button"
        role="switch"
        aria-checked={checked}
        id={id}
        onClick={() => onCheckedChange(!checked)}
        className={cn(
            "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent-primary shadow-inner",
            checked ? 'bg-brand-accent-primary' : 'bg-muted'
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
    const [isExporting, setIsExporting] = useState(false);


    const handleReset = () => {
        setLoanAmount('1500000');
        setIsSocialCategory(false);
    };

    const results = useMemo(() => {
        const res = calculateCGTMSEFee({ loanAmount, isSocialCategory });
        return {
            fee: res.fee.toNumber(),
            rate: res.rate.toNumber()
        };
    }, [loanAmount, isSocialCategory]);

    const { fee, rate } = results;


    const downloadPDF = async () => {
        if (isExporting) return;
        setIsExporting(true);
        try {
            const f = formatPdfCurrency;

            await exportToPDF({
                title: "CGTMSE Fee Assessment",
                subtitle: "Credit Guarantee Fund Trust for Micro & Small Enterprises | Statutory Audit",
                details: [
                    { label: "Sanctioned Loan Amount", value: f(parseFloat(loanAmount)) },
                    { label: "Entrepreneur Category", value: isSocialCategory ? "Special (10% Concessionary)" : "General / Standard" },
                    { label: "Applicable Annual Fee Rate", value: `${rate.toFixed(3)}%` },
                    { label: "--- Payout Liability ---", value: "" },
                    { label: "Aggregate Annual Fee", value: f(fee) },
                    { label: "Quarterly Installment", value: f(fee / 4) }
                ]
            }, `CGTMSE_Fee_Assessment.pdf`);
        } finally {
            setIsExporting(false);
        }
    };


    return (
        <Card className="premium-card w-full max-w-4xl mx-auto overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-purple-500/8 via-background to-background border-b border-border/10 p-4 md:px-6 relative overflow-hidden">
                <div className="flex justify-between items-center relative z-10">
                    <div className="flex items-center gap-3">
                        <ShieldCheck className="w-6 h-6 text-purple-600" />
                        <div>
                            <CardTitle className="text-xl font-black text-foreground">CGTMSE Fees</CardTitle>
                            <CardDescription className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground opacity-70">
                                Annual Guarantee Fee Assessment
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
                <div className="grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
                    {/* Inputs Section */}
                    <div className="lg:col-span-7 p-4 md:p-6 space-y-6 border-r border-border/50">
                        <div className="space-y-6">
                            <div className="space-y-2 share-row" data-share-key="loanAmount" data-share-type="input">
                                <Label htmlFor="cgtmse-loan" className="result-label text-purple-600 share-label">Loan Amount (₹)</Label>
                                <Input
                                    id="cgtmse-loan"
                                    type="number"
                                    value={loanAmount}
                                    onChange={(e) => setLoanAmount(e.target.value)}
                                    className="h-10 bg-accent/30 font-bold px-3 text-lg text-foreground placeholder:text-muted-foreground share-value"
                                />
                            </div>

                            <div className="p-4 bg-accent/30 border border-border/40 rounded-xl flex items-center justify-between group transition-all duration-300 share-row" data-share-key="isSocialCategory" data-share-type="option">
                                <div className="space-y-1.5">
                                    <Label htmlFor="social-toggle" className="text-[10px] font-black uppercase text-foreground/70 flex items-center gap-1.5 leading-none tracking-widest share-label">
                                        Special Category
                                        <Info className="w-4 h-4 text-purple-600" />
                                    </Label>
                                    <p className="text-[10px] font-black text-purple-600/70">
                                        Women / SC / ST / Aspirational
                                    </p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className={cn("text-[10px] font-black px-3 py-1.5 rounded-lg transition-all shadow-sm uppercase tracking-widest share-value", isSocialCategory ? "bg-purple-600 text-white" : "bg-muted text-foreground/50 border border-border/40")}>
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
                            <div className="flex items-center gap-3 text-[11px] font-black text-green-700 uppercase tracking-widest bg-green-500/5 p-3 rounded-lg border border-green-500/20">
                                <ShieldCheck className="w-5 h-5 text-green-600" /> Standard MSE Coverage norms applied
                            </div>
                        </div>
                    </div>

                    {/* Results Section */}
                    <div className="lg:col-span-5 p-4 md:p-6 bg-muted/30 flex flex-col justify-center space-y-6">
                        <div className="space-y-6">
                            <div className="bg-card/60 dark:bg-card/40 border border-border/40 rounded-xl p-6 shadow-sm dark:shadow-none share-row" data-share-key="annualFee" data-share-type="result">
                                <div className="space-y-1 text-center">
                                    <span className="result-label share-label">Annual Fee</span>
                                    <div className="hero-result-value h-16 flex items-center justify-center text-purple-600 share-value">
                                        {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(fee)}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                <div className="stat-card p-4 rounded-xl border border-border/50 bg-background shadow-sm flex items-center justify-between share-row" data-share-key="feeRate" data-share-type="result">
                                    <div className="flex flex-col">
                                        <span className="result-label share-label">Fee Rate</span>
                                        <span className="text-xl font-black text-purple-600 share-value">
                                            {rate.toFixed(3)}%
                                        </span>
                                    </div>
                                    <Percent className="w-5 h-5 text-purple-600 opacity-40" />
                                </div>

                                <div className="stat-card p-4 rounded-xl border border-border/50 bg-background shadow-sm flex items-center justify-between share-row" data-share-key="quarterlyFee" data-share-type="result">
                                    <div className="flex flex-col">
                                        <span className="result-label share-label">Quarterly Equivalent</span>
                                        <span className="text-xl font-black text-purple-600 share-value">
                                            {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(fee / 4)}
                                        </span>
                                    </div>

                                    <ArrowRight className="w-5 h-5 text-purple-600 opacity-40" />
                                </div>
                            </div>
                        </div>

                        <p className="text-[10px] text-foreground font-black text-center uppercase tracking-widest italic bg-primary/5 py-2 rounded-lg">
                            *Upfront on sanction, then annual on balance.
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
