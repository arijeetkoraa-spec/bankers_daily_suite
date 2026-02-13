import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Button } from '../../components/ui/button';
import { calculateMaturity, calculatePrematurePayout } from '../../lib/deposit_calculations';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { PieChart, AlertTriangle, FileDown, RotateCcw } from 'lucide-react';
import { exportToPDF } from '../../lib/pdf-export';
import { cn, formatPdfCurrency } from '../../lib/utils';

export const FDCalculator: React.FC = () => {
    // Persistent state
    const [principal, setPrincipal] = useLocalStorage<string>('fd_principal', '100000');
    const [rate, setRate] = useLocalStorage<string>('fd_rate', '7.00');
    const [tenure, setTenure] = useLocalStorage<string>('fd_tenure', '1');
    const [tenureType, setTenureType] = useLocalStorage<string>('fd_tenure_type', 'years'); // years, months, days

    // Results
    const [maturityValue, setMaturityValue] = useState<number>(0);
    const [interestEarned, setInterestEarned] = useState<number>(0);
    const [yieldRate, setYieldRate] = useState<number>(0);

    const [isPremature, setIsPremature] = useState(false);
    const [cardRate, setCardRate] = useLocalStorage<string>('fd_card_rate', '6.00');
    const [penalty, setPenalty] = useLocalStorage<string>('fd_penalty', '1.00');
    const [runTenure, setRunTenure] = useLocalStorage<string>('fd_run_tenure', '180');
    const [runTenureType, setRunTenureType] = useLocalStorage<string>('fd_run_tenure_type', 'days');
    const [prematureResult, setPrematureResult] = useState<any>(null);

    const handleReset = () => {
        setPrincipal('100000');
        setRate('7.00');
        setTenure('1');
        setTenureType('years');
        setIsPremature(false);
        setCardRate('6.00');
        setPenalty('1.00');
        setRunTenure('180');
        setRunTenureType('days');
    };

    const calculate = React.useCallback(() => {
        const P = parseFloat(principal);
        const R = parseFloat(rate);
        const T_val = parseFloat(tenure);

        if (isNaN(P) || isNaN(R) || isNaN(T_val) || P <= 0 || T_val <= 0) {
            setMaturityValue(0);
            setInterestEarned(0);
            setYieldRate(0);
            return;
        }

        const maturity = calculateMaturity('FD', P, R, tenureType === 'years' ? T_val * 12 : (tenureType === 'days' ? T_val / 30 : T_val));
        setMaturityValue(maturity);
        setInterestEarned(maturity - P);

        let timeInYears = 0;
        if (tenureType === 'years') timeInYears = T_val;
        else if (tenureType === 'months') timeInYears = T_val / 12;
        else timeInYears = T_val / 365;

        const effectiveYield = ((maturity - P) / P) / timeInYears * 100;
        setYieldRate(isNaN(effectiveYield) || !isFinite(effectiveYield) ? 0 : effectiveYield);

        if (isPremature) {
            const rt = parseFloat(runTenure);
            const monthsRun = runTenureType === 'years' ? rt * 12 : (runTenureType === 'days' ? rt / (365 / 12) : rt);

            const res = calculatePrematurePayout({
                product: 'FD',
                principal: P,
                bookedRate: R,
                cardRateForTenure: parseFloat(cardRate) || 0,
                penalty: parseFloat(penalty) || 0,
                completedMonths: monthsRun
            });
            setPrematureResult(res);
        } else {
            setPrematureResult(null);
        }
    }, [principal, rate, tenure, tenureType, isPremature, cardRate, penalty, runTenure, runTenureType]);

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
            title: "Fixed Deposit Summary",
            subtitle: `${isPremature ? "Premature Redemption Assessment" : "Maturity Growth Forecast"} | Professional Payout Schedule`,
            details: [
                { label: "Principal Invested", value: f(parseFloat(principal)) },
                { label: "Base ROI (Annually)", value: `${rate}% p.a.` },
                { label: "Booked Tenure", value: `${tenure} ${tenureType}` },
                { label: "Aggregate Interest", value: f(interestEarned) },
                { label: "Maturity Payout", value: f(maturityValue) },
                { label: "Effective Yield", value: `${yieldRate.toFixed(2)}%` },
                ...(isPremature ? [
                    { label: "--- Premature Termination Details ---", value: "" },
                    { label: "Actual Days Service", value: `${runTenure} ${runTenureType}` },
                    { label: "Applicable Base Rate", value: `${cardRate}%` },
                    { label: "Premature Penalty", value: `${penalty}%` },
                    { label: "Revised Effective ROI", value: `${prematureResult?.effectiveRate.toFixed(2)}%` },
                    { label: "Net Payout Amount", value: f(prematureResult?.netPayout || 0) }
                ] : [])
            ]
        }, `FD_Statement_Report.pdf`);
    };

    return (
        <Card className="premium-card w-full max-w-4xl mx-auto overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-primary/10 via-background to-background border-b border-border/10 p-4 md:px-6">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <PieChart className="w-6 h-6 text-primary" />
                        <div>
                            <CardTitle className="text-xl font-black text-primary">Fixed Deposit</CardTitle>
                            <CardDescription className="text-[10px] font-bold uppercase tracking-wider text-foreground opacity-70">
                                Capital Preservation Protocol
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
                        <Button onClick={downloadPDF} variant="outline" size="sm" className="h-10 gap-2 border-blue-600/30 hover:bg-blue-600/10 hidden md:flex text-xs font-black px-4 shadow-sm">
                            <FileDown className="w-5 h-5 text-blue-600" />
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
                            <div className="space-y-2 share-row" data-share-key="depositAmount" data-share-type="input">
                                <Label htmlFor="principal" className="result-label text-primary share-label">Investment (₹)</Label>
                                <Input
                                    id="principal"
                                    type="number"
                                    value={principal}
                                    onChange={(e) => setPrincipal(e.target.value)}
                                    className="h-12 text-2xl font-black bg-accent/30 border-none px-4 shadow-inner share-value"
                                />
                            </div>
                            <div className="space-y-2 share-row" data-share-key="roi" data-share-type="input">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="rate" className="result-label text-primary share-label">Interest (%)</Label>
                                    <button
                                        onClick={() => setIsPremature(!isPremature)}
                                        className={cn(
                                            "h-7 px-4 rounded-full text-[10px] font-black uppercase tracking-widest transition-all shadow-md active:scale-95",
                                            isPremature ? "bg-red-600 text-white shadow-red-500/20" : "bg-blue-600 text-white shadow-blue-500/20 hover:bg-blue-700"
                                        )}
                                    >
                                        {isPremature ? "Closure" : "+ Premature"}
                                    </button>
                                </div>
                                <Input
                                    id="rate"
                                    type="number"
                                    step="0.01"
                                    value={rate}
                                    onChange={(e) => setRate(e.target.value)}
                                    className="h-12 text-2xl font-black bg-accent/30 border-none px-4 text-primary shadow-inner share-value"
                                />
                            </div>
                        </div>

                        {isPremature && (
                            <div className="p-3 bg-red-500/5 border border-red-500/10 rounded-xl space-y-3 animate-in fade-in slide-in-from-top-4 duration-500">
                                <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-black text-[11px] uppercase tracking-widest bg-red-500/10 py-1.5 px-3 rounded-lg border border-red-500/20 shadow-sm">
                                    <AlertTriangle className="w-4 h-4" />
                                    Premature Closure Active
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1 share-row" data-share-key="runTenure">
                                        <Label className="hidden share-label">Actual Run ({runTenureType})</Label>
                                        <div className="flex gap-1 bg-background rounded-lg border border-border p-0.5">
                                            <Input
                                                type="number"
                                                value={runTenure}
                                                onChange={e => setRunTenure(e.target.value)}
                                                className="border-none bg-transparent h-7 text-xs font-black focus-visible:ring-0 px-2 share-value"
                                            />
                                            <select
                                                value={runTenureType}
                                                onChange={e => setRunTenureType(e.target.value)}
                                                className="bg-accent/50 text-[9px] font-black uppercase rounded py-1 px-1 border-none outline-none"
                                            >
                                                <option value="days">Days</option>
                                                <option value="months">Mos</option>
                                                <option value="years">Yrs</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="space-y-1 share-row" data-share-key="cardRate">
                                        <Label className="text-[10px] font-bold uppercase text-foreground opacity-70 share-label">Months Run</Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={cardRate}
                                            onChange={e => setCardRate(e.target.value)}
                                            className="h-8 bg-background font-black text-xs border-border text-red-600 rounded-lg share-value"
                                        />
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 share-row" data-share-key="penalty">
                                    <Label className="text-[10px] font-bold uppercase text-foreground opacity-70 shrink-0 share-label">Penalty (%)</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={penalty}
                                        onChange={e => setPenalty(e.target.value)}
                                        className="h-7 bg-background font-black text-xs border-border text-red-600 rounded-lg max-w-[80px] share-value"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="space-y-3 pt-2 share-row" data-share-key="tenure" data-share-type="input">
                            <Label className="result-label text-primary share-label">Investment Tenure ({tenureType})</Label>
                            <div className="flex flex-col md:flex-row gap-3">
                                <div className="flex p-1 bg-accent/50 rounded-xl gap-1 flex-1 shadow-inner">
                                    {['years', 'months', 'days'].map((type) => (
                                        <Button
                                            key={type}
                                            type="button"
                                            variant={tenureType === type ? "default" : "ghost"}
                                            onClick={() => setTenureType(type)}
                                            className={cn(
                                                "flex-1 capitalize h-10 rounded-lg text-xs font-black transition-all",
                                                tenureType === type
                                                    ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                                                    : "text-foreground bg-accent/80 opacity-60 hover:opacity-100"
                                            )}
                                        >
                                            {type}
                                        </Button>
                                    ))}
                                </div>
                                <Input
                                    id="tenure"
                                    type="number"
                                    value={tenure}
                                    onChange={(e) => setTenure(e.target.value)}
                                    className="h-12 text-2xl font-black bg-background border-dashed border-2 max-w-[120px] text-center rounded-xl share-value"
                                />
                            </div>
                        </div>

                        <div className="p-4 rounded-xl glass-panel bg-accent/50 border-2 border-primary/10 shadow-inner space-y-3">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col share-row" data-share-key="yieldRate">
                                    <span className="text-[9px] font-black text-foreground uppercase tracking-widest share-label">Effective Yield</span>
                                    <span className="text-sm font-black text-primary share-value">{yieldRate.toFixed(2)}%</span>
                                </div>
                                <div className="flex flex-col share-row" data-share-key="compounding">
                                    <span className="text-[9px] font-black text-foreground uppercase tracking-widest share-label">Compounding</span>
                                    <span className="text-sm font-black text-foreground uppercase share-value">Quarterly</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Results Section */}
                    <div className="lg:col-span-5 p-4 md:p-6 bg-muted/30 flex flex-col justify-center space-y-4">
                        <div className="space-y-1 share-row" data-share-key="maturityValue" data-share-type="result">
                            <span className="result-label share-label">
                                {isPremature ? "Net Payout" : "Expected Maturity"}
                            </span>
                            <div className={cn("hero-result-value leading-tight share-value", isPremature && "text-red-600")}>
                                {formatCurrency(isPremature ? prematureResult?.netPayout : maturityValue)}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                            <div className="stat-card share-row" data-share-key="investment" data-share-type="result">
                                <span className="result-label text-foreground share-label">Principal Invested</span>
                                <span className="text-lg font-black text-foreground leading-none share-value">
                                    {formatCurrency(parseFloat(principal) || 0)}
                                </span>
                            </div>
                            <div className="stat-card share-row" data-share-key="interest" data-share-type="result">
                                <span className="result-label share-label">Interest Accrued</span>
                                <span className={cn(
                                    "text-lg font-black leading-none share-value",
                                    isPremature ? "text-red-600" : "text-emerald-600"
                                )}>
                                    {formatCurrency(isPremature ? prematureResult?.interestEarned : interestEarned)}
                                </span>
                            </div>
                        </div>

                        <p className="text-[10px] text-foreground font-black text-center uppercase tracking-tighter italic bg-blue-600/5 py-2 rounded-lg">
                            *Quarterly compounding yields higher effective returns.
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
