import { RenderContext, PDF_LAYOUT, ensurePageSpace } from './layout';

/**
 * ENGINE: Render Table
 * Generic row-based table renderer with auto-paging support.
 */
export const renderTable = (
    ctx: RenderContext,
    columns: string[],
    rows: (string | number)[][],
    options: { colWidths?: number[] } = {}
): RenderContext => {
    let currentCtx = ctx;
    const { doc, pageWidth } = currentCtx;
    const tableWidth = pageWidth - (PDF_LAYOUT.margin * 2);
    const colWidth = tableWidth / columns.length;

    const drawHeader = (context: RenderContext): RenderContext => {
        const { doc: d } = context;
        d.setFillColor(...PDF_LAYOUT.colors.lightBlue);
        d.rect(PDF_LAYOUT.margin, context.cursorY, tableWidth, 8, 'F');
        d.setTextColor(...PDF_LAYOUT.colors.primary);
        d.setFontSize(PDF_LAYOUT.font.tableHeader);
        d.setFont('helvetica', 'bold');

        columns.forEach((col, i) => {
            const x = PDF_LAYOUT.margin + 3 + (i * colWidth);
            d.text(col, x, context.cursorY + 5.5);
        });

        return { ...context, cursorY: context.cursorY + 8 };
    };

    currentCtx = drawHeader(currentCtx);

    rows.forEach((row, index) => {
        // Ensure space for row (7mm height)
        currentCtx = ensurePageSpace(currentCtx, 7);

        // If page broke, redraw header
        if (currentCtx.cursorY === PDF_LAYOUT.pageTopStart) {
            currentCtx = drawHeader(currentCtx);
        }

        const { doc: d } = currentCtx;

        // zebra striping
        if (index % 2 === 0) {
            d.setFillColor(...PDF_LAYOUT.colors.rowAlternate);
            d.rect(PDF_LAYOUT.margin, currentCtx.cursorY, tableWidth, 7, 'F');
        }

        d.setTextColor(...PDF_LAYOUT.colors.text);
        d.setFont('helvetica', 'normal');
        d.setFontSize(PDF_LAYOUT.font.tableRow);

        row.forEach((cell, i) => {
            const x = PDF_LAYOUT.margin + 3 + (i * colWidth);
            d.text(cell.toString(), x, currentCtx.cursorY + 5);
        });

        currentCtx.cursorY += 7;
    });

    return currentCtx;
};
