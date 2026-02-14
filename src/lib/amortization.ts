import { generateAmortizationSchedule as coreGenerateSchedule } from '../core/loanEngine';
import type { RepaymentMethod, AmortizationEntry } from '../core/loanEngine';

export type { AmortizationEntry, RepaymentMethod };

export const generateAmortizationSchedule = (
    principal: number,
    annualRate: number,
    tenureMonths: number,
    method: RepaymentMethod
): AmortizationEntry[] => {
    return coreGenerateSchedule({
        principal,
        annualRate,
        tenureMonths,
        method
    });
};

