const client = process.env.DATABASE_CLIENT || 'sqlite';

const connections = {
  sqlite: {
    client: 'sqlite',
    connection: { filename: '.tmp/data.db' },
    useNullAsDefault: true,
  },
  postgres: {
    client: 'postgres',
    connection: {
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT || '5432', 10),
      database: process.env.DATABASE_NAME || 'strapi',
      user: process.env.DATABASE_USERNAME || 'strapi',
      password: process.env.DATABASE_PASSWORD || 'strapi',
      ssl: process.env.DATABASE_SSL === 'true',
    },
    searchPath: [process.env.DATABASE_SCHEMA || 'public'],
  },
  mysql: {
    client: 'mysql',
    connection: {
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT || '3306', 10),
      database: process.env.DATABASE_NAME || 'strapi',
      user: process.env.DATABASE_USERNAME || 'strapi',
      password: process.env.DATABASE_PASSWORD || 'strapi',
    },
  },
};

function resolveConnection() {
  if (client === 'postgres') return connections.postgres;
  if (client === 'mysql') return connections.mysql;
  return connections.sqlite;
}

module.exports = {
  connection: resolveConnection(),
};
