import { Decimal } from 'decimal.js';
import { roundCurrency, toDecimal } from './utils';

export type RepaymentMethod = "reducing" | "flat" | "fixed" | "bullet";

export interface AmortizationEntry {
    month: number;
    emi: number;
    principal: number;
    interest: number;
    balance: number;
}

export interface LoanInput {
    principal: string | number;
    annualRate: string | number;
    tenureMonths: string | number;
    method?: RepaymentMethod;
}

export interface EMICalcOutput {
    emi: Decimal;
    monthlyInterest: Decimal; // For bullet loans
    totalInterest: Decimal;
    totalPayable: Decimal;
    finalPayment: Decimal; // For bullet loans
}

/**
 * ENGINE: Calculate EMI and Totals
 */
export const calculateLoanTotals = (input: LoanInput): EMICalcOutput => {
    const P = toDecimal(input.principal);
    const annualRate = toDecimal(input.annualRate);
    const n = toDecimal(input.tenureMonths);
    const method = input.method || "reducing";

    const result: EMICalcOutput = {
        emi: new Decimal(0),
        monthlyInterest: new Decimal(0),
        totalInterest: new Decimal(0),
        totalPayable: new Decimal(0),
        finalPayment: new Decimal(0)
    };

    if (P.lte(0) || n.lte(0)) return result;

    const r = annualRate.div(12).div(100);

    switch (method) {
        case "reducing": {
            if (r.isZero()) {
                result.emi = P.div(n);
            } else {
                const onePlusR = r.plus(1);
                const powN = onePlusR.pow(n);
                result.emi = P.mul(r).mul(powN).div(powN.minus(1));
            }
            result.totalPayable = result.emi.mul(n);
            result.totalInterest = result.totalPayable.minus(P);
            break;
        }

        case "flat": {
            result.totalInterest = P.mul(annualRate.div(100)).mul(n.div(12));
            result.totalPayable = P.plus(result.totalInterest);
            result.emi = result.totalPayable.div(n);
            break;
        }

        case "fixed": { // Annual Rest
            const R_annual = annualRate.div(100);
            const years = n.div(12);
            if (R_annual.isZero()) {
                result.emi = P.div(n);
            } else {
                const annualEMI = P.mul(R_annual).div(new Decimal(1).minus(new Decimal(1).plus(R_annual).pow(years.neg())));
                result.emi = annualEMI.div(12);
            }
            result.totalPayable = result.emi.mul(n);
            result.totalInterest = result.totalPayable.minus(P);
            break;
        }

        case "bullet": {
            result.finalPayment = P.mul(r.plus(1).pow(n));
            result.monthlyInterest = P.mul(r);
            result.totalPayable = result.finalPayment;
            result.totalInterest = result.finalPayment.minus(P);
            result.emi = new Decimal(0);
            break;
        }
    }

    // Negative Amortization Check for reducing loans
    if (method === "reducing" && r.gt(0)) {
        const minInterest = P.mul(r);
        if (result.emi.lte(minInterest)) {
            throw new Error("EMI too low: Negative amortization detected.");
        }
    }

    return result;
};

/**
 * ENGINE: Generate Amortization Schedule
 */
export const generateAmortizationSchedule = (input: LoanInput): AmortizationEntry[] => {
    const P = toDecimal(input.principal);
    const annualRate = toDecimal(input.annualRate);
    const tenureMonths = Math.floor(toDecimal(input.tenureMonths).toNumber());
    const method = input.method || "reducing";

    if (P.lte(0) || tenureMonths <= 0) return [];

    const schedule: AmortizationEntry[] = [];
    let remainingBalance = P;
    const r = annualRate.div(12).div(100);
    const totals = calculateLoanTotals(input);
    const emi = roundCurrency(totals.emi);

    for (let i = 1; i <= tenureMonths; i++) {
        const isLastMonth = i === tenureMonths;
        let interest: Decimal;
        let principal: Decimal;
        let monthlyPayment: Decimal;

        if (method === "reducing") {
            if (isLastMonth) {
                principal = remainingBalance;
                interest = roundCurrency(remainingBalance.mul(r));
                monthlyPayment = principal.plus(interest);
                remainingBalance = new Decimal(0);
            } else {
                interest = roundCurrency(remainingBalance.mul(r));
                principal = emi.minus(interest);
                if (principal.gt(remainingBalance)) principal = remainingBalance;
                remainingBalance = remainingBalance.minus(principal);
                monthlyPayment = emi;
            }
        } else if (method === "flat") {
            const monthlyInt = totals.totalInterest.div(tenureMonths);
            interest = roundCurrency(monthlyInt);
            principal = isLastMonth ? remainingBalance : roundCurrency(emi.minus(interest));
            remainingBalance = remainingBalance.minus(principal);
            monthlyPayment = emi;
        } else if (method === "bullet") {
            interest = roundCurrency(remainingBalance.mul(r));
            principal = isLastMonth ? remainingBalance : new Decimal(0);
            monthlyPayment = isLastMonth ? principal.plus(interest) : interest;
            remainingBalance = remainingBalance.minus(principal);
        } else { // fixed/others
            interest = roundCurrency(remainingBalance.mul(r));
            principal = emi.minus(interest);
            if (principal.gt(remainingBalance)) principal = remainingBalance;
            remainingBalance = remainingBalance.minus(principal);
            monthlyPayment = emi;
        }

        schedule.push({
            month: i,
            emi: roundCurrency(monthlyPayment).toNumber(),
            principal: roundCurrency(principal).toNumber(),
            interest: roundCurrency(interest).toNumber(),
            balance: roundCurrency(remainingBalance).toNumber()
        });
    }

    return schedule;
};

// Legacy alias for compatibility if needed during migration
export const calculateEMI = (input: LoanInput): Decimal => calculateLoanTotals(input).emi;
