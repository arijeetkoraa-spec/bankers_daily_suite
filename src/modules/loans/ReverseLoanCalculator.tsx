import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Button } from '../../components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { RotateCcw, Sparkles, FileDown } from 'lucide-react';
import { cn, formatPdfCurrency } from '../../lib/utils';
import { exportToPDF } from '../../lib/pdf-export';
import { AmortizationModal } from '../../components/AmortizationModal';
import { generateAmortizationSchedule } from '../../lib/amortization';
import { TableProperties } from 'lucide-react';

export const ReverseLoanCalculator: React.FC = () => {
    const [target, setTarget] = useLocalStorage<string>('reverse_target', 'principal');

    // Inputs
    const [principal, setPrincipal] = useLocalStorage<string>('rev_principal', '0');
    const [rate, setRate] = useLocalStorage<string>('rev_rate', '9.50');
    const [tenure, setTenure] = useLocalStorage<string>('rev_tenure', '120');
    const [emi, setEmi] = useLocalStorage<string>('rev_emi', '15000');

    const [result, setResult] = useState<string>('');
    const [isScheduleOpen, setIsScheduleOpen] = useState(false);
    const [schedule, setSchedule] = useState<any[]>([]);

    const calculate = React.useCallback(() => {
        const P = parseFloat(principal);
        const R = parseFloat(rate); // % p.a.
        const N = parseFloat(tenure); // months
        const E = parseFloat(emi);

        if (target === 'principal') {
            if (E > 0 && R > 0 && N > 0) {
                const r = R / 12 / 100;
                const factor = Math.pow(1 + r, N);
                const p = E * (factor - 1) / (r * factor);
                setPrincipal(p.toFixed(0));
                setResult(`₹${p.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`);
            }
        } else if (target === 'tenure') {
            if (P > 0 && E > 0 && R > 0) {
                const r = R / 12 / 100;
                const numerator = -Math.log(1 - (r * P) / E);
                const denominator = Math.log(1 + r);
                const n = numerator / denominator;
                if (!isFinite(n) || isNaN(n)) {
                    setResult("Invalid Input");
                } else {
                    setTenure(n.toFixed(0));
                    setResult(`${n.toFixed(1)} Months`);
                }
            }
        } else if (target === 'rate') {
            if (P > 0 && E > 0 && N > 0) {
                let low = 0;
                let high = 500; // 500% annual
                let annualRate = 0;
                for (let i = 0; i < 50; i++) {
                    const mid = (low + high) / 2;
                    const r = mid / 12 / 100;
                    const fact = Math.pow(1 + r, N);
                    const calcEmi = P * r * fact / (fact - 1);
                    if (calcEmi < E) low = mid;
                    else high = mid;
                }
                annualRate = (low + high) / 2;
                setRate(annualRate.toFixed(2));
                setResult(`${annualRate.toFixed(2)}% p.a.`);
            }
        }

        // Generate schedule based on final parameters
        const P_final = parseFloat(principal) || 0;
        const R_final = parseFloat(rate) || 0;
        const N_final = parseFloat(tenure) || 0;
        if (P_final > 0 && R_final > 0 && N_final > 0) {
            setSchedule(generateAmortizationSchedule(P_final, R_final, N_final, 'reducing'));
        }
    }, [target, principal, rate, tenure, emi, setPrincipal, setRate, setTenure]);

    // Initial calculation and schedule generation on mount
    React.useEffect(() => {
        calculate();
    }, []);


    const downloadPDF = () => {
        const f = formatPdfCurrency;
        exportToPDF({
            title: "Reverse Loan Computation",
            subtitle: `Target Parameter: ${target.toUpperCase()}`,
            details: [
                { label: "Monthly EMI", value: f(parseFloat(emi)) },
                { label: "Principal", value: f(parseFloat(principal)) },
                { label: "Rate", value: `${rate}% p.a.` },
                { label: "Tenure", value: `${tenure} Months` },
                { label: "--- Calculated Result ---", value: "" },
                { label: `Target: ${target.toUpperCase()}`, value: target === 'rate' ? `${rate}% p.a.` : (target === 'tenure' ? `${tenure} Months` : f(parseFloat(principal))) }
            ]
        }, `Reverse_Loan_${target}.pdf`);
    };

    return (
        <Card className="premium-card w-full max-w-4xl mx-auto overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-cyan-500/10 via-background to-background border-b border-border/10 p-4 md:px-6">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <RotateCcw className="w-6 h-6 text-cyan-600" />
                        <div>
                            <CardTitle className="text-xl font-black">Inverse Modeling</CardTitle>
                            <CardDescription className="text-[10px] font-bold uppercase tracking-wider text-foreground opacity-70">
                                Debt Structure Reverse engineering
                            </CardDescription>
                        </div>
                    </div>
                    <Button onClick={downloadPDF} variant="outline" size="sm" className="h-10 gap-2 border-primary/30 hover:bg-primary/10 hidden md:flex text-xs font-black px-4 shadow-sm">
                        <FileDown className="w-5 h-5 text-primary" />
                        EXPORT PDF
                    </Button>
                    <Button onClick={() => setIsScheduleOpen(true)} variant="outline" size="sm" className="h-10 gap-2 border-cyan-500/30 hover:bg-cyan-500/10 hidden md:flex text-xs font-black px-4 shadow-sm">
                        <TableProperties className="w-5 h-5 text-cyan-600" />
                        AMORTIZATION
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <Tabs defaultValue={target} value={target} onValueChange={setTarget} className="w-full">
                    <div className="grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
                        {/* Inputs Section */}
                        <div className="lg:col-span-7 p-4 md:p-6 space-y-4 border-r border-border/50">
                            <TabsList className="grid w-full grid-cols-3 bg-accent/50 p-1.5 h-11 rounded-xl shadow-inner">
                                <TabsTrigger value="principal" className="rounded-lg h-8 font-black text-[11px] uppercase tracking-widest data-[state=active]:bg-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-cyan-500/20">Amount</TabsTrigger>
                                <TabsTrigger value="tenure" className="rounded-lg h-8 font-black text-[11px] uppercase tracking-widest data-[state=active]:bg-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-cyan-500/20">Tenure</TabsTrigger>
                                <TabsTrigger value="rate" className="rounded-lg h-8 font-black text-[11px] uppercase tracking-widest data-[state=active]:bg-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-cyan-500/20">ROI</TabsTrigger>
                            </TabsList>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <Label className="text-[10px] font-bold uppercase text-foreground opacity-70">Monthly EMI (₹)</Label>
                                    <Input
                                        type="number"
                                        value={emi}
                                        onChange={(e) => setEmi(e.target.value)}
                                        className="h-10 text-xl font-black bg-accent border-none px-4"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[10px] font-bold uppercase text-foreground opacity-70">Principal (₹)</Label>
                                    <Input
                                        type="number"
                                        value={principal}
                                        onChange={(e) => setPrincipal(e.target.value)}
                                        disabled={target === 'principal'}
                                        className={cn(
                                            "h-10 text-xl font-black border-none px-4",
                                            target === 'principal' ? "bg-cyan-600/10 text-cyan-700" : "bg-accent"
                                        )}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <Label className="text-[10px] font-bold uppercase text-foreground opacity-70">Rate (%)</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={rate}
                                        onChange={(e) => setRate(e.target.value)}
                                        disabled={target === 'rate'}
                                        className={cn(
                                            "h-10 text-xl font-black border-none px-4",
                                            target === 'rate' ? "bg-cyan-600/10 text-cyan-700" : "bg-accent"
                                        )}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[10px] font-bold uppercase text-foreground opacity-70">Tenure (Mos)</Label>
                                    <Input
                                        type="number"
                                        value={tenure}
                                        onChange={(e) => setTenure(e.target.value)}
                                        disabled={target === 'tenure'}
                                        className={cn(
                                            "h-10 text-xl font-black border-none px-4",
                                            target === 'tenure' ? "bg-cyan-600/10 text-cyan-700" : "bg-accent"
                                        )}
                                    />
                                </div>
                            </div>

                            <Button onClick={calculate} className="w-full h-12 rounded-xl bg-cyan-600 hover:bg-cyan-700 shadow-lg shadow-cyan-500/20 gap-2 font-black uppercase tracking-widest text-[12px]">
                                Recalculate Parameter
                            </Button>
                        </div>

                        {/* Results Section */}
                        <div className="lg:col-span-5 p-4 md:p-6 bg-muted/30 flex flex-col justify-center space-y-4">
                            <div className="space-y-1">
                                <span className="result-label">Computed {target}</span>
                                <div className="hero-result-value text-cyan-700 leading-tight">
                                    {result || "0"}
                                </div>
                            </div>

                            <div className="stat-card bg-cyan-500/5 border-none p-3 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <div className="p-1.5 rounded-lg bg-cyan-600/10 border border-cyan-600/20">
                                        <Sparkles className="w-3.5 h-3.5 text-cyan-600" />
                                    </div>
                                    <span className="text-[9px] font-black text-foreground uppercase tracking-tighter">
                                        Iterative Conversion: Verified
                                    </span>
                                </div>
                            </div>

                            <p className="text-[10px] text-foreground font-black text-center uppercase tracking-tighter italic bg-primary/5 py-2 rounded-lg">
                                *Precision modeling for debt liquidation.
                            </p>
                        </div>
                    </div>
                </Tabs>
            </CardContent>

            <AmortizationModal
                isOpen={isScheduleOpen}
                onClose={() => setIsScheduleOpen(false)}
                schedule={schedule}
                principal={parseFloat(principal) || 0}
                totalInterest={Math.max(0, (schedule[schedule.length - 1]?.emi * schedule.length || 0) - (parseFloat(principal) || 0))}
                accentColor="cyan-600"
            />
        </Card>
    );
};
