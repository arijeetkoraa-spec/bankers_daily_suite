import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Button } from '../../components/ui/button';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { Calculator, FileDown } from 'lucide-react';
import { calculateEMI, type RepaymentMethod } from '../../lib/calculations';
import { exportToPDF } from '../../lib/pdf-export';
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

        exportToPDF({
            title: "EMI Calculation Summary",
            subtitle: `${method.toUpperCase()} Repayment Method`,
            details: [
                { label: "Loan Amount", value: f(parseFloat(amount)) },
                { label: "ROI (p.a.)", value: `${rate}%` },
                { label: "Tenure", value: `${tenure} Months (${(parseFloat(tenure) / 12).toFixed(1)} Years)` },
                { label: "Repayment Method", value: method.toUpperCase() },
                { label: "--- Results ---", value: "" },
                { label: method === 'bullet' ? "Final Payment" : "Monthly EMI", value: f(method === 'bullet' ? results.finalPayment : results.emi) },
                { label: "Total Interest", value: f(results.totalInterest) },
                { label: "Total Payable", value: f(results.totalPayable) }
            ]
        }, `EMI_Summary_${method}.pdf`);
    };

    return (
        <Card className="premium-card w-full max-w-4xl mx-auto overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-primary/10 via-background to-background border-b border-border/10 p-4 md:px-6">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <Calculator className="w-6 h-6 text-primary" />
                        <div>
                            <CardTitle className="text-xl font-black">EMI Calculator</CardTitle>
                            <CardDescription className="text-[10px] font-bold uppercase tracking-wider text-foreground opacity-70">
                                Equal Monthly Installment Protocol
                            </CardDescription>
                        </div>
                    </div>
                    <Button onClick={downloadPDF} variant="outline" size="sm" className="h-10 gap-2 border-primary/30 hover:bg-primary/10 hidden md:flex text-xs font-black px-4 shadow-sm">
                        <FileDown className="w-5 h-5 text-primary" />
                        EXPORT PDF
                    </Button>
                    <Button onClick={() => setIsScheduleOpen(true)} variant="outline" size="sm" className="h-10 gap-2 border-indigo-600/30 hover:bg-indigo-600/10 hidden md:flex text-xs font-black px-4 shadow-sm">
                        <TableProperties className="w-5 h-5 text-indigo-600" />
                        AMORTIZATION
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
                    {/* Inputs Section */}
                    <div className="lg:col-span-7 p-4 md:p-6 space-y-4 border-r border-border/50">
                        <div className="space-y-2">
                            <Label className="result-label text-primary">Repayment Strategy</Label>
                            <div className="grid grid-cols-4 gap-1 p-1 bg-accent/30 rounded-xl">
                                {(['reducing', 'flat', 'fixed', 'bullet'] as RepaymentMethod[]).map((m) => (
                                    <Button
                                        key={m}
                                        type="button"
                                        size="sm"
                                        variant={method === m ? "default" : "ghost"}
                                        onClick={() => setMethod(m)}
                                        className={cn(
                                            "capitalize text-[11px] font-black transition-all rounded-lg h-10",
                                            method === m
                                                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                                                : "text-foreground bg-accent/20 hover:bg-accent opacity-60 hover:opacity-100"
                                        )}
                                    >
                                        {m === 'fixed' ? 'Fixed' : m}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="amount" className="result-label text-primary">Amount (₹)</Label>
                                <Input
                                    id="amount"
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="text-2xl font-black h-12 bg-accent/30 border-none ring-offset-background focus-visible:ring-primary shadow-inner"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="rate" className="result-label text-primary">Rate (%)</Label>
                                <Input
                                    id="rate"
                                    type="number"
                                    step="0.01"
                                    value={rate}
                                    onChange={(e) => setRate(e.target.value)}
                                    className="text-2xl font-black h-12 bg-accent/30 border-none ring-offset-background focus-visible:ring-primary shadow-inner text-primary"
                                />
                            </div>
                        </div>

                        <div className="space-y-2 pt-2">
                            <Label htmlFor="tenure" className="result-label text-primary">Tenure (Months)</Label>
                            <div className="flex gap-3 items-center">
                                <Input
                                    id="tenure"
                                    type="number"
                                    value={tenure}
                                    onChange={(e) => setTenure(e.target.value)}
                                    className="h-10 text-xl font-black bg-accent border-none px-4"
                                />
                                <div className="text-[12px] font-bold text-foreground w-20 text-right opacity-70">
                                    {(parseFloat(tenure) / 12).toFixed(1)} YEARS
                                </div>
                            </div>
                        </div>
                        <p className="text-[10px] text-foreground font-black text-center uppercase tracking-tighter italic bg-primary/5 py-2 rounded-lg">
                            *Standard actuarial reducing balance method.
                        </p>
                    </div>

                    {/* Results Section */}
                    <div className="lg:col-span-5 p-4 md:p-6 bg-muted/30 flex flex-col justify-center space-y-4">
                        <div className="space-y-1">
                            <span className="result-label">
                                {method === 'bullet' ? 'Final Payment' : (method === 'fixed' ? 'EMI (Annual)' : 'Monthly EMI')}
                            </span>
                            <div className="hero-result-value leading-tight">
                                {formatCurrency(method === 'bullet' ? results.finalPayment : results.emi)}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                            <div className="stat-card">
                                <div className="flex justify-between items-center">
                                    <span className="result-label">Total Interest</span>
                                    <span className="text-lg font-black text-emerald-500 leading-none">
                                        {formatCurrency(results.totalInterest)}
                                    </span>
                                </div>
                            </div>
                            <div className="stat-card p-3">
                                <span className="result-label">Total Payable</span>
                                <div className="text-xl font-black text-primary leading-none">
                                    {formatCurrency(results.totalPayable)}
                                </div>
                                <div className="w-full h-3 bg-accent/50 rounded-full overflow-hidden mt-1">
                                    <div
                                        className="h-full bg-primary transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(59,130,246,0.5)]"
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
