import { calculateLoanTotals, type RepaymentMethod, type LoanInput } from '../core/loanEngine';

export type { RepaymentMethod };


/**
 * Legacy wrapper for calculateEMI
 */
export const calculateEMI = (input: LoanInput) => {
    return calculateLoanTotals(input);
};
