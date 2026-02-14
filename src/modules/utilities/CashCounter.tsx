import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { ClipboardCopy, RotateCcw, Banknote, FileDown, Loader2 } from 'lucide-react';

import { formatIndianCurrency, numberToIndianWords, cn, formatPdfCurrency, formatDate } from '../../lib/utils';
import { exportToPDF, renderTable } from '../../lib/pdf/export';
import { useLocalStorage } from '../../hooks/useLocalStorage';

// Denominations
const denoms = [500, 200, 100, 50, 20, 10, 5, 2, 1];

export const CashCounter: React.FC = () => {

    // State for counts
    const getTodayISO = () => new Date().toISOString().split("T")[0];
    const [counts, setCounts] = useLocalStorage<Record<number, string>>('cash_counts', {});
    const [operationDate, setOperationDate] = React.useState(getTodayISO());
    const [isExporting, setIsExporting] = React.useState(false);


    // Derived State
    let total = 0;
    denoms.forEach(d => {
        const count = parseInt(counts[d] || '0', 10);
        if (!isNaN(count)) {
            total += count * d;
        }
    });
    const totalWords = numberToIndianWords(total);

    const handleCountChange = (denom: number, value: string) => {
        setCounts(prev => ({
            ...prev,
            [denom]: value
        }));
    };

    const reset = () => {
        setCounts({});
    };

    const copyToClipboard = () => {
        const text = `Total Cash: ${formatIndianCurrency(total)}\n(${totalWords})\n\nDetails:\n` +
            denoms.map(d => {
                const c = counts[d];
                return c ? `${d} x ${c} = ${d * parseInt(c, 10)}` : null;
            }).filter(Boolean).join('\n');

        navigator.clipboard.writeText(text);
        alert("Cash summary copied to clipboard!");
    };

    const downloadPDF = async () => {
        if (isExporting) return;
        setIsExporting(true);
        try {
            const f = formatPdfCurrency;
            await exportToPDF({
                title: "Cash Denomination Summary",
                subtitle: "Physical Cash Verification Report | Professional Audit",
                details: [
                    { label: "Operation Date", value: formatDate(operationDate) },
                    { label: "Grand Total Value", value: f(total) },
                    { label: "Amount in Words", value: totalWords },
                    { label: "--- Verification Stamp ---", value: "" },
                    { label: "Audit Status", value: "SELF-VERIFIED" }
                ]
            }, `Cash_Assessment.pdf`, (ctx) => {
                ctx.cursorY += 10;
                const columns = ["Denomination", "Quantity", "Total Value"];
                const rows = denoms
                    .filter(d => counts[d] && parseInt(counts[d]) > 0)
                    .map(d => [
                        `Rs. ${d}`,
                        counts[d],
                        f(d * parseInt(counts[d]))
                    ]);
                return renderTable(ctx, columns, rows);
            });
        } finally {
            setIsExporting(false);
        }
    };


    return (
        <Card className="premium-card w-full max-w-3xl mx-auto overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-slate-800/5 via-background to-background border-b border-border/10 p-4 md:px-6">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <Banknote className="w-6 h-6 text-slate-700" />
                        <div>
                            <CardTitle className="text-xl font-black text-slate-800">Cash Operations</CardTitle>
                            <CardDescription className="text-[10px] font-bold uppercase tracking-wider text-foreground opacity-70">
                                Denomination Counter
                            </CardDescription>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            onClick={reset}
                            variant="outline"
                            size="sm"
                            className="h-10 px-4 rounded-xl border border-border/50 bg-card/60 hover:bg-accent/50 text-sm font-semibold flex items-center gap-2 transition"
                        >
                            <RotateCcw className="w-4 h-4" />
                            Reset
                        </Button>
                        <Button onClick={copyToClipboard} size="sm" className="h-10 gap-2 border-slate-300 hover:bg-slate-100 hidden md:flex text-xs font-black px-4 shadow-sm" variant="outline">
                            <ClipboardCopy className="w-4 h-4 text-slate-600" />
                            Copy
                        </Button>
                        <Button
                            onClick={downloadPDF}
                            disabled={isExporting}
                            size="sm"
                            className="h-10 gap-2 border-primary/30 hover:bg-primary/10 hidden md:flex text-xs font-black px-4 shadow-sm"
                            variant="outline"
                        >
                            {isExporting ? (
                                <Loader2 className="w-5 h-5 text-primary animate-spin" />
                            ) : (
                                <FileDown className="w-5 h-5 text-primary" />
                            )}
                            {isExporting ? "..." : "PDF"}
                        </Button>
                    </div>
                </div>

                {/* Responsive Date Selector Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-4 pt-4 border-t border-border/10">
                    <div className="flex items-center gap-3 bg-accent/50 px-4 py-2 rounded-xl border border-border/20 shadow-sm grow sm:grow-0">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground whitespace-nowrap">
                            Operation Date
                        </label>
                        <input
                            type="date"
                            value={operationDate}
                            onChange={(e) => setOperationDate(e.target.value)}
                            className="bg-transparent border-none text-xs font-black focus:outline-none focus:ring-0 p-0 h-auto text-primary uppercase cursor-pointer"
                            style={{ colorScheme: 'light dark' }}
                        />
                    </div>
                    <Button
                        onClick={() => setOperationDate(getTodayISO())}
                        variant="ghost"
                        size="sm"
                        className="h-8 text-[10px] font-black uppercase tracking-widest text-primary hover:text-primary hover:bg-primary/5 px-4 rounded-lg border border-primary/10"
                    >
                        Reset to Today
                    </Button>
                </div>
            </CardHeader>

            <CardContent className="p-0">
                <div className="grid grid-cols-1 md:grid-cols-12">
                    {/* Input Section */}
                    <div className="md:col-span-7 p-4 space-y-3 bg-muted/20">
                        {denoms.map(denom => (
                            <div key={denom} className={cn("flex items-center gap-4 group", counts[denom] && parseInt(counts[denom]) > 0 ? "share-row" : "")} {...((counts[denom] && parseInt(counts[denom]) > 0) ? { "data-share-key": `denom${denom}`, "data-share-type": "input" } : {})}>
                                <div className="w-16 text-right font-black text-slate-600 text-sm share-label">₹ {denom}</div>
                                <div className="text-muted-foreground text-xs">x</div>
                                <Input
                                    type="number"
                                    placeholder="0"
                                    value={counts[denom] || ''}
                                    onChange={(e) => handleCountChange(denom, e.target.value)}
                                    className="h-10 text-lg font-bold text-center w-24 bg-white border-slate-200 focus:border-slate-400 focus:ring-slate-400 share-value"
                                />
                                <div className="text-muted-foreground text-xs">=</div>
                                <div className="flex-1 text-right font-bold text-slate-800">
                                    {((parseInt(counts[denom] || '0', 10) || 0) * denom).toLocaleString('en-IN')}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Total Section */}
                    <div className="md:col-span-5 bg-slate-900 text-white p-6 flex flex-col justify-center items-center text-center space-y-4">
                        <div className="space-y-1 share-row" data-share-key="totalCash" data-share-type="result">
                            <div className="text-[10px] font-bold uppercase tracking-widest opacity-70 share-label">Grand Total</div>
                            <div className="text-4xl font-black tracking-tight text-emerald-400 share-value">
                                {formatIndianCurrency(total)}
                            </div>
                        </div>
                        <div className="w-full h-px bg-white/10" />
                        <p className="text-xs font-medium opacity-80 leading-relaxed max-w-[200px]">
                            {totalWords}
                        </p>

                        {/* Hidden share field for Date */}
                        <div className="share-row hidden" data-share-key="operationDate" data-share-type="option">
                            <span className="share-label">Date</span>
                            <span className="share-value">{formatDate(operationDate)}</span>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card >
    );
};
