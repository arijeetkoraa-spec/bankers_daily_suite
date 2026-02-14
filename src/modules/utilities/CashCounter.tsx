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
                    <div className="md:col-span-7 p-6 space-y-1 bg-muted/10">
                        {denoms.map((denom, index) => (
                            <div
                                key={denom}
                                className={cn(
                                    "grid grid-cols-12 items-center gap-2 p-3 rounded-xl transition-all group",
                                    index % 2 === 0 ? "bg-background/40" : "bg-muted/10",
                                    counts[denom] && parseInt(counts[denom]) > 0 ? "share-row shadow-sm border border-border/20" : "border border-transparent"
                                )}
                                {...((counts[denom] && parseInt(counts[denom]) > 0) ? { "data-share-key": `denom${denom}`, "data-share-type": "input" } : {})}
                            >
                                <div className="col-span-3 text-right font-black text-foreground/70 text-sm share-label flex items-center justify-end gap-1">
                                    <span className="text-[10px] opacity-50">₹</span>
                                    {denom}
                                </div>
                                <div className="col-span-1 text-center text-muted-foreground text-[10px] font-black opacity-30 italic">x</div>
                                <div className="col-span-4 flex justify-center">
                                    <Input
                                        type="number"
                                        placeholder="0"
                                        value={counts[denom] || ''}
                                        onChange={(e) => handleCountChange(denom, e.target.value)}
                                        className={cn(
                                            "h-10 text-lg font-black text-center w-full max-w-[90px] bg-background border-border/50 focus:border-brand-navy focus:ring-4 focus:ring-brand-navy/5 share-value transition-all rounded-lg",
                                            !counts[denom] || parseInt(counts[denom]) === 0 ? "opacity-40" : "opacity-100"
                                        )}
                                    />
                                </div>
                                <div className="col-span-1 text-center text-muted-foreground text-[10px] font-black opacity-30 italic">=</div>
                                <div className="col-span-3 text-right font-black text-foreground tabular-nums">
                                    {((parseInt(counts[denom] || '0', 10) || 0) * denom).toLocaleString('en-IN')}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Total Section */}
                    <div className="md:col-span-5 flex flex-col">
                        <div className="bg-brand-navy dark:bg-slate-900 text-white p-8 flex flex-col justify-center items-center text-center space-y-4 md:flex-1 relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
                            <div className="space-y-2 share-row relative z-10" data-share-key="totalCash" data-share-type="result">
                                <div className="text-[11px] font-black uppercase tracking-[0.3em] opacity-50 share-label">Grand Total Value</div>
                                <div className="text-5xl font-black tracking-tight text-emerald-400 share-value drop-shadow-xl animate-scale-rebound" key={total}>
                                    {formatIndianCurrency(total)}
                                </div>
                            </div>
                            <div className="w-16 h-1 bg-white/10 rounded-full relative z-10" />
                            <p className="text-xs font-bold opacity-60 leading-relaxed max-w-[240px] italic relative z-10 uppercase tracking-wide">
                                {totalWords}
                            </p>

                            {/* Hidden share field for Date */}
                            <div className="share-row hidden" data-share-key="operationDate" data-share-type="option">
                                <span className="share-label">Date</span>
                                <span className="share-value">{formatDate(operationDate)}</span>
                            </div>
                        </div>

                        {/* Actions Section (Sticky on Mobile Desktop style) */}
                        <div className="p-6 bg-background border-t border-border/50 flex flex-col gap-3">
                            <div className="grid grid-cols-2 gap-3">
                                <Button onClick={copyToClipboard} variant="outline" className="h-12 gap-2 border-border hover:bg-muted font-black uppercase text-[10px] tracking-widest rounded-xl">
                                    <ClipboardCopy className="w-4 h-4" />
                                    Copy Text
                                </Button>
                                <Button onClick={downloadPDF} variant="outline" className="h-12 gap-2 border-primary/20 text-primary hover:bg-primary/5 font-black uppercase text-[10px] tracking-widest rounded-xl" disabled={isExporting}>
                                    {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
                                    PDF Report
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mobile Sticky Total Bar */}
                <div className="md:hidden sticky bottom-0 left-0 right-0 bg-brand-navy p-4 flex items-center justify-between border-t border-white/10 z-20 shadow-[0_-8px_30px_rgb(0,0,0,0.3)]">
                    <div className="flex flex-col">
                        <span className="text-[9px] font-black text-white/50 uppercase tracking-widest">Grand Total</span>
                        <span className="text-xl font-black text-emerald-400 tabular-nums">{formatIndianCurrency(total)}</span>
                    </div>
                    <Button
                        onClick={downloadPDF}
                        size="sm"
                        className="bg-white text-brand-navy font-black text-[10px] tracking-widest uppercase rounded-lg px-4"
                        disabled={isExporting}
                    >
                        {isExporting ? "..." : "EXPORT PDF"}
                    </Button>
                </div>
            </CardContent>
        </Card >
    );
};
