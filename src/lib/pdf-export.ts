import { jsPDF } from 'jspdf';

// Standard Branding Constants
// Standard Branding Constants
const LOGO_BASE64 = (typeof window !== 'undefined' && (window as any).process?.env?.PDF_LOGO) ||
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAAAAACPAi4CAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH5AgKCQ8OJSvW9AAAABl0RVh0Q29tbWVudABDcmVhdGVkIHdpdGggR0lNUFeBDhcAAABlSURBVFjD7dXBDcAgDETRpiuDshmDshmDshmTshnLshlDsqkLsv+L/i+iB0mRJEmSJEmSJEmSJEmSJEmSJEmSJEnyf6R7pLumC7mQC7mQC7mQC6X8l6R7pLumC7mQC7mQC/m/lv8C7U7pDukOAAAAAElFTkSuQmCC";

const PAGE_TOP_START = 35;

export interface PDFData {
    title: string;
    subtitle?: string;
    details: { label: string; value: string }[];
}

export interface AmortizationPDFData extends PDFData {
    schedule: {
        month: number;
        emi: number;
        principal: number;
        interest: number;
        balance: number;
    }[];
}

/**
 * HELPER: Render Header on every page
 */
export const renderHeader = (doc: jsPDF) => {
    const pageWidth = doc.internal.pageSize.getWidth();

    // Logo
    try {
        doc.addImage(LOGO_BASE64, 'PNG', 12, 8, 18, 18);
    } catch (e) {
        // Fallback for missing/invalid logo
        doc.setFillColor(30, 64, 175);
        doc.rect(12, 8, 18, 18, 'F');
        doc.setTextColor(255);
        doc.setFontSize(12);
        doc.text("B", 18, 20);
    }

    // Title
    doc.setFontSize(16);
    doc.setTextColor(30, 64, 175);
    doc.setFont('helvetica', 'bold');
    doc.text("BANKER'S DAILY SUITE", 35, 16);

    // Subtitle
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.setFont('helvetica', 'normal');
    doc.text("Professional Banking Assessment Report", 35, 23);

    // Header Divider
    doc.setDrawColor(230);
    doc.setLineWidth(0.5);
    doc.line(12, 30, pageWidth - 12, 30);
};

/**
 * HELPER: Render Footer on every page
 */
export const renderFooter = (doc: jsPDF, pageNo: number, totalPages: number) => {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Divider
    doc.setDrawColor(230);
    doc.setLineWidth(0.5);
    doc.line(12, pageHeight - 15, pageWidth - 12, pageHeight - 15);

    // Center Branding
    doc.setFontSize(14);
    doc.setTextColor(30, 64, 175);
    doc.setFont('helvetica', 'bold');
    const footerText = "Banker's Daily Suite | Developed by ARIJIT KORA";
    doc.text(footerText, pageWidth / 2, pageHeight - 8, { align: 'center' });

    // Page Numbering
    doc.setFontSize(9);
    doc.setTextColor(150);
    doc.setFont('helvetica', 'normal');
    const pageText = `Page ${pageNo} of ${totalPages}`;
    doc.text(pageText, pageWidth - 15, pageHeight - 8, { align: 'right' });
};

/**
 * HELPER: Render Watermark on every page
 */
export const renderWatermark = (doc: jsPDF) => {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    doc.saveGraphicsState();
    // @ts-ignore - GState is polyfilled or added by types
    const gState = new (doc as any).GState({ opacity: 0.05 });
    doc.setGState(gState);

    try {
        doc.addImage(LOGO_BASE64, 'PNG', (pageWidth - 120) / 2, (pageHeight - 120) / 2, 120, 120);
    } catch (e) { }

    doc.restoreGraphicsState();
};

/**
 * MASTER: Render Page base (Header, Footer, Watermark)
 */
export const renderPageBase = (doc: jsPDF, pageNo: number, totalPages: number = 1) => {
    renderWatermark(doc);
    renderHeader(doc);
    renderFooter(doc, pageNo, totalPages);
};

/**
 * HELPER: Render Section Title
 */
export const renderSection = (doc: jsPDF, title: string, y: number) => {
    doc.setFontSize(11);
    doc.setTextColor(30, 64, 175);
    doc.setFont('helvetica', 'bold');
    doc.text(title, 12, y);

    doc.setDrawColor(240, 244, 255);
    doc.setLineWidth(0.5);
    doc.line(12, y + 2, 200, y + 2);

    return y + 10;
};

/**
 * HELPER: Render Key Value Block
 */
export const renderKeyValueBlock = (doc: jsPDF, label: string, value: string, y: number) => {
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.setFont('helvetica', 'normal');
    doc.text(label, 15, y);

    doc.setFont('helvetica', 'bold');
    doc.text(value, pageWidth - 15, y, { align: 'right' });

    // Subtle line
    doc.setDrawColor(245);
    doc.setLineWidth(0.1);
    doc.line(15, y + 2, pageWidth - 15, y + 2);

    return y + 8;
};

/**
 * HELPER: Simple Key Value Table (Generic)
 */
