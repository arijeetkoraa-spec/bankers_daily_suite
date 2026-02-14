import { Decimal } from 'decimal.js';
import { roundCurrency, toDecimal } from './utils';

export interface MSMEInput {
    turnover?: string | number;
    currentAssets?: string | number;
    currentLiabilities?: string | number; // Excluding bank borrowing
    marginPercent?: string | number; // Default 25% for Nayak
}

/**
 * ENGINE: Nayak Committee Norms (Turnover Method)
 * Applicable for limits up to Rs. 5 Crores.
 */
export const calculateNayakWC = (input: MSMEInput) => {
    const turnover = toDecimal(input.turnover || 0);

    if (turnover.lte(0)) return { requirement: new Decimal(0), margin: new Decimal(0), limit: new Decimal(0) };

    const requirement = turnover.mul(0.25);
    const margin = turnover.mul(0.05); // 5% of turnover is min margin
    const limit = turnover.mul(0.20); // 20% of turnover is bank finance

    return {
        requirement: roundCurrency(requirement),
        margin: roundCurrency(margin),
        limit: roundCurrency(limit)
    };
};

/**
 * ENGINE: Tandon Committee Method II (MPBF Method)
 */
export const calculateTandonMPBF = (input: MSMEInput) => {
    const ca = toDecimal(input.currentAssets || 0);
    const cl = toDecimal(input.currentLiabilities || 0);

    if (ca.lte(0)) return { gap: new Decimal(0), margin: new Decimal(0), mpbf: new Decimal(0) };

    const gap = ca.minus(cl);
    const mpbf = gap.mul(0.75); // 75% of Gap
    const margin = gap.minus(mpbf); // 25% is margin

    return {
        gap: roundCurrency(gap),
        margin: roundCurrency(margin),
        mpbf: roundCurrency(mpbf.gt(0) ? mpbf : 0)
    };
};

/**
 * ENGINE: Financial Ratios
 */
export const calculateFinancialRatios = (input: {
    pat?: string | number;
    depreciation?: string | number;
    interest?: string | number;
    obligation?: string | number;
    ca?: string | number;
    cl?: string | number;
    inventory?: string | number;
    tol?: string | number;
    tnw?: string | number;
    fixedCost?: string | number;
    variableCost?: string | number;
    sales?: string | number;
}) => {
    const pat = toDecimal(input.pat || 0);
    const dep = toDecimal(input.depreciation || 0);
    const interest = toDecimal(input.interest || 0);
    const obligation = toDecimal(input.obligation || 0);
    const ca = toDecimal(input.ca || 0);
    const cl = toDecimal(input.cl || 0);
    const inventory = toDecimal(input.inventory || 0);
    const tol = toDecimal(input.tol || 0);
    const tnw = toDecimal(input.tnw || 0);
    const fc = toDecimal(input.fixedCost || 0);
    const vc = toDecimal(input.variableCost || 0);
    const sales = toDecimal(input.sales || 0);

    const contribution = sales.minus(vc);

    return {
        dscr: obligation.gt(0) ? pat.plus(dep).plus(interest).div(obligation) : new Decimal(0),
        currentRatio: cl.gt(0) ? ca.div(cl) : new Decimal(0),
        quickRatio: cl.gt(0) ? ca.minus(inventory).div(cl) : new Decimal(0),
        leverage: tnw.gt(0) ? tol.div(tnw) : new Decimal(0),
        bep: contribution.gt(0) ? fc.div(contribution).mul(100) : new Decimal(0)
    };
};

/**
 * ENGINE: Drawing Power (DP)
 * DP = [(Paid Stock) * (1 - Margin)] + [Debtors * (1 - Margin)]
 */
export const calculateDrawingPower = (input: {
    stock: string | number;
    creditors: string | number;
    stockMargin: string | number;
    debtors: string | number;
    debtorMargin: string | number;
}) => {
    const S = toDecimal(input.stock || 0);
    const C = toDecimal(input.creditors || 0);
    const D = toDecimal(input.debtors || 0);
    const SM = toDecimal(input.stockMargin || 0).div(100);
    const DM = toDecimal(input.debtorMargin || 0).div(100);

    const paidStock = Decimal.max(0, S.minus(C));
    const valStock = paidStock.mul(new Decimal(1).minus(SM));
    const valDebtors = D.mul(new Decimal(1).minus(DM));

    const dp = valStock.plus(valDebtors);

    return {
        paidStock: roundCurrency(paidStock),
        valStock: roundCurrency(valStock),
        valDebtors: roundCurrency(valDebtors),
        drawingPower: roundCurrency(dp.gt(0) ? dp : 0)
    };
};

/**
 * ENGINE: CGTMSE Fees
 * Calculates Annual Guarantee Fee (AGF) based on latest CGTMSE slabs.
 */
export const calculateCGTMSEFee = (input: {
    loanAmount: string | number;
    isSocialCategory?: boolean;
}) => {
    const amt = toDecimal(input.loanAmount || 0);
    if (amt.lte(0)) return { fee: new Decimal(0), rate: new Decimal(0) };

    let baseRate = new Decimal(0);
    const amtNum = amt.toNumber();

    if (amtNum <= 1000000) baseRate = new Decimal(0.37);
    else if (amtNum <= 5000000) baseRate = new Decimal(0.55);
    else if (amtNum <= 20000000) {
        if (amtNum <= 10000000) baseRate = new Decimal(0.60);
        else baseRate = new Decimal(1.20);
    } else {
        baseRate = new Decimal(1.35);
    }

    if (input.isSocialCategory) {
        baseRate = baseRate.mul(0.90); // 10% concession
    }

    const fee = amt.mul(baseRate.div(100));

    return {
        fee: roundCurrency(fee),
        rate: baseRate
    };
};



