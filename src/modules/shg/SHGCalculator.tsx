import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Button } from '../../components/ui/button';
import {
    Users,
    Plus,
    Trash2,
    FileDown,
    MessageCircle,
    AlertCircle,
    CheckCircle2,
    ChevronDown,
    ChevronUp,
    Settings2,
    RotateCcw,
    TableProperties,
    Copy,
    PlayCircle
} from 'lucide-react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { cn } from '../../lib/utils';
import {
    calculateSlabRate,
    calculateOutstandingAtDate,
    generateSHGAmortization,
    type InterestSlab,
    type SHGLoan,
    type SHGMember
} from '../../core/shgEngine';
import { formatCurrency } from '../../core/utils';
import { exportSHGReportToPDF } from '../../lib/pdf/export';
import { buildWhatsappMessage, type ShareField } from '../../lib/whatsapp-share';

// Default Slabs
const DEFAULT_SLABS: InterestSlab[] = [
    { limit: 300000, rate: 7 },
    { limit: 500000, rate: 8.85 },
    { limit: 10000000, rate: 11 }
];

export const SHGCalculator: React.FC = () => {
    // --- State Management ---
    const [groupName, setGroupName] = useLocalStorage<string>('shg_group_name', 'Uday SHG Group');
    const [sanctionedAmount, setSanctionedAmount] = useLocalStorage<string>('shg_sanction_amount', '500000');
    const [groupStartDate, setGroupStartDate] = useLocalStorage<string>('shg_start_date', new Date().toISOString().split('T')[0]);
    const [groupTenure, setGroupTenure] = useLocalStorage<string>('shg_tenure', '24');
    const [reviewDate, setReviewDate] = useState(new Date().toISOString().split('T')[0]);

    const [slabs, setSlabs] = useLocalStorage<InterestSlab[]>('shg_slabs', DEFAULT_SLABS);
    const [manualRate, setManualRate] = useLocalStorage<string>('shg_manual_rate', '');
    const [showSlabConfig, setShowSlabConfig] = useState(false);

    const [members, setMembers] = useLocalStorage<SHGMember[]>('shg_members', []);
    const [expandMember, setExpandMember] = useState<string | null>(null);
    const [isExporting, setIsExporting] = useState(false);
    const [showAmortization, setShowAmortization] = useState(false);
    const [isCalculated, setIsCalculated] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<any>(null);

    // --- Helpers ---
    const addMember = () => {
        const newMember: SHGMember = {
            id: crypto.randomUUID(),
            name: '',
            loans: []
        };
        setMembers([...members, newMember]);
        setExpandMember(newMember.id);
    };

    const removeMember = (id: string) => {
        setMembers(members.filter(m => m.id !== id));
    };

    const updateMemberName = (id: string, name: string) => {
        setMembers(members.map(m => m.id === id ? { ...m, name } : m));
    };

    const addLoan = (memberId: string) => {
        const newLoan: SHGLoan = {
            id: crypto.randomUUID(),
            amount: 0,
            startDate: reviewDate,
            tenure: 24,
            rate: calculateSlabRate(parseFloat(sanctionedAmount), slabs, manualRate ? parseFloat(manualRate) : undefined),
            missedEMIs: 0,
            partialPayments: 0
        };
        setMembers(members.map(m => m.id === memberId ? { ...m, loans: [...m.loans, newLoan] } : m));
    };

    const removeLoan = (memberId: string, loanId: string) => {
        setMembers(members.map(m => m.id === memberId ? { ...m, loans: m.loans.filter(l => l.id !== loanId) } : m));
    };

    const updateLoan = (memberId: string, loanId: string, updates: Partial<SHGLoan>) => {
        setMembers(members.map(m => m.id === memberId ? {
            ...m,
            loans: m.loans.map(l => l.id === loanId ? { ...l, ...updates } : l)
        } : m));
    };

    const resetAll = () => {
        if (confirm("Reset everything? All member data will be wiped.")) {
            setMembers([]);
            setGroupName('Uday SHG Group');
            setSanctionedAmount('500000');
            setSlabs(DEFAULT_SLABS);
            setManualRate('');
            setIsCalculated(false);
            setAnalysisResult(null);
            localStorage.removeItem('shg_members');
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert("Copied to clipboard!");
    };

    const downloadPDF = async () => {
        if (isExporting) return;
        setIsExporting(true);
        try {
            await exportSHGReportToPDF({
                title: "SHG Loan Assessment Report",
                groupName,
                sanctionedAmount: parseFloat(sanctionedAmount) || 0,
                groupRate: analysisResult?.groupRate || 0,
                groupEMI: analysisResult?.groupEMIDue || 0,
                groupStartDate,
                groupTenure: parseInt(groupTenure) || 0,
                reviewDate,
                groupOutstanding: analysisResult?.groupOutstanding || 0,
                monthsElapsed: analysisResult?.monthsElapsed || 0,
                monthsRemaining: analysisResult?.monthsRemaining || 0,
                totalInterest: analysisResult?.totalInterest || 0,
                totalPaid: analysisResult?.totalPaid || 0,
                isBalanced: analysisResult?.isBalanced || false,
                difference: analysisResult?.difference || 0,
                slabs: slabs,
                appliedSlabIndex: analysisResult?.appliedSlabIndex ?? 0,
                showAmortization: showAmortization,
                details: [
                    { label: "Group Name", value: groupName },
                ],
                members: (analysisResult?.memberBreakdown || []).map((m: any) => ({
                    name: m.name,
                    totalOutstanding: m.totalOutstanding,
                    loans: m.loans.map((l: any) => ({
                        amount: l.amount,
                        rate: l.rate,
                        startDate: l.startDate,
                        tenure: l.tenure || parseInt(groupTenure) || 18,
                        outstanding: l.outstanding
                    }))
                }))
            }, `${groupName.replace(/\s+/g, '_')}_SHG_Report.pdf`);
        } finally {
            setIsExporting(false);
        }
    };

    const handleShare = () => {
        const fields: ShareField[] = [
            { key: 'groupName', label: 'SHG Group', value: groupName, type: 'input' },
            { key: 'groupRate', label: 'Interest Rate', value: `${analysisResult?.groupRate || 0}%`, type: 'result' },
            { key: 'groupEMI', label: 'Group EMI', value: formatCurrency(analysisResult?.groupEMIDue || 0), type: 'result' },
            { key: 'totalDisbursed', label: 'Disbursed', value: formatCurrency(analysisResult?.totalDisbursed || 0), type: 'result' },
            { key: 'totalMemberOutstanding', label: 'Total Outstanding', value: formatCurrency(analysisResult?.totalMemberOutstanding || 0), type: 'result' },
            { key: 'balanceStatus', label: 'Status', value: analysisResult?.isBalanced ? 'BALANCED' : 'MISMATCH', type: 'result' }
        ];

        // Add member breakdown to message manually or via buildWhatsappMessage
        const baseMessage = buildWhatsappMessage('shg', fields);
        let memberList = "\n👥 MEMBER BREAKDOWN:\n";
        (analysisResult?.memberBreakdown || []).forEach((m: any) => {
            memberList += `• ${m.name || 'Unnamed'}: ${formatCurrency(m.totalOutstanding)}\n`;
        });

        const finalMessage = baseMessage + memberList;
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(finalMessage)}`, '_blank');
    };

    const performCalculation = () => {
        const P = parseFloat(sanctionedAmount) || 0;
        const R = calculateSlabRate(P, slabs, manualRate ? parseFloat(manualRate) : undefined);
        const N = parseInt(groupTenure) || 1;

        const masterOut = calculateOutstandingAtDate(P, R, N, groupStartDate, reviewDate);

        // Determine which slab was applied
        const sortedSlabs = [...slabs].sort((a, b) => a.limit - b.limit);
        let appliedSlabIndex = sortedSlabs.length - 1;
        for (let i = 0; i < sortedSlabs.length; i++) {
            if (P <= sortedSlabs[i].limit) { appliedSlabIndex = i; break; }
        }

        // Member-wise aggregation
        let totalDisbursed = 0;
        let totalMemberOutstanding = 0;
        const memberBreakdown = members.map(m => {
            let memberOut = 0;
            const loans = m.loans.map(l => {
                const outData = calculateOutstandingAtDate(l.amount, l.rate, l.tenure, l.startDate, reviewDate, l.missedEMIs, l.partialPayments);
                memberOut += outData.outstanding;
                totalDisbursed += (l.amount || 0);
                return { ...l, outstanding: outData.outstanding, emiDue: outData.emiDue };
            });
            totalMemberOutstanding += memberOut;
            return { ...m, totalOutstanding: memberOut, loans };
        });

        const diff = Math.abs(masterOut.outstanding - totalMemberOutstanding);
        const isBalanced = diff < 0.01;

        setAnalysisResult({
            groupRate: R,
            groupOutstanding: masterOut.outstanding,
            groupEMIDue: masterOut.emiDue,
            monthsElapsed: masterOut.monthsElapsed,
            monthsRemaining: masterOut.monthsRemaining,
            totalInterest: masterOut.totalInterest,
            totalPaid: masterOut.totalPaid,
            appliedSlabIndex,
            totalDisbursed,
            totalMemberOutstanding,
            isBalanced,
            difference: diff,
            memberBreakdown
        });
        setIsCalculated(true);
    };

    const currentSlabRate = useMemo(() => {
        return calculateSlabRate(parseFloat(sanctionedAmount) || 0, slabs, manualRate ? parseFloat(manualRate) : undefined);
    }, [sanctionedAmount, slabs, manualRate]);

    // --- Rendering ---
    return (
        <div className="space-y-6 pb-20">
            {/* Header & Controls */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-slate-800 dark:text-white">SHG Management</h1>
                    <p className="text-sm text-slate-500 font-medium">Cash Credit & Member Loan Monitoring</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        onClick={performCalculation}
                        className="gap-3 bg-blue-600 hover:bg-blue-700 text-white font-black px-10 py-8 text-xl rounded-2xl shadow-2xl shadow-blue-500/40 hover:scale-110 transition-all animate-pulse"
                    >
                        <PlayCircle className="w-6 h-6 shrink-0" />
                        RUN CALCULATION
                    </Button>
                    <Button onClick={resetAll} variant="ghost" className="text-red-600 hover:bg-red-50 gap-2 font-bold px-3">
                        <RotateCcw className="w-4 h-4" /> Reset
                    </Button>
                    <Button onClick={downloadPDF} disabled={isExporting || !isCalculated} variant="outline" className="gap-2 border-primary/20 hover:bg-primary/5 font-bold">
                        {isExporting ? <span className="animate-spin mr-2">⏳</span> : <FileDown className="w-4 h-4" />} PDF
                    </Button>
                    <Button onClick={handleShare} disabled={!isCalculated} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200 font-bold">
                        <MessageCircle className="w-4 h-4" /> Share
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Column: Group Config */}
                <div className="lg:col-span-4 space-y-6">
                    <Card className="premium-card overflow-hidden bg-card border-border">
                        <CardHeader className="bg-primary text-primary-foreground p-4">
                            <div className="flex items-center gap-2">
                                <Users className="w-5 h-5 opacity-80" />
                                <CardTitle className="text-lg font-bold">Group Details</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4 space-y-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Group Name</Label>
                                <Input value={groupName} onChange={e => { setGroupName(e.target.value); setIsCalculated(false); }} className="font-bold border-border bg-background" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Sanctioned Amount (₹)</Label>
                                <Input type="number" value={sanctionedAmount} onChange={e => { setSanctionedAmount(e.target.value); setIsCalculated(false); }} className="font-black text-lg text-primary bg-background border-border" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Start Date</Label>
                                    <Input type="date" value={groupStartDate} onChange={e => { setGroupStartDate(e.target.value); setIsCalculated(false); }} className="text-xs font-bold bg-background border-border" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Tenure (Mo)</Label>
                                    <Input type="number" value={groupTenure} onChange={e => { setGroupTenure(e.target.value); setIsCalculated(false); }} className="text-xs font-bold bg-background border-border" />
                                </div>
                            </div>
                            <div className="space-y-2 pt-2 border-t border-border">
                                <Label className="text-[10px] uppercase font-black tracking-widest text-emerald-600">Review Date (Today)</Label>
                                <Input type="date" value={reviewDate} onChange={e => { setReviewDate(e.target.value); setIsCalculated(false); }} className="text-xs font-black bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="premium-card bg-card border-border">
                        <CardHeader className="flex flex-row items-center justify-between p-4 space-y-0 text-foreground">
                            <div className="flex items-center gap-2">
                                <Settings2 className="w-5 h-5 opacity-70" />
                                <CardTitle className="text-lg font-bold">Interest Slabs</CardTitle>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => setShowSlabConfig(!showSlabConfig)}>
                                {showSlabConfig ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </Button>
                        </CardHeader>
                        {showSlabConfig && (
                            <CardContent className="p-4 space-y-3">
                                {slabs.map((slab, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                        <div className="flex-1">
                                            <Label className="text-[9px] uppercase font-bold text-muted-foreground">Up to Amount</Label>
                                            <Input
                                                type="number"
                                                value={slab.limit}
                                                onChange={e => {
                                                    const newSlabs = [...slabs];
                                                    newSlabs[i].limit = parseFloat(e.target.value);
                                                    setSlabs(newSlabs);
                                                    setIsCalculated(false);
                                                }}
                                                className="h-8 text-xs font-bold bg-background border-border"
                                            />
                                        </div>
                                        <div className="w-20">
                                            <Label className="text-[9px] uppercase font-bold text-muted-foreground">Rate %</Label>
                                            <Input
                                                type="number"
                                                value={slab.rate}
                                                onChange={e => {
                                                    const newSlabs = [...slabs];
                                                    newSlabs[i].rate = parseFloat(e.target.value);
                                                    setSlabs(newSlabs);
                                                    setIsCalculated(false);
                                                }}
                                                className="h-8 text-xs font-bold bg-background border-border"
                                            />
                                        </div>
                                    </div>
                                ))}
                                <div className="pt-2 border-t mt-2 border-border">
                                    <Label className="text-[9px] uppercase font-black text-muted-foreground">Manual Override Rate (%)</Label>
                                    <Input
                                        type="number"
                                        placeholder="Auto from slabs"
                                        value={manualRate}
                                        onChange={e => { setManualRate(e.target.value); setIsCalculated(false); }}
                                        className="h-9 text-xs font-black bg-amber-50/30 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800"
                                    />
                                </div>
                            </CardContent>
                        )}
                        {!showSlabConfig && (
                            <div className="px-4 pb-4">
                                <div className="bg-muted p-3 rounded-xl border border-border">
                                    <div className="flex justify-between items-center text-xs font-bold">
                                        <span className="text-muted-foreground">Applied Group Rate</span>
                                        <span className="text-primary">{currentSlabRate}%</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </Card>
                </div>

                {/* Middle Column: Member Management */}
                <div className="lg:col-span-8 space-y-6">
                    {/* Summary Bar */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="bg-card p-4 rounded-2xl border border-border shadow-sm flex flex-col items-center justify-center text-center">
                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1">Group Outstanding</span>
                            <span className="text-xl font-black text-foreground">
                                {isCalculated ? formatCurrency(analysisResult.groupOutstanding) : "₹ --"}
                            </span>
                        </div>
                        <div className="bg-card p-4 rounded-2xl border border-border shadow-sm flex flex-col items-center justify-center text-center">
                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1">Total Disbursed</span>
                            <span className="text-xl font-black text-primary">
                                {isCalculated ? formatCurrency(analysisResult.totalDisbursed) : "₹ --"}
                            </span>
                        </div>
                        <div className={cn(
                            "p-4 rounded-2xl border shadow-sm flex flex-col items-center justify-center text-center transition-colors cursor-pointer",
                            !isCalculated
                                ? "bg-muted border-border text-muted-foreground opacity-70"
                                : analysisResult.isBalanced
                                    ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-400"
                                    : "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-800 dark:text-red-400"
                        )} onClick={() => isCalculated && copyToClipboard(`Group: ${groupName}, Outstanding: ${formatCurrency(analysisResult.groupOutstanding)}, Member Total: ${formatCurrency(analysisResult.totalMemberOutstanding)}, Match: ${analysisResult.isBalanced}`)}>
                            <div className="flex items-center gap-2 mb-1">
                                {isCalculated ? (
                                    analysisResult.isBalanced ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />
                                ) : (
                                    <RotateCcw className="w-3 h-3 opacity-50" />
                                )}
                                <span className="text-[9px] font-black uppercase tracking-[0.2em]">Balance Status</span>
                            </div>
                            <span className="text-xl font-black">
                                {!isCalculated ? "NEUTRAL" : (analysisResult.isBalanced ? "BALANCED" : "MISMATCH")}
                            </span>
                            <div className="flex flex-col items-center gap-1 mt-2">
                                {!isCalculated ? (
                                    <Button
                                        size="sm"
                                        onClick={performCalculation}
                                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-7 px-4 rounded-lg text-[10px] shadow-lg animate-bounce"
                                    >
                                        Run Calculation Now
                                    </Button>
                                ) : (
                                    <div className="flex items-center gap-1">
                                        <span className="text-[8px] font-bold opacity-70">
                                            {`DIFF: ${formatCurrency(analysisResult.difference)}`}
                                        </span>
                                        <Copy className="w-2 h-2 opacity-50" />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Amortization Toggle */}
                    <div className="bg-slate-100/50 p-1 rounded-2xl inline-flex items-center">
                        <Button
                            variant={showAmortization ? "default" : "ghost"}
                            size="sm"
                            className="rounded-xl px-4 font-bold text-[10px] gap-2"
                            onClick={() => setShowAmortization(!showAmortization)}
                        >
                            <TableProperties className="w-3.5 h-3.5" />
                            {showAmortization ? "Hide Amortization" : "View Amortization Tables"}
                        </Button>
                    </div>

                    {showAmortization && isCalculated && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                            <Card className="border border-border bg-card shadow-sm overflow-hidden">
                                <CardHeader className="bg-muted py-3">
                                    <CardTitle className="text-sm font-black text-foreground uppercase tracking-widest">Group Amortization Schedule</CardTitle>
                                </CardHeader>
                                <CardContent className="p-0 overflow-x-auto">
                                    <table className="w-full text-[10px] border-collapse">
                                        <thead>
                                            <tr className="bg-muted/50 text-muted-foreground uppercase tracking-wider">
                                                <th className="p-2 text-left">Mo</th>
                                                <th className="p-2 text-left">Date</th>
                                                <th className="p-2 text-right">EMI</th>
                                                <th className="p-2 text-right">Principal</th>
                                                <th className="p-2 text-right">Interest</th>
                                                <th className="p-2 text-right">Balance</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {generateSHGAmortization(parseFloat(sanctionedAmount), analysisResult.groupRate, parseInt(groupTenure), groupStartDate).map((row: any) => (
                                                <tr key={row.month} className="border-t border-border hover:bg-muted/30">
                                                    <td className="p-2 font-bold">{row.month}</td>
                                                    <td className="p-2 text-muted-foreground">{row.dueDate}</td>
                                                    <td className="p-2 text-right font-medium">{formatCurrency(row.emi)}</td>
                                                    <td className="p-2 text-right">{formatCurrency(row.principal)}</td>
                                                    <td className="p-2 text-right text-red-500/70">{formatCurrency(row.interest)}</td>
                                                    <td className="p-2 text-right font-black text-primary">{formatCurrency(row.balance)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Members Section */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                                <Users className="w-5 h-5 text-primary" /> Members & Loans
                            </h3>
                            <Button onClick={addMember} size="sm" className="gap-2 rounded-xl h-9">
                                <Plus className="w-4 h-4" /> Add Member
                            </Button>
                        </div>

                        {members.length === 0 ? (
                            <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center">
                                <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                <p className="text-slate-500 font-bold">No members added yet.</p>
                                <p className="text-xs text-slate-400">Click the button above to start tracking member loans.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {(isCalculated ? analysisResult.memberBreakdown : members).map((member: any) => (
                                    <Card key={member.id} className={cn(
                                        "premium-card transition-all duration-300 bg-card border-border",
                                        expandMember === member.id ? "ring-2 ring-primary/20" : ""
                                    )}>
                                        <div
                                            className="p-4 flex items-center justify-between cursor-pointer"
                                            onClick={() => setExpandMember(expandMember === member.id ? null : member.id)}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground font-black">
                                                    {member.name ? member.name.charAt(0).toUpperCase() : '?'}
                                                </div>
                                                <div>
                                                    <div className="font-black text-foreground">{member.name || "Unnamed Member"}</div>
                                                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{member.loans.length} Loans Active</div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-6">
                                                <div className="text-right">
                                                    <div className="text-xs font-black text-foreground">
                                                        {isCalculated ? formatCurrency(member.totalOutstanding) : "₹ --"}
                                                    </div>
                                                    <div className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">Total Out</div>
                                                </div>
                                                <Button variant="ghost" size="icon" className="text-muted-foreground">
                                                    {expandMember === member.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                                </Button>
                                            </div>
                                        </div>

                                        {expandMember === member.id && (
                                            <div className="border-t border-border p-4 space-y-4 bg-muted/20">
                                                <div className="flex gap-4 items-end">
                                                    <div className="flex-1 space-y-1">
                                                        <Label className="text-[9px] uppercase font-black text-muted-foreground">Full Name</Label>
                                                        <Input
                                                            value={member.name}
                                                            onChange={e => { updateMemberName(member.id, e.target.value); setIsCalculated(false); }}
                                                            placeholder="Enter member name"
                                                            className="h-10 font-bold bg-background border-border"
                                                        />
                                                    </div>
                                                    <Button variant="destructive" size="sm" onClick={() => removeMember(member.id)} className="rounded-xl h-10 gap-2">
                                                        <Trash2 className="w-3.5 h-3.5" /> Remove
                                                    </Button>
                                                </div>

                                                <div className="space-y-3">
                                                    <div className="flex justify-between items-center px-1">
                                                        <span className="text-[10px] font-black uppercase text-muted-foreground">Individual Loans</span>
                                                        <Button onClick={() => addLoan(member.id)} variant="ghost" size="sm" className="h-7 text-[10px] font-bold text-primary gap-1">
                                                            <Plus className="w-3 h-3" /> Add Loan
                                                        </Button>
                                                    </div>

                                                    {member.loans.length === 0 ? (
                                                        <div className="text-[10px] text-center p-4 border rounded-xl border-dashed border-border opacity-50 font-bold italic">No loans recorded for this member.</div>
                                                    ) : (
                                                        member.loans.map((loan: any) => (
                                                            <div key={loan.id} className="bg-background p-3 rounded-2xl border border-border shadow-sm relative group/loan">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 opacity-0 group-hover/loan:opacity-100 transition-opacity"
                                                                    onClick={() => removeLoan(member.id, loan.id)}
                                                                >
                                                                    <Trash2 className="w-3 h-3" />
                                                                </Button>

                                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                                                    <div className="space-y-1">
                                                                        <Label className="text-[8px] font-black uppercase text-muted-foreground">Loan Amt</Label>
                                                                        <Input
                                                                            type="number"
                                                                            value={loan.amount}
                                                                            onChange={e => { updateLoan(member.id, loan.id, { amount: parseFloat(e.target.value) || 0 }); setIsCalculated(false); }}
                                                                            className="h-8 text-xs font-bold bg-background border-border"
                                                                        />
                                                                    </div>
                                                                    <div className="space-y-1">
                                                                        <Label className="text-[8px] font-black uppercase text-muted-foreground">Start Date</Label>
                                                                        <Input
                                                                            type="date"
                                                                            value={loan.startDate}
                                                                            onChange={e => { updateLoan(member.id, loan.id, { startDate: e.target.value }); setIsCalculated(false); }}
                                                                            className="h-8 text-xs font-bold bg-background border-border"
                                                                        />
                                                                    </div>
                                                                    <div className="space-y-1">
                                                                        <Label className="text-[8px] font-black uppercase text-muted-foreground">ROI (%)</Label>
                                                                        <Input
                                                                            type="number"
                                                                            value={loan.rate}
                                                                            onChange={e => { updateLoan(member.id, loan.id, { rate: parseFloat(e.target.value) || 0 }); setIsCalculated(false); }}
                                                                            className="h-8 text-xs font-black text-primary bg-background border-border"
                                                                        />
                                                                    </div>
                                                                    <div className="space-y-1">
                                                                        <Label className="text-[8px] font-black uppercase text-muted-foreground">Tenure (Mo)</Label>
                                                                        <Input
                                                                            type="number"
                                                                            value={loan.tenure}
                                                                            onChange={e => { updateLoan(member.id, loan.id, { tenure: parseInt(e.target.value) || 0 }); setIsCalculated(false); }}
                                                                            className="h-8 text-xs font-bold bg-background border-border"
                                                                        />
                                                                    </div>
                                                                </div>

                                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3 pt-3 border-t border-border">
                                                                    <div className="space-y-1">
                                                                        <Label className="text-[8px] font-bold uppercase text-red-500">Missed EMIs</Label>
                                                                        <Input
                                                                            type="number"
                                                                            value={loan.missedEMIs}
                                                                            onChange={e => { updateLoan(member.id, loan.id, { missedEMIs: parseInt(e.target.value) || 0 }); setIsCalculated(false); }}
                                                                            className="h-8 text-xs font-bold bg-background border-border"
                                                                        />
                                                                    </div>
                                                                    <div className="space-y-1">
                                                                        <Label className="text-[8px] font-bold uppercase text-emerald-600">Partial Repay</Label>
                                                                        <Input
                                                                            type="number"
                                                                            value={loan.partialPayments}
                                                                            onChange={e => { updateLoan(member.id, loan.id, { partialPayments: parseFloat(e.target.value) || 0 }); setIsCalculated(false); }}
                                                                            className="h-8 text-xs font-bold bg-background border-border"
                                                                        />
                                                                    </div>
                                                                    <div className="flex flex-col justify-end items-end pb-1 pr-1">
                                                                        <span className="text-[9px] font-black text-muted-foreground uppercase leading-none mb-1">Loan Outstanding</span>
                                                                        <span className="text-sm font-black text-foreground leading-none">{isCalculated ? formatCurrency(loan.outstanding || 0) : "₹ --"}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
