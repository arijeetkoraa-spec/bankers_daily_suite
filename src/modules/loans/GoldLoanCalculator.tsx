import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Button } from '../../components/ui/button';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { Coins, FileDown, RotateCcw, Plus, Trash2, AlertCircle, Info, ChevronDown, ChevronUp, ShieldCheck, Landmark, ReceiptText, Percent, IndianRupee } from 'lucide-react';
import { exportAmortizationToPDF } from '../../lib/pdf/export';
import { formatIndianCurrency, numberToIndianWords, formatPdfCurrency } from '../../lib/utils';

// -- TYPES --
interface Ornament {
    id: string;
    description: string;
    grossWeight: number;
    deductions: number;
    purity: number; // 18, 20, 22, 24
    isNetEntry: boolean;
}

interface Charge {
    id: string;
    name: string;
    type: 'percentage' | 'fixed';
    value: number;
}

type LoanType = 'EMI' | 'Bullet' | 'Overdraft';

const LOAN_RULES: Record<LoanType, { maxLTV: number, capMessage?: string }> = {
    'EMI': { maxLTV: 75 },
    'Overdraft': { maxLTV: 75 },
    'Bullet': { maxLTV: 65, capMessage: 'Bullet Repayment usually capped at lower LTV or Amount' }
};

