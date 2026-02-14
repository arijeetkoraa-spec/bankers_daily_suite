import { Decimal } from 'decimal.js';
import { roundCurrency, toDecimal } from './utils';

export interface DepositInput {
    principal: string | number;
    annualRate: string | number;
    tenureMonths: string | number;
    compoundingFrequency?: number; // 4 for Quarterly, 12 for Monthly, 1 for Annual
}

/**
 * ENGINE: Fixed Deposit (FD) Maturity
 * Standard formula: A = P * (1 + r/n)^(n*t)
 */
export const calculateFDMaturity = (input: DepositInput): { maturityValue: Decimal; interestEarned: Decimal; eay: Decimal } => {
    const P = toDecimal(input.principal);
    const R = toDecimal(input.annualRate);
    const t_months = toDecimal(input.tenureMonths);
    const n = toDecimal(input.compoundingFrequency || 4); // Default to Quarterly

    if (P.lte(0) || t_months.lte(0)) return { maturityValue: new Decimal(0), interestEarned: new Decimal(0), eay: new Decimal(0) };

    const t_years = t_months.div(12);
    const r = R.div(100);

    // Rate per compounding period
    const r_per_n = r.div(n);

    // total compounding periods
    const nt = n.mul(t_years);

    // A = P * (1 + r/n)^nt
    const maturityValue = P.mul(r_per_n.plus(1).pow(nt));
    const interestEarned = maturityValue.minus(P);

    // Effective Annual Yield (EAY) = (1 + r/n)^n - 1
    const eay = r_per_n.plus(1).pow(n).minus(1).mul(100);

    return {
        maturityValue: roundCurrency(maturityValue),
        interestEarned: roundCurrency(interestEarned),
        eay: roundCurrency(eay)
    };
};

/**
 * ENGINE: Recurring Deposit (RD) Maturity
 * Standard formula: A = P * [(1 + r/n)^(n*t) - 1] / (1 - (1 + r/n)^(-1/3)) // Simplified approximation variant often used
 * Better logic: Sum of individual monthly contributions compounded for remaining duration.
 */
export const calculateRDMaturity = (input: DepositInput): { maturityValue: Decimal; interestEarned: Decimal } => {
    const P = toDecimal(input.principal); // Monthly installment
    const R = toDecimal(input.annualRate);
    const tenureMonths = Math.floor(toDecimal(input.tenureMonths).toNumber());
    const n = toDecimal(input.compoundingFrequency || 4); // Quarterly compounding is standard in many Indian banks for RD too

    if (P.lte(0) || tenureMonths <= 0) return { maturityValue: new Decimal(0), interestEarned: new Decimal(0) };

    const r = R.div(100);
    const r_per_n = r.div(n);

    let maturityValue = new Decimal(0);

    for (let month = 1; month <= tenureMonths; month++) {
        // Remaining time for this specific installment in years
        const remainingMonths = new Decimal(tenureMonths - month + 1);
        const t_years = remainingMonths.div(12);

        // This installment compounds for t_years
        const installmentMaturity = P.mul(r_per_n.plus(1).pow(n.mul(t_years)));
        maturityValue = maturityValue.plus(installmentMaturity);
    }

    const totalInvested = P.mul(tenureMonths);
    const interestEarned = maturityValue.minus(totalInvested);

    return {
        maturityValue: roundCurrency(maturityValue),
        interestEarned: roundCurrency(interestEarned)
    };
};

/**
 * ENGINE: Premature Withdrawal
 */
export interface PrematureInput {
    product: 'FD' | 'RD' | 'MIS' | 'QIS';
    principal: Decimal | number;
    bookedRate: Decimal | number;
    cardRateForTenure: Decimal | number;
    penalty: Decimal | number;
    completedMonths: Decimal | number;
    completedInstallments?: number;
    interestAlreadyPaid?: Decimal | number;
}

export const calculatePrematurePayout = (input: PrematureInput) => {
    const P = toDecimal(input.principal);
    const bookedRate = toDecimal(input.bookedRate);
    const cardRateForTenure = toDecimal(input.cardRateForTenure);
    const penalty = toDecimal(input.penalty);
    const completedMonths = toDecimal(input.completedMonths);
    const product = input.product;

    let effectiveRate = Decimal.min(bookedRate, cardRateForTenure).minus(penalty);
    if (effectiveRate.lt(0)) effectiveRate = new Decimal(0);

    const r = effectiveRate.div(100);
    const n = new Decimal(4); // Quarterly
    const t = completedMonths.div(12);

    let interestEarned = new Decimal(0);
    let maturityBeforeRecovery = new Decimal(0);
    let interestRecovery = new Decimal(0);

    if (product === 'RD') {
        const installments = input.completedInstallments || 0;
        let totalVal = new Decimal(0);
        const r_per_n = r.div(n);
        for (let i = 0; i < installments; i++) {
            const monthsInAccount = completedMonths.minus(i);
            if (monthsInAccount.gt(0)) {
                totalVal = totalVal.plus(P.mul(r_per_n.plus(1).pow(n.mul(monthsInAccount.div(12)))));
            } else {
                totalVal = totalVal.plus(P);
            }
        }
        maturityBeforeRecovery = totalVal;
        interestEarned = totalVal.minus(P.mul(installments));
    } else {
        maturityBeforeRecovery = P.mul(r.div(n).plus(1).pow(n.mul(t)));
        interestEarned = maturityBeforeRecovery.minus(P);

        if ((product === 'MIS' || product === 'QIS') && input.interestAlreadyPaid) {
            const paid = toDecimal(input.interestAlreadyPaid);
            if (paid.gt(interestEarned)) {
                interestRecovery = paid.minus(interestEarned);
            }
        }
    }

    const netPayout = product === 'RD' ? maturityBeforeRecovery : P.minus(interestRecovery);

    return {
        effectiveRate: roundCurrency(effectiveRate),
        interestEarned: roundCurrency(interestEarned),
        interestRecovery: roundCurrency(interestRecovery),
        netPayout: roundCurrency(netPayout),
        maturityBeforeRecovery: roundCurrency(maturityBeforeRecovery)
    };
};

