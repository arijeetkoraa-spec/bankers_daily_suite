import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { Calculator, Plus, Minus, FileDown, RotateCcw, Loader2 } from 'lucide-react';

import { Button } from '../../components/ui/button';
import { exportToPDF } from '../../lib/pdf/export';
import { cn, formatPdfCurrency } from '../../lib/utils';

export const GSTCalculator: React.FC = () => {
    // inclusive or exclusive
    const [mode, setMode] = useLocalStorage<string>('gst_mode', 'exclusive'); // exclusive, inclusive
    const [amount, setAmount] = useLocalStorage<string>('gst_amount', '1000');
    const [rate, setRate] = useLocalStorage<string>('gst_rate', '18');
    const [isExporting, setIsExporting] = useState(false);


    const handleReset = () => {
        setMode('exclusive');
        setAmount('1000');
        setRate('18');
    };

    const [gstAmount, setGstAmount] = useState<number>(0);
    const [totalAmount, setTotalAmount] = useState<number>(0);
    const [netAmount, setNetAmount] = useState<number>(0);

    const calculate = React.useCallback(() => {
        const Amt = parseFloat(amount);
        const R = parseFloat(rate);

        if (isNaN(Amt) || isNaN(R) || Amt < 0 || R < 0) {
            setGstAmount(0);
            setTotalAmount(0);
            setNetAmount(0);
            return;
        }

        if (mode === 'exclusive') {
            const gst = Amt * (R / 100);
            setGstAmount(gst);
            setTotalAmount(Amt + gst);
            setNetAmount(Amt);
        } else {
            const net = Amt / (1 + R / 100);
            const gst = Amt - net;
            setGstAmount(gst);
            setTotalAmount(Amt);
            setNetAmount(net);
        }
    }, [mode, amount, rate]);

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 2
        }).format(val);
    };

    useEffect(() => {
        calculate();
    }, [calculate]);

    const downloadPDF = async () => {
        if (isExporting) return;
        setIsExporting(true);
        try {
            const f = formatPdfCurrency;
            await exportToPDF({
                title: "GST Assessment Report",
                subtitle: `Tax Configuration: GST ${mode.toUpperCase()} | Statutory Compliance`,
                details: [
                    { label: "Transaction Amount", value: f(parseFloat(amount)) },
                    { label: "Applicable Tax Rate", value: `${rate}%` },
                    { label: "--- Tax Itemization ---", value: "" },
                    { label: "Net Basic Value", value: f(netAmount) },
                    { label: "Total GST Component", value: f(gstAmount) },
                    { label: "CGST (Central Tax)", value: f(gstAmount / 2) },
                    { label: "SGST (State Tax)", value: f(gstAmount / 2) },
                    { label: "--- Final Valuation ---", value: "" },
                    { label: "Gross Invoice Value", value: f(totalAmount) }
                ]
            }, `GST_Report.pdf`);
        } finally {
            setIsExporting(false);
        }
    };


    return (
        <Card className="premium-card w-full max-w-4xl mx-auto overflow-hidden">
            <CardHeader className="bg-slate-950 border-b-2 border-slate-950 pb-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-slate-500/10 rounded-full -mr-16 -mt-16" />
                <div className="flex justify-between items-start relative z-10">
                    <div className="space-y-1">
                        <CardTitle className="text-2xl font-black text-white flex items-center gap-2">
                            <Calculator className="w-8 h-8 text-slate-400" />
                            GST Engine
                        </CardTitle>
                        <CardDescription className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                            Precise Tax Calculations for Indian Norms
                        </CardDescription>
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
                            size="sm"
                            className="h-10 gap-2 bg-white text-slate-950 hover:bg-slate-100 hidden md:flex text-xs font-black px-4 shadow-xl border-none"
                        >
                            {isExporting ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <FileDown className="w-5 h-5" />
                            )}
                            {isExporting ? "EXPORTING..." : "EXPORT PDF"}
                        </Button>

                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="grid grid-cols-1 lg:grid-cols-10 min-h-[400px]">
                    {/* Inputs Section */}
                    <div className="lg:col-span-6 p-6 md:p-10 space-y-10 border-r border-border/50 bg-card/30">
                        <div className="space-y-4">
                            <Label className="text-[11px] font-black text-foreground uppercase tracking-widest opacity-70">Calculation Mode</Label>
                            <div className="relative flex p-1 bg-muted/50 rounded-2xl gap-1 share-row h-14" data-share-key="calculationMode" data-share-type="option">
                                {/* Sliding Background */}
                                <div
                                    className={cn(
                                        "absolute top-1 bottom-1 w-[calc(50%-4px)] transition-all duration-300 ease-in-out rounded-xl shadow-md",
                                        mode === 'exclusive' ? "left-1 bg-brand-navy dark:bg-slate-800" : "left-[calc(50%+2px)] bg-brand-navy dark:bg-slate-800"
                                    )}
                                />
                                <button
                                    onClick={() => setMode('exclusive')}
                                    className={cn(
                                        "relative flex-1 flex items-center justify-center gap-2 rounded-xl transition-all font-black uppercase tracking-widest text-[11px] z-10",
                                        mode === 'exclusive' ? "text-white" : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    <Plus className="w-4 h-4" /> Exclusive
                                </button>
                                <button
                                    onClick={() => setMode('inclusive')}
                                    className={cn(
                                        "relative flex-1 flex items-center justify-center gap-2 rounded-xl transition-all font-black uppercase tracking-widest text-[11px] z-10",
                                        mode === 'inclusive' ? "text-white" : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    <Minus className="w-4 h-4" /> Inclusive
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="space-y-4 share-row" data-share-key="baseAmount" data-share-type="input">
                                <Label htmlFor="gst-amount" className="text-[11px] font-black uppercase text-foreground tracking-widest opacity-70 share-label">
                                    {mode === 'exclusive' ? 'Net Base Amount (₹)' : 'Total Amount (₹)'}
                                </Label>
                                <Input
                                    id="gst-amount"
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="h-16 text-4xl font-black bg-muted/30 border-2 border-border/50 px-6 text-foreground focus:border-brand-navy focus:ring-8 focus:ring-brand-navy/5 transition-all shadow-inner share-value rounded-2xl"
                                />
                            </div>

                            <div className="space-y-4 share-row" data-share-key="gstRate" data-share-type="input">
                                <Label htmlFor="gst-rate" className="text-[11px] font-black uppercase text-foreground tracking-widest opacity-70 share-label">GST Tax Rate (%)</Label>
                                <div className="grid grid-cols-4 gap-3">
                                    {[5, 12, 18, 28].map((r) => (
                                        <button
                                            key={r}
                                            onClick={() => setRate(r.toString())}
                                            className={cn(
                                                "py-4 rounded-xl text-[11px] font-black transition-all border-2 uppercase tracking-widest",
                                                rate === r.toString()
                                                    ? "bg-brand-navy border-brand-navy text-white shadow-lg scale-105"
                                                    : "bg-background border-border hover:border-brand-navy/30 hover:translate-y-[-2px] text-muted-foreground shadow-sm"
                                            )}
                                        >
                                            {r}%
                                        </button>
                                    ))}
                                </div>
                                <div className="relative mt-2">
                                    <Input
                                        type="number"
                                        value={rate}
                                        onChange={(e) => setRate(e.target.value)}
                                        className="h-12 font-black bg-muted/30 border-2 border-border/50 text-center text-sm text-foreground share-value rounded-xl focus:border-brand-navy/50"
                                        placeholder="Custom Rate"
                                    />
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-black pointer-events-none text-muted-foreground uppercase tracking-widest">
                                        % Rate
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Results Section */}
                    <div className="lg:col-span-4 p-6 md:p-10 bg-muted/20 flex flex-col justify-center space-y-8">
                        <div className="space-y-8">
                            <div className={cn(
                                "bg-brand-navy rounded-[2rem] p-8 shadow-2xl border-b-4 border-black/20 relative overflow-hidden share-row transition-all",
                                "animate-scale-rebound"
                            )} key={totalAmount} data-share-key="grossAmount" data-share-type="result">
                                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16" />
                                <div className="relative z-10 space-y-2 text-center">
                                    <span className="text-[11px] font-black uppercase text-white/60 tracking-[0.3em] share-label">Final Gross Total</span>
                                    <div className="text-5xl font-black text-white leading-tight share-value">
                                        {formatCurrency(totalAmount)}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-5">
                                <div className="bg-card border-2 border-border/50 p-6 rounded-2xl shadow-sm space-y-1 share-row" data-share-key="gstAmount" data-share-type="result">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[11px] font-black text-foreground uppercase tracking-widest share-label opacity-70">GST Tax ({rate}%)</span>
                                        <div className="px-3 py-1 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 text-[9px] font-black uppercase tracking-widest">
                                            Tax Liability
                                        </div>
                                    </div>
                                    <div className="text-3xl font-black text-[#dc2626] dark:text-red-400 share-value">
                                        {formatCurrency(gstAmount)}
                                    </div>
                                </div>

                                <div className="bg-card border-2 border-border/50 p-6 rounded-2xl shadow-sm space-y-1 share-row" data-share-key="netValue" data-share-type="result">
                                    <span className="text-[11px] font-black text-foreground uppercase tracking-widest share-label opacity-70">Net Basic Amount</span>
                                    <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 share-value">
                                        {formatCurrency(netAmount)}
                                    </div>
                                </div>

                                <div className="p-5 rounded-2xl bg-brand-navy dark:bg-slate-900 text-white flex items-center justify-between shadow-xl share-row" data-share-key="taxBreakdown" data-share-type="result">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black uppercase tracking-widest opacity-50 share-label">CGST / SGST (50/50)</span>
                                        <span className="text-lg font-black text-slate-200 share-value">{formatCurrency(gstAmount / 2)} <span className="text-[11px] opacity-50">EACH</span></span>
                                    </div>
                                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                                        <Calculator className="w-5 h-5 text-white/40" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
