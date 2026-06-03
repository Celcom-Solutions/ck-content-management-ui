'use strict';

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::dashboard-section.dashboard-section', () => ({
  async find(ctx) {
    const filters = ctx.query.filters || {};

    // Default: only return enabled sections
    if (filters.enabled === undefined) {
      filters.enabled = { $eq: true };
    }

    ctx.query.filters = filters;

    // Default sort by priority ascending
    if (!ctx.query.sort) {
      ctx.query.sort = 'priority:asc';
    }

    return await super.find(ctx);
  },
}));