export const renderTable = (doc: jsPDF, columns: string[], rows: string[][], startY: number) => {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let cursorY = startY;

    const colWidth = (pageWidth - 24) / columns.length;

    const drawHeader = (y: number) => {
        doc.setFillColor(240, 244, 255);
        doc.rect(12, y, pageWidth - 24, 8, 'F');
        doc.setTextColor(30, 64, 175);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        columns.forEach((col, i) => {
            doc.text(col, 15 + (i * colWidth), y + 5.5);
        });
        return y + 8;
    };

    cursorY = drawHeader(cursorY);

    rows.forEach((row, index) => {
        if (cursorY > pageHeight - 25) {
            doc.addPage();
            renderPageBase(doc, doc.getNumberOfPages());
            cursorY = PAGE_TOP_START;
            cursorY = drawHeader(cursorY);
        }

        if (index % 2 === 0) {
            doc.setFillColor(252, 252, 252);
            doc.rect(12, cursorY, pageWidth - 24, 7, 'F');
        }

        doc.setTextColor(0);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);

        row.forEach((cell, i) => {
            doc.text(cell.toString(), 15 + (i * colWidth), cursorY + 5);
        });

        cursorY += 7;
    });

    return cursorY;
};

/**
 * ENGINE: Unified Amortization Table
 */
export const renderAmortizationTable = (doc: jsPDF, schedule: any[], startY: number) => {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let cursorY = startY;

    // Columns: Month | EMI | Principal | Interest | Balance
    const colWidth = (pageWidth - 24) / 5;
    const cols = [15, 15 + colWidth, 15 + (2 * colWidth), 15 + (3 * colWidth), 15 + (4 * colWidth)];
    const format = (val: number) => `Rs. ${val.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

    const drawHeader = (y: number) => {
        doc.setFillColor(240, 244, 255);
        doc.rect(12, y, pageWidth - 24, 8, 'F');
        doc.setTextColor(30, 64, 175);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text("Month", cols[0], y + 5.5);
        doc.text("EMI", cols[1], y + 5.5);
        doc.text("Principal", cols[2], y + 5.5);
        doc.text("Interest", cols[3], y + 5.5);
        doc.text("Balance", cols[4], y + 5.5);
        return y + 8;
    };

    cursorY = drawHeader(cursorY);

    schedule.forEach((row, index) => {
        if (cursorY > pageHeight - 25) {
            doc.addPage();
            renderPageBase(doc, doc.getNumberOfPages());
            cursorY = PAGE_TOP_START;
            cursorY = drawHeader(cursorY);
        }

        if (index % 2 === 0) {
            doc.setFillColor(252, 252, 252);
            doc.rect(12, cursorY, pageWidth - 24, 7, 'F');
        }

        doc.setTextColor(0);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);

        doc.text(row.month.toString(), cols[0], cursorY + 5);
        doc.text(format(row.emi), cols[1], cursorY + 5);
        doc.text(format(row.principal), cols[2], cursorY + 5);
        doc.text(format(row.interest), cols[3], cursorY + 5);
        doc.text(format(row.balance), cols[4], cursorY + 5);

        cursorY += 7;
    });

    return cursorY;
};

/**
 * GLOBAL EXPORT: Standard Report
 */
export const exportToPDF = (data: PDFData, fileName: string = 'report.pdf', customRenderer?: (doc: jsPDF, yPos: number) => number) => {
    const doc = new jsPDF();
    const totalPages = 1;

    renderPageBase(doc, 1, 1);

    let yPos = PAGE_TOP_START;

    // Title
    doc.setFontSize(16);
    doc.setTextColor(30, 64, 175);
    doc.setFont('helvetica', 'bold');
    doc.text(data.title, 12, yPos);
    yPos += 10;

    if (data.subtitle) {
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.setFont('helvetica', 'normal');
        doc.text(data.subtitle, 12, yPos);
        yPos += 12;
    }

    data.details.forEach(item => {
        if (yPos > 260) {
            doc.addPage();
            renderPageBase(doc, doc.getNumberOfPages(), totalPages);
            yPos = PAGE_TOP_START;
        }

        if (item.label.startsWith('---')) {
            const sectionTitle = item.label.replace(/-/g, '').trim();
            yPos = renderSection(doc, sectionTitle, yPos);
        } else {
            yPos = renderKeyValueBlock(doc, item.label, item.value, yPos);
        }
    });

    if (customRenderer) {
        yPos = customRenderer(doc, yPos);
    }

    doc.save(fileName);
};

/**
 * GLOBAL EXPORT: Amortization Report
 */
export const exportAmortizationToPDF = (data: AmortizationPDFData, fileName: string = 'amortization-schedule.pdf') => {
    const doc = new jsPDF();

    // We can't know total pages easily before rendering without double rendering,
    // so we render and then patch, or just accept Page X of ? logic. 
    // Standard approach: render everything, then loop through pages and add footer.

    let yPos = PAGE_TOP_START;

    // Initial Header/Watermark for page 1
    renderPageBase(doc, 1, 0); // 0 means Y unknown yet

    // Title
    doc.setFontSize(16);
    doc.setTextColor(30, 64, 175);
    doc.setFont('helvetica', 'bold');
    doc.text(data.title, 12, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(data.subtitle || "Amortization Schedule", 12, yPos);
    yPos += 12;

    // Summary Details (Fixed block)
    yPos = renderSection(doc, "Assessment Summary", yPos);
    data.details.slice(0, 6).forEach(item => {
        yPos = renderKeyValueBlock(doc, item.label, item.value, yPos);
    });

    yPos += 10;
    yPos = renderSection(doc, "Monthly Repayment Schedule", yPos);

    yPos = renderAmortizationTable(doc, data.schedule, yPos);

    // Patch Page Numbers
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        renderFooter(doc, i, totalPages);
    }

    doc.save(fileName);
};
