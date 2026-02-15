import { jsPDF } from 'jspdf';

/**
 * PDF BRANDING CONFIGURATION
 * Centralized source of truth for all branding strings.
 */
export const PDF_BRANDING = {
    suiteTitle: "BANKERS DAILY SUITE",
    assessmentSubtitle: "Professional Banking Assessment Report",
    developedBy: "Bankers Daily Suite | Developed by ARIJIT KORA",
    logoBase64: (typeof window !== 'undefined' && (window as any).process?.env?.PDF_LOGO) ||
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAAAAACPAi4CAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH5AgKCQ8OJSvW9AAAABl0RVh0Q29tbWVudABDcmVhdGVkIHdpdGggR0lNUFeBDhcAAABlSURBVFjD7dXBDcAgDETRpiuDshmDshmDshmTshnLshlDsqkLsv+L/i+iB0mRJEmSJEmSJEmSJEmSJEmSJEmSJEnyf6R7pLumC7mQC7mQC7mQC6X8l6R7pLumC7mQC7mQC/m/lv8C7U7pDukOAAAAAElFTkSuQmCC"
};

/**
 * PDF LAYOUT CONFIGURATION
 * SaaS-style layout constants for easy theme updates.
 */
export const PDF_LAYOUT = {
    margin: 15, // Slightly larger margin for professional look
    headerHeight: 40,
    footerHeight: 18,
    watermarkSize: 130,
    pageTopStart: 40,
    contentLimit: 265,
    colors: {
        primary: [2, 38, 115] as [number, number, number], // Bankers Blue
        text: [20, 20, 20] as [number, number, number],
        muted: [110, 110, 110] as [number, number, number],
        lightBlue: [245, 248, 255] as [number, number, number],
        divider: [225, 225, 225] as [number, number, number],
        rowAlternate: [253, 253, 253] as [number, number, number],
    },
    font: {
        title: 18,
        subtitle: 11,
        section: 12,
        body: 10,
        tableHeader: 10,
        tableRow: 9,
        footerBranding: 13,
        footerPage: 10,
    }
};

/**
 * RENDERING CONTEXT
 * Composable state for PDF transformation.
 */
export interface RenderContext {
    doc: jsPDF;
    cursorY: number;
    pageWidth: number;
    pageHeight: number;
}

/**
 * DATA INTERFACES
 */
export interface PDFDetail {
    label: string;
    value: string;
    type?: 'section' | 'field';
}

export interface PDFDataBase {
    title: string;
    subtitle?: string;
    details: PDFDetail[];
}

export interface AmortizationRow {
    month: number;
    dueDate?: string;
    emi: number;
    principal: number;
    interest: number;
    balance: number;
}

export interface AmortizationPDFData extends PDFDataBase {
    schedule: AmortizationRow[];
}

/**
 * UTILITY: Create Initial Context
 */
export const createRenderContext = (doc: jsPDF): RenderContext => ({
    doc,
    cursorY: PDF_LAYOUT.pageTopStart,
    pageWidth: doc.internal.pageSize.getWidth(),
    pageHeight: doc.internal.pageSize.getHeight()
});

/**
 * UTILITY: Ensure Page Space
 * Centralized logic for pagination. Guarantees header and footer.
 */
export const ensurePageSpace = (ctx: RenderContext, requiredHeight: number): RenderContext => {
    if (ctx.cursorY + requiredHeight > PDF_LAYOUT.contentLimit) {
        ctx.doc.addPage();
        const nextContext = {
            ...ctx,
            cursorY: PDF_LAYOUT.pageTopStart
        };
        renderPageBase(nextContext, nextContext.doc.getNumberOfPages());
        return nextContext;
    }
    return ctx;
};

/**
 * ENGINE: Render Header
 */
export const renderHeader = (ctx: RenderContext) => {
    const { doc } = ctx;

    // Logo - Rendered as Circle
    try {
        doc.saveGraphicsState();
        // @ts-ignore
        doc.circle(21, 17, 9, 'F');
        // @ts-ignore
        doc.clip();
        doc.addImage(PDF_BRANDING.logoBase64, 'PNG', 12, 8, 18, 18);
        doc.restoreGraphicsState();
    } catch (e) {
        doc.setFillColor(...PDF_LAYOUT.colors.primary);
        // @ts-ignore
        doc.circle(21, 17, 9, 'F');
        doc.setTextColor(255);
        doc.setFontSize(12);
        doc.text("B", 18.5, 20);
    }

    // Title
    doc.setFontSize(PDF_LAYOUT.font.title);
    doc.setTextColor(...PDF_LAYOUT.colors.primary);
    doc.setFont('helvetica', 'bold');
    doc.text(PDF_BRANDING.suiteTitle, 35, 16);

    // Subtitle
    doc.setFontSize(PDF_LAYOUT.font.subtitle);
    doc.setTextColor(...PDF_LAYOUT.colors.muted);
    doc.setFont('helvetica', 'normal');
    doc.text(PDF_BRANDING.assessmentSubtitle, 35, 23);

    // Header Divider
    doc.setDrawColor(...PDF_LAYOUT.colors.divider);
    doc.setLineWidth(0.5);
    doc.line(PDF_LAYOUT.margin, 30, ctx.pageWidth - PDF_LAYOUT.margin, 30);
};

