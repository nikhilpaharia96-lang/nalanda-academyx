/** Money is stored as floating point; always round to paise before storing or comparing. */
export const roundMoney = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
