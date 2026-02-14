import { calculateFDMaturity, calculateRDMaturity, calculatePrematurePayout as corePrematurePayout, type PrematureInput } from '../core/depositEngine';

/**
 * Legacy wrapper for maturity calculations
 */
export const calculateMaturity = (product: 'FD' | 'RD', principal: number, rate: number, tenureMonths: number) => {
    if (product === 'FD') {
        const res = calculateFDMaturity({ principal, annualRate: rate, tenureMonths });
        return res.maturityValue.toNumber();
    } else {
        const res = calculateRDMaturity({ principal, annualRate: rate, tenureMonths });
        return res.maturityValue.toNumber();
    }
};

/**
 * Legacy wrapper for premature payout
 */
export const calculatePrematurePayout = (input: PrematureInput) => {
    const res = corePrematurePayout(input);
    return {
        ...res,
        effectiveRate: res.effectiveRate.toNumber(),
        interestEarned: res.interestEarned.toNumber(),
        interestRecovery: res.interestRecovery.toNumber(),
        netPayout: res.netPayout.toNumber(),
        maturityBeforeRecovery: res.maturityBeforeRecovery.toNumber()
    };
};
