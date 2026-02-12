import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Button } from '../../components/ui/button';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { Coins, FileDown, RotateCcw, Plus, Trash2, AlertCircle, Info, ChevronDown, ChevronUp, ShieldCheck, Landmark, ReceiptText, Percent, IndianRupee } from 'lucide-react';
import { exportToPDF } from '../../lib/pdf-export';
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
    const schedule: { month: number, principal: number, interest: number, balance: number }[] = [];

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
                    schedule.push({ month: i, principal, interest, balance });
                }
            }
        } else if (loanType === 'Bullet') {
            totalInterest = (actualLoanAmount * (parseFloat(interestRate) || 0) * (n / 12)) / 100;
            totalPayment = actualLoanAmount + totalInterest;
            schedule.push({ month: Math.round(n), principal: actualLoanAmount, interest: totalInterest, balance: 0 });
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

        exportToPDF({
            title: `Gold Loan Assessment (${loanType} @ ${interestRate}% for ${tenureMonths}m)`,
            subtitle: `Detailed Valuation & Repayment Roadmap`,
            details: [
                { label: "Loan Type", value: loanType },
                { label: "Gold Rate (22K)", value: `${f(rate)}/g` },
                { label: "Applied LTV", value: `${applicableLTV}%` },
                { label: "--- Ornaments ---", value: "" },
                ...detailedValuation.map(o => ({
                    label: `${o.description || 'Item'} (${o.purity}K)`,
                    value: `${o.netWeight.toFixed(2)}g Net | Val: ${f(o.value)}`
                })),
                { label: "--- Summary ---", value: "" },
                { label: "Total Net Weight", value: `${totalNetWeight.toFixed(2)} grams` },
                { label: "Total Valuation", value: f(totalValuation) },
                { label: "Max Eligible Loan", value: f(maxEligibleLoan) },
                { label: "Amount in Words", value: actualLoanWords },
                { label: "--- Repayment ---", value: "" },
                { label: "Monthly EMI", value: loanType === 'EMI' ? f(emi) : 'N/A' },
                { label: "Total Interest", value: f(totalInterest) },
                { label: "Total Payable", value: f(totalPayment) },
                { label: "--- Amortization Schedule ---", value: "" },
                ...schedule.map(s => ({
                    label: `Month ${s.month}`,
                    value: `P: ${f(s.principal)} | I: ${f(s.interest)} | Bal: ${f(s.balance)}`
                }))
            ]
        }, docTitle);
    };

    return (
        <Card className="premium-card w-full max-w-5xl mx-auto overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-yellow-600/10 via-background to-background border-b border-border/10 p-4 md:px-6">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <Coins className="w-6 h-6 text-yellow-700" />
                        <div>
                            <CardTitle className="text-xl font-black text-slate-800">Advanced Gold Loan</CardTitle>
                            <CardDescription className="text-[10px] font-bold uppercase tracking-wider text-foreground opacity-70">
                                Dynamic Multi-Case Calculator • Indian Banking Standard
                            </CardDescription>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button onClick={reset} variant="outline" size="sm" className="h-9 gap-2 text-xs font-black">
                            <RotateCcw className="w-4 h-4" /> RESET
                        </Button>
                        <Button onClick={downloadPDF} size="sm" className="h-9 gap-2 text-xs font-black bg-slate-900 text-white hover:bg-slate-800">
                            <FileDown className="w-4 h-4" /> EXPORT PDF
                        </Button>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-0">
                <div className="grid grid-cols-1 xl:grid-cols-12 overflow-hidden">

                    {/* INPUT SECTION */}
                    <div className="xl:col-span-7 p-4 md:p-6 space-y-6 border-r border-border/50 h-full overflow-y-auto max-h-[850px]">

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Loan Scheme</Label>
                                <select
                                    value={loanType}
                                    onChange={(e) => setLoanType(e.target.value as LoanType)}
                                    className="w-full h-10 text-xs font-black bg-slate-50 border-2 border-slate-200 rounded-lg px-3 appearance-none cursor-pointer focus:ring-2 focus:ring-yellow-500/20 transition-all"
                                >
                                    <option value="EMI">Compound Interest (EMI)</option>
                                    <option value="Bullet">Bullet Repayment (Simple)</option>
                                    <option value="Overdraft">Overdraft Facility (Daily)</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Gold Rate (₹/gm 22K)</Label>
                                <div className="relative">
                                    <Input
                                        type="number"
                                        value={goldRate}
                                        onChange={(e) => setGoldRate(e.target.value)}
                                        className="h-10 font-black bg-slate-50 border-2 border-slate-200 focus:border-yellow-600 pl-8 text-slate-950"
                                    />
                                    <IndianRupee className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center px-1">
                                <Label className="text-xs font-black text-slate-700 uppercase tracking-wider">Collateral Details</Label>
                                <Button onClick={addOrnament} variant="ghost" size="sm" className="h-7 text-[10px] font-black text-yellow-700 hover:bg-yellow-50">
                                    <Plus className="w-3.5 h-3.5 mr-1" /> ADD ITEM
                                </Button>
                            </div>

                            <div className="space-y-4">
                                {ornaments.map((item) => (
                                    <div key={item.id} className="p-4 bg-white border-2 border-slate-100 rounded-2xl shadow-sm space-y-4 group transition-all hover:border-slate-300">
                                        <div className="flex flex-col md:flex-row gap-4">
                                            <div className="flex-1 space-y-1.5">
                                                <Label className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Item Description</Label>
                                                <Input
                                                    value={item.description}
                                                    onChange={(e) => updateOrnament(item.id, 'description', e.target.value)}
                                                    className="h-10 text-xs font-black border-slate-200 focus:border-yellow-600 bg-slate-50/50"
                                                    placeholder="Ornament Name"
                                                />
                                            </div>
                                            <div className="w-full md:w-32 space-y-1.5">
                                                <Label className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Purity</Label>
                                                <select
                                                    value={item.purity}
                                                    onChange={(e) => updateOrnament(item.id, 'purity', parseFloat(e.target.value))}
                                                    className="w-full h-10 text-xs font-black bg-yellow-50 border-2 border-yellow-200 rounded-lg px-3 focus:border-yellow-600"
                                                >
                                                    <option value="18">18K (Purity)</option>
                                                    <option value="20">20K (Purity)</option>
                                                    <option value="22">22K (Purity)</option>
                                                    <option value="24">24K (Purity)</option>
                                                </select>
                                            </div>
                                            <div className="flex items-end pb-0.5">
                                                <Button onClick={() => removeOrnament(item.id)} variant="ghost" size="icon" className="h-10 w-10 text-red-500 hover:bg-red-50 hover:text-red-700 transition-all rounded-lg">
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-end">
                                            <div className="space-y-1.5">
                                                <Label className="text-[10px] font-black text-slate-900 uppercase tracking-widest flex justify-between items-center">
                                                    Gross Wt
                                                    <span className={`cursor-pointer px-1.5 py-0.5 rounded text-[8px] border-2 ${item.isNetEntry ? 'bg-yellow-100 border-yellow-400 text-yellow-800' : 'bg-slate-100 border-slate-300 text-slate-700'}`} onClick={() => updateOrnament(item.id, 'isNetEntry', !item.isNetEntry)}>
                                                        {item.isNetEntry ? 'NET' : 'DEDUCT'}
                                                    </span>
                                                </Label>
                                                <Input type="number" value={item.grossWeight || ''} onChange={(e) => updateOrnament(item.id, 'grossWeight', parseFloat(e.target.value) || 0)} className="h-10 text-xs font-black border-slate-200" />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Deductions</Label>
                                                <Input type="number" disabled={item.isNetEntry} value={item.deductions || ''} onChange={(e) => updateOrnament(item.id, 'deductions', parseFloat(e.target.value) || 0)} className={`h-10 text-xs font-black border-slate-200 ${item.isNetEntry ? 'bg-slate-50 opacity-50' : ''}`} />
                                            </div>
                                            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center col-span-2 shadow-lg ring-1 ring-white/5">
                                                <div className="text-[9px] font-black uppercase text-slate-400 tracking-[0.2em] mb-0.5">Valuation Weight</div>
                                                <div className="text-xl font-black text-white">
                                                    {item.isNetEntry ? item.grossWeight.toFixed(2) : Math.max(0, item.grossWeight - item.deductions).toFixed(2)}<span className="text-yellow-500 ml-1 text-sm font-bold uppercase">g</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Loan Selection & Repayment Params */}
                        <div className="bg-slate-50 dark:bg-slate-900/30 p-5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-black text-slate-700 flex items-center gap-2">
                                    <Landmark className="w-4 h-4 text-emerald-600" /> DESIRED LOAN AMOUNT
                                </Label>
                                <Input
                                    type="number"
                                    placeholder={`MAX: ${formatIndianCurrency(maxEligibleLoan)}`}
                                    value={requestedLoanAmount}
                                    onChange={(e) => setRequestedLoanAmount(e.target.value)}
                                    className="h-10 font-black border-2 border-emerald-100 focus:border-emerald-500 text-emerald-700"
                                />
                                {isAmountCapped && (
                                    <p className="text-[10px] text-red-600 font-bold flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3" /> Amount capped at Maximum LTV Limit.
                                    </p>
                                )}
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <Label className="text-[10px] font-bold">ROI (% p.a)</Label>
                                    <Input type="number" value={interestRate} onChange={(e) => setInterestRate(e.target.value)} className="h-8 text-xs font-black" />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[10px] font-bold">Tenure (Months)</Label>
                                    <Input type="number" value={tenureMonths} onChange={(e) => setTenureMonths(e.target.value)} className="h-8 text-xs font-black" />
                                </div>
                            </div>
                        </div>

                        {/* Dynamic Service Charges */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-center px-1">
                                <Label className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
                                    <ReceiptText className="w-3.5 h-3.5" /> Service Charges
                                </Label>
                                <Button onClick={addCharge} variant="ghost" size="sm" className="h-7 text-[10px] font-black text-emerald-600 hover:bg-emerald-50">
                                    <Plus className="w-3.5 h-3.5 mr-1" /> ADD CHARGE
                                </Button>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                {charges.map((charge) => (
                                    <div key={charge.id} className="relative p-5 bg-white border-2 border-slate-100 rounded-2xl shadow-sm flex flex-col md:flex-row gap-4 items-center group transition-all hover:border-slate-300">
                                        <div className="flex-1 w-full space-y-1.5">
                                            <Label className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Charge Name</Label>
                                            <Input
                                                value={charge.name}
                                                onChange={(e) => updateCharge(charge.id, 'name', e.target.value)}
                                                className="h-10 text-xs font-black border-slate-200 bg-slate-50/50"
                                            />
                                        </div>
                                        <div className="w-full md:w-36 space-y-1.5">
                                            <Label className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Type</Label>
                                            <div className="flex bg-slate-100 border-2 border-slate-200 rounded-xl p-1 h-10">
                                                <button
                                                    onClick={() => updateCharge(charge.id, 'type', 'percentage')}
                                                    className={`flex-1 flex items-center justify-center rounded-lg transition-all ${charge.type === 'percentage' ? 'bg-white shadow-md text-emerald-700 font-black' : 'text-slate-500 hover:text-slate-700'}`}
                                                >
                                                    <Percent className="w-4 h-4 mr-1" /> <span className="text-[10px] uppercase">LTV%</span>
                                                </button>
                                                <button
                                                    onClick={() => updateCharge(charge.id, 'type', 'fixed')}
                                                    className={`flex-1 flex items-center justify-center rounded-lg transition-all ${charge.type === 'fixed' ? 'bg-white shadow-md text-emerald-700 font-black' : 'text-slate-500 hover:text-slate-700'}`}
                                                >
                                                    <IndianRupee className="w-4 h-4 mr-1" /> <span className="text-[10px] uppercase">Flat</span>
                                                </button>
                                            </div>
                                        </div>
                                        <div className="w-full md:w-32 space-y-1.5">
                                            <Label className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{charge.type === 'percentage' ? 'Value (%)' : 'Amount (₹)'}</Label>
                                            <Input
                                                type="number"
                                                value={charge.value || ''}
                                                onChange={(e) => updateCharge(charge.id, 'value', parseFloat(e.target.value) || 0)}
                                                className="h-10 text-xs font-black text-right border-slate-200"
                                            />
                                        </div>
                                        <div className="flex items-end pb-0.5">
                                            <Button onClick={() => removeCharge(charge.id)} variant="ghost" size="icon" className="h-10 w-10 text-red-500 hover:bg-red-50 hover:text-red-700 transition-all rounded-lg">
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Assessment Parameters */}
                        <div className="border-2 border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm transition-all hover:border-slate-300">
                            <button onClick={() => setShowParams(!showParams)} className="w-full flex justify-between items-center p-4 text-[10px] font-black uppercase text-slate-900 bg-slate-50 hover:bg-slate-100 transition-colors">
                                <span className="flex items-center gap-2 tracking-widest"><ShieldCheck className="w-4 h-4 text-emerald-600" /> Assessment Parameters (Internal)</span>
                                {showParams ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                            {showParams && (
                                <div className="p-5 grid grid-cols-2 gap-5 border-t-2 border-slate-100 animate-in slide-in-from-top-2">
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] font-black text-slate-900 uppercase tracking-widest">CIBIL Score</Label>
                                        <Input type="number" value={cibilScore} onChange={(e) => setCibilScore(e.target.value)} className="h-10 text-xs font-black border-slate-200" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] font-black text-slate-900 uppercase tracking-widest">LTV Override (%)</Label>
                                        <Input type="number" value={customLTV} placeholder="System Auto" onChange={(e) => setCustomLTV(e.target.value)} className="h-10 text-xs font-black border-slate-200 placeholder:text-slate-400" />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* RESULTS SECTION */}
                    <div className="xl:col-span-5 bg-yellow-50/20 dark:bg-yellow-950/5 flex flex-col h-full border-l border-border/10">
                        <div className="p-6 space-y-6 flex-1 overflow-y-auto">

                            <div className="bg-slate-950 rounded-2xl p-6 mb-6 shadow-2xl relative overflow-hidden border border-slate-800">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/5 rounded-full -mr-16 -mt-16" />
                                <div className="relative z-10 space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-yellow-500 tracking-[0.2em]">Sanctioned Loan Amount</Label>
                                    <div className="text-4xl font-black text-white tracking-tighter">
                                        {formatIndianCurrency(actualLoanAmount)}
                                    </div>
                                    <div className="text-[10px] font-bold text-slate-400 italic">{actualLoanWords}</div>
                                    <div className="flex gap-2 text-[10px] mt-2">
                                        <span className="bg-yellow-500 text-slate-950 px-2 py-0.5 rounded shadow-sm font-black uppercase">Net Wt: {totalNetWeight.toFixed(2)}g</span>
                                        {detailedValuation.length > 0 && <span className="bg-white/10 text-white px-2 py-0.5 rounded shadow-sm font-black uppercase ring-1 ring-white/20">Items: {detailedValuation.length}</span>}
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white border-2 border-slate-200 p-5 rounded-2xl shadow-sm space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <div className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Collateral Value</div>
                                        <div className="text-xl font-black text-slate-950">{formatIndianCurrency(totalValuation)}</div>
                                    </div>
                                    <div className="space-y-1 text-right">
                                        <div className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Applied LTV</div>
                                        <div className="text-xl font-black text-yellow-700">{totalValuation > 0 ? ((actualLoanAmount / totalValuation) * 100).toFixed(1) : applicableLTV}%</div>
                                    </div>
                                </div>
                                <div className="h-[2px] bg-slate-200" />
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="font-black text-slate-900">Gross Loan:</span>
                                        <span className="font-black text-slate-950 text-sm">{formatIndianCurrency(actualLoanAmount)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="font-bold text-slate-900">Total Deductions:</span>
                                        <span className="font-black text-red-700">-{formatIndianCurrency(totalUpfrontCharges)}</span>
                                    </div>
                                    <div className="flex justify-between items-center p-4 bg-emerald-600 rounded-xl text-white shadow-xl shadow-emerald-600/30">
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Net Disbursement</span>
                                        <span className="text-xl font-black">{formatIndianCurrency(netDisbursement)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-slate-900 dark:bg-slate-800 rounded-xl border border-slate-800 text-center shadow-md">
                                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Monthly EMI</div>
                                        <div className="text-xl font-black text-white">{loanType === 'EMI' ? formatIndianCurrency(emi) : 'N/A'}</div>
                                    </div>
                                    <div className="p-4 bg-slate-900 dark:bg-slate-800 rounded-xl border border-slate-800 text-center shadow-md">
                                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Interest</div>
                                        <div className="text-xl font-black text-white">{formatIndianCurrency(totalInterest)}</div>
                                    </div>
                                </div>

                                <div className="bg-slate-900 rounded-2xl p-5 text-white shadow-xl relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 rounded-full -mr-16 -mt-16 group-hover:bg-yellow-500/20 transition-all duration-500" />
                                    <div className="space-y-1 relative z-10">
                                        <div className="text-[10px] font-black uppercase text-yellow-500 tracking-widest">Total Cost of Loan</div>
                                        <div className="text-3xl font-black text-white">{formatIndianCurrency(totalInterest + totalUpfrontCharges)}</div>

                                        <div className="flex flex-col gap-1.5 pt-2 border-t border-white/10 mt-2">
                                            <div className="flex justify-between text-[10px] font-bold">
                                                <span className="opacity-60 uppercase">Interest Only:</span>
                                                <span className="text-yellow-400 font-black">{formatIndianCurrency(totalInterest)} paid for interest only</span>
                                            </div>
                                            <div className="flex justify-between text-[10px] font-bold">
                                                <span className="opacity-60 uppercase">Total Repayment:</span>
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
                                <div className="rounded-2xl border-2 border-slate-300 shadow-xl bg-white overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500">
                                    <table className="w-full text-left text-[11px]">
                                        <thead className="bg-slate-950 px-4">
                                            <tr>
                                                <th className="p-4 font-black text-white uppercase tracking-widest">Month</th>
                                                <th className="p-4 text-right font-black text-white uppercase tracking-widest">Principal</th>
                                                <th className="p-4 text-right font-black text-white uppercase tracking-widest">Interest</th>
                                                <th className="p-4 text-right font-black text-white uppercase tracking-widest">Balance</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y-2 divide-slate-100">
                                            {schedule.slice(0, 12).map((s) => (
                                                <tr key={s.month} className="hover:bg-slate-50 transition-colors">
                                                    <td className="p-4 font-black text-slate-900 border-r-2 border-slate-50">{s.month}</td>
                                                    <td className="p-4 text-right font-bold text-slate-800">{formatIndianCurrency(s.principal)}</td>
                                                    <td className="p-4 text-right font-bold text-red-600">{formatIndianCurrency(s.interest)}</td>
                                                    <td className="p-4 text-right font-black text-slate-950 bg-slate-50/50">{formatIndianCurrency(s.balance)}</td>
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
