import type { RepaymentMethod } from './calculations';

export interface AmortizationEntry {
    month: number;
    emi: number;
    principal: number;
    interest: number;
    balance: number;
}

export const generateAmortizationSchedule = (
    principal: number,
    annualRate: number,
    tenureMonths: number,
    method: RepaymentMethod
): AmortizationEntry[] => {
    const schedule: AmortizationEntry[] = [];
    let remainingBalance = principal;
    const R_annual = annualRate / 100;
    const months = Math.floor(tenureMonths);

    if (principal <= 0 || months <= 0) return [];

    switch (method) {
        case 'reducing': {
            const r = R_annual / 12;
            const emi = r === 0
                ? principal / months
                : (principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);

            for (let i = 1; i <= months; i++) {
                const interest = remainingBalance * r;
                let principalPaid = emi - interest;

                if (i === months) {
                    principalPaid = remainingBalance;
                }

                remainingBalance -= principalPaid;
                schedule.push({
                    month: i,
                    emi: principalPaid + interest,
                    principal: principalPaid,
                    interest: interest,
                    balance: Math.max(0, remainingBalance)
                });
            }
            break;
        }

        case 'flat': {
            const totalInterest = principal * R_annual * (months / 12);
            const monthlyPrincipal = principal / months;
            const monthlyInterest = totalInterest / months;
            const emi = monthlyPrincipal + monthlyInterest;

            for (let i = 1; i <= months; i++) {
                remainingBalance -= monthlyPrincipal;
                schedule.push({
                    month: i,
                    emi,
                    principal: monthlyPrincipal,
                    interest: monthlyInterest,
                    balance: Math.max(0, remainingBalance)
                });
            }
            break;
        }

        case 'fixed': {
            // Annual rest logic
            const r = R_annual;
            const years = months / 12;
            const annualEMI = r === 0
                ? principal / years
                : (principal * r) / (1 - Math.pow(1 + r, -years));
            const monthlyEMI = annualEMI / 12;

            let yearlyPrincipal = principal;
            for (let i = 1; i <= months; i++) {
                // In Annual Rest, interest is calculated on the balance at the start of the year
                const monthInYear = (i - 1) % 12;

                if (monthInYear === 0 && i > 1) {
                    // Update yearly balance for interest calc
                    yearlyPrincipal = remainingBalance;
                }

                const interest = (yearlyPrincipal * r) / 12;
                let principalPaid = monthlyEMI - interest;

                if (i === months) {
                    principalPaid = remainingBalance;
                }

                remainingBalance -= principalPaid;
                schedule.push({
                    month: i,
                    emi: principalPaid + interest,
                    principal: principalPaid,
                    interest: interest,
                    balance: Math.max(0, remainingBalance)
                });
            }
            break;
        }

        case 'bullet': {
            const r = R_annual / 12;
            const monthlyInterest = principal * r;

            for (let i = 1; i <= months; i++) {
                const isLastMonth = i === months;
                const interest = monthlyInterest;
                const principalPaid = isLastMonth ? principal : 0;

                if (isLastMonth) {
                    remainingBalance = 0;
                }

                schedule.push({
                    month: i,
                    emi: principalPaid + interest,
                    principal: principalPaid,
                    interest: interest,
                    balance: remainingBalance
                });
            }
            break;
        }
    }

    return schedule;
};
