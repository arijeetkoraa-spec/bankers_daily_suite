import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function numberToIndianWords(num: number): string {
    const a = [
        '', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ',
        'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '
    ];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const getLT20 = (n: number) => a[Number(n)];
    const get20Plus = (n: number) => {
        const str = n.toString();
        return b[Number(str[0])] + ' ' + a[Number(str[1])];
    }

    if (num === 0) return '';

    // Quick integer check
    num = Math.floor(num);

    const process = (n: number): string => {
        if (n < 20) return getLT20(n);
        if (n < 100) return get20Plus(n);
        if (n < 1000) return getLT20(Math.floor(n / 100)) + 'Hundred ' + process(n % 100);
        if (n < 100000) return process(Math.floor(n / 1000)) + 'Thousand ' + process(n % 1000);
        if (n < 10000000) return process(Math.floor(n / 100000)) + 'Lakh ' + process(n % 100000);
        return process(Math.floor(n / 10000000)) + 'Crore ' + process(n % 10000000);
    }

    return 'Rupees ' + process(num).trim() + ' Only';
}

export function formatIndianCurrency(num: number): string {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(num);
}

export function formatPdfCurrency(num: number): string {
    return 'Rs. ' + new Intl.NumberFormat('en-IN', {
        maximumFractionDigits: 0
    }).format(num);
}
