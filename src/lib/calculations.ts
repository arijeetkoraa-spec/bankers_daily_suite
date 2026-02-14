import type { RepaymentMethod, LoanInput } from '../core/loanEngine';
import { calculateLoanTotals } from '../core/loanEngine';

export type { RepaymentMethod };

export interface EMICalcInput {
    principal: number;
    annualRate: number;
    tenureMonths: number;
    method: RepaymentMethod;
}

export interface EMICalcOutput {
    emi: number;
    monthlyInterest: number;
    totalInterest: number;
    totalPayable: number;
    finalPayment: number;
}

/**
 * WRAPPER: EMI Calculation
 * Consumes the hardened /core/loanEngine.ts
 */
export const calculateEMI = (input: EMICalcInput): EMICalcOutput => {
    const loanInput: LoanInput = {
        principal: input.principal,
        annualRate: input.annualRate,
        tenureMonths: input.tenureMonths,
        method: input.method
    };

    const result = calculateLoanTotals(loanInput);

    return {
        emi: result.emi.toNumber(),
        monthlyInterest: result.monthlyInterest.toNumber(),
        totalInterest: result.totalInterest.toNumber(),
        totalPayable: result.totalPayable.toNumber(),
        finalPayment: result.finalPayment.toNumber()
    };
};
