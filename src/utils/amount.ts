export const formatAmount = (amount: number, decimals: number = 2): string => {
  return amount.toFixed(decimals);
};

export const formatCurrency = (amount: number, symbol: string = '¥'): string => {
  return `${symbol}${formatAmount(amount)}`;
};

export const parseAmount = (str: string): number => {
  const num = parseFloat(str.replace(/[^\d.-]/g, ''));
  return isNaN(num) ? 0 : num;
};

export const addAmount = (a: number, b: number): number => {
  return Math.round((a + b) * 100) / 100;
};

export const subtractAmount = (a: number, b: number): number => {
  return Math.round((a - b) * 100) / 100;
};

export const multiplyAmount = (a: number, b: number): number => {
  return Math.round(a * b * 100) / 100;
};
