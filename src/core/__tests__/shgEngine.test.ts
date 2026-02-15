import { describe, it, expect } from 'vitest';
import {
    calculateSlabRate,
    calculateMonthsElapsed,
    calculateOutstandingAtDate,
    generateSHGAmortization,
    type InterestSlab
} from '../shgEngine';

describe('SHG Engine - Slab Rates', () => {
    const slabs: InterestSlab[] = [
        { limit: 300000, rate: 7 },
        { limit: 500000, rate: 8.85 },
        { limit: 10000000, rate: 11 }
    ];

    it('should apply correct rate for <= 3L', () => {
        expect(calculateSlabRate(300000, slabs)).toBe(7);
        expect(calculateSlabRate(100000, slabs)).toBe(7);
    });

    it('should apply correct rate for <= 5L', () => {
        expect(calculateSlabRate(500000, slabs)).toBe(8.85);
        expect(calculateSlabRate(300001, slabs)).toBe(8.85);
    });

    it('should apply correct rate for > 5L', () => {
        expect(calculateSlabRate(500001, slabs)).toBe(11);
        expect(calculateSlabRate(600000, slabs)).toBe(11);
    });

    it('should respect manual override', () => {
        expect(calculateSlabRate(300000, slabs, 12)).toBe(12);
    });
});

describe('SHG Engine - Date Calculations', () => {
    it('should calculate months elapsed correctly (simple case)', () => {
        // From 2024-01-01 to 2024-03-01 should be 2 months
        expect(calculateMonthsElapsed('2024-01-01', '2024-03-01')).toBe(2);
    });

    it('should return 0 for same month', () => {
        expect(calculateMonthsElapsed('2024-01-01', '2024-01-15')).toBe(0);
    });

    it('should return 0 for negative difference', () => {
        expect(calculateMonthsElapsed('2024-03-01', '2024-01-01')).toBe(0);
    });
});

describe('SHG Engine - Amortization & Outstanding', () => {
    it('should generate full amortization schedule', () => {
        const schedule = generateSHGAmortization(500000, 8.85, 24, '2024-01-01');
        expect(schedule.length).toBe(24);
        expect(schedule[23].balance).toBeCloseTo(0, 2);
    });

    it('should calculate outstanding correctly at a given date', () => {
        // Loan: 100,000, 12%, 12 months, starts 2024-01-01
        // After 6 months (2024-07-01), outstanding should be roughly half
        const principal = 100000;
        const rate = 12;
        const tenure = 12;
        const start = '2024-01-01';
        const review = '2024-07-01'; // 6 months later

        const result = calculateOutstandingAtDate(principal, rate, tenure, start, review);
        expect(result.monthsPaid).toBe(6);
        expect(result.outstanding).toBeLessThan(principal);
        expect(result.outstanding).toBeGreaterThan(0);
    });

    it('should handle missed EMIs', () => {
        const principal = 100000;
        const rate = 12;
        const tenure = 12;
        const start = '2024-01-01';
        const review = '2024-07-01'; // 6 months elapsed

        const resultWithMissed = calculateOutstandingAtDate(principal, rate, tenure, start, review, 2); // 2 missed
        const resultNormal = calculateOutstandingAtDate(principal, rate, tenure, start, review, 0);

        // With missed EMIs, outstanding should be higher (less principal paid)
        expect(resultWithMissed.outstanding).toBeGreaterThan(resultNormal.outstanding);
        expect(resultWithMissed.monthsPaid).toBe(4); // 6 - 2 = 4
    });

    it('should handle partial payments', () => {
        const principal = 100000;
        const rate = 12;
        const tenure = 12;
        const start = '2024-01-01';
        const review = '2024-07-01';

        const partial = 5000;
        const result = calculateOutstandingAtDate(principal, rate, tenure, start, review, 0, partial);
        const resultNormal = calculateOutstandingAtDate(principal, rate, tenure, start, review, 0, 0);

        expect(result.outstanding).toBeCloseTo(resultNormal.outstanding - partial, 2);
    });
});
