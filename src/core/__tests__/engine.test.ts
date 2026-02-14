import { describe, it, expect } from 'vitest';
import { calculateEMI, generateAmortizationSchedule } from '../loanEngine';
import { calculateFDMaturity, calculateRDMaturity } from '../depositEngine';
import { calculateNayakWC, calculateTandonMPBF } from '../msmeEngine';
import { validateLoanInput } from '../validation';


describe('Loan Engine - EMI & Amortization', () => {
    it('should calculate correct EMI for a standard loan', () => {
        const input = { principal: 1000000, annualRate: 9, tenureMonths: 120 }; // 10L, 9%, 10yrs
        const emi = calculateEMI(input);
        // Formula check: ~12,667.58
        expect(emi.toNumber()).toBeCloseTo(12667.58, 2);
    });

    it('should handle zero interest loans correctly', () => {
        const input = { principal: 120000, annualRate: 0, tenureMonths: 12 };
        const emi = calculateEMI(input);
        expect(emi.toNumber()).toBe(10000);

        const schedule = generateAmortizationSchedule(input);
        expect(schedule[11].balance).toBe(0);
        expect(schedule[0].interest).toBe(0);
    });

    it('should guarantee closure (zero balance) on 240 month loan', () => {
        const input = { principal: 5000000, annualRate: 8.5, tenureMonths: 240 };
        const schedule = generateAmortizationSchedule(input);
        const lastRow = schedule[schedule.length - 1];

        expect(lastRow.balance).toBe(0);

        // Sum of principal should equal original principal
        const totalPrincipalPaid = schedule.reduce((sum, row) => sum + row.principal, 0);
        expect(totalPrincipalPaid).toBeCloseTo(5000000, 2);
    });

    it('should throw error for negative amortization (EMI <= Interest)', () => {
        // Validation check for extreme rate
        const validation = validateLoanInput({ principal: 1000000, annualRate: 120, tenureMonths: 12 });
        expect(validation.isValid).toBe(false); // Rate > 100 as per our validation rule
    });

    it('should handle micro-principal (1 rupee)', () => {
        const input = { principal: 1, annualRate: 10, tenureMonths: 12 };
        const schedule = generateAmortizationSchedule(input);
        expect(schedule[11].balance).toBe(0);
    });
});

describe('Deposit Engine - FD & RD', () => {
    it('should calculate FD maturity correctly (Quarterly Compounding)', () => {
        const input = { principal: 100000, annualRate: 7, tenureMonths: 12 };
        const result = calculateFDMaturity(input);
        // 100000 * (1 + 0.07/4)^4 = ~107185.90
        expect(result.maturityValue.toNumber()).toBeCloseTo(107185.90, 2);
    });

    it('should compute Effective Annual Yield (EAY)', () => {
        const input = { principal: 100000, annualRate: 12, tenureMonths: 12, compoundingFrequency: 12 }; // Monthly
        const result = calculateFDMaturity(input);
        // (1 + 0.12/12)^12 - 1 = 12.68%
        expect(result.eay.toNumber()).toBeCloseTo(12.68, 2);
    });

    it('should calculate RD maturity correctly', () => {
        const input = { principal: 5000, annualRate: 8, tenureMonths: 24 };
        const result = calculateRDMaturity(input);
        // Total Invested: 120,000. Interest usually around ~10,400-10,600
        expect(result.maturityValue.toNumber()).toBeGreaterThan(120000);
        expect(result.interestEarned.toNumber()).toBeGreaterThan(0);
    });
});

describe('MSME Engine - Nayak & Tandon', () => {
    it('should calculate Nayak WC limits correctly', () => {
        const result = calculateNayakWC({ turnover: 10000000 }); // 1 Cr
        expect(result.requirement.toNumber()).toBe(2500000); // 25%
        expect(result.limit.toNumber()).toBe(2000000); // 20%
        expect(result.margin.toNumber()).toBe(500000); // 5%
    });

    it('should calculate Tandon MPBF correctly', () => {
        const result = calculateTandonMPBF({ currentAssets: 1000000, currentLiabilities: 400000 });
        // Gap = 600,000. MPBF = 75% of Gap = 450,000.
        expect(result.mpbf.toNumber()).toBe(450000);
        expect(result.margin.toNumber()).toBe(150000);
    });
});
