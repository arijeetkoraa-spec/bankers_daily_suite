import React from 'react';
import { X, Calendar, ArrowUpRight, TrendingDown, ArrowLeft, MessageCircle, FileDown } from 'lucide-react';
import { Button } from './ui/button';
import type { AmortizationEntry } from '../lib/amortization';
import { cn, formatPdfCurrency } from '../lib/utils';
import { exportAmortizationToPDF } from '../lib/pdf-export';

interface AmortizationModalProps {
    isOpen: boolean;
    onClose: () => void;
    schedule: AmortizationEntry[];
    principal: number;
    totalInterest: number;
    accentColor: string; // Tailored color like 'blue-600', 'indigo-600' etc.
}

export const AmortizationModal: React.FC<AmortizationModalProps> = ({
    isOpen,
    onClose,
    schedule,
    principal,
    totalInterest,
    accentColor
}) => {
    if (!isOpen) return null;

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(val);
    };

    const handleShare = () => {
        const text = `Loan Amortization Summary:\nPrincipal: ${formatCurrency(principal)}\nTotal Interest: ${formatCurrency(totalInterest)}\nTotal Payable: ${formatCurrency(principal + totalInterest)}\nTenure: ${schedule.length} Months`;
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
    };

    const handleDownloadPDF = () => {
        const f = formatPdfCurrency;

        exportAmortizationToPDF({
            title: "Amortization Schedule",
            subtitle: "Monthly Debt Liquidation Roadmap",
            details: [
                { label: "Principal", value: f(principal) },
                { label: "Total Interest", value: f(totalInterest) },
                { label: "Tenure", value: `${schedule.length} Months` },
                { label: "Total Liability", value: f(principal + totalInterest) }
            ],
            schedule: schedule
        }, `Schedule_${principal}_${schedule.length}.pdf`);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-start justify-center p-2 md:p-8 overflow-y-auto lg:overflow-hidden">
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={onClose}
            />

            <div className={cn(
                "relative bg-background border-2 w-full max-w-4xl md:h-fit md:max-h-[90vh] rounded-2xl md:rounded-[2.5rem] overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.4)] animate-in zoom-in-95 duration-300 flex flex-col z-10 mx-auto my-auto",
                `border-${accentColor}/30`
            )}>
                {/* Header */}
                <div
                    className={cn("p-6 border-b border-border/10 flex justify-between items-center shrink-0 relative overflow-hidden",
                        `bg-${accentColor}/5`
                    )}
                >
                    <div className={cn("absolute inset-0 opacity-10 bg-gradient-to-r from-transparent via-background to-transparent pointer-events-none", `bg-${accentColor}/20`)} />
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-accent -ml-2">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <div className="flex items-center gap-3">
                            <div className={cn("p-2 rounded-xl bg-background shadow-sm border border-border/10")}>
                                <Calendar className={cn("w-6 h-6", `text-${accentColor}`)} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black tracking-tight">Amortization Schedule</h3>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-60">Monthly Debt Liquidation Roadmap</p>
                            </div>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-accent">
                        <X className="w-5 h-5" />
                    </Button>
                </div>

                {/* Summary bar */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 md:px-8 border-b border-border/10 bg-muted/30 shrink-0">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 flex-1 w-full md:w-auto">
                        <div className="space-y-0.5">
                            <span className="text-[9px] font-black uppercase text-muted-foreground">Principal</span>
                            <p className="text-sm font-black tracking-tighter">{formatCurrency(principal)}</p>
                        </div>
                        <div className="space-y-0.5">
                            <span className="text-[9px] font-black uppercase text-muted-foreground">Total Interest</span>
                            <p className={cn("text-sm font-black tracking-tighter", `text-${accentColor}`)}>{formatCurrency(totalInterest)}</p>
                        </div>
                        <div className="space-y-0.5">
                            <span className="text-[9px] font-black uppercase text-muted-foreground">Tenure</span>
                            <p className="text-sm font-black tracking-tighter">{schedule.length} Months</p>
                        </div>
                        <div className="space-y-0.5">
                            <span className="text-[9px] font-black uppercase text-muted-foreground">Total Liability</span>
                            <p className="text-sm font-black tracking-tighter">{formatCurrency(principal + totalInterest)}</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                        <Button
                            onClick={handleDownloadPDF}
                            variant="outline"
                            className={cn(
                                "h-9 px-4 rounded-xl gap-2 font-black uppercase tracking-widest text-[10px] border-border/20 transition-all transform hover:scale-105 active:scale-95",
                                `hover:text-${accentColor} hover:border-${accentColor}/30`
                            )}
                        >
                            <FileDown className="w-4 h-4" />
                            PDF Report
                        </Button>
                        <Button
                            onClick={handleShare}
                            className={cn(
                                "h-9 px-4 rounded-xl gap-2 font-black uppercase tracking-widest text-[10px] shadow-lg shadow-green-500/20",
                                "bg-green-600 hover:bg-green-700 text-white transition-all transform hover:scale-105 active:scale-95"
                            )}
                        >
                            <MessageCircle className="w-4 h-4" />
                            Share
                        </Button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-0 scrollbar-thin scrollbar-thumb-accent">
                    <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 bg-background/95 backdrop-blur-md z-10">
                            <tr className="border-b border-border/10">
                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Month</th>
                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">EMI</th>
                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Principal</th>
                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Interest</th>
                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right">Balance</th>
                            </tr>
                        </thead>
                        <tbody>
                            {schedule.map((entry) => (
                                <tr key={entry.month} className="border-b border-border/5 hover:bg-accent/30 transition-colors group">
                                    <td className="p-4">
                                        <span className="w-8 h-8 rounded-lg bg-accent/50 flex items-center justify-center text-[11px] font-black text-foreground border border-border/10 group-hover:bg-background transition-colors">
                                            {entry.month}
                                        </span>
                                    </td>
                                    <td className="p-4 text-sm font-black tracking-tighter tabular-nums">
                                        {formatCurrency(entry.emi)}
                                    </td>
                                    <td className="p-4">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-sm font-black tracking-tighter tabular-nums text-emerald-600 flex items-center gap-1">
                                                <ArrowUpRight className="w-3 h-3" />
                                                {formatCurrency(entry.principal)}
                                            </span>
                                            <div className="w-full h-1 bg-accent rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-emerald-500 opacity-60"
                                                    style={{ width: `${(entry.principal / (entry.emi || 1)) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex flex-col gap-1">
                                            <span className={cn("text-sm font-black tracking-tighter tabular-nums flex items-center gap-1", `text-${accentColor}`)}>
                                                <TrendingDown className="w-3 h-3" />
                                                {formatCurrency(entry.interest)}
                                            </span>
                                            <div className="w-full h-1 bg-accent rounded-full overflow-hidden">
                                                <div
                                                    className="h-full opacity-60"
                                                    style={{
                                                        width: `${(entry.interest / (entry.emi || 1)) * 100}%`,
                                                        backgroundColor: `var(--${accentColor.split('-')[0]}-600)`
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4 text-sm font-black tracking-tighter tabular-nums text-right text-muted-foreground">
                                        {formatCurrency(entry.balance)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Footer Disclaimer */}
                <div className="p-4 bg-muted/20 border-t border-border/10 shrink-0">
                    <p className="text-[9px] font-black uppercase text-center text-muted-foreground tracking-widest">
                        *Amortization projection is indicative and follows standard banking accounting protocols.
                    </p>
                </div>
            </div>
        </div>
    );
};
