const BaseEntity = require('./base/BaseEntity');

class Budget extends BaseEntity {
  #userId;
  #categoryId;
  #title;
  #amount;
  #currency;
  #period;
  #startDate;
  #endDate;
  #alertThreshold;
  #notes;

  constructor({
    id,
    userId,
    categoryId,
    title,
    amount,
    currency = 'INR',
    period = 'monthly',
    startDate,
    endDate,
    alertThreshold = 80,
    notes = '',
    createdAt,
    updatedAt,
  }) {
    super({ id, createdAt, updatedAt });

    if (!userId) throw new Error('Budget must belong to a user');
    if (!categoryId) throw new Error('Budget must belong to a category');
    if (!title || !title.trim()) throw new Error('Budget title is required');
    if (typeof amount !== 'number' || amount <= 0) {
      throw new Error('Budget amount must be a positive number');
    }
    if (!startDate || !endDate) {
      throw new Error('Budget must have a start date and an end date');
    }
    if (new Date(endDate) < new Date(startDate)) {
      throw new Error('Budget end date must be on or after the start date');
    }

    this.#userId = userId;
    this.#categoryId = categoryId;
    this.#title = title.trim();
    this.#amount = amount;
    this.#currency = currency;
    this.#period = period;
    this.#startDate = new Date(startDate);
    this.#endDate = new Date(endDate);
    this.#alertThreshold = alertThreshold;
    this.#notes = notes;
  }

  get userId() {
    return this.#userId;
  }
  get categoryId() {
    return this.#categoryId;
  }
  get title() {
    return this.#title;
  }
  get amount() {
    return this.#amount;
  }
  get currency() {
    return this.#currency;
  }
  get period() {
    return this.#period;
  }
  get startDate() {
    return this.#startDate;
  }
  get endDate() {
    return this.#endDate;
  }
  get alertThreshold() {
    return this.#alertThreshold;
  }
  get notes() {
    return this.#notes;
  }

  updateAmount(newAmount) {
    if (typeof newAmount !== 'number' || newAmount <= 0) {
      throw new Error('Budget amount must be a positive number');
    }
    this.#amount = newAmount;
    this.touch();
  }

  isActive(today = new Date()) {
    return today >= this.#startDate && today <= this.#endDate;
  }

  belongsToPeriod(startDate, endDate) {
    return this.#startDate <= new Date(endDate) && this.#endDate >= new Date(startDate);
  }

  static fromDocument(doc) {
    // `category` may be a raw ObjectId or a populated subdocument
    // (getAllBudgets/getBudgetById/updateBudget call .populate('category', ...))
    // — normalize to a clean id string either way.
    const categoryId = doc.category?._id
      ? doc.category._id.toString()
      : doc.category?.toString();

    return new Budget({
      id: doc._id?.toString(),
      userId: doc.user?.toString(),
      categoryId,
      title: doc.title,
      amount: doc.amount,
      currency: doc.currency,
      period: doc.period,
      startDate: doc.startDate,
      endDate: doc.endDate,
      alertThreshold: doc.alertThreshold,
      notes: doc.notes,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }

  toJSON() {
    return {
      ...super.toJSON(),
      userId: this.#userId,
      categoryId: this.#categoryId,
      title: this.#title,
      amount: this.#amount,
      currency: this.#currency,
      period: this.#period,
      startDate: this.#startDate,
      endDate: this.#endDate,
      alertThreshold: this.#alertThreshold,
      notes: this.#notes,
    };
  }
}

module.exports = Budget;
