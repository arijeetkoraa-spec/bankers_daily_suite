/**
 * Unified Deposit Calculation Engine for Indian Banking (2024-2026 Norms)
 */

export type DepositProduct = 'FD' | 'RD' | 'MIS' | 'QIS';

export interface PrematureInput {
    product: DepositProduct;
    principal: number; // monthly installment for RD
    bookedRate: number;
    cardRateForTenure: number;
    penalty: number;
    completedMonths: number;
    completedInstallments?: number; // for RD
    interestAlreadyPaid?: number; // for MIS/QIS
}

export interface PrematureOutput {
    effectiveRate: number;
    interestEarned: number;
    interestRecovery: number;
    netPayout: number;
    maturityBeforeRecovery: number;
}

/**
 * Calculates maturity value for normal deposit completion
 */
export const calculateMaturity = (product: DepositProduct, principal: number, rate: number, months: number): number => {
    const r = rate / 100;
    const n = 4; // Quarterly compounding
    const t = months / 12;

    if (product === 'RD') {
        let total = 0;
        const r_q = r / n;
        for (let i = 0; i < months; i++) {
            const monthsInvested = months - i;
            total += principal * Math.pow(1 + r_q, monthsInvested / 3);
        }
        return total;
    } else if (product === 'MIS') {
        // MIS is discounted payout, principal remains same
        return principal;
    } else if (product === 'QIS') {
        // QIS is periodic payout, principal remains same
        return principal;
    } else {
        // FD (Cumulative)
        return principal * Math.pow(1 + r / n, n * t);
    }
}

/**
 * Calculates premature withdrawal value according to Indian banking norms
 */
export const calculatePrematurePayout = (input: PrematureInput): PrematureOutput => {
    const {
        product, principal, bookedRate, cardRateForTenure,
        penalty, completedMonths, completedInstallments = 0, interestAlreadyPaid = 0
    } = input;

    // 1. Effective Rate Logics
    let effectiveRate = Math.min(bookedRate, cardRateForTenure) - penalty;
    if (effectiveRate < 0) effectiveRate = 0;

    const r = effectiveRate / 100;
    const n = 4; // Quarterly compounding
    const t = completedMonths / 12;

    let interestEarned = 0;
    let maturityBeforeRecovery = 0;
    let interestRecovery = 0;

    if (product === 'RD') {
        let totalMaturity = 0;
        const r_q = r / n;
        for (let i = 0; i < completedInstallments; i++) {
            const monthsInAccount = completedMonths - i;
            if (monthsInAccount > 0) {
                totalMaturity += principal * Math.pow(1 + r_q, monthsInAccount / 3);
            } else {
                totalMaturity += principal;
            }
        }
        maturityBeforeRecovery = totalMaturity;
        interestEarned = totalMaturity - (principal * completedInstallments);
    } else {
        // FD, MIS, QIS use standard compounding for interest earning calculation
        maturityBeforeRecovery = principal * Math.pow(1 + r / n, n * t);
        interestEarned = maturityBeforeRecovery - principal;

        if (product === 'MIS' || product === 'QIS') {
            if (interestAlreadyPaid > interestEarned) {
                interestRecovery = interestAlreadyPaid - interestEarned;
            }
        }
    }

    const netPayout = (product === 'RD') ? maturityBeforeRecovery : (principal - interestRecovery);

    return {
        effectiveRate,
        interestEarned,
        interestRecovery,
        netPayout,
        maturityBeforeRecovery
    };
}
