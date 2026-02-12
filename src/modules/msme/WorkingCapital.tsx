import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { Briefcase, Coins, ShieldCheck, BarChart3, FileDown } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { exportToPDF } from '../../lib/pdf-export';
import { cn, formatPdfCurrency } from '../../lib/utils';

export const WorkingCapitalCalculator: React.FC = () => {
    const [method, setMethod] = useLocalStorage<string>('wc_method', 'turnover');

    // Turnover Method
    const [sales, setSales] = useLocalStorage<string>('wc_sales', '10000000'); // 1 Cr
    const [turnoverLimit, setTurnoverLimit] = useState<number>(0);

    // MPBF Method II
    const [ca, setCa] = useLocalStorage<string>('wc_ca', '5000000'); // Current Assets
    const [cl, setCl] = useLocalStorage<string>('wc_cl', '1500000'); // Current Liabilities (excluding bank borrowing)
    const [mpbf, setMpbf] = useState<number>(0);

    const calculate = React.useCallback(() => {
        if (method === 'turnover') {
            const S = parseFloat(sales);
            if (isNaN(S) || S <= 0) {
                setTurnoverLimit(0);
                return;
            }
            const bankFinance = S * 0.20;
            setTurnoverLimit(bankFinance);

        } else if (method === 'mpbf') {
            const CA = parseFloat(ca);
            const CL = parseFloat(cl);
            if (isNaN(CA) || isNaN(CL)) {
                setMpbf(0);
                return;
            }
            const val = 0.75 * (CA - CL);
            setMpbf(val > 0 ? val : 0);
        }
    }, [method, sales, ca, cl]);

    useEffect(() => {
        calculate();
    }, [calculate]);

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(val);
    };

    const downloadPDF = () => {
        const f = formatPdfCurrency;

        exportToPDF({
            title: "Working Capital Assessment",
            subtitle: method === 'turnover' ? "Nayak Committee (Turnover Method)" : "Tandon Committee (MPBF Method II)",
            details: [
                { label: "Assessment Method", value: method === 'turnover' ? "Turnover Method" : "MPBF Method II" },
                ...(method === 'turnover' ? [
                    { label: "Projected Annual Sales", value: f(parseFloat(sales)) },
                    { label: "WC Requirement (25%)", value: f(parseFloat(sales) * 0.25) },
                    { label: "Minimum Margin (5%)", value: f(parseFloat(sales) * 0.05) },
                ] : [
                    { label: "Total Current Assets", value: f(parseFloat(ca)) },
                    { label: "Other Current Liabilities", value: f(parseFloat(cl)) },
                    { label: "Working Capital Gap", value: f(parseFloat(ca) - parseFloat(cl)) },
                ]),
                { label: "--- Limit Calculation ---", value: "" },
                { label: "Bank Finance Share", value: method === 'turnover' ? "20% of Sales" : "75% of Gap" },
                { label: "Proposed Limit", value: f(method === 'turnover' ? turnoverLimit : mpbf) }
            ]
        }, `Working_Capital_${method}.pdf`);
    };

    return (
        <Card className="premium-card w-full max-w-4xl mx-auto overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-amber-500/10 via-background to-background border-b border-border/10 pb-8">
                <div className="flex justify-between items-start">
                    <div className="space-y-1">
                        <CardTitle className="text-2xl font-black flex items-center gap-2">
                            <Briefcase className="w-8 h-8 text-amber-500" />
                            Working Capital
                        </CardTitle>
                        <CardDescription className="text-[10px] font-bold uppercase tracking-wider text-foreground opacity-70">
                            Nayak & Tandon Assessment Engines
                        </CardDescription>
                    </div>
                    <Button onClick={downloadPDF} variant="outline" className="h-10 gap-2 border-amber-500/30 hover:bg-amber-500/10 hidden md:flex text-xs font-black px-4 shadow-sm">
                        <FileDown className="w-5 h-5 text-amber-600" />
                        EXPORT PDF
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <Tabs defaultValue={method} value={method} onValueChange={setMethod} className="w-full">
                    <div className="p-4 bg-muted/30 border-b border-border/50">
                        <TabsList className="grid w-full grid-cols-2 gap-2 bg-transparent h-auto p-0">
                            {[
                                { id: 'turnover', label: 'Nayak (Turnover)', icon: <BarChart3 className="w-4 h-4" /> },
                                { id: 'mpbf', label: 'Tandon (Gap)', icon: <ShieldCheck className="w-4 h-4" /> }
                            ].map((tab) => (
                                <TabsTrigger
                                    key={tab.id}
                                    value={tab.id}
                                    className={cn(
                                        "flex items-center gap-2 px-6 py-4 rounded-xl transition-all font-black uppercase tracking-tighter text-xs md:text-sm shadow-sm",
                                        "data-[state=active]:bg-amber-600 data-[state=active]:text-white data-[state=active]:shadow-xl data-[state=active]:shadow-amber-500/30",
                                        "hover:bg-accent/80 text-foreground bg-accent/20 opacity-60 data-[state=active]:opacity-100 hover:opacity-100"
                                    )}
                                >
                                    {tab.icon}
                                    {tab.label}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[400px]">
                        {/* Inputs Section */}
                        <div className="lg:col-span-7 p-6 md:p-8 space-y-8 border-r border-border/50">
                            {method === 'turnover' && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-left-4">
                                    <div className="space-y-1">
                                        <Label htmlFor="wc-sales" className="text-[10px] font-bold uppercase text-amber-700 opacity-70">Projected Annual Turnover (₹)</Label>
                                        <div className="relative">
                                            <Input
                                                id="wc-sales"
                                                type="number"
                                                value={sales}
                                                onChange={(e) => setSales(e.target.value)}
                                                className="text-3xl font-black h-14 bg-accent border-none focus-visible:ring-amber-500 px-6"
                                            />
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-amber-800/40 bg-background/50 px-2 py-1 rounded-md tracking-widest">
                                                PROJECTED
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="stat-card border-none bg-emerald-600/10">
                                            <span className="text-[10px] font-bold uppercase text-emerald-800 opacity-70">WC Requirement (25%)</span>
                                            <span className="text-xl font-black text-emerald-600">
                                                {formatCurrency(parseFloat(sales) * 0.25)}
                                            </span>
                                        </div>
                                        <div className="stat-card border-none bg-red-600/10">
                                            <span className="text-[10px] font-bold uppercase text-red-800 opacity-70">Min. Margin (5%)</span>
                                            <span className="text-xl font-black text-red-600">
                                                {formatCurrency(parseFloat(sales) * 0.05)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {method === 'mpbf' && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-left-4">
                                    <div className="grid grid-cols-1 gap-6">
                                        <div className="space-y-1">
                                            <Label htmlFor="wc-ca" className="text-[10px] font-bold uppercase text-amber-700 opacity-70">Total Current Assets (₹)</Label>
                                            <Input
                                                id="wc-ca"
                                                type="number"
                                                value={ca}
                                                onChange={(e) => setCa(e.target.value)}
                                                className="text-2xl font-black h-12 bg-accent border-none focus-visible:ring-amber-500 px-6"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label htmlFor="wc-cl" className="text-[10px] font-bold uppercase text-amber-700 opacity-70">Other Current Liabilities (₹)</Label>
                                            <Input
                                                id="wc-cl"
                                                type="number"
                                                value={cl}
                                                onChange={(e) => setCl(e.target.value)}
                                                className="text-2xl font-black h-12 bg-accent border-none focus-visible:ring-amber-500 px-6"
                                            />
                                            <p className="text-[10px] font-black text-amber-800 uppercase tracking-tight">Excluding Short Term Bank Borrowings</p>
                                        </div>
                                    </div>

                                    <div className="stat-card border-none bg-amber-500/5">
                                        <span className="result-label text-amber-700">Working Capital Gap</span>
                                        <span className="text-xl font-black text-amber-600">
                                            {formatCurrency(parseFloat(ca) - parseFloat(cl))}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Results Section */}
                        <div className="lg:col-span-5 p-6 md:p-8 bg-muted/30 flex flex-col justify-between">
                            <div className="space-y-8 flex-1 flex flex-col justify-center">
                                <div className="space-y-2">
                                    <span className="result-label">
                                        Max Permissible Finance
                                    </span>
                                    <div className="hero-result-value text-amber-600">
                                        {formatCurrency(method === 'turnover' ? turnoverLimit : mpbf)}
                                    </div>
                                </div>

                                <div className="stat-card bg-amber-500/10 border-amber-500/20">
                                    <div className="flex justify-between items-center">
                                        <div className="flex flex-col">
                                            <span className="result-label text-amber-700">Bank Share</span>
                                            <span className="text-2xl font-black text-amber-600">
                                                {method === 'turnover' ? '20%' : '75%'}
                                            </span>
                                        </div>
                                        <Coins className="w-8 h-8 text-amber-500 opacity-20" />
                                    </div>
                                    <div className="w-full h-2 bg-amber-500/20 rounded-full mt-3 overflow-hidden">
                                        <div
                                            className="h-full bg-amber-500 transition-all duration-1000 ease-out"
                                            style={{ width: method === 'turnover' ? '20%' : '75%' }}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 pt-8 border-t border-border/10">
                                <p className="text-[11px] text-foreground/80 leading-relaxed font-black uppercase tracking-tight bg-amber-500/5 p-3 rounded-xl border border-amber-500/10 shadow-sm">
                                    {method === 'turnover'
                                        ? "*Turnover method follows Nayak Committee norms for limits up to ₹5 Crores."
                                        : "*MPBF calculations follow Tandon Committee Method II norms (0.75 x Gap)."
                                    }
                                </p>
                            </div>
                        </div>
                    </div>
                </Tabs>
            </CardContent>
        </Card>
    );
};
