// Shared fields for domain entities.
class BaseEntity {
  #id;
  #createdAt;
  #updatedAt;

  constructor({ id = null, createdAt = new Date(), updatedAt = new Date() } = {}) {
    if (new.target === BaseEntity) {
      throw new Error('BaseEntity is abstract and cannot be instantiated directly');
    }

    this.#id = id;
    this.#createdAt = createdAt;
    this.#updatedAt = updatedAt;
  }

  get id() {
    return this.#id;
  }

  get createdAt() {
    return this.#createdAt;
  }

  get updatedAt() {
    return this.#updatedAt;
  }

  touch() {
    this.#updatedAt = new Date();
  }
  toJSON() {
    return {
      id: this.#id,
      createdAt: this.#createdAt,
      updatedAt: this.#updatedAt,
    };
  }
}

module.exports = BaseEntity;
