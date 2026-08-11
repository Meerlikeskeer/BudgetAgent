export type AmortizationRow = {
  month: number;
  balance: number;
  principal: number;
  interest: number;
};

export function buildAmortizationSchedule(
  currentBalance: number,
  annualRatePercent: number | undefined,
  monthlyPayment: number,
  maxMonths = 480,
): { schedule: AmortizationRow[]; payoffMonths: number | null } {
  const r = (annualRatePercent ?? 0) / 100 / 12;
  const schedule: AmortizationRow[] = [];
  let balance = currentBalance;

  if (monthlyPayment <= balance * r) {
    // payment doesn't even cover monthly interest; balance never shrinks
    return { schedule, payoffMonths: null };
  }

  for (let month = 1; month <= maxMonths && balance > 0.01; month++) {
    const interest = balance * r;
    const principal = Math.min(monthlyPayment - interest, balance);
    balance = Math.max(0, balance - principal);
    schedule.push({ month, balance, principal, interest });
    if (balance <= 0.01) break;
  }

  return {
    schedule,
    payoffMonths: balance <= 0.01 ? schedule.length : null,
  };
}
