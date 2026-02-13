import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { Briefcase, Coins, ShieldCheck, BarChart3, FileDown, RotateCcw } from 'lucide-react';
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

    const handleReset = () => {
        setMethod('turnover');
        setSales('10000000');
        setCa('5000000');
        setCl('1500000');
    };

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
            <CardHeader className="bg-gradient-to-r from-amber-500/8 via-background to-background border-b border-border/10 p-4 md:px-6 relative overflow-hidden">
                <div className="flex justify-between items-start relative z-10">
                    <div className="space-y-1">
                        <CardTitle className="text-2xl font-black flex items-center gap-2 text-foreground">
                            <Briefcase className="w-8 h-8 text-amber-500" />
                            Working Capital
                        </CardTitle>
                        <CardDescription className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground opacity-70">
                            Nayak & Tandon Assessment Engines
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
                        <Button onClick={downloadPDF} variant="outline" size="sm" className="h-10 gap-2 border-primary/30 hover:bg-primary/10 hidden md:flex text-xs font-black px-4 shadow-sm">
                            <FileDown className="w-5 h-5 text-primary" />
                            EXPORT PDF
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <Tabs defaultValue={method} value={method} onValueChange={setMethod} className="w-full">
                    <div className="p-2 bg-muted/30 border-b border-border/50">
                        <TabsList className="grid w-full grid-cols-2 gap-1 bg-transparent h-auto p-0">
                            {[
                                { id: 'turnover', label: 'Nayak (Turnover)', icon: <BarChart3 className="w-3 h-3" /> },
                                { id: 'mpbf', label: 'Tandon (Gap)', icon: <ShieldCheck className="w-3 h-3" /> }
                            ].map((tab) => (
                                <TabsTrigger
                                    key={tab.id}
                                    value={tab.id}
                                    className={cn(
                                        "flex items-center gap-1.5 h-10 px-4 rounded-lg transition-all font-black uppercase text-[10px] tracking-widest shadow-sm",
                                        "data-[state=active]:bg-amber-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-amber-500/20",
                                        "hover:bg-accent/80 text-foreground opacity-70 data-[state=active]:opacity-100 hover:opacity-100"
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
                        <div className="lg:col-span-7 p-4 md:p-6 space-y-6 border-r border-border/50">
                            {method === 'turnover' && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-left-2 duration-300">
                                    <div className="space-y-2 share-row">
                                        <Label htmlFor="wc-sales" className="result-label text-amber-600 share-label">Projected Annual Turnover (₹)</Label>
                                        <div className="relative">
                                            <Input
                                                id="wc-sales"
                                                type="number"
                                                value={sales}
                                                onChange={(e) => setSales(e.target.value)}
                                                className="h-10 bg-accent/30 font-bold px-3 text-lg text-foreground placeholder:text-muted-foreground share-value"
                                            />
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-amber-600 bg-amber-500/5 px-2 py-1 rounded-md tracking-widest uppercase">
                                                PROJECTED
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="stat-card p-4 rounded-xl border border-border/50 bg-background shadow-sm flex flex-col gap-1">
                                            <span className="result-label">WC Requirement (25%)</span>
                                            <span className="text-xl font-black text-amber-600">
                                                {formatCurrency(parseFloat(sales) * 0.25)}
                                            </span>
                                        </div>
                                        <div className="stat-card p-4 rounded-xl border border-border/50 bg-background shadow-sm flex flex-col gap-1">
                                            <span className="result-label text-red-600">Min. Margin (5%)</span>
                                            <span className="text-xl font-black text-red-600">
                                                {formatCurrency(parseFloat(sales) * 0.05)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {method === 'mpbf' && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-left-2 duration-300">
                                    <div className="grid grid-cols-1 gap-4">
                                        <div className="space-y-2 share-row">
                                            <Label htmlFor="wc-ca" className="result-label text-amber-600 share-label">Total Current Assets (₹)</Label>
                                            <Input
                                                id="wc-ca"
                                                type="number"
                                                value={ca}
                                                onChange={(e) => setCa(e.target.value)}
                                                className="h-10 bg-accent/30 font-bold px-3 text-lg text-foreground placeholder:text-muted-foreground share-value"
                                            />
                                        </div>
                                        <div className="space-y-2 share-row">
                                            <Label htmlFor="wc-cl" className="result-label text-amber-600 share-label">Other Current Liabilities (₹)</Label>
                                            <Input
                                                id="wc-cl"
                                                type="number"
                                                value={cl}
                                                onChange={(e) => setCl(e.target.value)}
                                                className="h-10 bg-accent/30 font-bold px-3 text-lg text-foreground placeholder:text-muted-foreground share-value"
                                            />
                                            <p className="text-[10px] font-black text-amber-700/70 uppercase tracking-tight italic">*Excluding Short Term Bank Borrowings</p>
                                        </div>
                                    </div>

                                    <div className="stat-card p-4 rounded-xl border border-border/50 bg-background shadow-sm flex items-center justify-between">
                                        <span className="result-label">Working Capital Gap</span>
                                        <span className="text-xl font-black text-amber-600">
                                            {formatCurrency(parseFloat(ca) - parseFloat(cl))}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Results Section */}
                        <div className="lg:col-span-5 p-4 md:p-6 bg-muted/30 flex flex-col justify-center space-y-6">
                            <div className="space-y-6 flex-1 flex flex-col justify-center">
                                <div className="bg-card/60 dark:bg-card/40 border border-border/40 rounded-xl p-6 shadow-sm dark:shadow-none share-row">
                                    <div className="space-y-1 text-center">
                                        <span className="result-label share-label">
                                            Max Permissible Finance
                                        </span>
                                        <div className="hero-result-value h-16 flex items-center justify-center text-amber-500 share-value">
                                            {formatCurrency(method === 'turnover' ? turnoverLimit : mpbf)}
                                        </div>
                                    </div>
                                </div>

                                <div className="stat-card p-4 rounded-xl border border-border/50 bg-background shadow-sm flex items-center justify-between group">
                                    <div className="flex flex-col">
                                        <span className="result-label share-label">Bank Share</span>
                                        <span className="text-xl font-black text-amber-600 share-value">
                                            {method === 'turnover' ? '20%' : '75%'}
                                        </span>
                                    </div>
                                    <Coins className="w-6 h-6 text-amber-500 opacity-40" />
                                </div>
                            </div>

                            <div className="mt-4">
                                <p className="text-[10px] text-foreground font-black text-center uppercase tracking-tighter italic bg-primary/5 py-2 rounded-lg">
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
