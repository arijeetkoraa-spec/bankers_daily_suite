import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { Landmark, Sparkles, FileDown, ArrowRight, RotateCcw, Plus, Trash2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { exportAmortizationToPDF } from '../../lib/pdf-export';
import { cn, formatPdfCurrency } from '../../lib/utils';
import { AmortizationModal } from '../../components/AmortizationModal';
import { generateAmortizationSchedule } from '../../lib/amortization';
import { TableProperties } from 'lucide-react';

export const TakeoverCalculator: React.FC = () => {
    // Current Loan
    const [principal, setPrincipal] = useLocalStorage<string>('takeover_principal', '5000000');
    const [rate, setRate] = useLocalStorage<string>('takeover_rate', '9.5');
    const [tenure, setTenure] = useLocalStorage<string>('takeover_tenure', '180');

    // New Loan
    const [newRate, setNewRate] = useLocalStorage<string>('takeover_new_rate', '8.5');
    const [charges, setCharges] = useLocalStorage<{ id: string; name: string; value: string }[]>('takeover_charges', [
        { id: '1', name: 'Processing Fee', value: '5000' }
    ]);

    const calculateEMI = (p: number, r: number, n: number) => {
        if (p === 0 || r === 0 || n === 0) return 0;
        const mr = r / (12 * 100);
        return (p * mr * Math.pow(1 + mr, n)) / (Math.pow(1 + mr, n) - 1);
    };

    const results = useMemo(() => {
        const P = parseFloat(principal);
        const Rold = parseFloat(rate);
        const Rnew = parseFloat(newRate);
        const N = parseFloat(tenure);
        const totalCharges = charges.reduce((acc, c) => acc + (parseFloat(c.value) || 0), 0);

        if (isNaN(P) || isNaN(Rold) || isNaN(Rnew) || isNaN(N) || P <= 0 || N <= 0) {
            return {
                savings: 0,
                oldEMI: 0,
                newEMI: 0,
                monthlySavings: 0,
                oldSchedule: [],
                newSchedule: []
            };
        }

        const emiOld = calculateEMI(P, Rold, N);
        const emiNew = calculateEMI(P, Rnew, N);

        const totalOld = emiOld * N;
        const totalNew = (emiNew * N) + totalCharges;

        return {
            oldEMI: emiOld,
            newEMI: emiNew,
            monthlySavings: emiOld - emiNew,
            savings: totalOld - totalNew,
            oldSchedule: generateAmortizationSchedule(P, Rold, N, 'reducing'),
            newSchedule: generateAmortizationSchedule(P, Rnew, N, 'reducing')
        };
    }, [principal, rate, tenure, newRate, charges]);

    const [isOldScheduleOpen, setIsOldScheduleOpen] = useState(false);
    const [isNewScheduleOpen, setIsNewScheduleOpen] = useState(false);

    const { oldEMI, newEMI, monthlySavings, savings, oldSchedule, newSchedule } = results;

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
            title: "Loan Takeover Analysis",
            subtitle: "Refinancing Impact & Savings Assessment | Professional Audit",
            details: [
                { label: "Principal Outstanding", value: f(parseFloat(principal)) },
                { label: "--- Current Profile ---", value: "" },
                { label: "Existing ROI (p.a.)", value: `${rate}%` },
                { label: "Remaining Tenure", value: `${tenure} Months` },
                { label: "Current EMI", value: f(oldEMI) },
                { label: "--- Proposed Profile ---", value: "" },
                { label: "New ROI (p.a.)", value: `${newRate}%` },
                { label: "Proposed EMI", value: f(newEMI) },
                ...charges.map(c => ({ label: c.name || "Charge", value: f(parseFloat(c.value)) })),
                { label: "--- Impact Analysis ---", value: "" },
                { label: "Monthly Savings", value: f(monthlySavings) },
                { label: "Net Lifetime Savings", value: f(savings) }
            ],
            schedule: newSchedule // Exporting the proposed schedule by default
        }, `Takeover_Analysis.pdf`);
    };

    const reset = () => {
        setPrincipal('5000000');
        setRate('9.5');
        setTenure('180');
        setNewRate('8.5');
        setCharges([{ id: '1', name: 'Processing Fee', value: '5000' }]);
    };

    return (
        <Card className="premium-card w-full max-w-5xl mx-auto overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-500/10 via-background to-background border-b border-border/10 p-4 md:px-6">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <Landmark className="w-6 h-6 text-blue-600" />
                        <div>
                            <CardTitle className="text-xl font-black text-rose-600">Takeover Audit</CardTitle>
                            <CardDescription className="text-[10px] font-bold uppercase tracking-wider text-foreground opacity-70">
                                Liability Migration Assessment
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
                        <Button onClick={downloadPDF} variant="outline" size="sm" className="h-10 gap-2 border-primary/30 hover:bg-primary/10 hidden md:flex text-xs font-black px-4 shadow-sm">
                            <FileDown className="w-5 h-5 text-primary" />
                            EXPORT PDF
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
                    {/* Inputs Section */}
                    <div className="lg:col-span-7 p-4 md:p-6 space-y-4 border-r border-border/50">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <Label className="text-[10px] font-black uppercase text-foreground opacity-70">Current Loan</Label>
                                    <button
                                        onClick={() => setIsOldScheduleOpen(true)}
                                        className="text-[9px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors"
                                    >
                                        <TableProperties className="w-3 h-3" /> Schedule
                                    </button>
                                </div>
                                <div className="space-y-2 share-row" data-share-key="loanAmount" data-share-type="input">
                                    <Label className="text-[10px] font-bold uppercase text-foreground opacity-70 share-label">O/S Principal (₹)</Label>
                                    <Input
                                        type="number"
                                        value={principal}
                                        onChange={(e) => setPrincipal(e.target.value)}
                                        className="h-10 text-xl font-black bg-accent border-none px-4 share-value"
                                    />
                                </div>
                                <div className="space-y-2 share-row" data-share-key="roi" data-share-type="input">
                                    <Label className="text-[10px] font-bold uppercase text-foreground opacity-70 share-label">Existing Rate (%)</Label>
                                    <Input
                                        type="number"
                                        value={rate}
                                        onChange={(e) => setRate(e.target.value)}
                                        className="h-10 text-xl font-black bg-accent border-none px-4 share-value"
                                    />
                                </div>
                                <div className="space-y-2 share-row" data-share-key="tenure" data-share-type="input">
                                    <Label className="text-[10px] font-bold uppercase text-foreground opacity-70 share-label">Remaining Tenure (Months)</Label>
                                    <Input
                                        type="number"
                                        value={tenure}
                                        onChange={(e) => setTenure(e.target.value)}
                                        className="h-10 text-xl font-black bg-accent border-none px-4 share-value"
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <Label className="text-[10px] font-black uppercase text-foreground opacity-70">Proposed Loan</Label>
                                    <button
                                        onClick={() => setIsNewScheduleOpen(true)}
                                        className="text-[9px] font-black uppercase tracking-widest text-emerald-600 hover:text-emerald-700 flex items-center gap-1 transition-colors"
                                    >
                                        <TableProperties className="w-3 h-3" /> Schedule
                                    </button>
                                </div>
                                <div className="space-y-2 share-row" data-share-key="newRate" data-share-type="input">
                                    <Label className="text-[10px] font-bold uppercase text-foreground opacity-70 share-label">New Proposed ROI (%)</Label>
                                    <Input
                                        type="number"
                                        value={newRate}
                                        onChange={(e) => setNewRate(e.target.value)}
                                        className="h-10 text-xl font-black bg-emerald-600/10 border-none px-4 text-emerald-700 share-value"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <Label className="text-[10px] font-bold uppercase text-foreground opacity-70">Charges (₹)</Label>
                                        <Button
                                            onClick={() => setCharges([...charges, { id: Date.now().toString(), name: '', value: '' }])}
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 w-6 p-0 text-emerald-600 hover:bg-emerald-600/10 rounded-full"
                                        >
                                            <Plus className="w-4 h-4" />
                                        </Button>
                                    </div>
                                    <div className="space-y-2 max-h-[120px] overflow-y-auto pr-1 custom-scrollbar">
                                        {charges.map((charge, idx) => (
                                            <div key={charge.id} className="flex gap-2 group">
                                                <Input
                                                    placeholder="Name"
                                                    value={charge.name}
                                                    onChange={(e) => {
                                                        const newCharges = [...charges];
                                                        newCharges[idx].name = e.target.value;
                                                        setCharges(newCharges);
                                                    }}
                                                    className="h-8 text-[10px] font-bold bg-accent/30 border-none px-2 flex-[2]"
                                                />
                                                <Input
                                                    type="number"
                                                    placeholder="Amt"
                                                    value={charge.value}
                                                    onChange={(e) => {
                                                        const newCharges = [...charges];
                                                        newCharges[idx].value = e.target.value;
                                                        setCharges(newCharges);
                                                    }}
                                                    className="h-8 text-[11px] font-black bg-accent/30 border-none px-2 flex-1"
                                                />
                                                {charges.length > 1 && (
                                                    <Button
                                                        onClick={() => setCharges(charges.filter((_, i) => i !== idx))}
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 p-0 text-rose-500 hover:bg-rose-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="pt-2.5 px-3.5 pb-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-start gap-2.5 shadow-sm">
                                    <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                                    <p className="text-[10px] font-black text-blue-800 uppercase tracking-widest leading-tight">
                                        Potential Spread: <span className="text-sm">{(parseFloat(rate) - parseFloat(newRate)).toFixed(2)}%</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Results Section */}
                    <div className="lg:col-span-5 p-4 md:p-6 bg-muted/30 flex flex-col justify-center space-y-4">
                        <div className="space-y-1 share-row" data-share-key="netSavings" data-share-type="result">
                            <span className="result-label share-label">Net Lifetime Savings</span>
                            <div className={cn("hero-result-value leading-tight share-value", savings > 0 ? "text-emerald-500" : "text-red-500")}>
                                {formatCurrency(savings)}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                            <div className="stat-card share-row" data-share-key="emi" data-share-type="result">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="result-label share-label">New Proposed EMI</span>
                                    <span className="text-[10px] font-black text-emerald-700 bg-emerald-500/20 px-2 py-1 rounded-lg border border-emerald-500/20 shadow-sm">
                                        SAVE {formatCurrency(monthlySavings)}/mo
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold text-muted-foreground line-through opacity-40">{formatCurrency(oldEMI)}</span>
                                    <ArrowRight className="w-2.5 h-2.5 text-muted-foreground/30" />
                                    <span className="text-lg font-black text-foreground leading-none share-value">{formatCurrency(newEMI)}</span>
                                </div>
                            </div>

                            <div className="p-3 rounded-lg border border-dashed border-blue-500/30 flex flex-col gap-1.5 bg-blue-500/5">
                                <div className="flex justify-between items-center">
                                    <span className="result-label text-blue-700">Refinance Efficiency</span>
                                    <span className="text-[9px] font-black text-blue-600">
                                        {((savings / (oldEMI * parseFloat(tenure))) * 100).toFixed(1)}% Saving
                                    </span>
                                </div>
                                <div className="w-full h-1.5 bg-blue-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-blue-500"
                                        style={{ width: `${Math.min((savings / (oldEMI * parseFloat(tenure)) * 100) * 5, 100)}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>

            <AmortizationModal
                isOpen={isOldScheduleOpen}
                onClose={() => setIsOldScheduleOpen(false)}
                schedule={oldSchedule}
                principal={parseFloat(principal) || 0}
                totalInterest={(oldEMI * parseFloat(tenure)) - parseFloat(principal)}
                accentColor="blue-600"
            />
            <AmortizationModal
                isOpen={isNewScheduleOpen}
                onClose={() => setIsNewScheduleOpen(false)}
                schedule={newSchedule}
                principal={parseFloat(principal) || 0}
                totalInterest={(newEMI * parseFloat(tenure)) - parseFloat(principal)}
                accentColor="emerald-600"
            />
        </Card>
    );
};

