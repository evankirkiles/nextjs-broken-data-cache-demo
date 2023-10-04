const cache = new Map();

module.exports = class CacheHandler {
  constructor(options) {
    console.log(options);
    this.options = options;
    this.cache = {};
  }

  async get(key) {
    return cache.get(key);
  }

  async set(key, data) {
    cache.set(key, {
      value: data,
      lastModified: Date.now(),
    });
  }
};
