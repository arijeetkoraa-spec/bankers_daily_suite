import { jsPDF } from 'jspdf';

/**
 * PDF BRANDING CONFIGURATION
 */
export const PDF_BRANDING = {
    suiteTitle: "BANKERS DAILY SUITE",
    assessmentSubtitle: "Professional Banking Assessment Report",
    developedBy: "Bankers Daily Suite | Developed by ARIJIT KORA",
    logoBase64: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAAAAACPAi4CAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH5AgKCQ8OJSvW9AAAABl0RVh0Q29tbWVudABDcmVhdGVkIHdpdGggR0lNUFeBDhcAAABlSURBVFjD7dXBDcAgDETRpiuDshmDshmDshmTshnLshlDsqkLsv+L/i+iB0mRJEmSJEmSJEmSJEmSJEmSJEmSJEnyf6R7pLumC7mQC7mQC7mQC6X8l6R7pLumC7mQC7mQC/m/lv8C7U7pDukOAAAAAElFTkSuQmCC"
};

export const PDF_LAYOUT = {
    margin: 15,
    headerHeight: 40,
    footerHeight: 18,
    watermarkSize: 130,
    pageTopStart: 40,
    contentLimit: 265,
    colors: {
        primary: [2, 38, 115] as [number, number, number],
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

export interface RenderContext {
    doc: jsPDF;
    cursorY: number;
    pageWidth: number;
    pageHeight: number;
}

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

export const createRenderContext = (doc: jsPDF): RenderContext => ({
    doc,
    cursorY: PDF_LAYOUT.pageTopStart,
    pageWidth: doc.internal.pageSize.getWidth(),
    pageHeight: doc.internal.pageSize.getHeight()
});

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

export const renderHeader = (ctx: RenderContext) => {
    const { doc } = ctx;
    let graphicsSaved = false;
    try {
        doc.saveGraphicsState();
        graphicsSaved = true;
        doc.circle(21, 17, 9, 'S');
        doc.clip();
        doc.addImage(PDF_BRANDING.logoBase64, 'PNG', 12, 8, 18, 18);
    } catch (e) {
        doc.setFillColor(...PDF_LAYOUT.colors.primary);
        doc.circle(21, 17, 9, 'F');
        doc.setTextColor(255);
        doc.setFontSize(12);
        doc.text("B", 18, 20);
    } finally {
        if (graphicsSaved) {
            doc.restoreGraphicsState();
        }
    }

    doc.setFontSize(PDF_LAYOUT.font.title);
    doc.setTextColor(...PDF_LAYOUT.colors.primary);
    doc.setFont('helvetica', 'bold');
    doc.text(PDF_BRANDING.suiteTitle, 35, 16);

    doc.setFontSize(PDF_LAYOUT.font.subtitle);
    doc.setTextColor(...PDF_LAYOUT.colors.muted);
    doc.setFont('helvetica', 'normal');
    doc.text(PDF_BRANDING.assessmentSubtitle, 35, 23);

    doc.setDrawColor(...PDF_LAYOUT.colors.divider);
    doc.setLineWidth(0.5);
    doc.line(PDF_LAYOUT.margin, 30, ctx.pageWidth - PDF_LAYOUT.margin, 30);
};

export const renderFooter = (ctx: RenderContext, pageNo: number, totalPages: number) => {
    const { doc, pageWidth, pageHeight } = ctx;
    doc.setDrawColor(...PDF_LAYOUT.colors.divider);
    doc.setLineWidth(0.5);
    doc.line(PDF_LAYOUT.margin, pageHeight - PDF_LAYOUT.footerHeight, pageWidth - PDF_LAYOUT.margin, pageHeight - PDF_LAYOUT.footerHeight);

    doc.setFontSize(PDF_LAYOUT.font.footerBranding);
    doc.setTextColor(...PDF_LAYOUT.colors.primary);
    doc.setFont('helvetica', 'bold');
    doc.text(PDF_BRANDING.developedBy, pageWidth / 2, pageHeight - 8, { align: 'center' });

    if (totalPages > 0) {
        doc.setFontSize(PDF_LAYOUT.font.footerPage);
        doc.setTextColor(150);
        doc.setFont('helvetica', 'normal');
        const pageText = `Page ${pageNo} of ${totalPages}`;
        doc.text(pageText, pageWidth - 15, pageHeight - 8, { align: 'right' });
    }
};

export const renderWatermark = (ctx: RenderContext) => {
    const { doc, pageWidth, pageHeight } = ctx;
    doc.saveGraphicsState();
    // @ts-ignore
    const gState = new (doc as any).GState({ opacity: 0.05 });
    doc.setGState(gState);
    try {
        const size = PDF_LAYOUT.watermarkSize;
        doc.addImage(PDF_BRANDING.logoBase64, 'PNG', (pageWidth - size) / 2, (pageHeight - size) / 2, size, size);
    } catch (e) { }
    doc.restoreGraphicsState();
};

export const formatPDFCurrency = (value: number): string => {
    return 'Rs. ' + value.toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
};

export const renderPageBase = (ctx: RenderContext, pageNo: number, totalPages: number = 0) => {
    renderWatermark(ctx);
    renderHeader(ctx);
    if (totalPages > 0) {
        renderFooter(ctx, pageNo, totalPages);
    }
};

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

export const renderKeyValueBlock = (ctx: RenderContext, label: string, value: string): RenderContext => {
    const { doc, pageWidth } = ctx;
    doc.setFontSize(PDF_LAYOUT.font.body);
    doc.setTextColor(...PDF_LAYOUT.colors.text);
    doc.setFont('helvetica', 'normal');
    doc.text(label, PDF_LAYOUT.margin + 3, ctx.cursorY);

    doc.setFont('helvetica', 'bold');
    doc.text(value, pageWidth - PDF_LAYOUT.margin - 3, ctx.cursorY, { align: 'right' });

    doc.setDrawColor(245, 245, 245);
    doc.setLineWidth(0.1);
    doc.line(PDF_LAYOUT.margin + 3, ctx.cursorY + 2, pageWidth - PDF_LAYOUT.margin - 3, ctx.cursorY + 2);

    return { ...ctx, cursorY: ctx.cursorY + 8 };
};
