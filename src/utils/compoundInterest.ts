export function projectGrowth(
  currentBalance: number,
  monthlyContribution: number,
  annualInterestRate: number,
  months: number
): number[] {
  const monthlyRate = annualInterestRate / 100 / 12;
  const balances: number[] = [];
  let balance = currentBalance;
  for (let i = 0; i < months; i++) {
    balance = balance * (1 + monthlyRate) + monthlyContribution;
    balances.push(balance);
  }
  return balances;
}

export function estimateCompletionMonths(
  currentBalance: number,
  targetAmount: number,
  monthlyContribution: number,
  annualInterestRate: number
): number {
  // Cannot grow without contributions or interest, or without a starting balance to compound
  if (monthlyContribution <= 0 && (annualInterestRate <= 0 || currentBalance <= 0)) {
    return Infinity;
  }
  const monthlyRate = annualInterestRate / 100 / 12;
  let balance = currentBalance;
  let months = 0;
  while (balance < targetAmount && months < 1200) {
    balance = balance * (1 + monthlyRate) + monthlyContribution;
    months++;
  }
  return months;
}
