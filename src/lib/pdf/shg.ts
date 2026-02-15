import { jsPDF } from 'jspdf';
import {
    type PDFDataBase,
    createRenderContext,
    renderPageBase,
    renderFooter,
    renderSection,
    renderKeyValueBlock,
    ensurePageSpace,
    formatPDFCurrency
} from './layout';
import { renderTable } from './tables';
import { renderAmortizationTable } from './amortization';
import { generateSHGAmortization } from '../../core/shgEngine';

// ─────────────────────────────────────────────
// DATA INTERFACES
// ─────────────────────────────────────────────

export interface SHGMemberLoanPDFData {
    amount: number;
    rate: number;
    startDate: string;
    tenure: number;
    outstanding: number;
}

export interface SHGMemberPDFData {
    name: string;
    totalOutstanding: number;
    loans: SHGMemberLoanPDFData[];
}

export interface SHGReportPDFData extends PDFDataBase {
    groupName: string;
    sanctionedAmount: number;
    groupRate: number;
    groupEMI: number;
    groupStartDate: string;
    groupTenure: number;
    reviewDate: string;
    groupOutstanding: number;
    monthsElapsed: number;
    monthsRemaining: number;
    totalInterest: number;
    totalPaid: number;
    isBalanced: boolean;
    difference: number;
    slabs: { limit: number; rate: number }[];
    appliedSlabIndex: number;
    members: SHGMemberPDFData[];
    showAmortization?: boolean;
}

// ─────────────────────────────────────────────
// UTILITY: Date Formatting
// ─────────────────────────────────────────────

const formatDateDDMMYYYY = (isoDate: string): string => {
    if (!isoDate) return '--';
    const parts = isoDate.split('-');
    if (parts.length !== 3) return isoDate;
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
};

// ─────────────────────────────────────────────
// MAIN EXPORT FUNCTION
// ─────────────────────────────────────────────

