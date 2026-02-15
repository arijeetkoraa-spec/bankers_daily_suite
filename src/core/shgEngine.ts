import { Decimal } from 'decimal.js';
import { roundCurrency, toDecimal } from './utils';

export interface InterestSlab {
    limit: number;
    rate: number;
}

export interface SHGLoan {
    id: string;
    amount: number;
    startDate: string; // ISO date
    tenure: number;
    rate: number;
    missedEMIs: number;
    partialPayments: number;
}

export interface SHGMember {
    id: string;
    name: string;
    loans: SHGLoan[];
}

export interface SHGGroup {
    name: string;
    sanctionedAmount: number;
    startDate: string;
    tenure: number;
    slabs: InterestSlab[];
    manualRate?: number;
}

export interface SHGAmortizationEntry {
    month: number;
    dueDate: string;
    emi: number;
    principal: number;
    interest: number;
    balance: number;
}

/**
 * ENGINE: Calculate Interest Rate based on Slabs
 */
export const calculateSlabRate = (amount: number, slabs: InterestSlab[], manualRate?: number): number => {
    if (manualRate !== undefined && manualRate > 0) return manualRate;

    // Sort slabs by limit ascending
    const sortedSlabs = [...slabs].sort((a, b) => a.limit - b.limit);

    for (const slab of sortedSlabs) {
        if (amount <= slab.limit) return slab.rate;
    }

    // if (amount <= slab1Limit) else if (amount <= slab2Limit) else ...
    return sortedSlabs.length > 0 ? sortedSlabs[sortedSlabs.length - 1].rate : 0;
};

/**
 * ENGINE: Calculate Months Difference between two dates
 */
export const calculateMonthsElapsed = (startDate: string, endDate: string, tenureMonths?: number): number => {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;

    // Use calendar months difference
    let months = (end.getFullYear() - start.getFullYear()) * 12;
    months -= start.getMonth();
    months += end.getMonth();

    let result = Math.max(0, months);

    // Cap at tenure if provided
    if (tenureMonths !== undefined && result > tenureMonths) {
        return tenureMonths;
    }

    return result;
};

/**
 * ENGINE: Generate Date-Based Amortization Schedule
 */
export const generateSHGAmortization = (
    principal: number,
    annualRate: number,
    tenureMonths: number,
    startDate: string
): SHGAmortizationEntry[] => {
    const P = toDecimal(principal);
    const r = toDecimal(annualRate).div(12).div(100);
    const n = toDecimal(tenureMonths);
    const start = new Date(startDate);

    if (P.lte(0) || n.lte(0) || isNaN(start.getTime())) return [];

    // Monthly EMI calculation (Reducing Balance)
    let emi: Decimal;
    if (r.isZero()) {
        emi = P.div(n);
    } else {
        const powN = r.plus(1).pow(n);
        emi = P.mul(r).mul(powN).div(powN.minus(1));
    }
    const roundedEMI = roundCurrency(emi);

    const schedule: SHGAmortizationEntry[] = [];
    let remainingBalance = P;

    for (let i = 1; i <= tenureMonths; i++) {
        const isLastMonth = i === tenureMonths;
        const interest = roundCurrency(remainingBalance.mul(r));
        let principalPaid: Decimal;

        if (isLastMonth) {
            principalPaid = remainingBalance;
        } else {
            principalPaid = roundedEMI.minus(interest);
            if (principalPaid.gt(remainingBalance)) principalPaid = remainingBalance;
        }

        const currentDueDate = new Date(start);
        currentDueDate.setMonth(start.getMonth() + i);

        schedule.push({
            month: i,
            dueDate: currentDueDate.toISOString().split('T')[0],
            emi: principalPaid.plus(interest).toNumber(),
            principal: principalPaid.toNumber(),
            interest: interest.toNumber(),
            balance: remainingBalance.minus(principalPaid).toNumber()
        });

        remainingBalance = remainingBalance.minus(principalPaid);
    }

    return schedule;
};

/**
 * ENGINE: Calculate Outstanding Balance till a Specific Date
 */
export const calculateOutstandingAtDate = (
    principal: number,
    annualRate: number,
    tenureMonths: number,
    startDate: string,
    reviewDate: string,
    missedEMIs: number = 0,
    partialPayments: number = 0
): {
    outstanding: number;
    emiDue: number;
    monthsPaid: number;
    monthsElapsed: number;
    monthsRemaining: number;
    totalInterest: number;
    totalPaid: number;
} => {
    const schedule = generateSHGAmortization(principal, annualRate, tenureMonths, startDate);
    const monthsElapsed = calculateMonthsElapsed(startDate, reviewDate, tenureMonths);

    // EMI from first row of schedule (consistent with amortization table)
    const emi = schedule.length > 0 ? schedule[0].emi : 0;

    // Total interest over full tenure
    const totalInterestFull = schedule.reduce((acc, row) => acc + row.interest, 0);

    // Effective months paid (subtracting missed ones)
    const effectiveMonths = Math.max(0, monthsElapsed - missedEMIs);
    const monthsRemaining = Math.max(0, tenureMonths - monthsElapsed);

    if (effectiveMonths === 0) {
        return {
            outstanding: Math.max(0, Number((principal - partialPayments).toFixed(2))),
            emiDue: emi,
            monthsPaid: 0,
            monthsElapsed,
            monthsRemaining,
            totalInterest: Number(totalInterestFull.toFixed(2)),
            totalPaid: Number(partialPayments.toFixed(2))
        };
    }

    const monthIndex = Math.min(effectiveMonths, schedule.length) - 1;
    const currentEntry = schedule[monthIndex];

    const outstandingRaw = (currentEntry ? currentEntry.balance : 0) - partialPayments;

    // Total paid = sum of EMIs paid so far + partial payments
    const totalPaid = schedule.slice(0, effectiveMonths).reduce((acc, row) => acc + row.emi, 0) + partialPayments;

    return {
        outstanding: Math.max(0, Number(outstandingRaw.toFixed(2))),
        emiDue: emi,
        monthsPaid: effectiveMonths,
        monthsElapsed,
        monthsRemaining,
        totalInterest: Number(totalInterestFull.toFixed(2)),
        totalPaid: Number(totalPaid.toFixed(2))
    };
};
