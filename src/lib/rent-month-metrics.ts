type MonthBill = { dueDate: string; amount: number; pending: number };

// The collection month follows the due date, including rent billed in arrears.
export function getRentMonthMetrics(bills: MonthBill[], currentPeriod: string) {
  const currentBills = bills.filter((bill) => bill.dueDate.slice(0, 7) === currentPeriod);
  const billedThisMonth = currentBills.reduce((sum, bill) => sum + bill.amount, 0);
  const pendingThisMonth = currentBills.reduce((sum, bill) => sum + bill.pending, 0);
  const paidThisMonth = Math.max(0, billedThisMonth - pendingThisMonth);
  return {
    billedThisMonth,
    pendingThisMonth,
    paidThisMonth,
    collectionRate: billedThisMonth > 0
      ? Math.round((paidThisMonth / billedThisMonth) * 1000) / 10
      : 0,
  };
}
