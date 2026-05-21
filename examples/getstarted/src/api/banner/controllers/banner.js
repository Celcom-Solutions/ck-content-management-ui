'use strict';
const { createCoreController } = require('@strapi/strapi').factories;
module.exports = createCoreController('api::banner.banner', () => ({
  async find(ctx) {
    const filters = ctx.query.filters || {};
    if (!filters.enabled) {
      filters.enabled = { $eq: true };
    }
    ctx.query.filters = filters;
    ctx.query.sort = ctx.query.sort ?? 'priority:asc';
    return await super.find(ctx);
  },
}));
