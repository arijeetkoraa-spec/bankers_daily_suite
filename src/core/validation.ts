import { toDecimal } from './utils';
import type { LoanInput } from './loanEngine';
import type { DepositInput } from './depositEngine';
import type { MSMEInput } from './msmeEngine';

export interface ValidationError {
    field: string;
    message: string;
}

export interface ValidationResult {
    isValid: boolean;
    errors: ValidationError[];
}

/**
 * VALIDATION: Loan Inputs
 */
export const validateLoanInput = (input: LoanInput): ValidationResult => {
    const errors: ValidationError[] = [];
    const P = toDecimal(input.principal);
    const R = toDecimal(input.annualRate);
    const n = toDecimal(input.tenureMonths);

    if (P.lte(0)) errors.push({ field: 'principal', message: 'Principal amount must be greater than zero.' });
    if (R.lt(0) || R.gt(100)) errors.push({ field: 'annualRate', message: 'Annual interest rate must be between 0 and 100.' });
    if (n.lte(0) || n.gt(600)) errors.push({ field: 'tenureMonths', message: 'Tenure must be between 1 and 600 months.' });

    return { isValid: errors.length === 0, errors };
};

/**
 * VALIDATION: Deposit Inputs
 */
export const validateDepositInput = (input: DepositInput): ValidationResult => {
    const errors: ValidationError[] = [];
    const P = toDecimal(input.principal);
    const R = toDecimal(input.annualRate);
    const n = toDecimal(input.tenureMonths);

    if (P.lte(0)) errors.push({ field: 'principal', message: 'Amount must be greater than zero.' });
    if (R.lt(0) || R.gt(100)) errors.push({ field: 'annualRate', message: 'Interest rate must be between 0 and 100.' });
    if (n.lte(0) || n.gt(1200)) errors.push({ field: 'tenureMonths', message: 'Tenure must be between 1 and 1200 months.' });

    return { isValid: errors.length === 0, errors };
};

/**
 * VALIDATION: MSME Inputs
 */
export const validateMSMEInput = (input: MSMEInput): ValidationResult => {
    const errors: ValidationError[] = [];

    if (input.turnover !== undefined && toDecimal(input.turnover).lt(0)) {
        errors.push({ field: 'turnover', message: 'Turnover cannot be negative.' });
    }
    if (input.currentAssets !== undefined && toDecimal(input.currentAssets).lt(0)) {
        errors.push({ field: 'currentAssets', message: 'Current Assets cannot be negative.' });
    }

    return { isValid: errors.length === 0, errors };
};
