import React, { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { TrendingDown, Package, Users, FileDown, RotateCcw } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { exportToPDF } from '../../lib/pdf/export';
import { formatPdfCurrency } from '../../lib/utils';

export const DrawingPowerCalculator: React.FC = () => {
    // Paid Stock
    const [stock, setStock] = useLocalStorage<string>('dp_stock', '2000000');
    const [creditors, setCreditors] = useLocalStorage<string>('dp_creditors', '500000');
    const [stockMargin, setStockMargin] = useLocalStorage<string>('dp_stock_margin', '25');

    // Debtors
    const [debtors, setDebtors] = useLocalStorage<string>('dp_debtors', '1000000');
    const [debtorMargin, setDebtorMargin] = useLocalStorage<string>('dp_debtor_margin', '40');

    const handleReset = () => {
        setStock('2000000');
        setCreditors('500000');
        setStockMargin('25');
        setDebtors('1000000');
        setDebtorMargin('40');
    };

    const dp = useMemo(() => {
        const S = parseFloat(stock) || 0;
        const C = parseFloat(creditors) || 0;
        const D = parseFloat(debtors) || 0;
        const SM = parseFloat(stockMargin) || 0;
        const DM = parseFloat(debtorMargin) || 0;

        const paidStock = Math.max(0, S - C);
        const valStock = paidStock * (1 - SM / 100);
        const valDebtors = D * (1 - DM / 100);
        const calculatedDp = valStock + valDebtors;
        return calculatedDp > 0 ? calculatedDp : 0;
    }, [stock, creditors, stockMargin, debtors, debtorMargin]);

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
            title: "Drawing Power Assessment",
            subtitle: "Security Audit Summary | Stock & Book Debt Validation",
            details: [
                { label: "--- Inventory Assets (Stock) ---", value: "" },
                { label: "Gross Stock Value", value: f(parseFloat(stock)) },
                { label: "Prescribed Stock Margin", value: `${stockMargin}% ` },
                { label: "Net Margin-Adjusted Stock", value: f(parseFloat(stock) * (1 - parseFloat(stockMargin) / 100)) },
                { label: "--- Receivables (Book Debts) ---", value: "" },
                { label: "Eligible Debtor Balance", value: f(parseFloat(debtors)) },
                { label: "Prescribed Debtor Margin", value: `${debtorMargin}% ` },
                { label: "Net Margin-Adjusted Debtors", value: f(parseFloat(debtors) * (1 - parseFloat(debtorMargin) / 100)) },
                { label: "--- Liabilities & Deductions ---", value: "" },
                { label: "Sundry Creditors (Deduction)", value: f(parseFloat(creditors)) },
                { label: "--- Terminal Eligibility ---", value: "" },
                { label: "Final Bank Drawing Power", value: f(dp) }
            ]
        }, `Drawing_Power_Assessment.pdf`);
    };

    return (
        <Card className="premium-card w-full max-w-4xl mx-auto overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-amber-500/10 via-background to-background border-b border-border/10 p-4 md:px-6">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <TrendingDown className="w-6 h-6 text-amber-500" />
                        <div>
                            <CardTitle className="text-xl font-black">Drawing Power</CardTitle>
                            <CardDescription className="text-[10px] font-bold uppercase tracking-wider text-foreground opacity-70">
                                Stock & Book Debt Assessment
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
                        <Button onClick={downloadPDF} variant="outline" size="sm" className="h-10 gap-2 border-amber-500/30 hover:bg-amber-500/10 hidden md:flex text-xs font-black px-4 shadow-sm">
                            <FileDown className="w-5 h-5 text-amber-600" />
                            EXPORT PDF
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
                    {/* Inputs Section */}
                    <div className="lg:col-span-7 p-4 md:p-6 space-y-4 border-r border-border/50">
                        {/* Stock Section */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 bg-emerald-500/5 p-2 rounded-lg border border-emerald-500/10">
                                <Package className="w-4 h-4 text-emerald-700" />
                                <h3 className="font-black uppercase tracking-widest text-[11px] text-emerald-800">Inventory Assets</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1 share-row" data-share-key="grossStock" data-share-type="input">
                                    <Label className="text-[10px] font-bold uppercase text-foreground opacity-70 share-label">Stock Value (₹)</Label>
                                    <Input value={stock} onChange={(e) => setStock(e.target.value)} type="number" className="h-10 bg-accent font-black border-none px-3 text-xl share-value" />
                                </div>
                                <div className="space-y-1 share-row" data-share-key="stockMargin" data-share-type="input">
                                    <Label className="text-[10px] font-bold uppercase text-emerald-800 opacity-70 share-label">Stock Margin (%)</Label>
                                    <Input value={stockMargin} onChange={(e) => setStockMargin(e.target.value)} type="number" className="h-10 bg-emerald-500/10 font-black text-emerald-700 border-none px-3 text-xl share-value" />
                                </div>
                            </div>
                        </div>

                        {/* Debtor Section */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 bg-blue-500/5 p-2 rounded-lg border border-blue-500/10">
                                <Users className="w-4 h-4 text-blue-700" />
                                <h3 className="font-black uppercase tracking-widest text-[11px] text-blue-800">Receivables</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1 share-row" data-share-key="grossDebtors" data-share-type="input">
                                    <Label className="text-[10px] font-bold uppercase text-foreground opacity-70 share-label">Eligible Debtors (₹)</Label>
                                    <Input value={debtors} onChange={(e) => setDebtors(e.target.value)} type="number" className="h-10 bg-accent font-black border-none px-3 text-xl share-value" />
                                </div>
                                <div className="space-y-1 share-row" data-share-key="debtorMargin" data-share-type="input">
                                    <Label className="text-[10px] font-bold uppercase text-blue-800 opacity-70 share-label">Debtor Margin (%)</Label>
                                    <Input value={debtorMargin} onChange={(e) => setDebtorMargin(e.target.value)} type="number" className="h-10 bg-blue-500/10 font-black text-blue-700 border-none px-3 text-xl share-value" />
                                </div>
                            </div>
                        </div>

                        {/* Liab Section */}
                        <div className="pt-3 border-t border-border/50">
                            <div className="space-y-1 share-row" data-share-key="creditors" data-share-type="input">
                                <Label className="text-[10px] font-bold uppercase text-amber-700 opacity-70 share-label">Sundry Creditors (₹)</Label>
                                <Input value={creditors} onChange={(e) => setCreditors(e.target.value)} type="number" className="h-10 bg-amber-500/10 font-black border-none text-amber-700 text-xl px-3 share-value" />
                            </div>
                        </div>
                    </div>

                    {/* Results Section */}
                    <div className="lg:col-span-5 p-4 md:p-6 bg-muted/30 flex flex-col justify-center space-y-4">
                        <div className="space-y-1 share-row" data-share-key="drawingPower" data-share-type="result">
                            <span className="result-label text-amber-700 share-label">Total DP Eligibility</span>
                            <div className="hero-result-value text-amber-600 leading-tight share-value">
                                {formatCurrency(dp)}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-2">
                            <div className="stat-card border-none bg-emerald-500/5 p-3 flex justify-between items-center share-row" data-share-key="netStock" data-share-type="result">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black text-emerald-800 uppercase tracking-widest share-label">Net Stock</span>
                                    <span className="text-base font-black text-emerald-600 leading-none share-value">
                                        {formatCurrency(Math.max(0, (parseFloat(stock) * (1 - parseFloat(stockMargin) / 100)) - parseFloat(creditors)))}
                                    </span>
                                </div>
                                <Package className="w-4 h-4 text-emerald-600/20" />
                            </div>
                            <div className="stat-card border-none bg-blue-500/5 p-3 flex justify-between items-center share-row" data-share-key="netDebtors" data-share-type="result">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black text-blue-800 uppercase tracking-widest share-label">Net Debtors</span>
                                    <span className="text-base font-black text-blue-600 leading-none share-value">
                                        {formatCurrency(parseFloat(debtors) * (1 - parseFloat(debtorMargin) / 100))}
                                    </span>
                                </div>
                                <Users className="w-4 h-4 text-blue-600/20" />
                            </div>
                        </div>

                        <p className="text-[10px] text-foreground font-black text-center uppercase tracking-tighter italic bg-amber-500/5 py-2 rounded-lg">
                            *DP = [(Stock - Margin) + (Debtors - Margin)] - Creditors
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
