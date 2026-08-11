const BaseEntity = require('./base/BaseEntity');

class Income extends BaseEntity {
  #userId;
  #categoryId;
  #title;
  #amount;
  #currency;
  #date;
  #source;
  #notes;

  constructor({
    id,
    userId,
    categoryId,
    title,
    amount,
    currency = 'INR',
    date = new Date(),
    source = 'salary',
    notes = '',
    createdAt,
    updatedAt,
  }) {
    super({ id, createdAt, updatedAt });

    if (!userId) throw new Error('Income must belong to a user');
    if (!categoryId) throw new Error('Income must belong to a category');
    if (!title || !title.trim()) throw new Error('Income title is required');
    if (typeof amount !== 'number' || amount <= 0) {
      throw new Error('Income amount must be a positive number');
    }

    this.#userId = userId;
    this.#categoryId = categoryId;
    this.#title = title.trim();
    this.#amount = amount;
    this.#currency = currency;
    this.#date = new Date(date);
    this.#source = source;
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
  get date() {
    return this.#date;
  }
  get source() {
    return this.#source;
  }
  get notes() {
    return this.#notes;
  }

  updateAmount(newAmount) {
    if (typeof newAmount !== 'number' || newAmount <= 0) {
      throw new Error('Income amount must be a positive number');
    }
    this.#amount = newAmount;
    this.touch();
  }

  belongsToPeriod(startDate, endDate) {
    return this.#date >= new Date(startDate) && this.#date <= new Date(endDate);
  }

  isPassiveIncome() {
    return this.#source === 'investment';
  }

  static fromDocument(doc) {
    return new Income({
      id: doc._id?.toString(),
      userId: doc.user?.toString(),
      categoryId: doc.category?._id
  ? doc.category._id.toString()
  : doc.category?.toString(),
      title: doc.title,
      amount: doc.amount,
      currency: doc.currency,
      date: doc.date,
      source: doc.source,
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
      date: this.#date,
      source: this.#source,
      notes: this.#notes,
    };
  }
}

module.exports = Income;
