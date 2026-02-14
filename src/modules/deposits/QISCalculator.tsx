import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Button } from '../../components/ui/button';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { CalendarClock, AlertTriangle, FileDown, RotateCcw, Loader2 } from 'lucide-react';

import { calculatePrematurePayout } from '../../lib/deposit_calculations';
import { exportToPDF } from '../../lib/pdf/export';
import { cn, formatPdfCurrency } from '../../lib/utils';

export const QISCalculator: React.FC = () => {
    const [principal, setPrincipal] = useLocalStorage<string>('qis_principal', '500000');
    const [rate, setRate] = useLocalStorage<string>('qis_rate', '7.50');
    const [isExporting, setIsExporting] = useState(false);


    const [quarterlyPayout, setQuarterlyPayout] = useState<number>(0);

    const [isPremature, setIsPremature] = useState(false);
    const [cardRate, setCardRate] = useLocalStorage<string>('qis_card_rate', '6.50');
    const [penalty, setPenalty] = useLocalStorage<string>('qis_penalty', '1.00');
    const [runMonths, setRunMonths] = useLocalStorage<string>('qis_run_months', '6');
    const [interestAlreadyPaid, setInterestAlreadyPaid] = useLocalStorage<string>('qis_paid_interest', '0');
    const [prematureResult, setPrematureResult] = useState<any>(null);

    const handleReset = () => {
        setPrincipal('500000');
        setRate('7.50');
        setIsPremature(false);
        setCardRate('6.50');
        setPenalty('1.00');
        setRunMonths('6');
        setInterestAlreadyPaid('0');
    };

    const calculate = React.useCallback(() => {
        const P = parseFloat(principal);
        const R = parseFloat(rate);

        if (isNaN(P) || isNaN(R) || P <= 0) {
            setQuarterlyPayout(0);
            return;
        }

        const payout = P * (R / 100) / 4;
        setQuarterlyPayout(payout);

        if (isPremature) {
            const res = calculatePrematurePayout({
                product: 'QIS',
                principal: P,
                bookedRate: R,
                cardRateForTenure: parseFloat(cardRate) || 0,
                penalty: parseFloat(penalty) || 0,
                completedMonths: parseFloat(runMonths) || 0,
                interestAlreadyPaid: parseFloat(interestAlreadyPaid) || 0
            });
            setPrematureResult(res);
        } else {
            setPrematureResult(null);
        }
    }, [principal, rate, isPremature, cardRate, penalty, runMonths, interestAlreadyPaid]);

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

    const downloadPDF = async () => {
        if (isExporting) return;
        setIsExporting(true);
        try {
            const f = formatPdfCurrency;

            await exportToPDF({
                title: "Quarterly Income Assessment",
                subtitle: `${isPremature ? "Premature Liquidation Review" : "Quarterly Strategic Payout"} | Professional Banking Summary`,
                details: [
                    { label: "Principal Investment", value: f(parseFloat(principal)) },
                    { label: "ROI (Annually)", value: `${rate}% p.a.` },
                    { label: "Quarterly Interest Payout", value: f(quarterlyPayout) },
                    ...(isPremature ? [
                        { label: "--- Premature Termination Details ---", value: "" },
                        { label: "Active Months Run", value: `${runMonths}` },
                        { label: "Applicable Base Rate", value: `${cardRate}%` },
                        { label: "Foreclosure Penalty", value: `${penalty}%` },
                        { label: "Interest Already Disbursed", value: f(parseFloat(interestAlreadyPaid)) },
                        { label: "Interest Recovery Component", value: f(prematureResult?.interestRecovery || 0) },
                        { label: "--- Final Settlement ---", value: "" },
                        { label: "Net Redemption Amount", value: f(prematureResult?.netPayout || 0) }
                    ] : [])
                ]
            }, `QIS_Growth_Statement.pdf`);
        } finally {
            setIsExporting(false);
        }
    };


    return (
        <Card className="premium-card w-full max-w-4xl mx-auto overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-orange-500/10 via-background to-background border-b border-border/10 p-4 md:px-6">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <CalendarClock className="w-6 h-6 text-orange-600" />
                        <div>
                            <CardTitle className="text-xl font-black text-foreground">Quarterly Interest</CardTitle>
                            <CardDescription className="text-[10px] font-bold uppercase tracking-wider text-foreground opacity-70">
                                Quarterly Interest Assessment
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
                        <Button
                            onClick={downloadPDF}
                            disabled={isExporting}
                            variant="outline"
                            size="sm"
                            className="h-10 gap-2 border-primary/30 hover:bg-primary/10 hidden md:flex text-xs font-black px-4 shadow-sm"
                        >
                            {isExporting ? (
                                <Loader2 className="w-5 h-5 text-primary animate-spin" />
                            ) : (
                                <FileDown className="w-5 h-5 text-primary" />
                            )}
                            {isExporting ? "EXPORTING..." : "EXPORT PDF"}
                        </Button>

                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
                    {/* Inputs Section */}
                    <div className="lg:col-span-7 p-4 md:p-6 space-y-4 border-r border-border/50">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2 share-row" data-share-key="depositAmount" data-share-type="input">
                                <Label htmlFor="qis-principal" className="result-label text-orange-600 share-label">Principal Corpus (₹)</Label>
                                <Input
                                    id="qis-principal"
                                    type="number"
                                    value={principal}
                                    onChange={(e) => setPrincipal(e.target.value)}
                                    className="h-12 text-2xl font-black bg-accent/30 border-none px-4 share-value"
                                />
                            </div>
                            <div className="space-y-2 share-row" data-share-key="roi" data-share-type="input">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="qis-rate" className="result-label text-orange-700 dark:text-orange-300 share-label">Interest (%)</Label>
                                    <button
                                        onClick={() => setIsPremature(!isPremature)}
                                        className={cn(
                                            "h-7 px-4 rounded-full text-[10px] font-black uppercase tracking-widest transition-all shadow-md active:scale-95",
                                            isPremature ? "bg-red-600 text-white shadow-red-500/20" : "bg-orange-600 text-white shadow-orange-500/20 hover:bg-orange-700"
                                        )}
                                    >
                                        {isPremature ? "Closure" : "+ Premature"}
                                    </button>
                                </div>
                                <Input
                                    id="qis-rate"
                                    type="number"
                                    step="0.01"
                                    value={rate}
                                    onChange={(e) => setRate(e.target.value)}
                                    className="h-12 text-2xl font-black bg-accent/30 border-none px-4 text-orange-600 shadow-inner share-value"
                                />
                            </div>
                        </div>

                        {isPremature && (
                            <div className="p-3 bg-red-500/5 border border-red-500/10 rounded-xl space-y-3 animate-in fade-in slide-in-from-top-4 duration-500">
                                <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-bold text-[10px] uppercase tracking-widest bg-red-600/10 py-1.5 px-3 rounded-lg border border-red-600/20 shadow-sm">
                                    <AlertTriangle className="w-4 h-4" />
                                    Premature Liquidation Protocol Active
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <Label className="text-[10px] font-bold uppercase text-foreground opacity-70">Months Run</Label>
                                        <Input
                                            type="number"
                                            value={runMonths}
                                            onChange={e => setRunMonths(e.target.value)}
                                            className="bg-background border-red-600/20 h-7 text-xs font-bold"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[10px] font-bold uppercase text-foreground opacity-70">Card Rate (%)</Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={cardRate}
                                            onChange={e => setCardRate(e.target.value)}
                                            className="bg-background border-red-600/20 h-7 text-xs font-bold"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="flex items-center gap-2 share-row" data-share-key="penalty">
                                        <Label className="text-[10px] font-bold uppercase text-foreground opacity-70 shrink-0">Penalty (%)</Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={penalty}
                                            onChange={e => setPenalty(e.target.value)}
                                            className="bg-background border-red-600/30 h-7 text-xs font-bold text-red-600 max-w-[80px]"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[9px] font-bold uppercase text-red-900/40">Interest Paid (₹)</Label>
                                        <Input
                                            type="number"
                                            value={interestAlreadyPaid}
                                            onChange={e => setInterestAlreadyPaid(e.target.value)}
                                            className="bg-background border-red-500/10 h-7 font-bold text-sm"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Results Section */}
                    <div className="lg:col-span-5 p-4 md:p-6 bg-muted/30 flex flex-col justify-center space-y-4">
                        <div className="space-y-1">
                            {isPremature && prematureResult ? (
                                <div className="space-y-4">
                                    <div className="space-y-1 share-row" data-share-key="netSettlement" data-share-type="result">
                                        <span className="result-label share-label">Net Settlement</span>
                                        <div className="hero-result-value text-red-600 leading-tight share-value">
                                            {formatCurrency(prematureResult.netPayout)}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 gap-4">
                                        <div className="flex flex-col share-row" data-share-key="payoutCycle">
                                            <span className="text-[9px] font-black text-foreground uppercase tracking-widest share-label">Payout Cycle</span>
                                            <span className="text-sm font-black text-sky-600 share-value">QUARTERLY</span>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 gap-2">
                                        <div className="stat-card p-3 share-row" data-share-key="interestEarned" data-share-type="result">
                                            <span className="result-label share-label">Interest Earned</span>
                                            <span className="text-lg font-black text-emerald-500 leading-none share-value">
                                                {formatCurrency(prematureResult.interestEarned)}
                                            </span>
                                        </div>
                                        <div className="stat-card p-3 share-row" data-share-key="interestRecovery" data-share-type="result">
                                            <span className="result-label share-label">Interest Recovery</span>
                                            <span className="text-lg font-black text-red-500 leading-none share-value">
                                                {formatCurrency(prematureResult.interestRecovery)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="space-y-1 share-row" data-share-key="quarterlyPayout" data-share-type="result">
                                        <span className="result-label share-label">Quarterly Stream</span>
                                        <div className="hero-result-value text-orange-700 leading-tight share-value">
                                            {formatCurrency(quarterlyPayout)}
                                        </div>
                                    </div>

                                    <div className="stat-card bg-orange-500/5 border-none p-3 share-row" data-share-key="annualCashflow" data-share-type="result">
                                        <span className="result-label text-orange-700 share-label">Annual Cashflow</span>
                                        <div className="text-lg font-black text-foreground mt-1 share-value">
                                            {formatCurrency(quarterlyPayout * 4)}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <p className="text-[10px] text-foreground font-black text-center uppercase tracking-tighter italic bg-primary/5 py-2 rounded-lg">
                            *Quarterly interest calculated on Simple Interest basis.
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
