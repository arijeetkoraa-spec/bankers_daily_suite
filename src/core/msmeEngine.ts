import { Decimal } from 'decimal.js';
import { roundCurrency, toDecimal } from './utils';

export interface MSMEInput {
    turnover?: string | number;
    currentAssets?: string | number;
    currentLiabilities?: string | number; // Excluding bank borrowing
    marginPercent?: string | number; // Default 25% for Nayak
}

/**
 * ENGINE: Nayak Committee Norms (Turnover Method)
 * Applicable for limits up to Rs. 5 Crores.
 */
export const calculateNayakWC = (input: MSMEInput) => {
    const turnover = toDecimal(input.turnover || 0);

    if (turnover.lte(0)) return { requirement: new Decimal(0), margin: new Decimal(0), limit: new Decimal(0) };

    const requirement = turnover.mul(0.25);
    const margin = turnover.mul(0.05); // 5% of turnover is min margin
    const limit = turnover.mul(0.20); // 20% of turnover is bank finance

    return {
        requirement: roundCurrency(requirement),
        margin: roundCurrency(margin),
        limit: roundCurrency(limit)
    };
};

/**
 * ENGINE: Tandon Committee Method II (MPBF Method)
 */
export const calculateTandonMPBF = (input: MSMEInput) => {
    const ca = toDecimal(input.currentAssets || 0);
    const cl = toDecimal(input.currentLiabilities || 0);

    if (ca.lte(0)) return { gap: new Decimal(0), margin: new Decimal(0), mpbf: new Decimal(0) };

    const gap = ca.minus(cl);
    const mpbf = gap.mul(0.75); // 75% of Gap
    const margin = gap.minus(mpbf); // 25% is margin

    return {
        gap: roundCurrency(gap),
        margin: roundCurrency(margin),
        mpbf: roundCurrency(mpbf.gt(0) ? mpbf : 0)
    };
};
