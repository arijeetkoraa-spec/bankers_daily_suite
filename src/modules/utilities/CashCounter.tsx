import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { ClipboardCopy, RotateCcw, Banknote } from 'lucide-react';
import { formatIndianCurrency, numberToIndianWords } from '../../lib/utils';
import { useLocalStorage } from '../../hooks/useLocalStorage';

// Denominations
const denoms = [2000, 500, 200, 100, 50, 20, 10, 5, 2, 1];

export const CashCounter: React.FC = () => {

    // State for counts
    const [counts, setCounts] = useLocalStorage<Record<number, string>>('cash_counts', {});

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
                        <Button onClick={reset} variant="outline" size="sm" className="h-9 gap-2 text-xs font-black">
                            <RotateCcw className="w-4 h-4" /> Reset
                        </Button>
                        <Button onClick={copyToClipboard} size="sm" className="h-9 gap-2 text-xs font-black">
                            <ClipboardCopy className="w-4 h-4" /> Copy Summary
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="grid grid-cols-1 md:grid-cols-12">
                    {/* Input Section */}
                    <div className="md:col-span-7 p-4 space-y-3 bg-muted/20">
                        {denoms.map(denom => (
                            <div key={denom} className="flex items-center gap-4 group">
                                <div className="w-16 text-right font-black text-slate-600 text-sm">₹ {denom}</div>
                                <div className="text-muted-foreground text-xs">x</div>
                                <Input
                                    type="number"
                                    placeholder="0"
                                    value={counts[denom] || ''}
                                    onChange={(e) => handleCountChange(denom, e.target.value)}
                                    className="h-10 text-lg font-bold text-center w-24 bg-white border-slate-200 focus:border-slate-400 focus:ring-slate-400"
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
                        <div className="space-y-1">
                            <div className="text-[10px] font-bold uppercase tracking-widest opacity-70">Grand Total</div>
                            <div className="text-4xl font-black tracking-tight text-emerald-400">
                                {formatIndianCurrency(total)}
                            </div>
                        </div>
                        <div className="w-full h-px bg-white/10" />
                        <p className="text-xs font-medium opacity-80 leading-relaxed max-w-[200px]">
                            {totalWords}
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
