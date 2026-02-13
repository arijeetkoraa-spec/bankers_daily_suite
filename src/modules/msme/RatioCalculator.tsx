import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { Percent, TrendingUp, Droplets, Scale, Activity, FileDown, RotateCcw } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { exportToPDF } from '../../lib/pdf-export';
import { cn, formatPdfCurrency } from '../../lib/utils';

export const RatioCalculator: React.FC = () => {
    const [activeTab, setActiveTab] = React.useState('dscr');

    // DSCR Inputs
    const [pat, setPat] = useLocalStorage<string>('ratio_pat', '500000');
    const [dep, setDep] = useLocalStorage<string>('ratio_dep', '100000');
    const [interest, setInterest] = useLocalStorage<string>('ratio_int', '200000');
    const [obligation, setObligation] = useLocalStorage<string>('ratio_obl', '300000'); // CPLTD + Interest
    const [dscr, setDscr] = useState<number>(0);

    // Liquidity Inputs
    const [ca, setCa] = useLocalStorage<string>('ratio_ca', '2000000');
    const [cl, setCl] = useLocalStorage<string>('ratio_cl', '1500000');
    const [inventory, setInventory] = useLocalStorage<string>('ratio_inventory', '500000');
    const [currentRatio, setCurrentRatio] = useState<number>(0);
    const [quickRatio, setQuickRatio] = useState<number>(0);

    // Leverage Inputs
    const [tol, setTol] = useLocalStorage<string>('ratio_tol', '4000000');
    const [tnw, setTnw] = useLocalStorage<string>('ratio_tnw', '1000000');
    const [leverage, setLeverage] = useState<number>(0);

    const handleReset = () => {
        setPat('500000');
        setDep('100000');
        setInterest('200000');
        setObligation('300000');
        setCa('2000000');
        setCl('1500000');
        setInventory('500000');
        setTol('4000000');
        setTnw('1000000');
        setFixedCost('1000000');
        setVarCost('3000000');
        setSales('5000000');
    };

    // BEP Inputs
    const [fixedCost, setFixedCost] = useLocalStorage<string>('ratio_fc', '1000000');
    const [varCost, setVarCost] = useLocalStorage<string>('ratio_vc', '3000000');
    const [sales, setSales] = useLocalStorage<string>('ratio_sales', '5000000');
    const [bep, setBep] = useState<number>(0);


    const calculate = React.useCallback(() => {
        const patVal = parseFloat(pat) || 0;
        const depVal = parseFloat(dep) || 0;
        const intVal = parseFloat(interest) || 0;
        const oblVal = parseFloat(obligation) || 0;

        if (oblVal > 0) {
            setDscr((patVal + depVal + intVal) / oblVal);
        } else {
            setDscr(0);
        }

        const caVal = parseFloat(ca) || 0;
        const clVal = parseFloat(cl) || 0;
        const invVal = parseFloat(inventory) || 0;

        if (clVal > 0) {
            setCurrentRatio(caVal / clVal);
            setQuickRatio((caVal - invVal) / clVal);
        } else {
            setCurrentRatio(0);
            setQuickRatio(0);
        }

        const tolVal = parseFloat(tol) || 0;
        const tnwVal = parseFloat(tnw) || 0;

        if (tnwVal > 0) {
            setLeverage(tolVal / tnwVal);
        } else {
            setLeverage(0);
        }

        const fcVal = parseFloat(fixedCost) || 0;
        const vcVal = parseFloat(varCost) || 0;
        const sVal = parseFloat(sales) || 0;

        const contribution = sVal - vcVal;
        if (contribution > 0) {
            setBep((fcVal / contribution) * 100);
        } else {
            setBep(0);
        }

    }, [pat, dep, interest, obligation, ca, cl, inventory, tol, tnw, fixedCost, varCost, sales]);

    useEffect(() => {
        calculate();
    }, [calculate]);

    const downloadPDF = () => {
        const f = formatPdfCurrency;

        exportToPDF({
            title: "Financial Ratio Analysis",
            subtitle: "Credit Health Diagnostic Report",
            details: [
                { label: "--- DSCR Analysis ---", value: "" },
                { label: "Net Profit After Tax", value: f(parseFloat(pat)) },
                { label: "Depreciation", value: f(parseFloat(dep)) },
                { label: "Interest Expense", value: f(parseFloat(interest)) },
                { label: "Total Obligation", value: f(parseFloat(obligation)) },
                { label: "DSCR Ratio", value: dscr.toFixed(2) },
                { label: "--- Liquidity ---", value: "" },
                { label: "Current Assets", value: f(parseFloat(ca)) },
                { label: "Current Liabilities", value: f(parseFloat(cl)) },
                { label: "Current Ratio", value: currentRatio.toFixed(2) },
                { label: "Quick Ratio", value: quickRatio.toFixed(2) },
                { label: "--- Leverage ---", value: "" },
                { label: "Total Outside Lib.", value: f(parseFloat(tol)) },
                { label: "Tangible Net Worth", value: f(parseFloat(tnw)) },
                { label: "TOL/TNW Ratio", value: leverage.toFixed(2) },
                { label: "--- Profitability (BEP) ---", value: "" },
                { label: "Break-Even Point", value: `${bep.toFixed(1)}% of Sales` }
            ]
        }, `Ratio_Analysis.pdf`);
    };

    return (
        <Card className="premium-card w-full max-w-5xl mx-auto overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-emerald-500/10 via-background to-background border-b border-border/10 p-4 md:px-6">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <Activity className="w-6 h-6 text-emerald-500" />
                        <div>
                            <CardTitle className="text-xl font-black text-foreground">Credit Ratios</CardTitle>
                            <CardDescription className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground opacity-70">
                                Financial Health Diagnostics
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
                        <Button onClick={downloadPDF} variant="outline" size="sm" className="h-10 gap-2 border-primary/30 hover:bg-primary/10 hidden md:flex text-xs font-black px-4 shadow-sm">
                            <FileDown className="w-5 h-5 text-primary" />
                            EXPORT PDF
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <div className="p-2 bg-muted/30 border-b border-border/50">
                        <TabsList className="grid w-full grid-cols-4 gap-1 bg-transparent h-auto p-0">
                            {[
                                { id: 'dscr', label: 'DSCR', icon: <TrendingUp className="w-3 h-3" /> },
                                { id: 'liquidity', label: 'Liquidity', icon: <Droplets className="w-3 h-3" /> },
                                { id: 'leverage', label: 'Leverage', icon: <Scale className="w-3 h-3" /> },
                                { id: 'bep', label: 'BEP', icon: <Percent className="w-3 h-3" /> }
                            ].map((tab) => (
                                <TabsTrigger
                                    key={tab.id}
                                    value={tab.id}
                                    className={cn(
                                        "flex items-center gap-1.5 h-10 px-4 rounded-lg transition-all font-black uppercase text-[10px] tracking-widest shadow-sm",
                                        "data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-emerald-500/20",
                                        "hover:bg-accent/80 text-foreground opacity-60 data-[state=active]:opacity-100 hover:opacity-100"
                                    )}
                                >
                                    {tab.icon}
                                    <span className="hidden md:inline">{tab.label}</span>
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
                        {/* Inputs Section */}
                        <div className="lg:col-span-7 p-4 md:p-6 space-y-4 border-r border-border/50">
                            {activeTab === 'dscr' && (
                                <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-left-2 duration-300">
                                    <div className="space-y-2 share-row"><Label className="result-label text-primary share-label">PAT (Profit After Tax)</Label><Input value={pat} onChange={e => setPat(e.target.value)} type="number" className="h-10 bg-accent/30 font-bold px-3 text-lg text-foreground share-value" /></div>
                                    <div className="space-y-2 share-row"><Label className="result-label text-primary share-label">Depreciation</Label><Input value={dep} onChange={e => setDep(e.target.value)} type="number" className="h-10 bg-accent/30 font-bold px-3 text-lg text-foreground share-value" /></div>
                                    <div className="space-y-2 share-row"><Label className="result-label text-primary share-label">Interest Expense</Label><Input value={interest} onChange={e => setInterest(e.target.value)} type="number" className="h-10 bg-accent/30 font-bold px-3 text-lg text-foreground share-value" /></div>
                                    <div className="space-y-2 share-row"><Label className="result-label text-primary share-label">Total Obligation</Label><Input value={obligation} onChange={e => setObligation(e.target.value)} type="number" className="h-10 bg-accent/30 font-bold px-3 text-lg text-foreground share-value" /></div>
                                </div>
                            )}

                            {activeTab === 'liquidity' && (
                                <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-left-2 duration-300">
                                    <div className="space-y-2 share-row"><Label className="result-label text-primary share-label">Current Assets</Label><Input value={ca} onChange={e => setCa(e.target.value)} type="number" className="h-10 bg-accent/30 font-bold px-3 text-lg text-foreground share-value" /></div>
                                    <div className="space-y-2 share-row"><Label className="result-label text-primary share-label">Current Liab.</Label><Input value={cl} onChange={e => setCl(e.target.value)} type="number" className="h-10 bg-accent/30 font-bold px-3 text-lg text-foreground share-value" /></div>
                                    <div className="space-y-2 col-span-2 share-row"><Label className="result-label text-primary share-label">Inventory (for Quick Ratio)</Label><Input value={inventory} onChange={e => setInventory(e.target.value)} type="number" className="h-10 bg-accent/30 font-bold px-3 text-lg text-foreground share-value" /></div>
                                </div>
                            )}

                            {activeTab === 'leverage' && (
                                <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-left-2 duration-300">
                                    <div className="space-y-2 share-row"><Label className="result-label text-primary share-label">Total Outside Liab. (TOL)</Label><Input value={tol} onChange={e => setTol(e.target.value)} type="number" className="h-10 bg-accent/30 font-bold px-3 text-lg text-foreground share-value" /></div>
                                    <div className="space-y-2 share-row"><Label className="result-label text-primary share-label">Tangible Net Worth (TNW)</Label><Input value={tnw} onChange={e => setTnw(e.target.value)} type="number" className="h-10 bg-accent/30 font-bold px-3 text-lg text-foreground share-value" /></div>
                                </div>
                            )}

                            {activeTab === 'bep' && (
                                <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-left-2 duration-300">
                                    <div className="space-y-2 share-row"><Label className="result-label text-primary share-label">Fixed Costs</Label><Input value={fixedCost} onChange={e => setFixedCost(e.target.value)} type="number" className="h-10 bg-accent/30 font-bold px-3 text-lg text-foreground share-value" /></div>
                                    <div className="space-y-2 share-row"><Label className="result-label text-primary share-label">Variable Costs</Label><Input value={varCost} onChange={e => setVarCost(e.target.value)} type="number" className="h-10 bg-accent/30 font-bold px-3 text-lg text-foreground share-value" /></div>
                                    <div className="space-y-2 col-span-2 share-row"><Label className="result-label text-primary share-label">Total Projected Sales</Label><Input value={sales} onChange={e => setSales(e.target.value)} type="number" className="h-10 bg-accent/30 font-bold px-3 text-lg text-foreground share-value" /></div>
                                </div>
                            )}
                        </div>

                        {/* Results Section */}
                        <div className="lg:col-span-5 p-4 md:p-6 bg-muted/30 flex flex-col justify-center space-y-4">
                            {activeTab === 'dscr' && (
                                <div className="space-y-4">
                                    <div className="bg-card/60 dark:bg-card/40 border border-border/40 rounded-xl p-4 shadow-sm dark:shadow-none share-row">
                                        <div className="space-y-1 text-center">
                                            <span className="result-label share-label">DSCR Ratio</span>
                                            <div className={cn("hero-result-value h-12 flex items-center justify-center share-value", dscr >= 1.25 ? "text-emerald-500" : "text-amber-500")}>
                                                {dscr.toFixed(2)}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="stat-card p-4 rounded-xl border border-border/50 bg-background shadow-sm flex items-center justify-between">
                                        <span className="result-label">Risk Profile</span>
                                        <span className={cn("text-sm font-black uppercase tracking-widest px-3 py-1 rounded-lg shadow-inner",
                                            dscr < 1.0 ? "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20" :
                                                dscr < 1.25 ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20" :
                                                    "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20")}>
                                            {dscr < 1.0 ? 'CRITICAL' : dscr < 1.25 ? 'MODERATE' : 'HEALTHY'}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'liquidity' && (
                                <div className="space-y-4">
                                    <div className="bg-card/60 dark:bg-card/40 border border-border/40 rounded-xl p-4 shadow-sm dark:shadow-none share-row">
                                        <div className="space-y-1 text-center">
                                            <span className="result-label share-label">Current Ratio</span>
                                            <div className={cn("hero-result-value h-12 flex items-center justify-center share-value", currentRatio >= 1.33 ? "text-emerald-500" : "text-amber-500")}>
                                                {currentRatio.toFixed(2)}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="stat-card p-3 rounded-xl border-none flex items-center justify-between">
                                        <span className="result-label">Quick Ratio</span>
                                        <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                                            {quickRatio.toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'leverage' && (
                                <div className="space-y-4">
                                    <div className="bg-card/60 dark:bg-card/40 border border-border/40 rounded-xl p-4 shadow-sm dark:shadow-none share-row">
                                        <div className="space-y-1 text-center">
                                            <span className="result-label share-label">TOL/TNW</span>
                                            <div className={cn("hero-result-value h-12 flex items-center justify-center share-value", leverage <= 3 ? "text-emerald-500" : "text-red-500")}>
                                                {leverage.toFixed(2)}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="stat-card p-3 rounded-xl border-none flex items-center justify-between">
                                        <span className={cn("text-[10px] font-black uppercase", leverage <= 3 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400")}>
                                            {leverage <= 3 ? 'Within Norms' : 'High Risk'}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'bep' && (
                                <div className="space-y-4">
                                    <div className="bg-card/60 dark:bg-card/40 border border-border/40 rounded-xl p-4 shadow-sm dark:shadow-none share-row">
                                        <div className="space-y-1 text-center">
                                            <span className="result-label share-label">Break-Even Point</span>
                                            <div className="hero-result-value h-12 flex items-center justify-center text-emerald-500 share-value">
                                                {bep.toFixed(1)}%
                                            </div>
                                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">of Sales</span>
                                        </div>
                                    </div>
                                    <div className="w-full h-2 bg-accent/50 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-emerald-500 transition-all duration-1000 ease-out"
                                            style={{ width: `${Math.min(bep, 100)}%` }}
                                        />
                                    </div>
                                </div>
                            )}

                            <p className="text-[10px] text-foreground font-black text-center uppercase tracking-tighter italic bg-primary/5 py-2 rounded-lg">
                                *Standard banking benchmarks apply.
                            </p>
                        </div>
                    </div>
                </Tabs>
            </CardContent>
        </Card>
    );
};
