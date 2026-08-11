const BaseEntity = require('./base/BaseEntity');

class Category extends BaseEntity {
  #name;
  #type;
  #icon;
  #color;
  #ownerId; // null => system default, visible to all users

  constructor({ id, name, type, icon = 'FaTag', color = '#6366F1', ownerId = null, createdAt, updatedAt }) {
    super({ id, createdAt, updatedAt });

    if (!name || !name.trim()) throw new Error('Category name is required');
    if (!['expense', 'income'].includes(type)) {
      throw new Error('Category type must be "expense" or "income"');
    }

    this.#name = name.trim();
    this.#type = type;
    this.#icon = icon;
    this.#color = color;
    this.#ownerId = ownerId;
  }

  get name() {
    return this.#name;
  }
  get type() {
    return this.#type;
  }
  get icon() {
    return this.#icon;
  }
  get color() {
    return this.#color;
  }
  get ownerId() {
    return this.#ownerId;
  }

  isSystemDefault() {
    return this.#ownerId === null;
  }

  isEditableBy(userId) {
    return !this.isSystemDefault() && this.#ownerId === userId;
  }

  rename(newName) {
    if (!newName || !newName.trim()) throw new Error('Category name is required');
    this.#name = newName.trim();
    this.touch();
  }

  recolor(newColor) {
    if (!/^#([0-9A-Fa-f]{3}){1,2}$/.test(newColor)) {
      throw new Error('Color must be a valid hex code');
    }
    this.#color = newColor;
    this.touch();
  }

  static fromDocument(doc) {
    return new Category({
      id: doc._id?.toString(),
      name: doc.name,
      type: doc.type,
      icon: doc.icon,
      color: doc.color,
      ownerId: doc.owner ? doc.owner.toString() : null,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }

  toJSON() {
    return {
      ...super.toJSON(),
      name: this.#name,
      type: this.#type,
      icon: this.#icon,
      color: this.#color,
      ownerId: this.#ownerId,
      isSystemDefault: this.isSystemDefault(),
    };
  }
}

module.exports = Category;
