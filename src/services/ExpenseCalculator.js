// Shared calculations for amounts and date ranges.
class ExpenseCalculator {
  static sum(transactions) {
    return transactions.reduce((total, t) => total + t.amount, 0);
  }

  static average(transactions) {
    if (transactions.length === 0) return 0;
    return ExpenseCalculator.sum(transactions) / transactions.length;
  }

  static max(transactions) {
    if (transactions.length === 0) return null;
    return transactions.reduce((biggest, t) => (t.amount > biggest.amount ? t : biggest));
  }

  // Groups a flat list of transactions into a `{ [categoryId]: total }` map
  // — the exact shape a pie chart or budget-progress check needs.
  static groupByCategory(transactions) {
    const totals = new Map();
    for (const t of transactions) {
      const key = t.categoryId;
      totals.set(key, (totals.get(key) || 0) + t.amount);
    }
    return Object.fromEntries(totals);
  }

  // Groups by calendar month ("2026-08") — the shape a monthly trend line
  // chart needs, sorted chronologically.
  static groupByMonth(transactions) {
    const totals = new Map();
    for (const t of transactions) {
      const d = new Date(t.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      totals.set(key, (totals.get(key) || 0) + t.amount);
    }
    return Object.fromEntries([...totals.entries()].sort(([a], [b]) => (a > b ? 1 : -1)));
  }

  // Percentage change between two totals (e.g. this month vs last month) —
  // used by the dashboard's "up/down X% from last month" indicator.
  // Returns null when there's no meaningful baseline to compare against,
  // rather than a misleading Infinity or divide-by-zero NaN.
  static percentageChange(previousTotal, currentTotal) {
    if (previousTotal === 0) return currentTotal === 0 ? 0 : null;
    return Math.round(((currentTotal - previousTotal) / previousTotal) * 100);
  }

  // How much of a budget's limit has been consumed, expressed 0-100,
  // capped at 100 so the frontend progress bar never overflows visually.
  static budgetUsagePercent(limitAmount, spentAmount) {
    if (limitAmount <= 0) return 0;
    return Math.min(100, Math.round((spentAmount / limitAmount) * 100));
  }

  // Filters transactions to a [start, end] window — a shared helper so
  // AnalyticsService doesn't repeat this date comparison in every method.
  static withinPeriod(transactions, startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return transactions.filter((t) => {
      const d = new Date(t.date);
      return d >= start && d <= end;
    });
  }
}

module.exports = ExpenseCalculator;
