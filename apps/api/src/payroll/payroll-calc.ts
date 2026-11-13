import { roundMoney } from "../common/money";

export interface PayComponents {
  basic: number; hra: number; da: number; otherAllowances: number;
  pfPercent: number; professionalTax: number; otherDeductions: number;
}
export interface PayResult { grossEarned: number; pfAmount: number; totalDeductions: number; netPay: number }

const pad = (n: number) => String(n).padStart(2, "0");
export const daysInMonth = (year: number, month: number) => new Date(Date.UTC(year, month, 0)).getUTCDate();
const isSunday = (year: number, month: number, day: number) => new Date(Date.UTC(year, month - 1, day)).getUTCDay() === 0;
export const dateStr = (year: number, month: number, day: number) => `${year}-${pad(month)}-${pad(day)}`;

/** Days in the month excluding Sundays (the school's weekly off). */
export function workingDaysIn(year: number, month: number): number {
  let n = 0;
  for (let d = 1; d <= daysInMonth(year, month); d++) if (!isSunday(year, month, d)) n++;
  return n;
}

/** Non-Sunday days of the month that fall before the joining date (counted as loss of pay for a mid-month joiner). */
export function daysBeforeJoining(year: number, month: number, joiningDate: string): number {
  const first = dateStr(year, month, 1);
  if (joiningDate <= first) return 0;
  let n = 0;
  for (let d = 1; d <= daysInMonth(year, month); d++) {
    if (dateStr(year, month, d) < joiningDate && !isSunday(year, month, d)) n++;
  }
  return n;
}

/**
 * Pay for a month. Gross is reduced pro-rata for loss-of-pay days (gross / working days per day), PF is taken
 * on the pro-rated basic, and flat deductions apply in full. Net pay never goes below zero.
 */
export function calculatePay(c: PayComponents, workingDays: number, lopDays: number): PayResult {
  const gross = c.basic + c.hra + c.da + c.otherAllowances;
  const lop = Math.min(Math.max(lopDays, 0), workingDays);
  const lopAmount = workingDays > 0 ? roundMoney((gross / workingDays) * lop) : 0;
  const grossEarned = roundMoney(Math.max(gross - lopAmount, 0));
  const factor = gross > 0 ? grossEarned / gross : 0;
  const pfAmount = roundMoney(c.basic * factor * (c.pfPercent / 100));
  const totalDeductions = roundMoney(pfAmount + c.professionalTax + c.otherDeductions);
  const netPay = roundMoney(Math.max(grossEarned - totalDeductions, 0));
  return { grossEarned, pfAmount, totalDeductions, netPay };
}

// --- Amount in words (Indian numbering: thousand, lakh, crore) ---------------------------------------------
const ONES = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function belowThousand(n: number): string {
  const parts: string[] = [];
  if (n >= 100) { parts.push(`${ONES[Math.floor(n / 100)]} Hundred`); n %= 100; }
  if (n >= 20) { parts.push(TENS[Math.floor(n / 10)] + (n % 10 ? ` ${ONES[n % 10]}` : "")); }
  else if (n > 0) parts.push(ONES[n]);
  return parts.join(" ");
}

export function rupeesInWords(amount: number): string {
  const total = Math.round(amount * 100);
  const rupees = Math.floor(total / 100);
  const paise = total % 100;
  if (rupees === 0 && paise === 0) return "Rupees Zero Only";

  let n = rupees;
  const parts: string[] = [];
  for (const [unit, name] of [[10_000_000, "Crore"], [100_000, "Lakh"], [1000, "Thousand"]] as const) {
    if (n >= unit) { parts.push(`${belowThousand(Math.floor(n / unit))} ${name}`); n %= unit; }
  }
  if (n > 0) parts.push(belowThousand(n));
  const rupeeWords = parts.join(" ");
  const paiseWords = paise ? `${belowThousand(paise)} Paise` : "";
  return `Rupees ${[rupeeWords, paiseWords].filter(Boolean).join(" and ")} Only`;
}
