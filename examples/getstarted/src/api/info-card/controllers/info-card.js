'use strict';
const { createCoreController } = require('@strapi/strapi').factories;
module.exports = createCoreController('api::info-card.info-card', () => ({
  async find(ctx) {
    const filters = ctx.query.filters || {};
    if (!filters.enabled) {
      filters.enabled = { $eq: true };
    }
    ctx.query.filters = filters;
    return await super.find(ctx);
  },
}));