/**
 * ENGINE: Render Footer
 */
export const renderFooter = (ctx: RenderContext, pageNo: number, totalPages: number) => {
    const { doc, pageWidth, pageHeight } = ctx;

    // Divider
    doc.setDrawColor(...PDF_LAYOUT.colors.divider);
    doc.setLineWidth(0.5);
    doc.line(PDF_LAYOUT.margin, pageHeight - PDF_LAYOUT.footerHeight, pageWidth - PDF_LAYOUT.margin, pageHeight - PDF_LAYOUT.footerHeight);

    // Center Branding
    doc.setFontSize(PDF_LAYOUT.font.footerBranding);
    doc.setTextColor(...PDF_LAYOUT.colors.primary);
    doc.setFont('helvetica', 'bold');
    doc.text(PDF_BRANDING.developedBy, pageWidth / 2, pageHeight - 8, { align: 'center' });

    // Page Numbering
    if (totalPages > 0) {
        doc.setFontSize(PDF_LAYOUT.font.footerPage);
        doc.setTextColor(150);
        doc.setFont('helvetica', 'normal');
        const pageText = `Page ${pageNo} of ${totalPages}`;
        doc.text(pageText, pageWidth - 15, pageHeight - 8, { align: 'right' });
    }
};

/**
 * ENGINE: Render Watermark
 * Protected graphics state to avoid leaking opacity to content.
 */
export const renderWatermark = (ctx: RenderContext) => {
    const { doc, pageWidth, pageHeight } = ctx;

    doc.saveGraphicsState();
    // @ts-ignore - GState is polyfilled or added by types
    const gState = new (doc as any).GState({ opacity: 0.05 });
    doc.setGState(gState);

    try {
        const size = PDF_LAYOUT.watermarkSize;
        doc.addImage(PDF_BRANDING.logoBase64, 'PNG', (pageWidth - size) / 2, (pageHeight - size) / 2, size, size);
    } catch (e) { }

    doc.restoreGraphicsState();
};

/**
 * UTILITY: Format Currency for PDF
 * Uses "Rs. " instead of "₹" to avoid character rendering artifacts in standard fonts.
 */
export const formatPDFCurrency = (value: number): string => {
    return 'Rs. ' + value.toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
};

/**
 * MASTER: Render Page base
 */
export const renderPageBase = (ctx: RenderContext, pageNo: number, totalPages: number = 0) => {
    renderWatermark(ctx);
    renderHeader(ctx);
    if (totalPages > 0) {
        renderFooter(ctx, pageNo, totalPages);
    }
};

/**
 * ENGINE: Render Section Title
 */
export const renderSection = (ctx: RenderContext, title: string): RenderContext => {
    const { doc } = ctx;
    doc.setFontSize(PDF_LAYOUT.font.section);
    doc.setTextColor(...PDF_LAYOUT.colors.primary);
    doc.setFont('helvetica', 'bold');
    doc.text(title, PDF_LAYOUT.margin, ctx.cursorY);

    doc.setDrawColor(...PDF_LAYOUT.colors.lightBlue);
    doc.setLineWidth(0.5);
    doc.line(PDF_LAYOUT.margin, ctx.cursorY + 2, ctx.pageWidth - PDF_LAYOUT.margin, ctx.cursorY + 2);

    return { ...ctx, cursorY: ctx.cursorY + 10 };
};

/**
 * ENGINE: Render Key Value Block
 */
export const renderKeyValueBlock = (ctx: RenderContext, label: string, value: string): RenderContext => {
    const { doc, pageWidth } = ctx;

    doc.setFontSize(PDF_LAYOUT.font.body);
    doc.setTextColor(...PDF_LAYOUT.colors.text);
    doc.setFont('helvetica', 'normal');
    doc.text(label, PDF_LAYOUT.margin + 3, ctx.cursorY);

    doc.setFont('helvetica', 'bold');
    doc.text(value, pageWidth - PDF_LAYOUT.margin - 3, ctx.cursorY, { align: 'right' });

    // Subtle line
    doc.setDrawColor(245, 245, 245);
    doc.setLineWidth(0.1);
    doc.line(PDF_LAYOUT.margin + 3, ctx.cursorY + 2, pageWidth - PDF_LAYOUT.margin - 3, ctx.cursorY + 2);

    return { ...ctx, cursorY: ctx.cursorY + 8 };
};
