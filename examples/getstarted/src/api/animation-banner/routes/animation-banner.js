'use strict';
module.exports = {
  routes: [
    { method: 'GET', path: '/animation-banners', handler: 'animation-banner.find' },
    { method: 'GET', path: '/animation-banners/:id', handler: 'animation-banner.findOne' },
    { method: 'POST', path: '/animation-banners', handler: 'animation-banner.create' },
    { method: 'PUT', path: '/animation-banners/:id', handler: 'animation-banner.update' },
    { method: 'DELETE', path: '/animation-banners/:id', handler: 'animation-banner.delete' },
  ],
};
