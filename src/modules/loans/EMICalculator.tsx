import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Button } from '../../components/ui/button';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { Calculator, FileDown, RotateCcw } from 'lucide-react';
import { calculateEMI, type RepaymentMethod } from '../../lib/calculations';
import { exportAmortizationToPDF } from '../../lib/pdf-export';
import { cn, formatPdfCurrency } from '../../lib/utils';
import { AmortizationModal } from '../../components/AmortizationModal';
import { generateAmortizationSchedule } from '../../lib/amortization';
import { TableProperties } from 'lucide-react';

export const EMICalculator: React.FC = () => {
    const [amount, setAmount] = useLocalStorage<string>('loan_amount', '1000000');
    const [rate, setRate] = useLocalStorage<string>('loan_rate', '9.50');
    const [tenure, setTenure] = useLocalStorage<string>('loan_tenure', '120'); // months
    const [method, setMethod] = useLocalStorage<RepaymentMethod>('loan_method', 'reducing');

    const [results, setResults] = useState({
        emi: 0,
        monthlyInterest: 0,
        totalInterest: 0,
        totalPayable: 0,
        finalPayment: 0
    });

    const [isScheduleOpen, setIsScheduleOpen] = useState(false);
    const [schedule, setSchedule] = useState<any[]>([]);

    const handleReset = () => {
        setAmount('1000000');
        setRate('9.50');
        setTenure('120');
        setMethod('reducing');
    };

    const calculate = React.useCallback(() => {
        const P = parseFloat(amount);
        const R = parseFloat(rate);
        const N = parseFloat(tenure);

        if (isNaN(P) || isNaN(R) || isNaN(N) || P <= 0 || N <= 0) {
            setResults({ emi: 0, monthlyInterest: 0, totalInterest: 0, totalPayable: 0, finalPayment: 0 });
            return;
        }

        const output = calculateEMI({
            principal: P,
            annualRate: R,
            tenureMonths: N,
            method: method
        });


        setResults(output);

        // Update schedule
        const newSchedule = generateAmortizationSchedule(P, R, N, method);
        setSchedule(newSchedule);
    }, [amount, rate, tenure, method]);

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

        exportAmortizationToPDF({
            title: "EMI Assessment Report",
            subtitle: `${method.toUpperCase()} Repayment Method | Professional Loan Analysis`,
            details: [
                { label: "Loan Amount", value: f(parseFloat(amount)) },
                { label: "ROI (p.a.)", value: `${rate}%` },
                { label: "Tenure", value: `${tenure} Months (${(parseFloat(tenure) / 12).toFixed(1)} Years)` },
                { label: "Repayment Method", value: method.toUpperCase() },
                { label: "--- Results ---", value: "" },
                { label: method === 'bullet' ? "Final Payment" : "Monthly EMI", value: f(method === 'bullet' ? results.finalPayment : results.emi) },
                { label: "Total Interest", value: f(results.totalInterest) },
                { label: "Total Payable", value: f(results.totalPayable) }
            ],
            schedule: schedule
        }, `EMI_Report_${method}.pdf`);
    };

    return (
        <Card className="premium-card w-full max-w-4xl mx-auto overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-primary/10 via-background to-background border-b border-border/10 p-4 md:px-6">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <Calculator className="w-6 h-6 text-primary" />
                        <div>
                            <CardTitle className="text-xl font-black">EMI Calculator</CardTitle>
                            <CardDescription className="text-[10px] font-black uppercase tracking-wider text-primary/80 dark:text-foreground/70">
                                Equal Monthly Installment Protocol
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
                        <Button onClick={() => setIsScheduleOpen(true)} variant="outline" size="sm" className="h-10 gap-2 border-indigo-600/30 hover:bg-indigo-600/10 hidden md:flex text-xs font-black px-4 shadow-sm">
                            <TableProperties className="w-5 h-5 text-indigo-600" />
                            AMORTIZATION
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
                    {/* Inputs Section */}
                    <div className="lg:col-span-7 p-4 md:p-6 space-y-4 border-r border-border/50">
                        <div className="space-y-1 share-row" data-share-key="repaymentStrategy" data-share-type="option">
                            <Label className="text-[10px] font-black text-foreground dark:text-muted-foreground uppercase tracking-widest share-label">Repayment Strategy</Label>
                            <div className="flex p-1 bg-accent/50 dark:bg-slate-800/50 rounded-xl shadow-inner share-value">
                                {(['reducing', 'flat', 'fixed', 'bullet'] as RepaymentMethod[]).map((m) => (
                                    <button
                                        key={m}
                                        onClick={() => setMethod(m)}
                                        className={cn(
                                            "flex-1 text-[11px] py-2 rounded-lg font-black uppercase tracking-wider transition-all",
                                            method === m
                                                ? "bg-white shadow dark:bg-slate-700 text-indigo-700 dark:text-indigo-400"
                                                : "text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        {m}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1 share-row" data-share-key="loanAmount" data-share-type="input">
                                <Label htmlFor="amount" className="text-[10px] font-black text-foreground dark:text-muted-foreground uppercase tracking-widest share-label">Loan Amount (₹)</Label>
                                <Input
                                    id="amount"
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="h-12 text-2xl font-black bg-accent/50 dark:bg-slate-800/50 border-none px-4 share-value"
                                />
                            </div>
                            <div className="space-y-1 share-row" data-share-key="roi" data-share-type="input">
                                <Label htmlFor="rate" className="text-[10px] font-black text-slate-950 dark:text-muted-foreground uppercase tracking-widest share-label">ROI (% p.a)</Label>
                                <Input
                                    id="rate"
                                    type="number"
                                    step="0.01"
                                    value={rate}
                                    onChange={(e) => setRate(e.target.value)}
                                    className="h-12 text-2xl font-black bg-accent/50 dark:bg-slate-800/50 border-none px-4 text-black dark:text-white share-value"
                                />
                            </div>
                        </div>

                        <div className="space-y-1 share-row" data-share-key="tenure" data-share-type="input">
                            <Label htmlFor="tenure" className="text-[10px] font-black text-foreground dark:text-muted-foreground uppercase tracking-widest share-label">Tenure (Months)</Label>
                            <div className="flex gap-4 items-center">
                                <Input
                                    id="tenure"
                                    type="number"
                                    value={tenure}
                                    onChange={(e) => setTenure(e.target.value)}
                                    className="h-12 text-2xl font-black bg-accent/50 dark:bg-slate-800/50 border-none px-4 share-value flex-1"
                                />
                                <div className="text-[10px] font-black text-foreground dark:text-muted-foreground w-20 text-right uppercase leading-tight">
                                    {(parseFloat(tenure) / 12).toFixed(1)} <br /> Years
                                </div>
                            </div>
                        </div>
                        <p className="text-[9px] text-foreground dark:text-muted-foreground font-black text-center uppercase tracking-widest italic opacity-50 dark:opacity-40">
                            *Standard actuarial reducing balance method.
                        </p>
                    </div>

                    {/* Results Section */}
                    <div className="lg:col-span-5 p-4 md:p-6 bg-muted/30 flex flex-col justify-center space-y-6">
                        <div className="space-y-1 share-row" data-share-key="emi" data-share-type="result">
                            <span className="result-label share-label text-slate-950 dark:text-muted-foreground">
                                {method === 'bullet' ? 'Final Payment' : (method === 'fixed' ? 'EMI (Annual)' : 'Monthly EMI')}
                            </span>
                            <div className="hero-result-value tracking-tighter text-slate-950 dark:text-foreground share-value">
                                {formatCurrency(method === 'bullet' ? results.finalPayment : results.emi)}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            <div className="p-4 bg-background dark:bg-slate-900/40 rounded-2xl border border-border/50 share-row" data-share-key="totalInterest" data-share-type="result">
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-950 dark:text-muted-foreground share-label">Total Interest</span>
                                    <span className="text-xl font-black text-black dark:text-white share-value">
                                        {formatCurrency(results.totalInterest)}
                                    </span>
                                </div>
                            </div>
                            <div className="p-4 bg-background dark:bg-slate-900/40 rounded-2xl border border-border/50 space-y-2 share-row" data-share-key="totalPayable" data-share-type="result">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-950 dark:text-muted-foreground share-label">Total Payable</span>
                                <div className="text-2xl font-black text-black dark:text-white share-value">
                                    {formatCurrency(results.totalPayable)}
                                </div>
                                <div className="w-full h-2 bg-accent dark:bg-slate-800 rounded-full overflow-hidden mt-1 shadow-inner">
                                    <div
                                        className="h-full bg-indigo-600 dark:bg-indigo-500 transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(79,70,229,0.3)]"
                                        style={{ width: `${(parseFloat(amount) / (results.totalPayable || 1)) * 100}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>

            <AmortizationModal
                isOpen={isScheduleOpen}
                onClose={() => setIsScheduleOpen(false)}
                schedule={schedule}
                principal={parseFloat(amount) || 0}
                totalInterest={results.totalInterest}
                accentColor="indigo-600"
            />
        </Card>
    );
};
