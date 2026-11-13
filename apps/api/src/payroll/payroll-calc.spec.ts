import { calculatePay, daysBeforeJoining, rupeesInWords, workingDaysIn } from "./payroll-calc";

// Sept 2024 starts on a Sunday: Sundays are 1, 8, 15, 22, 29 -> 25 working days.
const C = { basic: 30000, hra: 12000, da: 3000, otherAllowances: 5000, pfPercent: 12, professionalTax: 200, otherDeductions: 0 }; // gross 50,000

describe("payroll calculation", () => {
  it("counts working days without Sundays", () => {
    expect(workingDaysIn(2024, 9)).toBe(25);
    expect(workingDaysIn(2024, 1)).toBe(27); // Jan 2024: 31 days, 4 Sundays
    expect(workingDaysIn(2024, 2)).toBe(25); // leap-year February: 29 days, 4 Sundays
  });

  it("counts non-Sunday days before a mid-month joining date", () => {
    expect(daysBeforeJoining(2024, 9, "2024-09-10")).toBe(7); // 2-7 and 9 (Sundays 1 and 8 excluded)
    expect(daysBeforeJoining(2024, 9, "2024-09-01")).toBe(0);
    expect(daysBeforeJoining(2024, 9, "2023-01-01")).toBe(0);
  });

  it("full month: PF on basic, flat deductions", () => {
    // PF = 12% of 30,000 = 3,600; + PT 200 = 3,800; net = 46,200
    expect(calculatePay(C, 25, 0)).toEqual({ grossEarned: 50000, pfAmount: 3600, totalDeductions: 3800, netPay: 46200 });
  });

  it("pro-rates gross and PF for loss-of-pay days", () => {
    // per day = 50,000 / 25 = 2,000; 2.5 days = 5,000 -> earned 45,000; PF = 30,000 * 0.9 * 12% = 3,240
    // deductions = 3,240 + 200 = 3,440; net = 41,560
    expect(calculatePay(C, 25, 2.5)).toEqual({ grossEarned: 45000, pfAmount: 3240, totalDeductions: 3440, netPay: 41560 });
  });

  it("handles no-PF structures and rounds to paise", () => {
    const r = calculatePay({ ...C, pfPercent: 0, professionalTax: 0 }, 27, 1); // 50,000 / 27 = 1851.85...
    expect(r.grossEarned).toBe(48148.15);
    expect(r.netPay).toBe(48148.15);
  });

  it("never pays below zero and caps loss-of-pay at the working days", () => {
    expect(calculatePay({ ...C, otherDeductions: 90000 }, 25, 0).netPay).toBe(0);
    expect(calculatePay(C, 25, 99)).toMatchObject({ grossEarned: 0, pfAmount: 0, netPay: 0 });
  });
});

describe("rupeesInWords (Indian numbering)", () => {
  it.each([
    [0, "Rupees Zero Only"],
    [7, "Rupees Seven Only"],
    [42500, "Rupees Forty Two Thousand Five Hundred Only"],
    [125000, "Rupees One Lakh Twenty Five Thousand Only"],
    [100000, "Rupees One Lakh Only"],
    [12345678, "Rupees One Crore Twenty Three Lakh Forty Five Thousand Six Hundred Seventy Eight Only"],
    [1050.5, "Rupees One Thousand Fifty and Fifty Paise Only"],
    [46200, "Rupees Forty Six Thousand Two Hundred Only"],
  ])("%p", (n, words) => expect(rupeesInWords(n)).toBe(words));
});
