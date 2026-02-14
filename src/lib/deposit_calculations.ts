import {
    calculateFDMaturity,
    calculateRDMaturity,
    calculatePrematurePayout as coreCalculatePrematurePayout
} from '../core/depositEngine';
import type { PrematureInput as CorePrematureInput } from '../core/depositEngine';

export type DepositProduct = 'FD' | 'RD' | 'MIS' | 'QIS';

export interface PrematureInput {
    product: DepositProduct;
    principal: number;
    bookedRate: number;
    cardRateForTenure: number;
    penalty: number;
    completedMonths: number;
    completedInstallments?: number;
    interestAlreadyPaid?: number;
}

export interface PrematureOutput {
    effectiveRate: number;
    interestEarned: number;
    interestRecovery: number;
    netPayout: number;
    maturityBeforeRecovery: number;
}

/**
 * WRAPPER: Maturity Calculation
 */
export const calculateMaturity = (product: DepositProduct, principal: number, rate: number, months: number): number => {
    if (product === 'RD') {
        return calculateRDMaturity({ principal, annualRate: rate, tenureMonths: months }).maturityValue.toNumber();
    } else if (product === 'FD' || product === 'MIS' || product === 'QIS') {
        if (product === 'MIS' || product === 'QIS') return principal;
        return calculateFDMaturity({ principal, annualRate: rate, tenureMonths: months }).maturityValue.toNumber();
    }
    return 0;
};

/**
 * WRAPPER: Premature Payout
 */
export const calculatePrematurePayout = (input: PrematureInput): PrematureOutput => {
    const coreInput: CorePrematureInput = {
        ...input,
        product: input.product
    };

    const result = coreCalculatePrematurePayout(coreInput);

    return {
        effectiveRate: result.effectiveRate.toNumber(),
        interestEarned: result.interestEarned.toNumber(),
        interestRecovery: result.interestRecovery.toNumber(),
        netPayout: result.netPayout.toNumber(),
        maturityBeforeRecovery: result.maturityBeforeRecovery.toNumber()
    };
};
