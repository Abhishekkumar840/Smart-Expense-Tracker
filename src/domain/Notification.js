const BaseEntity = require('./base/BaseEntity');

class Notification extends BaseEntity {
  #userId;
  #title;
  #message;
  #type;
  #relatedEntityId;
  #relatedEntityModel;
  #isRead;
  #readAt;

  constructor({
    id,
    userId,
    title,
    message,
    type,
    relatedEntityId = null,
    relatedEntityModel = null,
    isRead = false,
    readAt = null,
    createdAt,
    updatedAt,
  }) {
    super({ id, createdAt, updatedAt });

    const validTypes = ['budget_alert', 'large_expense', 'system', 'account', 'admin_broadcast'];
    if (!validTypes.includes(type)) {
      throw new Error(`Invalid notification type: ${type}`);
    }
    if (!userId) throw new Error('Notification must belong to a user');
    if (!title || !message) throw new Error('Notification requires a title and message');

    this.#userId = userId;
    this.#title = title;
    this.#message = message;
    this.#type = type;
    this.#relatedEntityId = relatedEntityId;
    this.#relatedEntityModel = relatedEntityModel;
    this.#isRead = isRead;
    this.#readAt = readAt;
  }

  get userId() {
    return this.#userId;
  }
  get title() {
    return this.#title;
  }
  get message() {
    return this.#message;
  }
  get type() {
    return this.#type;
  }
  get relatedEntityId() {
    return this.#relatedEntityId;
  }
  get relatedEntityModel() {
    return this.#relatedEntityModel;
  }
  get isRead() {
    return this.#isRead;
  }
  get readAt() {
    return this.#readAt;
  }

  markAsRead() {
    this.#isRead = true;
    this.#readAt = new Date();
    this.touch();
  }

  static forBudgetAlert({ userId, budgetId, budgetName, percentageUsed }) {
    return new Notification({
      userId,
      title: 'Budget alert',
      message: `You've used ${percentageUsed}% of your "${budgetName}" budget.`,
      type: 'budget_alert',
      relatedEntityId: budgetId,
      relatedEntityModel: 'Budget',
    });
  }

  static forLargeExpense({ userId, expenseId, expenseTitle, amount }) {
    return new Notification({
      userId,
      title: 'Large expense detected',
      message: `A large expense of ${amount} was recorded for "${expenseTitle}".`,
      type: 'large_expense',
      relatedEntityId: expenseId,
      relatedEntityModel: 'Expense',
    });
  }

  static forAdminBroadcast({ userId, title, message }) {
    return new Notification({
      userId,
      title,
      message,
      type: 'admin_broadcast',
    });
  }

  static fromDocument(doc) {
    return new Notification({
      id: doc._id?.toString(),
      userId: doc.user?.toString(),
      title: doc.title,
      message: doc.message,
      type: doc.type,
      relatedEntityId: doc.relatedEntity ? doc.relatedEntity.toString() : null,
      relatedEntityModel: doc.relatedEntityModel,
      isRead: doc.isRead,
      readAt: doc.readAt,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }

  toJSON() {
    return {
      ...super.toJSON(),
      userId: this.#userId,
      title: this.#title,
      message: this.#message,
      type: this.#type,
      relatedEntityId: this.#relatedEntityId,
      relatedEntityModel: this.#relatedEntityModel,
      isRead: this.#isRead,
      readAt: this.#readAt,
    };
  }
}

module.exports = Notification;
