import { jsPDF } from 'jspdf';
import type {
    PDFDataBase,
    AmortizationPDFData,
    RenderContext,
} from './layout';

import {
    createRenderContext,
    renderPageBase,
    renderSection,
    renderKeyValueBlock,
    PDF_LAYOUT,
    ensurePageSpace,
    renderFooter
} from './layout';
import { renderAmortizationTable } from './amortization';

/**
 * EXPORT: Standard Report
 * Returns jsPDF instance to allow caller to save, preview or upload.
 */
export const exportToPDF = async (
    data: PDFDataBase,
    fileName: string = 'report.pdf',
    customRenderer?: (ctx: RenderContext) => RenderContext
): Promise<jsPDF> => {

    const doc = new jsPDF();
    let ctx = createRenderContext(doc);

    renderPageBase(ctx, 1, 1);

    // Title
    doc.setFontSize(PDF_LAYOUT.font.title);
    doc.setTextColor(...PDF_LAYOUT.colors.primary);
    doc.setFont('helvetica', 'bold');
    doc.text(data.title, PDF_LAYOUT.margin, ctx.cursorY);
    ctx.cursorY += 10;

    if (data.subtitle) {
        doc.setFontSize(PDF_LAYOUT.font.subtitle);
        doc.setTextColor(...PDF_LAYOUT.colors.muted);
        doc.setFont('helvetica', 'normal');
        doc.text(data.subtitle, PDF_LAYOUT.margin, ctx.cursorY);
        ctx.cursorY += 12;
    }

    data.details.forEach(item => {
        ctx = ensurePageSpace(ctx, 10);

        if (item.type === 'section' || item.label.startsWith('---')) {
            const sectionTitle = item.label.replace(/-/g, '').trim();
            ctx = renderSection(ctx, sectionTitle);
        } else {
            ctx = renderKeyValueBlock(ctx, item.label, item.value);
        }
    });

    if (customRenderer) {
        ctx = customRenderer(ctx);
    }

    // If fileName is provided, trigger download
    if (fileName) {
        doc.save(fileName);
    }

    return doc;
};

/**
 * EXPORT: Amortization Report
 * Uses a post-rendering footer patch to handle total page count correctly.
 */
export const exportAmortizationToPDF = async (
    data: AmortizationPDFData,
    fileName: string = 'amortization-schedule.pdf'
): Promise<jsPDF> => {
    const doc = new jsPDF();
    let ctx = createRenderContext(doc);

    // Initial page base (Footer will be patched later with total pages)
    renderPageBase(ctx, 1, 0);

    // Title Header
    doc.setFontSize(PDF_LAYOUT.font.title);
    doc.setTextColor(...PDF_LAYOUT.colors.primary);
    doc.setFont('helvetica', 'bold');
    doc.text(data.title, PDF_LAYOUT.margin, ctx.cursorY);
    ctx.cursorY += 8;

    doc.setFontSize(PDF_LAYOUT.font.subtitle);
    doc.setTextColor(...PDF_LAYOUT.colors.muted);
    doc.setFont('helvetica', 'normal');
    doc.text(data.subtitle || "Amortization Schedule", PDF_LAYOUT.margin, ctx.cursorY);
    ctx.cursorY += 12;

    // Summary Section
    ctx = renderSection(ctx, "Assessment Summary");
    data.details.forEach(item => {
        ctx = ensurePageSpace(ctx, 8);
        ctx = renderKeyValueBlock(ctx, item.label, item.value);
    });

    ctx.cursorY += 10;
    ctx = renderSection(ctx, "Monthly Repayment Schedule");

    // Table
    ctx = renderAmortizationTable(ctx, data.schedule);

    // Post-rendering Patch: Page Numbers
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        // Temporarily override context for selective footer rendering
        const patchCtx = { ...ctx, doc };
        renderFooter(patchCtx, i, totalPages);
    }

    if (fileName) {
        doc.save(fileName);
    }

    return doc;
};

// Re-export core types for consumers
export * from './layout';
export * from './tables';
export * from './amortization';
export * from './shg';
