// Budget usage calculations.
const mongoose = require('mongoose');
const ExpenseModel = require('../models/Expense.model');

class BudgetService {
  /**
   * Sums this user's expenses in `budgetDoc.category` between
   * `budgetDoc.startDate` and `budgetDoc.endDate`, then derives
   * remaining amount and percentage used against `budgetDoc.amount`.
   *
   * @param {import('mongoose').Document} budgetDoc - a Budget Mongoose document
   * @returns {Promise<{usedAmount: number, remainingAmount: number, percentageUsed: number, isOverBudget: boolean}>}
   */
  static async calculateUsage(budgetDoc) {
    // `category` may be a raw ObjectId (e.g. right after BudgetModel.create())
    // or a populated subdocument (e.g. after .populate('category', ...) in
    // getAllBudgets/getBudgetById/updateBudget) — normalize to a plain id
    // either way before using it in the aggregation match.
    const categoryId = budgetDoc.category?._id
      ? budgetDoc.category._id
      : budgetDoc.category;

    const [result] = await ExpenseModel.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(budgetDoc.user),
          category: new mongoose.Types.ObjectId(categoryId),
          date: { $gte: budgetDoc.startDate, $lte: budgetDoc.endDate },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
        },
      },
    ]);

    const usedAmount = result?.total || 0;
    const remainingAmount = Number((budgetDoc.amount - usedAmount).toFixed(2));
    const percentageUsed =
      budgetDoc.amount > 0
        ? Number(((usedAmount / budgetDoc.amount) * 100).toFixed(2))
        : 0;

    return {
      usedAmount: Number(usedAmount.toFixed(2)),
      remainingAmount,
      percentageUsed,
      isOverBudget: usedAmount > budgetDoc.amount,
    };
  }

  /**
   * Runs calculateUsage for a list of budget documents in parallel and
   * returns a Map keyed by budget id, so the list endpoint can attach
   * usage to each budget without N sequential round trips.
   *
   * @param {import('mongoose').Document[]} budgetDocs
   * @returns {Promise<Map<string, object>>}
   */
  static async calculateUsageForMany(budgetDocs) {
    const results = await Promise.all(
      budgetDocs.map((doc) => BudgetService.calculateUsage(doc))
    );
    return new Map(budgetDocs.map((doc, index) => [doc._id.toString(), results[index]]));
  }
}

module.exports = BudgetService;
