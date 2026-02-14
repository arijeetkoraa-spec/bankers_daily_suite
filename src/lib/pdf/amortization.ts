import { RenderContext, PDF_LAYOUT, ensurePageSpace, AmortizationRow, renderPageBase, renderFooter } from './layout';

/**
 * ENGINE: Render Amortization Table
 * Specific formatting for loan schedules using localized currency.
 */
export const renderAmortizationTable = (
    ctx: RenderContext,
    schedule: AmortizationRow[]
): RenderContext => {
    let currentCtx = ctx;
    const { doc, pageWidth } = currentCtx;
    const tableWidth = pageWidth - (PDF_LAYOUT.margin * 2);

    // Columns: Month | EMI | Principal | Interest | Balance
    const colWidth = tableWidth / 5;
    const format = (val: number) => `Rs. ${val.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

    const drawHeader = (context: RenderContext): RenderContext => {
        const { doc: d } = context;
        d.setFillColor(...PDF_LAYOUT.colors.lightBlue);
        d.rect(PDF_LAYOUT.margin, context.cursorY, tableWidth, 8, 'F');
        d.setTextColor(...PDF_LAYOUT.colors.primary);
        d.setFontSize(PDF_LAYOUT.font.tableHeader);
        d.setFont('helvetica', 'bold');

        const headers = ["Month", "EMI", "Principal", "Interest", "Balance"];
        headers.forEach((h, i) => {
            const x = PDF_LAYOUT.margin + 3 + (i * colWidth);
            d.text(h, x, context.cursorY + 5.5);
        });

        return { ...context, cursorY: context.cursorY + 8 };
    };

    currentCtx = drawHeader(currentCtx);

    schedule.forEach((row, index) => {
        currentCtx = ensurePageSpace(currentCtx, 7);

        if (currentCtx.cursorY === PDF_LAYOUT.pageTopStart) {
            currentCtx = drawHeader(currentCtx);
        }

        const { doc: d } = currentCtx;

        if (index % 2 === 0) {
            d.setFillColor(...PDF_LAYOUT.colors.rowAlternate);
            d.rect(PDF_LAYOUT.margin, currentCtx.cursorY, tableWidth, 7, 'F');
        }

        d.setTextColor(...PDF_LAYOUT.colors.text);
        d.setFont('helvetica', 'normal');
        d.setFontSize(PDF_LAYOUT.font.tableRow + 1); // Slightly larger for financial data clarity

        const cells = [
            row.month.toString(),
            format(row.emi),
            format(row.principal),
            format(row.interest),
            format(row.balance)
        ];

        cells.forEach((cell, i) => {
            const x = PDF_LAYOUT.margin + 3 + (i * colWidth);
            d.text(cell, x, currentCtx.cursorY + 5);
        });

        currentCtx.cursorY += 7;
    });

    return currentCtx;
};
