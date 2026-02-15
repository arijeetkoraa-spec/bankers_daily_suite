export const HEADER = "⭕ BANKERS DAILY SUITE";
export const DIVIDER = "──────────────────";

export interface ShareField {
    key: string;
    label: string;
    value: string;
    type: 'input' | 'option' | 'result';
}

export const calculatorConfigMap: Record<string, { title: string, results: string[] }> = {
    // Loans
    emi: { title: "EMI LOAN ASSESSMENT", results: ["monthlyEmi", "totalPayable", "totalInterest"] },
    gold: { title: "GOLD LOAN ASSESSMENT", results: ["netDisbursement", "monthlyEmi", "appliedLtv"] },
    kcc: { title: "KCC LIMIT ASSESSMENT", results: ["kccLimit"] },
    reverse: { title: "REVERSE LOAN ANALYSIS", results: ["loanAmount"] },
    'loan-compare': { title: "LOAN COMPARISON MATRIX", results: ["monthlySaving", "interestSaving", "bestChoice"] },
    takeover: { title: "TAKEOVER BENEFIT AUDIT", results: ["totalBenefit", "monthlySaving"] },

    // MSME
    'working-capital': { title: "WORKING CAPITAL ASSESSMENT", results: ["mpbfLimit", "wcGap"] },
    'drawing-power': { title: "DRAWING POWER AUDIT", results: ["drawingPower"] },
    ratios: { title: "FINANCIAL RATIO ANALYSIS", results: ["dscr", "risk", "currentRatio", "leverageRatio", "bep"] },
    fees: { title: "CGTMSE FEE ASSESSMENT", results: ["annualFee", "quarterlyFee"] },

    // Deposits
    fd: { title: "FIXED DEPOSIT GROWTH", results: ["maturityValue", "interestEarned"] },
    rd: { title: "RECURRING DEPOSIT SUMMARY", results: ["maturityValue", "interestEarned"] },
    mis: { title: "MONTHLY INCOME PLAN", results: ["monthlyPayout", "annualCashflow"] },
    qis: { title: "QUARTERLY INCOME PLAN", results: ["quarterlyPayout", "annualCashflow"] },

    // Utilities
    'cash-counter': { title: "CASH DENOMINATION AUDIT", results: ["totalAmount", "totalNotes"] },
    gst: { title: "GST TAX ASSESSMENT", results: ["gstAmount", "totalAmount"] },
    date: { title: "DATE DYNAMICS ANALYSIS", results: ["differenceDays"] },
    converter: { title: "MEASUREMENT MATRIX", results: ["conversionResult"] },
    shg: { title: "SHG LOAN MONITORING", results: ["totalMemberOutstanding", "balanceStatus"] }
};

export const buildWhatsappMessage = (calculatorKey: string, fields: ShareField[]): string => {
    const config = calculatorConfigMap[calculatorKey] || {
        title: calculatorKey.toUpperCase().replace(/-/g, ' '),
        results: []
    };

    const inputs = fields.filter(f => f.type === 'input');
    const options = fields.filter(f => f.type === 'option');
    const results = fields.filter(f => f.type === 'result');

    let message = `${HEADER}\n${DIVIDER}\n\n`;
    message += `🧮 ${config.title}\n\n`;

    if (inputs.length > 0) {
        message += `📋 INPUT DETAILS\n`;
        inputs.forEach(f => message += `${f.label}: ${f.value}\n`);
        message += `\n`;
    }

    if (options.length > 0) {
        message += `⚙️ SELECTED OPTIONS\n`;
        options.forEach(f => message += `${f.label}: ${f.value}\n`);
        message += `\n`;
    }

    if (results.length > 0) {
        message += `📈 RESULT SUMMARY\n`;
        results.forEach(f => message += `${f.label}: ${f.value}\n`);
        message += `\n`;
    }

    message += `${DIVIDER}\n`;
    message += `🔗 https://bankersdailysuite.vercel.app\n`;
    message += `👨‍💻 Developed by Bankers Daily Suite | Arijit Kora`;

    return message;
};
