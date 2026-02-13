import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Button } from '../../components/ui/button';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { TrendingUp, AlertTriangle, FileDown, RotateCcw } from 'lucide-react';
import { calculateMaturity, calculatePrematurePayout } from '../../lib/deposit_calculations';
import { exportToPDF } from '../../lib/pdf-export';
import { cn, formatPdfCurrency } from '../../lib/utils';

export const RDCalculator: React.FC = () => {
    const [monthlyInstallment, setMonthlyInstallment] = useLocalStorage<string>('rd_installment', '5000');
    const [rate, setRate] = useLocalStorage<string>('rd_rate', '7.00');
    const [months, setMonths] = useLocalStorage<string>('rd_months', '12');

    const [maturityValue, setMaturityValue] = useState<number>(0);
    const [interestEarned, setInterestEarned] = useState<number>(0);
    const [isPremature, setIsPremature] = useState(false);
    const [cardRate, setCardRate] = useLocalStorage<string>('rd_card_rate', '6.00');
    const [penalty, setPenalty] = useLocalStorage<string>('rd_penalty', '1.00');
    const [runMonths, setRunMonths] = useLocalStorage<string>('rd_run_months', '6');
    const [prematureResult, setPrematureResult] = useState<any>(null);

    const handleReset = () => {
        setMonthlyInstallment('5000');
        setRate('7.00');
        setMonths('12');
        setIsPremature(false);
        setCardRate('6.00');
        setPenalty('1.00');
        setRunMonths('6');
    };

    const calculate = React.useCallback(() => {
        const P = parseFloat(monthlyInstallment);
        const R = parseFloat(rate);
        const N = parseInt(months);

        if (isNaN(P) || isNaN(R) || isNaN(N) || P <= 0 || N <= 0) {
            setMaturityValue(0);
            setInterestEarned(0);
            return;
        }

        const maturity = calculateMaturity('RD', P, R, N);
        setMaturityValue(maturity);
        setInterestEarned(maturity - (P * N));

        if (isPremature) {
            const res = calculatePrematurePayout({
                product: 'RD',
                principal: P,
                bookedRate: R,
                cardRateForTenure: parseFloat(cardRate) || 0,
                penalty: parseFloat(penalty) || 0,
                completedMonths: parseFloat(runMonths) || 0,
                completedInstallments: Math.floor(parseFloat(runMonths))
            });
            setPrematureResult(res);
        } else {
            setPrematureResult(null);
        }
    }, [monthlyInstallment, rate, months, isPremature, cardRate, penalty, runMonths]);

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
            title: "Recurring Deposit Summary",
            subtitle: isPremature ? "Premature Closure Calculation" : "Maturity Calculation",
            details: [
                { label: "Monthly Installment", value: f(parseFloat(monthlyInstallment)) },
                { label: "Interest Rate", value: `${rate}% p.a.` },
                { label: "Planned Tenure", value: `${months} Months` },
                { label: "Total Investment", value: f(parseFloat(monthlyInstallment) * parseInt(months)) },
                { label: "Maturity Value", value: f(maturityValue) },
                { label: "Total Interest Earned", value: f(interestEarned) },
                ...(isPremature ? [
                    { label: "--- Premature Details ---", value: "" },
                    { label: "Months Completed", value: `${runMonths}` },
                    { label: "Applicable Card Rate", value: `${cardRate}%` },
                    { label: "Premature Penalty", value: `${penalty}%` },
                    { label: "Net Payout Amount", value: f(prematureResult?.netPayout || 0) }
                ] : [])
            ]
        }, `RD_Summary.pdf`);
    };

    return (
        <Card className="premium-card w-full max-w-4xl mx-auto overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-emerald-500/10 via-background to-background border-b border-border/10 p-4 md:px-6">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <TrendingUp className="w-6 h-6 text-emerald-600" />
                        <div>
                            <CardTitle className="text-xl font-black">Recurring Deposit</CardTitle>
                            <CardDescription className="text-[10px] font-bold uppercase tracking-wider text-foreground opacity-70">
                                Disciplined Savings Protocol
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
                        <Button onClick={downloadPDF} variant="outline" size="sm" className="h-10 gap-2 border-emerald-600/30 hover:bg-emerald-600/10 hidden md:flex text-xs font-black px-4 shadow-sm">
                            <FileDown className="w-5 h-5 text-emerald-600" />
                            EXPORT PDF
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
                    {/* Inputs Section */}
                    <div className="lg:col-span-7 p-4 md:p-6 space-y-4 border-r border-border/50">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2 share-row">
                                <Label htmlFor="rd-amount" className="result-label text-emerald-600 share-label">Monthly Savings (₹)</Label>
                                <Input
                                    id="rd-amount"
                                    type="number"
                                    value={monthlyInstallment}
                                    onChange={(e) => setMonthlyInstallment(e.target.value)}
                                    className="h-12 text-2xl font-black bg-accent/30 border-none px-4 share-value"
                                />
                            </div>
                            <div className="space-y-2 share-row">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="rd-rate" className="result-label text-emerald-700 dark:text-emerald-300 share-label">Interest (%)</Label>
                                    <button
                                        onClick={() => setIsPremature(!isPremature)}
                                        className={cn(
                                            "h-7 px-4 rounded-full text-[10px] font-black uppercase tracking-widest transition-all shadow-md active:scale-95",
                                            isPremature ? "bg-red-600 text-white shadow-red-500/20" : "bg-emerald-600 text-white shadow-emerald-500/20 hover:bg-emerald-700"
                                        )}
                                    >
                                        {isPremature ? "Closure" : "+ Premature"}
                                    </button>
                                </div>
                                <Input
                                    id="rd-rate"
                                    type="number"
                                    step="0.01"
                                    value={rate}
                                    onChange={(e) => setRate(e.target.value)}
                                    className="h-12 text-2xl font-black bg-accent/30 border-none px-4 text-emerald-600 shadow-inner share-value"
                                />
                            </div>
                        </div>

                        <div className="space-y-2 pt-2 share-row">
                            <Label htmlFor="rd-months" className="result-label text-emerald-600 share-label">Period (Months)</Label>
                            <Input
                                id="rd-months"
                                type="number"
                                value={months}
                                onChange={(e) => setMonths(e.target.value)}
                                className="h-12 text-2xl font-black bg-background border-dashed border-2 max-w-[120px] text-center rounded-xl share-value"
                            />
                        </div>

                        {isPremature && (
                            <div className="p-3 bg-red-500/5 border border-red-500/10 rounded-xl space-y-3 animate-in fade-in slide-in-from-top-4 duration-500">
                                <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-bold text-[10px] uppercase tracking-widest bg-red-600/10 py-1.5 px-3 rounded-lg border border-red-600/20 shadow-sm">
                                    <AlertTriangle className="w-4 h-4" />
                                    Premature Closure Active
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1 share-row">
                                        <Label className="text-[10px] font-bold uppercase text-foreground opacity-70 share-label">Months Run</Label>
                                        <Input
                                            type="number"
                                            value={runMonths}
                                            onChange={e => setRunMonths(e.target.value)}
                                            className="bg-background border-red-600/20 h-7 text-xs font-bold share-value"
                                        />
                                    </div>
                                    <div className="space-y-1 share-row">
                                        <Label className="text-[10px] font-bold uppercase text-foreground opacity-70 share-label">Card Rate (%)</Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={cardRate}
                                            onChange={e => setCardRate(e.target.value)}
                                            className="bg-background border-red-600/20 h-7 text-xs font-bold share-value"
                                        />
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 share-row">
                                    <Label className="text-[10px] font-bold uppercase text-foreground opacity-70 shrink-0 share-label">Penalty (%)</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={penalty}
                                        onChange={e => setPenalty(e.target.value)}
                                        className="bg-background border-red-600/30 h-7 text-xs font-bold text-red-600 max-w-[80px] share-value"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Results Section */}
                    <div className="lg:col-span-5 p-4 md:p-6 bg-muted/30 flex flex-col justify-center space-y-4">
                        <div className="space-y-1 share-row">
                            <span className="result-label share-label">
                                {isPremature ? "Net Payout" : "Expected Maturity"}
                            </span>
                            <div className={cn("hero-result-value leading-tight share-value", isPremature && "text-red-600")}>
                                {formatCurrency(isPremature ? prematureResult?.netPayout : maturityValue)}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                            <div className="stat-card share-row">
                                <span className="result-label share-label">Principal Invested</span>
                                <span className="text-lg font-black text-foreground leading-none share-value">
                                    {formatCurrency(parseFloat(monthlyInstallment) * parseInt(months) || 0)}
                                </span>
                            </div>
                            <div className="stat-card share-row">
                                <span className="result-label share-label">Interest Accrued</span>
                                <span className={cn(
                                    "text-lg font-black leading-none share-value",
                                    isPremature ? "text-red-600" : "text-emerald-600"
                                )}>
                                    {formatCurrency(isPremature ? prematureResult?.interestEarned : interestEarned)}
                                </span>
                            </div>
                        </div>

                        <p className="text-[10px] text-foreground font-black text-center uppercase tracking-tighter italic bg-emerald-600/5 py-2 rounded-lg">
                            *Quarterly compounding yields higher effective returns.
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
