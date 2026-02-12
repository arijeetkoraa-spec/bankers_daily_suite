import { jsPDF } from 'jspdf';

export interface PDFData {
    title: string;
    subtitle?: string;
    details: { label: string; value: string }[];
    footer?: string;
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

export const exportToPDF = (data: PDFData, fileName: string = 'report.pdf') => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = 20;

    const drawHeader = () => {
        doc.setFillColor(30, 64, 175); // Banking Blue
        doc.rect(10, 10, pageWidth - 20, 25, 'F');
        doc.setFontSize(24);
        doc.setTextColor(255);
        doc.setFont('helvetica', 'bold');
        doc.text("BANKER'S DAILY", pageWidth / 2, 27, { align: 'center' });

        // Border for the whole page
        doc.setDrawColor(30, 64, 175);
        doc.setLineWidth(0.5);
        doc.rect(10, 10, pageWidth - 20, 277);
    };

    drawHeader();
    yPos = 45;

    // Title
    doc.setFontSize(18);
    doc.setTextColor(30, 64, 175);
    doc.setFont('helvetica', 'bold');
    doc.text(data.title, 20, yPos);
    yPos += 10;

    if (data.subtitle) {
        doc.setFontSize(12);
        doc.setTextColor(100);
        doc.setFont('helvetica', 'normal');
        doc.text(data.subtitle, 20, yPos);
        yPos += 15;
    }

    // Details/Rows
    doc.setFontSize(10);
    doc.setTextColor(0);

    data.details.forEach(item => {
        if (yPos > 260) {
            // New Page
            doc.addPage();
            drawHeader();
            yPos = 45;

            // Re-identify context if needed, but for general reports we just continue
            doc.setFontSize(10);
            doc.setTextColor(0);
        }

        if (item.label.startsWith('---')) {
            yPos += 5;
            const sectionTitle = item.label.replace(/-/g, '').trim();

            // Section Header Bar
            doc.setFillColor(240, 244, 255);
            doc.rect(15, yPos - 5, pageWidth - 30, 8, 'F');

            doc.setFontSize(11);
            doc.setTextColor(30, 64, 175);
            doc.setFont('helvetica', 'bold');
            doc.text(sectionTitle, 20, yPos);

            yPos += 10;
            doc.setFontSize(10);
            doc.setTextColor(0);
        } else {
            doc.setFont('helvetica', 'normal');
            doc.text(item.label, 25, yPos);

            doc.setFont('helvetica', 'bold');
            // Right-aligned values for better readability
            doc.text(item.value, pageWidth - 25, yPos, { align: 'right' });

            // Subtle dotted line
            doc.setDrawColor(230);
            doc.setLineWidth(0.1);
            doc.line(25, yPos + 2, pageWidth - 25, yPos + 2);

            yPos += 8;
        }
    });

    // Final Footer
    const footerText = "Developed By ARIJIT KORA | Banker's Daily Suite";
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.setFont('helvetica', 'italic');
    doc.text(footerText, pageWidth / 2, 285, { align: 'center' });

    doc.save(fileName);
};

export const exportAmortizationToPDF = (data: AmortizationPDFData, fileName: string = 'amortization-schedule.pdf') => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = 20;

    const addFooter = () => {
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.setFont('helvetica', 'italic');
        const footerText = "Developed By ARIJIT KORA";
        doc.text(footerText, pageWidth / 2, 285, { align: 'center' });
    };

    // Branding Header
    doc.setFillColor(30, 64, 175);
    doc.rect(10, 10, pageWidth - 20, 25, 'F');
    doc.setFontSize(24);
    doc.setTextColor(255);
    doc.setFont('helvetica', 'bold');
    doc.text("BANKER'S DAILY", pageWidth / 2, 27, { align: 'center' });

    yPos = 45;

    // Title & Summary
    doc.setFontSize(18);
    doc.setTextColor(30, 64, 175);
    doc.text(data.title, 20, yPos);
    yPos += 10;

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(data.subtitle || "Amortization Schedule", 20, yPos);
    yPos += 10;

    // Summary Box
    doc.setFillColor(245, 247, 250);
    doc.setDrawColor(230);
    doc.rect(20, yPos, pageWidth - 40, 25, 'FD');

    doc.setFontSize(9);
    doc.setTextColor(50);
    doc.setFont('helvetica', 'normal');

    const summaryX = [25, 65, 105, 145];
    const summaryLabels = data.details.slice(0, 4);

    summaryLabels.forEach((item, i) => {
        doc.setFont('helvetica', 'bold');
        doc.text(item.label, summaryX[i], yPos + 8);
        doc.setFont('helvetica', 'normal');
        doc.text(item.value, summaryX[i], yPos + 16);
    });

    yPos += 35;

    // Table Header
    doc.setFillColor(30, 64, 175);
    doc.rect(20, yPos, pageWidth - 40, 8, 'F');
    doc.setTextColor(255);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');

    const cols = [25, 45, 80, 115, 150];
    doc.text("Month", cols[0], yPos + 5.5);
    doc.text("EMI", cols[1], yPos + 5.5);
    doc.text("Principal", cols[2], yPos + 5.5);
    doc.text("Interest", cols[3], yPos + 5.5);
    doc.text("Balance", cols[4], yPos + 5.5);

    yPos += 8;

    // Table Rows
    doc.setTextColor(0);
    doc.setFont('helvetica', 'normal');
    const format = (val: number) => `Rs. ${val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    data.schedule.forEach((row, index) => {
        if (index % 2 === 0) {
            doc.setFillColor(252, 252, 252);
            doc.rect(20, yPos, pageWidth - 40, 7, 'F');
        }

        doc.text(row.month.toString(), cols[0], yPos + 5);
        doc.text(format(row.emi), cols[1], yPos + 5);
        doc.text(format(row.principal), cols[2], yPos + 5);
        doc.text(format(row.interest), cols[3], yPos + 5);
        doc.text(format(row.balance), cols[4], yPos + 5);

        yPos += 7;

        if (yPos > 270) {
            addFooter();
            doc.addPage();
            yPos = 20;
            // Draw header on new page
            doc.setFillColor(30, 64, 175);
            doc.rect(20, yPos, pageWidth - 40, 8, 'F');
            doc.setTextColor(255);
            doc.setFont('helvetica', 'bold');
            doc.text("Month", cols[0], yPos + 5.5);
            doc.text("EMI", cols[1], yPos + 5.5);
            doc.text("Principal", cols[2], yPos + 5.5);
            doc.text("Interest", cols[3], yPos + 5.5);
            doc.text("Balance", cols[4], yPos + 5.5);
            yPos += 10;
            doc.setTextColor(0);
            doc.setFont('helvetica', 'normal');
        }
    });

    addFooter();
    doc.save(fileName);
};
