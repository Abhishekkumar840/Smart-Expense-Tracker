const BaseEntity = require('./base/BaseEntity');

const HIGH_VALUE_THRESHOLD = 10000;

class Expense extends BaseEntity {
  #userId;
  #categoryId;
  #title;
  #amount;
  #currency;
  #date;
  #paymentMethod;
  #notes;
  #tags;

  constructor({
    id,
    userId,
    categoryId,
    title,
    amount,
    currency = 'INR',
    date = new Date(),
    paymentMethod = 'cash',
    notes = '',
    tags = [],
    createdAt,
    updatedAt,
  }) {
    super({ id, createdAt, updatedAt });

    if (!userId) throw new Error('Expense must belong to a user');
    if (!categoryId) throw new Error('Expense must belong to a category');
    if (!title || !title.trim()) throw new Error('Expense title is required');
    if (typeof amount !== 'number' || amount <= 0) {
      throw new Error('Expense amount must be a positive number');
    }

    this.#userId = userId;
    this.#categoryId = categoryId;
    this.#title = title.trim();
    this.#amount = amount;
    this.#currency = currency;
    this.#date = new Date(date);
    this.#paymentMethod = paymentMethod;
    this.#notes = notes;
    this.#tags = [...tags]; // copy, not reference — prevents external mutation of the internal array
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
  get paymentMethod() {
    return this.#paymentMethod;
  }
  get notes() {
    return this.#notes;
  }
  get tags() {
    return [...this.#tags];
  }

  updateAmount(newAmount) {
    if (typeof newAmount !== 'number' || newAmount <= 0) {
      throw new Error('Expense amount must be a positive number');
    }
    this.#amount = newAmount;
    this.touch();
  }

  addTag(tag) {
    if (this.#tags.length >= 10) {
      throw new Error('A maximum of 10 tags is allowed per expense');
    }
    if (!this.#tags.includes(tag)) {
      this.#tags.push(tag);
      this.touch();
    }
  }

  isHighValue() {
    return this.#amount >= HIGH_VALUE_THRESHOLD;
  }

  belongsToPeriod(startDate, endDate) {
    return this.#date >= new Date(startDate) && this.#date <= new Date(endDate);
  }

  static fromDocument(doc) {
    return new Expense({
      id: doc._id?.toString(),
      userId: doc.user?.toString(),
      categoryId: doc.category?.toString(),
      title: doc.title,
      amount: doc.amount,
      currency: doc.currency,
      date: doc.date,
      paymentMethod: doc.paymentMethod,
      notes: doc.notes,
      tags: doc.tags,
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
      paymentMethod: this.#paymentMethod,
      notes: this.#notes,
      tags: this.tags,
    };
  }
}

module.exports = Expense;
