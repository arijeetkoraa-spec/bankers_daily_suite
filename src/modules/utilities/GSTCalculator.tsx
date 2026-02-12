import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { Calculator, Plus, Minus, FileDown } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { exportToPDF } from '../../lib/pdf-export';
import { cn, formatPdfCurrency } from '../../lib/utils';

export const GSTCalculator: React.FC = () => {
    // inclusive or exclusive
    const [mode, setMode] = useLocalStorage<string>('gst_mode', 'exclusive'); // exclusive, inclusive
    const [amount, setAmount] = useLocalStorage<string>('gst_amount', '1000');
    const [rate, setRate] = useLocalStorage<string>('gst_rate', '18');

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

    const downloadPDF = () => {
        const f = formatPdfCurrency;
        exportToPDF({
            title: "GST Invoice Summary",
            subtitle: `Mode: GST ${mode.toUpperCase()} Calculation`,
            details: [
                { label: "Input Amount", value: f(parseFloat(amount)) },
                { label: "Tax Rate", value: `${rate}%` },
                { label: "--- Calculation Breakdown ---", value: "" },
                { label: "Net Basic Amount", value: f(netAmount) },
                { label: "Total GST Amount", value: f(gstAmount) },
                { label: "CGST (Local)", value: f(gstAmount / 2) },
                { label: "SGST (Local)", value: f(gstAmount / 2) },
                { label: "--- Final Result ---", value: "" },
                { label: "Gross Total Amount", value: f(totalAmount) }
            ]
        }, `GST_Report.pdf`);
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
                    <Button onClick={downloadPDF} size="sm" className="h-10 gap-2 bg-white text-slate-950 hover:bg-slate-100 hidden md:flex text-xs font-black px-4 shadow-xl border-none">
                        <FileDown className="w-5 h-5" />
                        EXPORT PDF
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[400px]">
                    {/* Inputs Section */}
                    <div className="lg:col-span-7 p-6 md:p-8 space-y-8 border-r-2 border-slate-100 bg-white">
                        <div className="space-y-5">
                            <Label className="text-[10px] font-black text-slate-950 uppercase tracking-widest">Calculation Mode</Label>
                            <div className="flex p-1.5 bg-slate-100 border-2 border-slate-200 rounded-2xl gap-1.5 shadow-inner">
                                <button
                                    onClick={() => setMode('exclusive')}
                                    className={cn(
                                        "flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl transition-all font-black uppercase tracking-widest text-[10px]",
                                        mode === 'exclusive'
                                            ? "bg-slate-950 text-white shadow-xl scale-[1.02]"
                                            : "hover:bg-slate-200 text-slate-500"
                                    )}
                                >
                                    <Plus className="w-4 h-4" /> Exclusive
                                </button>
                                <button
                                    onClick={() => setMode('inclusive')}
                                    className={cn(
                                        "flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl transition-all font-black uppercase tracking-widest text-[10px]",
                                        mode === 'inclusive'
                                            ? "bg-slate-950 text-white shadow-xl scale-[1.02]"
                                            : "hover:bg-slate-200 text-slate-500"
                                    )}
                                >
                                    <Minus className="w-4 h-4" /> Inclusive
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="space-y-3">
                                <Label htmlFor="gst-amount" className="text-[10px] font-black uppercase text-slate-950 tracking-widest leading-none">
                                    {mode === 'exclusive' ? 'Net Base Amount (₹)' : 'Total Amount (₹)'}
                                </Label>
                                <Input
                                    id="gst-amount"
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="h-14 text-4xl font-black bg-slate-50 border-2 border-slate-200 px-6 text-slate-950 focus:border-slate-950 focus:ring-4 focus:ring-slate-950/5 transition-all shadow-inner"
                                />
                            </div>

                            <div className="space-y-3">
                                <Label htmlFor="gst-rate" className="text-[10px] font-black uppercase text-slate-950 tracking-widest leading-none">GST Tax Rate (%)</Label>
                                <div className="grid grid-cols-4 gap-2">
                                    {[5, 12, 18, 28].map((r) => (
                                        <button
                                            key={r}
                                            onClick={() => setRate(r.toString())}
                                            className={cn(
                                                "py-3 rounded-xl text-[10px] font-black transition-all border-2 uppercase tracking-widest",
                                                rate === r.toString()
                                                    ? "bg-slate-950 border-slate-950 text-white shadow-lg"
                                                    : "bg-white border-slate-100 hover:border-slate-300 text-slate-500 shadow-sm"
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
                                        className="h-10 font-black bg-slate-50 border-2 border-slate-100 text-center text-xs text-slate-950"
                                        placeholder="Custom Rate"
                                    />
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[8px] font-black pointer-events-none text-slate-500 uppercase tracking-widest">
                                        % Rate
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Results Section */}
                    <div className="lg:col-span-5 p-6 md:p-8 bg-slate-50 flex flex-col justify-center space-y-8">
                        <div className="space-y-8">
                            <div className="bg-slate-950 rounded-2xl p-8 shadow-2xl border-2 border-slate-900 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-slate-500/10 rounded-full -mr-16 -mt-16" />
                                <div className="relative z-10 space-y-2 text-center">
                                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em]">Final Gross Total</span>
                                    <div className="text-4xl font-black text-white leading-tight">
                                        {formatCurrency(totalAmount)}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                <div className="bg-white border-2 border-slate-200 p-5 rounded-2xl shadow-sm space-y-1">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-black text-slate-950 uppercase tracking-widest">GST Portion ({rate}%)</span>
                                        <div className="px-2 py-0.5 rounded-md bg-red-100 text-red-700 text-[8px] font-black uppercase tracking-widest">
                                            Tax Liability
                                        </div>
                                    </div>
                                    <div className="text-2xl font-black text-red-600">
                                        {formatCurrency(gstAmount)}
                                    </div>
                                </div>

                                <div className="bg-white border-2 border-slate-200 p-5 rounded-2xl shadow-sm space-y-1">
                                    <span className="text-[10px] font-black text-slate-950 uppercase tracking-widest">Net Basic Amount</span>
                                    <div className="text-2xl font-black text-emerald-600">
                                        {formatCurrency(netAmount)}
                                    </div>
                                </div>

                                <div className="p-4 rounded-xl bg-slate-950 text-white flex items-center justify-between shadow-xl ring-2 ring-white/5">
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-black uppercase tracking-widest opacity-60">CGST / SGST (50/50)</span>
                                        <span className="text-base font-black text-slate-300">{formatCurrency(gstAmount / 2)} <span className="text-[10px] opacity-60">EACH</span></span>
                                    </div>
                                    <Calculator className="w-5 h-5 text-slate-500" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