export const exportSHGReportToPDF = async (data: SHGReportPDFData, fileName: string) => {
    const doc = new jsPDF();
    let ctx = createRenderContext(doc);

    // Page 1 — Header
    renderPageBase(ctx, 1);

    // ━━━ 1. GROUP LOAN SUMMARY ━━━
    ctx = renderSection(ctx, "GROUP LOAN SUMMARY");
    ctx = renderKeyValueBlock(ctx, "Group Name", data.groupName);
    ctx = renderKeyValueBlock(ctx, "Sanctioned Amount", formatPDFCurrency(data.sanctionedAmount));
    ctx = renderKeyValueBlock(ctx, "Applied Interest Rate", `${data.groupRate}%`);
    ctx = renderKeyValueBlock(ctx, "Monthly EMI", formatPDFCurrency(data.groupEMI));
    ctx = renderKeyValueBlock(ctx, "Disbursement Date", formatDateDDMMYYYY(data.groupStartDate));
    ctx = renderKeyValueBlock(ctx, "Loan Tenure", `${data.groupTenure} Months`);
    ctx = renderKeyValueBlock(ctx, "Review Date", formatDateDDMMYYYY(data.reviewDate));
    ctx = renderKeyValueBlock(ctx, "Group Outstanding", formatPDFCurrency(data.groupOutstanding));

    // ━━━ 1.5 ADDITIONAL SUMMARY ━━━
    ctx = ensurePageSpace(ctx, 45); // Increased space
    ctx = renderKeyValueBlock(ctx, "Months Elapsed", `${data.monthsElapsed}`);
    ctx = renderKeyValueBlock(ctx, "Months Remaining", `${data.monthsRemaining}`);
    ctx = renderKeyValueBlock(ctx, "Total Interest Payable (Full Tenure)", formatPDFCurrency(data.totalInterest));
    ctx = renderKeyValueBlock(ctx, "Total Amount Paid Till Review", formatPDFCurrency(data.totalPaid));

    // ━━━ 2. INTEREST SLAB CONFIGURATION ━━━
    ctx = ensurePageSpace(ctx, 40); // Increased space
    ctx = renderSection(ctx, "INTEREST SLAB CONFIGURATION");

    const sortedSlabs = [...data.slabs].sort((a, b) => a.limit - b.limit);
    const slabColumns = ["Slab Range", "Interest Rate (%)", "Applied"];
    const slabRows = sortedSlabs.map((s, i) => {
        let rangeLabel: string;
        if (i === 0) {
            rangeLabel = `Up to ${formatPDFCurrency(s.limit)}`;
        } else if (i === sortedSlabs.length - 1 && s.limit >= 10000000) {
            rangeLabel = `Above ${formatPDFCurrency(sortedSlabs[i - 1].limit)}`;
        } else {
            rangeLabel = `${formatPDFCurrency(sortedSlabs[i - 1].limit + 1)} to ${formatPDFCurrency(s.limit)}`;
        }

        const isApplied = i === data.appliedSlabIndex;
        return [rangeLabel, `${s.rate}%`, isApplied ? "✓ APPLIED" : ""];
    });
    ctx = renderTable(ctx, slabColumns, slabRows);

    // ━━━ 3. MEMBER-WISE LOAN TRACKING ━━━
    ctx = ensurePageSpace(ctx, 35); // Increased space
    ctx = renderSection(ctx, "MEMBER-WISE LOAN TRACKING");

    if (data.members.length === 0) {
        ctx = renderKeyValueBlock(ctx, "Status", "No members added for this group.");
    } else {
        for (const member of data.members) {
            ctx = ensurePageSpace(ctx, 40); // Increased space for each member block
            ctx = renderKeyValueBlock(ctx, `Member: ${member.name || 'Unnamed'}`, `Total Outstanding: ${formatPDFCurrency(member.totalOutstanding)}`);

            const loanCols = ["Loan Amount", "Start Date", "Rate (%)", "Tenure", "Outstanding"];
            const loanRows = member.loans.map(l => [
                formatPDFCurrency(l.amount),
                formatDateDDMMYYYY(l.startDate),
                `${l.rate}%`,
                `${l.tenure} Mo`,
                formatPDFCurrency(l.outstanding)
            ]);
            ctx = renderTable(ctx, loanCols, loanRows);
            ctx.cursorY += 8; // More padding after table
        }
    }

    // ━━━ 4. SYSTEM VALIDATION ━━━
    ctx = ensurePageSpace(ctx, 35); // Increased space
    ctx = renderSection(ctx, "SYSTEM VALIDATION");

    if (data.members.length === 0) {
        ctx = renderKeyValueBlock(ctx, "Validation Result", "Not applicable (no member data)");
    } else {
        const memberCombinedTotal = data.members.reduce((acc, m) => acc + m.totalOutstanding, 0);
        ctx = renderKeyValueBlock(ctx, "Group Outstanding", formatPDFCurrency(data.groupOutstanding));
        ctx = renderKeyValueBlock(ctx, "Member Combined Total", formatPDFCurrency(memberCombinedTotal));
        ctx = renderKeyValueBlock(ctx, "Balance Status", data.isBalanced ? "MATCHED / BALANCED ✓" : "MISMATCH DETECTED ✗");
        if (!data.isBalanced) {
            ctx = renderKeyValueBlock(ctx, "Variance (Difference)", formatPDFCurrency(data.difference));
        }
    }

    // ━━━ 5. AMORTIZATION SCHEDULES (Optional) ━━━
    if (data.showAmortization) {
        // Group Amortization
        if (data.sanctionedAmount > 0) {
            ctx = ensurePageSpace(ctx, 35);
            ctx = renderSection(ctx, "GROUP AMORTIZATION SCHEDULE");
            const schedule = generateSHGAmortization(data.sanctionedAmount, data.groupRate, data.groupTenure, data.groupStartDate);
            ctx = renderAmortizationTable(ctx, schedule);
        }

        // Member Loan Schedules
        for (const member of data.members) {
            for (let i = 0; i < member.loans.length; i++) {
                const loan = member.loans[i];
                ctx = ensurePageSpace(ctx, 40);
                ctx = renderSection(ctx, `SCHEDULE: ${member.name || 'Unnamed'} (Loan ${i + 1})`);
                const schedule = generateSHGAmortization(loan.amount, loan.rate, loan.tenure, loan.startDate);
                ctx = renderAmortizationTable(ctx, schedule);
            }
        }
    }

    // ━━━ 6. REPORT METADATA ━━━
    ctx = ensurePageSpace(ctx, 25);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Calculation Date: ${formatDateDDMMYYYY(data.reviewDate)}`, 15, ctx.cursorY + 5);
    doc.text(`Report Generated: ${new Date().toLocaleString('en-IN')}`, 15, ctx.cursorY + 10);

    // ━━━ 7. RENDER FOOTERS ON ALL PAGES ━━━
    const totalPages = doc.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
        doc.setPage(p);
        renderFooter(ctx, p, totalPages);
    }

    doc.save(fileName);
};
