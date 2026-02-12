import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { TrendingDown, Package, Users, FileDown } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { exportToPDF } from '../../lib/pdf-export';
import { formatPdfCurrency } from '../../lib/utils';

export const DrawingPowerCalculator: React.FC = () => {
    // Paid Stock
    const [stock, setStock] = useLocalStorage<string>('dp_stock', '2000000');
    const [creditors, setCreditors] = useLocalStorage<string>('dp_creditors', '500000');
    const [stockMargin, setStockMargin] = useLocalStorage<string>('dp_stock_margin', '25');

    // Debtors
    const [debtors, setDebtors] = useLocalStorage<string>('dp_debtors', '1000000');
    const [debtorMargin, setDebtorMargin] = useLocalStorage<string>('dp_debtor_margin', '40');

    const [dp, setDp] = useState<number>(0);

    const calculate = React.useCallback(() => {
        const S = parseFloat(stock) || 0;
        const C = parseFloat(creditors) || 0;
        const D = parseFloat(debtors) || 0;
        const SM = parseFloat(stockMargin) || 0;
        const DM = parseFloat(debtorMargin) || 0;

        const paidStock = Math.max(0, S - C);
        const valStock = paidStock * (1 - SM / 100);
        const valDebtors = D * (1 - DM / 100);
        const calculatedDp = valStock + valDebtors;
        setDp(calculatedDp > 0 ? calculatedDp : 0);
    }, [stock, creditors, stockMargin, debtors, debtorMargin]);

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
            title: "Drawing Power Assessment",
            subtitle: "Stock & Book Debt Audit Summary",
            details: [
                { label: "--- Inventory Assets ---", value: "" },
                { label: "Total Stock Value", value: f(parseFloat(stock)) },
                { label: "Stock Margin", value: `${stockMargin}%` },
                { label: "Net Stock Value", value: f(parseFloat(stock) * (1 - parseFloat(stockMargin) / 100)) },
                { label: "--- Receivables ---", value: "" },
                { label: "Eligible Debtors", value: f(parseFloat(debtors)) },
                { label: "Debtor Margin", value: `${debtorMargin}%` },
                { label: "Net Debtor Value", value: f(parseFloat(debtors) * (1 - parseFloat(debtorMargin) / 100)) },
                { label: "--- Deductions ---", value: "" },
                { label: "Sundry Creditors", value: f(parseFloat(creditors)) },
                { label: "--- Final Eligibility ---", value: "" },
                { label: "Total Drawing Power", value: f(dp) }
            ]
        }, `Drawing_Power_Summary.pdf`);
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
                    <Button onClick={downloadPDF} variant="outline" size="sm" className="h-10 gap-2 border-amber-500/30 hover:bg-amber-500/10 hidden md:flex text-xs font-black px-4 shadow-sm">
                        <FileDown className="w-5 h-5 text-amber-600" />
                        EXPORT PDF
                    </Button>
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
                                <div className="space-y-1">
                                    <Label className="text-[10px] font-bold uppercase text-foreground opacity-70">Stock Value (₹)</Label>
                                    <Input value={stock} onChange={(e) => setStock(e.target.value)} type="number" className="h-10 bg-accent font-black border-none px-3 text-xl" />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[10px] font-bold uppercase text-emerald-800 opacity-70">Margin (%)</Label>
                                    <Input value={stockMargin} onChange={(e) => setStockMargin(e.target.value)} type="number" className="h-10 bg-emerald-500/10 font-black text-emerald-700 border-none px-3 text-xl" />
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
                                <div className="space-y-1">
                                    <Label className="text-[10px] font-bold uppercase text-foreground opacity-70">Eligible Debtors (₹)</Label>
                                    <Input value={debtors} onChange={(e) => setDebtors(e.target.value)} type="number" className="h-10 bg-accent font-black border-none px-3 text-xl" />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[10px] font-bold uppercase text-blue-800 opacity-70">Margin (%)</Label>
                                    <Input value={debtorMargin} onChange={(e) => setDebtorMargin(e.target.value)} type="number" className="h-10 bg-blue-500/10 font-black text-blue-700 border-none px-3 text-xl" />
                                </div>
                            </div>
                        </div>

                        {/* Liab Section */}
                        <div className="pt-3 border-t border-border/50">
                            <div className="space-y-1">
                                <Label className="text-[10px] font-bold uppercase text-amber-700 opacity-70">Sundry Creditors (₹)</Label>
                                <Input value={creditors} onChange={(e) => setCreditors(e.target.value)} type="number" className="h-10 bg-amber-500/10 font-black border-none text-amber-700 text-xl px-3" />
                            </div>
                        </div>
                    </div>

                    {/* Results Section */}
                    <div className="lg:col-span-5 p-4 md:p-6 bg-muted/30 flex flex-col justify-center space-y-4">
                        <div className="space-y-1">
                            <span className="result-label text-amber-700">Total DP Eligibility</span>
                            <div className="hero-result-value text-amber-600 leading-tight">
                                {formatCurrency(dp)}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-2">
                            <div className="stat-card border-none bg-emerald-500/5 p-3 flex justify-between items-center">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">Net Stock</span>
                                    <span className="text-base font-black text-emerald-600 leading-none">
                                        {formatCurrency(Math.max(0, (parseFloat(stock) * (1 - parseFloat(stockMargin) / 100)) - parseFloat(creditors)))}
                                    </span>
                                </div>
                                <Package className="w-4 h-4 text-emerald-600/20" />
                            </div>
                            <div className="stat-card border-none bg-blue-500/5 p-3 flex justify-between items-center">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black text-blue-800 uppercase tracking-widest">Net Debtors</span>
                                    <span className="text-base font-black text-blue-600 leading-none">
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
