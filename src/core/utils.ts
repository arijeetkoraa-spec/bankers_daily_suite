import { Decimal } from 'decimal.js';

/**
 * FINANCIAL ROUNDING POLICY
 * Banking standards typically require 2-decimal precision for all reporting and 
 * intermediate balance tracking.
 */
export const ROUNDING_DP = 2;
export const ROUNDING_MODE = Decimal.ROUND_HALF_UP;

/**
 * UTILITY: Round to standard currency decimals
 */
export const roundCurrency = (value: Decimal | number): Decimal => {
    const d = new Decimal(value);
    return d.toDecimalPlaces(ROUNDING_DP, ROUNDING_MODE);
};

/**
 * UTILITY: Format for Display
 */
export const formatCurrency = (value: Decimal | number): string => {
    const v = typeof value === 'number' ? value : value.toNumber();
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(v);
};

/**
 * UTILITY: Safe Parse
 */
export const toDecimal = (value: Decimal | string | number): Decimal => {
    try {
        if (value instanceof Decimal) return value;
        const d = new Decimal(value);
        if (d.isNaN() || !d.isFinite()) return new Decimal(0);
        return d;
    } catch {
        return new Decimal(0);
    }
};

