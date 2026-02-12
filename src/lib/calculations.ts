export type RepaymentMethod = "reducing" | "flat" | "fixed" | "bullet";

export interface EMICalcInput {
    principal: number;
    annualRate: number;
    tenureMonths: number;
    method: RepaymentMethod;
}

export interface EMICalcOutput {
    emi: number;
    monthlyInterest: number; // For bullet loans
    totalInterest: number;
    totalPayable: number;
    finalPayment: number; // For bullet loans
}

export const calculateEMI = (input: EMICalcInput): EMICalcOutput => {
    const { principal: P, annualRate: R_annual, tenureMonths: N, method } = input;
    const R = R_annual / 100; // Decimal rate

    let emi = 0;
    let totalPayable = 0;
    let totalInterest = 0;
    let monthlyInterest = 0;
    let finalPayment = 0;

    if (P <= 0 || N <= 0) {
        return { emi: 0, monthlyInterest: 0, totalInterest: 0, totalPayable: 0, finalPayment: 0 };
    }

    switch (method) {
        case "reducing": {
            // Standard EMI formula: P * r * (1+r)^n / ((1+r)^n - 1)
            const r = R / 12;
            if (r === 0) {
                emi = P / N;
            } else {
                emi = (P * r * Math.pow(1 + r, N)) / (Math.pow(1 + r, N) - 1);
            }
            totalPayable = emi * N;
            totalInterest = totalPayable - P;
            break;
        }

        case "flat": {
            // Interest = principal × annualRate × (tenureMonths / 12)
            // EMI = (principal + interest) / tenureMonths
            totalInterest = P * R * (N / 12);
            totalPayable = P + totalInterest;
            emi = totalPayable / N;
            break;
        }

        case "fixed": {
            // Fixed Rate (Annual Rest)
            // annualEMI = P × R / (1 − (1+R)^−years)
            // Monthly EMI = annualEMI / 12
            const years = N / 12;
            if (R === 0) {
                emi = P / N;
            } else {
                const annualEMI = (P * R) / (1 - Math.pow(1 + R, -years));
                emi = annualEMI / 12;
            }
            totalPayable = emi * N;
            totalInterest = totalPayable - P;
            break;
        }

        case "bullet": {
            // Maturity amount: A = P × (1 + R/12)^tenureMonths
            // Monthly interest = P × (R/12)
            // Final payment = maturity amount. EMI = 0
            const r = R / 12;
            finalPayment = P * Math.pow(1 + r, N);
            monthlyInterest = P * r;
            totalPayable = finalPayment;
            totalInterest = finalPayment - P;
            emi = 0;
            break;
        }
    }

    return {
        emi,
        monthlyInterest,
        totalInterest,
        totalPayable,
        finalPayment
    };
};
