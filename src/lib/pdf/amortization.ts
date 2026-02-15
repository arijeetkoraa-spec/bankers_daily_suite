import { type RenderContext, PDF_LAYOUT, ensurePageSpace, type AmortizationRow, formatPDFCurrency } from './layout';

/**
 * ENGINE: Render Amortization Table
 * Full schedule with Due Date column, Rs. currency, 2 decimal precision.
 * Proper pagination — never truncated.
 */
export const renderAmortizationTable = (
    ctx: RenderContext,
    schedule: AmortizationRow[]
): RenderContext => {
    let currentCtx = ctx;
    const { pageWidth } = currentCtx;
    const tableWidth = pageWidth - (PDF_LAYOUT.margin * 2);

    // 6 columns: Month | Due Date | EMI | Principal | Interest | Balance
    const hasDueDate = schedule.length > 0 && !!schedule[0].dueDate;
    const colCount = hasDueDate ? 6 : 5;
    const colWidth = tableWidth / colCount;

    const drawHeader = (context: RenderContext): RenderContext => {
        const { doc: d } = context;
        d.setFillColor(...PDF_LAYOUT.colors.lightBlue);
        d.rect(PDF_LAYOUT.margin, context.cursorY, tableWidth, 9, 'F');
        d.setTextColor(...PDF_LAYOUT.colors.primary);
        d.setFontSize(PDF_LAYOUT.font.tableHeader);
        d.setFont('helvetica', 'bold');

        const headers = hasDueDate
            ? ["Month", "Due Date", "EMI", "Principal", "Interest", "Balance"]
            : ["Month", "EMI", "Principal", "Interest", "Balance"];

        headers.forEach((h, i) => {
            const x = PDF_LAYOUT.margin + 3 + (i * colWidth);
            d.text(h, x, context.cursorY + 6);
        });

        return { ...context, cursorY: context.cursorY + 9 };
    };

    currentCtx = drawHeader(currentCtx);

    schedule.forEach((row, index) => {
        currentCtx = ensurePageSpace(currentCtx, 8);

        // If page broke, redraw header for continuity
        if (currentCtx.cursorY === PDF_LAYOUT.pageTopStart) {
            currentCtx = drawHeader(currentCtx);
        }

        const { doc: d } = currentCtx;

        if (index % 2 === 0) {
            d.setFillColor(...PDF_LAYOUT.colors.rowAlternate);
            d.rect(PDF_LAYOUT.margin, currentCtx.cursorY, tableWidth, 8, 'F');
        }

        d.setTextColor(...PDF_LAYOUT.colors.text);
        d.setFont('helvetica', 'normal');
        d.setFontSize(PDF_LAYOUT.font.tableRow);

        const cells = hasDueDate
            ? [
                row.month.toString(),
                formatDateForTable(row.dueDate || ''),
                formatPDFCurrency(row.emi),
                formatPDFCurrency(row.principal),
                formatPDFCurrency(row.interest),
                formatPDFCurrency(row.balance)
            ]
            : [
                row.month.toString(),
                formatPDFCurrency(row.emi),
                formatPDFCurrency(row.principal),
                formatPDFCurrency(row.interest),
                formatPDFCurrency(row.balance)
            ];

        cells.forEach((cell, i) => {
            const x = PDF_LAYOUT.margin + 3 + (i * colWidth);
            d.text(cell, x, currentCtx.cursorY + 5.5);
        });

        currentCtx.cursorY += 8;
    });

    return currentCtx;
};

/**
 * UTILITY: Format ISO date to DD-MM-YYYY for table display
 */
const formatDateForTable = (isoDate: string): string => {
    if (!isoDate) return '--';
    const parts = isoDate.split('-');
    if (parts.length !== 3) return isoDate;
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
};
