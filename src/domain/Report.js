class Report {
  #userId;
  #periodLabel; // e.g. "August 2026" or "2026"
  #startDate;
  #endDate;
  #expenses; // Expense[] domain instances
  #incomes; // Income[] domain instances

  constructor({ userId, periodLabel, startDate, endDate, expenses = [], incomes = [] }) {
    if (!userId) throw new Error('Report must belong to a user');
    if (new Date(endDate) <= new Date(startDate)) {
      throw new Error('Report end date must be after the start date');
    }

    this.#userId = userId;
    this.#periodLabel = periodLabel;
    this.#startDate = new Date(startDate);
    this.#endDate = new Date(endDate);
    // Store copies, not the original arrays/references, so external code
    // can't mutate this report's data after construction.
    this.#expenses = [...expenses];
    this.#incomes = [...incomes];
  }

  get userId() {
    return this.#userId;
  }
  get periodLabel() {
    return this.#periodLabel;
  }
  get startDate() {
    return this.#startDate;
  }
  get endDate() {
    return this.#endDate;
  }
  get expenses() {
    return [...this.#expenses];
  }
  get incomes() {
    return [...this.#incomes];
  }

  totalExpense() {
    return this.#expenses.reduce((sum, e) => sum + e.amount, 0);
  }

  totalIncome() {
    return this.#incomes.reduce((sum, i) => sum + i.amount, 0);
  }

  netSavings() {
    return this.totalIncome() - this.totalExpense();
  }

  expenseBreakdownByCategory() {
    const breakdown = new Map();
    for (const expense of this.#expenses) {
      const current = breakdown.get(expense.categoryId) || 0;
      breakdown.set(expense.categoryId, current + expense.amount);
    }
    return Object.fromEntries(breakdown);
  }

  savingsRatePercent() {
    const income = this.totalIncome();
    if (income === 0) return 0;
    return Math.round((this.netSavings() / income) * 100);
  }

  toTransactionRows() {
    const expenseRows = this.#expenses.map((e) => ({
      date: e.date,
      title: e.title,
      type: 'expense',
      amount: e.amount,
    }));
    const incomeRows = this.#incomes.map((i) => ({
      date: i.date,
      title: i.title,
      type: 'income',
      amount: i.amount,
    }));
    return [...expenseRows, ...incomeRows].sort((a, b) => new Date(a.date) - new Date(b.date));
  }

  toJSON() {
    return {
      userId: this.#userId,
      periodLabel: this.#periodLabel,
      startDate: this.#startDate,
      endDate: this.#endDate,
      totalExpense: this.totalExpense(),
      totalIncome: this.totalIncome(),
      netSavings: this.netSavings(),
      savingsRatePercent: this.savingsRatePercent(),
      expenseBreakdownByCategory: this.expenseBreakdownByCategory(),
    };
  }
}

module.exports = Report;