export const GoldLoanCalculator: React.FC = () => {
    // -- STATE --
    const [loanType, setLoanType] = useLocalStorage<LoanType>('gl_type', 'EMI');
    const [goldRate, setGoldRate] = useLocalStorage<string>('gl_rate', '6500');
    const [customLTV, setCustomLTV] = useLocalStorage<string>('gl_custom_ltv', '');
    const [interestRate, setInterestRate] = useLocalStorage<string>('gl_roi', '9.0');
    const [tenureMonths, setTenureMonths] = useLocalStorage<string>('gl_tenure', '12');
    const [ornaments, setOrnaments] = useLocalStorage<Ornament[]>('gl_ornaments', [
        { id: '1', description: 'Gold Ring', grossWeight: 10, deductions: 0, purity: 22, isNetEntry: false }
    ]);
    const [cibilScore, setCibilScore] = useLocalStorage<string>('gl_cibil', '750');

    // Advanced & Dynamic Inputs
    const [requestedLoanAmount, setRequestedLoanAmount] = useLocalStorage<string>('gl_req_amount', '');
    const [charges, setCharges] = useLocalStorage<Charge[]>('gl_charges', [
        { id: '1', name: 'Processing Fee', type: 'percentage', value: 1.0 },
        { id: '2', name: 'Documentation', type: 'fixed', value: 500 }
    ]);

    // UI State
    const [showParams, setShowParams] = useState(false);
    const [showSchedule, setShowSchedule] = useState(false);

    // -- LOGIC --
    const rate = parseFloat(goldRate) || 0;

    const detailedValuation = ornaments.map(o => {
        let netWeight = 0;
        let deductionPct = 0;
        if (o.isNetEntry) {
            netWeight = o.grossWeight;
        } else {
            netWeight = Math.max(0, o.grossWeight - o.deductions);
            if (o.grossWeight > 0) deductionPct = (o.deductions / o.grossWeight) * 100;
        }
        const equivalent22K = netWeight * (o.purity / 22);
        const value = equivalent22K * rate;
        return { ...o, netWeight, equivalent22K, value, deductionPct };
    });

    const totalNetWeight = detailedValuation.reduce((sum, o) => sum + o.netWeight, 0);
    const totalValuation = detailedValuation.reduce((sum, o) => sum + o.value, 0);

    const highDeductionWarning = detailedValuation.some(o => o.deductionPct > 20);

    let applicableLTV = LOAN_RULES[loanType].maxLTV;
    if (customLTV) applicableLTV = parseFloat(customLTV) || applicableLTV;

    let ltvWarning = '';
    let highValueWarning = '';
    if (totalValuation > 500000) highValueWarning = "High Value (> ₹5L): Recommend second appraisal.";

    const score = parseFloat(cibilScore) || 750;
    if (score < 650) {
        applicableLTV = Math.max(applicableLTV - 10, 50);
        ltvWarning = "LTV reduced due to Credit Score.";
    }

    const maxEligibleLoan = totalValuation * (applicableLTV / 100);
    const actualLoanAmount = requestedLoanAmount ? Math.min(parseFloat(requestedLoanAmount) || 0, maxEligibleLoan) : maxEligibleLoan;
    const isAmountCapped = requestedLoanAmount && parseFloat(requestedLoanAmount) > maxEligibleLoan;

    const actualLoanWords = numberToIndianWords(Math.round(actualLoanAmount));

    // Calculate Dynamic Charges
    const chargeBreakdown = charges.map(c => {
        const amount = c.type === 'percentage' ? (actualLoanAmount * c.value) / 100 : c.value;
        return { ...c, calculatedAmount: amount };
    });
    const totalUpfrontCharges = chargeBreakdown.reduce((sum, c) => sum + c.calculatedAmount, 0);
    const netDisbursement = actualLoanAmount - totalUpfrontCharges;

    // Repayment
    let emi = 0;
    let totalInterest = 0;
    let totalPayment = 0;
    const schedule: { month: number, emi: number, principal: number, interest: number, balance: number }[] = [];

    const r = (parseFloat(interestRate) || 0) / 12 / 100;
    const n = parseFloat(tenureMonths) || 12;

    if (actualLoanAmount > 0 && n > 0) {
        if (loanType === 'EMI') {
            if (r > 0) {
                emi = (actualLoanAmount * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
                totalPayment = emi * n;
                totalInterest = totalPayment - actualLoanAmount;
                let balance = actualLoanAmount;
                for (let i = 1; i <= n; i++) {
                    const interest = balance * r;
                    const principal = emi - interest;
                    balance = Math.max(0, balance - principal);
                    schedule.push({ month: i, emi, principal, interest, balance });
                }
            }
        } else if (loanType === 'Bullet') {
            totalInterest = (actualLoanAmount * (parseFloat(interestRate) || 0) * (n / 12)) / 100;
            totalPayment = actualLoanAmount + totalInterest;
            schedule.push({ month: Math.round(n), emi: totalPayment, principal: actualLoanAmount, interest: totalInterest, balance: 0 });
        } else if (loanType === 'Overdraft') {
            totalInterest = (actualLoanAmount * (parseFloat(interestRate) || 0) * (1 / 12)) / 100;
            totalPayment = actualLoanAmount;
        }
    }

    // -- HANDLERS --
    const updateOrnament = (id: string, field: keyof Ornament, value: string | number | boolean) => {
        setOrnaments(ornaments.map(o => o.id === id ? { ...o, [field]: value } : o));
    };

    const addOrnament = () => {
        setOrnaments([...ornaments, { id: Date.now().toString(), description: '', grossWeight: 0, deductions: 0, purity: 22, isNetEntry: false }]);
    };

    const removeOrnament = (id: string) => {
        setOrnaments(ornaments.filter(o => o.id !== id));
    };

    const updateCharge = (id: string, field: keyof Charge, value: string | number) => {
        setCharges(charges.map(c => c.id === id ? { ...c, [field]: value } : c));
    };

    const addCharge = () => {
        setCharges([...charges, { id: Date.now().toString(), name: 'New Charge', type: 'fixed', value: 0 }]);
    };

    const removeCharge = (id: string) => {
        setCharges(charges.filter(c => c.id !== id));
    };

    const reset = () => {
        setLoanType('EMI');
        setGoldRate('6500');
        setOrnaments([{ id: Date.now().toString(), description: 'Gold Ring', grossWeight: 10, deductions: 0, purity: 22, isNetEntry: false }]);
        setCibilScore('750');
        setCustomLTV('');
        setInterestRate('9.0');
        setTenureMonths('12');
        setRequestedLoanAmount('');
        setCharges([
            { id: '1', name: 'Processing Fee', type: 'percentage', value: 1.0 },
            { id: '2', name: 'Documentation', type: 'fixed', value: 500 }
        ]);
    };

    const downloadPDF = () => {
        const timestamp = Date.now();
        const docTitle = `Gold_Loan_Report_${timestamp}.pdf`;

        const f = formatPdfCurrency;

        exportAmortizationToPDF({
            title: `Gold Loan Assessment`,
            subtitle: `${loanType} @ ${interestRate}% for ${tenureMonths}m | Detailed Repayment Roadmap`,
            details: [
                { label: "Loan Type", value: loanType },
                { label: "Gold Rate (22K)", value: `${f(rate)}/g` },
                { label: "Applied LTV", value: `${applicableLTV}%` },
                { label: "--- Summary ---", value: "" },
                { label: "Total Net Weight", value: `${totalNetWeight.toFixed(2)} grams` },
                { label: "Total Valuation", value: f(totalValuation) },
                { label: "Max Eligible Loan", value: f(maxEligibleLoan) },
                { label: "Requested Amount", value: requestedLoanAmount ? f(parseFloat(requestedLoanAmount)) : "Max Eligible" },
                { label: "Actual Loan Amount", value: f(actualLoanAmount) },
                { label: "--- Repayment ---", value: "" },
                { label: "Monthly EMI", value: loanType === 'EMI' ? f(emi) : 'N/A' },
                { label: "Total Interest", value: f(totalInterest) },
                { label: "Total Payable", value: f(totalPayment) },
            ],
            schedule: schedule
        }, docTitle);
    };

    return (
        <Card className="premium-card w-full max-w-5xl mx-auto overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-yellow-600/10 via-background to-background border-b border-border/10 p-4 md:px-6">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <Coins className="w-6 h-6 text-yellow-700" />
                        <div>
                            <CardTitle className="text-xl font-black text-foreground">Advanced Gold Loan</CardTitle>
                            <CardDescription className="text-[10px] font-black uppercase tracking-wider text-primary/80 dark:text-foreground/70">
                                Dynamic Multi-Case Calculator • Indian Banking Standard
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
                        <Button onClick={downloadPDF} size="sm" className="h-10 gap-2 text-xs font-black border-yellow-600/30 hover:bg-yellow-600/10 hidden md:flex px-4 shadow-sm" variant="outline">
                            <FileDown className="w-5 h-5 text-yellow-700" />
                            EXPORT PDF
                        </Button>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-0">
                <div className="grid grid-cols-1 xl:grid-cols-12 overflow-hidden">

                    {/* INPUT SECTION */}
                    <div className="xl:col-span-7 p-4 md:p-6 space-y-6 border-r border-border/50 h-full overflow-y-auto max-h-[850px]">

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1 share-row" data-share-key="loanScheme" data-share-type="option">
                                <Label className="text-[10px] font-black text-foreground dark:text-muted-foreground uppercase tracking-widest share-label">Loan Scheme</Label>
                                <div className="flex p-1 bg-accent/50 dark:bg-slate-800/50 rounded-lg shadow-inner">
                                    {[
                                        { id: 'EMI', label: 'EMI' },
                                        { id: 'Bullet', label: 'Bullet' },
                                        { id: 'Overdraft', label: 'OD' }
                                    ].map(scheme => (
                                        <button
                                            key={scheme.id}
                                            onClick={() => setLoanType(scheme.id as LoanType)}
                                            className={`flex-1 text-[11px] py-1.5 rounded-md font-black uppercase tracking-wider transition-all ${loanType === scheme.id ? 'bg-white shadow dark:bg-slate-700 text-yellow-700 dark:text-yellow-500' : 'text-muted-foreground hover:text-foreground'}`}
                                        >
                                            {scheme.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-1 share-row" data-share-key="goldRate" data-share-type="input">
                                <Label className="text-[10px] font-black text-foreground dark:text-muted-foreground uppercase tracking-widest share-label">Gold Rate (₹/gm 22K)</Label>
                                <Input
                                    type="number"
                                    value={goldRate}
                                    onChange={(e) => setGoldRate(e.target.value)}
                                    className="h-10 text-lg font-black bg-accent/50 dark:bg-slate-800/50 border-none px-4 text-foreground share-value"
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center px-1">
                                <Label className="text-[10px] font-black text-foreground dark:text-muted-foreground uppercase tracking-wider">Collateral Details</Label>
                                <Button onClick={addOrnament} variant="ghost" size="sm" className="h-7 text-[10px] font-black text-yellow-700 hover:bg-yellow-50 dark:hover:bg-yellow-900/20">
                                    <Plus className="w-3.5 h-3.5 mr-1" /> ADD ITEM
                                </Button>
                            </div>

                            <div className="space-y-4">
                                {ornaments.map((item) => (
                                    <div key={item.id} className="p-5 bg-slate-100/50 dark:bg-slate-900/40 rounded-2xl border border-border/50 space-y-4 group transition-all share-row">
                                        <div className="flex flex-col md:flex-row gap-4">
                                            <div className="flex-1 space-y-1.5">
                                                <Label className="text-[10px] font-black text-foreground dark:text-muted-foreground uppercase tracking-widest share-label">Ornament Description</Label>
                                                <Input
                                                    value={item.description}
                                                    onChange={(e) => updateOrnament(item.id, 'description', e.target.value)}
                                                    className="h-10 text-xs font-black bg-accent/50 dark:bg-slate-800/50 border-none px-3 share-value"
                                                    placeholder="e.g. Necklace, Ring"
                                                />
                                            </div>
                                            <div className="w-full md:w-40 space-y-1.5">
                                                <Label className="text-[10px] font-black text-foreground dark:text-muted-foreground uppercase tracking-widest">Purity</Label>
                                                <select
                                                    value={item.purity}
                                                    onChange={(e) => updateOrnament(item.id, 'purity', parseFloat(e.target.value))}
                                                    className="w-full h-10 text-xs font-black bg-accent/50 dark:bg-slate-800/50 border-none rounded-md px-3 text-foreground"
                                                >
                                                    {[18, 20, 22, 24].map(k => <option key={k} value={k} className="bg-background">{k} Karat</option>)}
                                                </select>
                                            </div>
                                            <div className="flex items-end pb-0.5">
                                                <Button onClick={() => removeOrnament(item.id)} variant="ghost" size="icon" className="h-10 w-10 text-red-500 hover:bg-red-500/10 rounded-xl">
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-end">
                                            <div className="space-y-1.5">
                                                <Label className="text-[10px] font-black text-foreground dark:text-muted-foreground uppercase tracking-widest flex justify-between items-center">
                                                    Gross Wt
                                                    <span className={`cursor-pointer px-1.5 py-0.5 rounded text-[8px] font-black border-2 transition-all ${item.isNetEntry ? 'bg-yellow-500/10 border-yellow-500/50 text-yellow-700' : 'bg-slate-500/10 border-slate-500/50 text-slate-600'}`} onClick={() => updateOrnament(item.id, 'isNetEntry', !item.isNetEntry)}>
                                                        {item.isNetEntry ? 'NET' : 'DEDUCT'}
                                                    </span>
                                                </Label>
                                                <Input type="number" value={item.grossWeight || ''} onChange={(e) => updateOrnament(item.id, 'grossWeight', parseFloat(e.target.value) || 0)} className="h-12 text-xl font-black bg-accent/50 dark:bg-slate-800/50 border-none px-3 text-foreground" />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-[10px] font-black text-foreground dark:text-muted-foreground uppercase tracking-widest">Deductions</Label>
                                                <Input type="number" disabled={item.isNetEntry} value={item.deductions || ''} onChange={(e) => updateOrnament(item.id, 'deductions', parseFloat(e.target.value) || 0)} className={`h-12 text-xl font-black bg-accent/50 dark:bg-slate-800/50 border-none px-3 text-foreground ${item.isNetEntry ? 'opacity-30' : ''}`} />
                                            </div>
                                            <div className="bg-slate-900 dark:bg-slate-950 p-4 rounded-2xl border border-white/5 text-center col-span-2 shadow-lg glassmorphism-dark">
                                                <div className="text-[9px] font-black uppercase text-slate-400 tracking-[0.2em] mb-1">Valuation Weight</div>
                                                <div className="text-2xl font-black text-white">
                                                    {item.isNetEntry ? item.grossWeight.toFixed(2) : Math.max(0, item.grossWeight - item.deductions).toFixed(2)}<span className="text-yellow-500 ml-1 text-sm font-bold uppercase">g</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Loan Selection & Repayment Params */}
                        <div className="p-6 bg-slate-100/50 dark:bg-slate-900/40 rounded-2xl border border-border/50 space-y-6">
                            <div className="space-y-2 share-row" data-share-key="loanAmount" data-share-type="input">
                                <Label className="text-[10px] font-black text-foreground dark:text-muted-foreground uppercase tracking-widest share-label flex items-center gap-2">
                                    <Landmark className="w-4 h-4 text-emerald-600" /> Desired Loan Amount
                                </Label>
                                <Input
                                    type="number"
                                    placeholder={`Max: ${formatIndianCurrency(maxEligibleLoan)}`}
                                    value={requestedLoanAmount}
                                    onChange={(e) => setRequestedLoanAmount(e.target.value)}
                                    className="h-12 text-2xl font-black bg-accent/50 dark:bg-slate-800/50 border-none px-4 text-emerald-700 dark:text-emerald-500 share-value"
                                />
                                {isAmountCapped && (
                                    <p className="text-[10px] text-red-600 dark:text-red-400 font-bold flex items-center gap-1 uppercase tracking-tighter">
                                        <AlertCircle className="w-3 h-3" /> Capped at Max LTV Limit
                                    </p>
                                )}
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2 share-row" data-share-key="roi" data-share-type="input">
                                    <Label className="text-[10px] font-black text-foreground dark:text-muted-foreground uppercase tracking-widest share-label">ROI (% p.a)</Label>
                                    <Input type="number" value={interestRate} onChange={(e) => setInterestRate(e.target.value)} className="h-10 text-lg font-black bg-accent/50 dark:bg-slate-800/50 border-none px-4 share-value" />
                                </div>
                                <div className="space-y-2 share-row" data-share-key="tenure" data-share-type="input">
                                    <Label className="text-[10px] font-black text-foreground dark:text-muted-foreground uppercase tracking-widest share-label">Tenure (Months)</Label>
                                    <Input type="number" value={tenureMonths} onChange={(e) => setTenureMonths(e.target.value)} className="h-10 text-lg font-black bg-accent/50 dark:bg-slate-800/50 border-none px-4 share-value" />
                                </div>
                            </div>
                        </div>

                        {/* Dynamic Service Charges */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-center px-1">
                                <Label className="text-[10px] font-black text-foreground dark:text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                    <ReceiptText className="w-3.5 h-3.5" /> Service Charges
                                </Label>
                                <Button onClick={addCharge} variant="ghost" size="sm" className="h-7 text-[10px] font-black text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20">
                                    <Plus className="w-3.5 h-3.5 mr-1" /> ADD CHARGE
                                </Button>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                {charges.map((charge) => (
                                    <div key={charge.id} className="relative p-5 bg-slate-100/30 dark:bg-slate-900/40 border border-border/50 rounded-2xl shadow-sm flex flex-col md:flex-row gap-4 items-center group transition-all share-row">
                                        <div className="flex-1 w-full space-y-1.5">
                                            <Label className="text-[10px] font-black text-foreground dark:text-muted-foreground uppercase tracking-widest share-label">{charge.name}</Label>
                                            <Input
                                                value={charge.name}
                                                onChange={(e) => updateCharge(charge.id, 'name', e.target.value)}
                                                className="h-10 text-xs font-black bg-accent/50 dark:bg-slate-800/50 border-none px-3"
                                            />
                                        </div>
                                        <div className="w-full md:w-36 space-y-1.5">
                                            <Label className="text-[10px] font-black text-foreground dark:text-muted-foreground uppercase tracking-widest">Type</Label>
                                            <div className="flex bg-accent/50 dark:bg-slate-800/50 rounded-xl p-1 h-10 shadow-inner">
                                                <button
                                                    onClick={() => updateCharge(charge.id, 'type', 'percentage')}
                                                    className={`flex-1 flex items-center justify-center rounded-lg transition-all ${charge.type === 'percentage' ? 'bg-white shadow dark:bg-slate-700 text-emerald-700 dark:text-emerald-400 font-black' : 'text-slate-500 hover:text-slate-700'}`}
                                                >
                                                    <Percent className="w-4 h-4 mr-0.5" /> <span className="text-[9px] uppercase tracking-tighter">LTV%</span>
                                                </button>
                                                <button
                                                    onClick={() => updateCharge(charge.id, 'type', 'fixed')}
                                                    className={`flex-1 flex items-center justify-center rounded-lg transition-all ${charge.type === 'fixed' ? 'bg-white shadow dark:bg-slate-700 text-emerald-700 dark:text-emerald-400 font-black' : 'text-slate-500 hover:text-slate-700'}`}
                                                >
                                                    <IndianRupee className="w-4 h-4 mr-0.5" /> <span className="text-[9px] uppercase tracking-tighter">Flat</span>
                                                </button>
                                            </div>
                                        </div>
                                        <div className="w-full md:w-32 space-y-1.5">
                                            <Label className="text-[10px] font-black text-foreground dark:text-muted-foreground uppercase tracking-widest">{charge.type === 'percentage' ? 'Value (%)' : 'Amount (₹)'}</Label>
                                            <Input
                                                type="number"
                                                value={charge.value || ''}
                                                onChange={(e) => updateCharge(charge.id, 'value', parseFloat(e.target.value) || 0)}
                                                className="h-10 text-xs font-black text-right bg-accent/50 dark:bg-slate-800/50 border-none px-3 share-value"
                                            />
                                        </div>
                                        <div className="flex items-end pb-0.5">
                                            <Button onClick={() => removeCharge(charge.id)} variant="ghost" size="icon" className="h-10 w-10 text-red-500 hover:bg-red-500/10 rounded-xl">
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Assessment Parameters */}
                        <div className="border border-border/50 rounded-2xl overflow-hidden bg-background dark:bg-slate-900/40">
                            <button onClick={() => setShowParams(!showParams)} className="w-full flex justify-between items-center p-4 bg-muted/40 hover:bg-muted/60 transition-colors">
                                <span className="text-[10px] font-black uppercase text-foreground dark:text-muted-foreground tracking-widest flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-emerald-600" /> Assessment Parameters (Internal)</span>
                                {showParams ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                            {showParams && (
                                <div className="p-5 grid grid-cols-2 gap-5 bg-muted/10 animate-in slide-in-from-top-2 border-t border-border/50">
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] font-black text-foreground dark:text-muted-foreground uppercase tracking-widest">CIBIL Score</Label>
                                        <Input type="number" value={cibilScore} onChange={(e) => setCibilScore(e.target.value)} className="h-10 text-lg font-black bg-accent/30 dark:bg-slate-800/30 border-none px-3" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] font-black text-foreground dark:text-muted-foreground uppercase tracking-widest">LTV Override (%)</Label>
                                        <Input type="number" value={customLTV} placeholder="Auto" onChange={(e) => setCustomLTV(e.target.value)} className="h-10 text-lg font-black bg-accent/30 dark:bg-slate-800/30 border-none px-3 placeholder:opacity-30" />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* RESULTS SECTION */}
                    <div className="xl:col-span-5 bg-muted/30 flex flex-col h-full border-l border-border/10">
                        <div className="p-6 space-y-6 flex-1 overflow-y-auto">

                            <div className="bg-slate-900 dark:bg-slate-950 rounded-2xl p-6 shadow-2xl relative overflow-hidden border border-white/5 share-row" data-share-key="sanctionedAmount" data-share-type="result">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/5 rounded-full -mr-16 -mt-16" />
                                <div className="relative z-10 space-y-2">
                                    <span className="result-label share-label text-yellow-500 font-black">Sanctioned Loan Amount</span>
                                    <div className="hero-result-value text-white share-value">
                                        {formatIndianCurrency(actualLoanAmount)}
                                    </div>
                                    <div className="text-[10px] font-bold text-slate-400 italic lowercase tracking-tighter opacity-70">{actualLoanWords}</div>
                                    <div className="flex gap-2 text-[9px] mt-3">
                                        <span className="bg-yellow-500 text-slate-950 px-2 py-0.5 rounded shadow-sm font-black uppercase tracking-tighter">Net Wt: {totalNetWeight.toFixed(2)}g</span>
                                        {detailedValuation.length > 0 && <span className="bg-white/10 text-white px-2 py-0.5 rounded shadow-sm font-black uppercase tracking-tighter ring-1 ring-white/20">Items: {detailedValuation.length}</span>}
                                    </div>
                                </div>
                            </div>

                            <div className="bg-background dark:bg-slate-900/40 border border-border/50 p-5 rounded-2xl shadow-sm space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1 share-row" data-share-key="totalValuation" data-share-type="result">
                                        <div className="text-[10px] font-black text-foreground dark:text-muted-foreground uppercase tracking-widest share-label">Collateral Value</div>
                                        <div className="text-xl font-black text-foreground share-value">{formatIndianCurrency(totalValuation)}</div>
                                    </div>
                                    <div className="space-y-1 text-right share-row" data-share-key="appliedLtv" data-share-type="result">
                                        <div className="text-[10px] font-black text-foreground dark:text-muted-foreground uppercase tracking-widest share-label">Applied LTV</div>
                                        <div className="text-xl font-black text-yellow-600 dark:text-yellow-500 share-value">{totalValuation > 0 ? ((actualLoanAmount / totalValuation) * 100).toFixed(1) : applicableLTV}%</div>
                                    </div>
                                </div>
                                <div className="h-px bg-border/50" />
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center text-[10px] uppercase font-black share-row" data-share-key="loanAmountResult" data-share-type="result">
                                        <span className="text-foreground dark:text-muted-foreground share-label">Gross Loan:</span>
                                        <span className="text-foreground share-value">{formatIndianCurrency(actualLoanAmount)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-[10px] uppercase font-black share-row" data-share-key="totalDeductions" data-share-type="result">
                                        <span className="text-foreground dark:text-muted-foreground share-label">Total Deductions:</span>
                                        <span className="text-red-600 dark:text-red-400 share-value">-{formatIndianCurrency(totalUpfrontCharges)}</span>
                                    </div>
                                    <div className="flex justify-between items-center p-4 bg-emerald-600 dark:bg-emerald-700 rounded-2xl text-white shadow-xl shadow-emerald-600/20 share-row" data-share-key="netDisbursement" data-share-type="result">
                                        <span className="text-[10px] font-black uppercase tracking-widest share-label">Net Disbursement</span>
                                        <span className="text-xl font-black share-value">{formatIndianCurrency(netDisbursement)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-slate-900 dark:bg-slate-800 rounded-xl border border-slate-800 text-center shadow-md share-row" data-share-key="emi" data-share-type="result">
                                        <div className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 share-label">Monthly EMI</div>
                                        <div className="text-xl font-black text-white share-value">{loanType === 'EMI' ? formatIndianCurrency(emi) : 'N/A'}</div>
                                    </div>
                                    <div className="p-4 bg-slate-900 dark:bg-slate-800 rounded-xl border border-slate-800 text-center shadow-md share-row" data-share-key="totalInterest" data-share-type="result">
                                        <div className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 share-label">Total Interest</div>
                                        <div className="text-xl font-black text-white share-value">{formatIndianCurrency(totalInterest)}</div>
                                    </div>
                                </div>

                                <div className="bg-slate-900 rounded-2xl p-5 text-white shadow-xl relative overflow-hidden group border border-white/5">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 rounded-full -mr-16 -mt-16 group-hover:bg-yellow-500/20 transition-all duration-500" />
                                    <div className="space-y-1 relative z-10">
                                        <div className="text-[10px] font-black uppercase text-yellow-500 tracking-widest">Total Cost of Loan</div>
                                        <div className="text-3xl font-black text-white tracking-tighter">{formatIndianCurrency(totalInterest + totalUpfrontCharges)}</div>

                                        <div className="flex flex-col gap-1.5 pt-3 border-t border-white/10 mt-3">
                                            <div className="flex justify-between text-[10px] font-black uppercase tracking-tighter">
                                                <span className="text-white dark:text-slate-400 font-black">Interest Component:</span>
                                                <span className="text-yellow-400">{formatIndianCurrency(totalInterest)}</span>
                                            </div>
                                            <div className="flex justify-between text-[10px] font-black uppercase tracking-tighter">
                                                <span className="text-white dark:text-slate-400 font-black">Total Repayment:</span>
                                                <span className="text-white">{formatIndianCurrency(totalPayment)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {(highDeductionWarning || ltvWarning || isAmountCapped || highValueWarning) && (
                                    <div className="space-y-2">
                                        {isAmountCapped && <div className="text-[9px] p-2 bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-500 rounded border border-amber-100 dark:border-amber-900/50 flex items-center gap-2 font-bold"><Info className="w-3.5 h-3.5" /> Desired amount exceeded max LTV. Capped at {applicableLTV}%.</div>}
                                        {ltvWarning && <div className="text-[9px] p-2 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-500 rounded border border-red-100 dark:border-red-900/50 flex items-center gap-2 font-bold"><AlertCircle className="w-3.5 h-3.5" /> {ltvWarning}</div>}
                                        {highValueWarning && <div className="text-[9px] p-2 bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 rounded border border-blue-100 dark:border-blue-900/50 flex items-center gap-2 font-bold"><Info className="w-3.5 h-3.5" /> {highValueWarning}</div>}
                                    </div>
                                )}

                                <Button
                                    onClick={() => setShowSchedule(!showSchedule)}
                                    variant="ghost"
                                    className="w-full text-xs font-black gap-2 text-slate-400 hover:text-slate-900 transition-colors"
                                >
                                    {showSchedule ? 'HIDE REPAYMENT PLAN' : 'VIEW REPAYMENT PLAN'}
                                    {showSchedule ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                </Button>
                            </div>

                            {showSchedule && (
                                <div className="rounded-2xl border border-border/50 shadow-xl bg-background overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500">
                                    <table className="w-full text-left text-[10px]">
                                        <thead className="bg-muted">
                                            <tr>
                                                <th className="p-3 font-black uppercase tracking-widest text-foreground dark:text-muted-foreground">Month</th>
                                                <th className="p-3 text-right font-black uppercase tracking-widest text-foreground dark:text-muted-foreground">Principal</th>
                                                <th className="p-3 text-right font-black uppercase tracking-widest text-foreground dark:text-muted-foreground">Interest</th>
                                                <th className="p-3 text-right font-black uppercase tracking-widest text-foreground dark:text-muted-foreground">Balance</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y border-t border-border/50">
                                            {schedule.slice(0, 12).map((s) => (
                                                <tr key={s.month} className="hover:bg-accent/30 transition-colors">
                                                    <td className="p-3 font-black text-foreground">{s.month}</td>
                                                    <td className="p-3 text-right font-bold text-foreground/80">{formatIndianCurrency(s.principal)}</td>
                                                    <td className="p-3 text-right font-bold text-red-600 dark:text-red-400">{formatIndianCurrency(s.interest)}</td>
                                                    <td className="p-3 text-right font-black text-foreground bg-accent/20">{formatIndianCurrency(s.balance)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
