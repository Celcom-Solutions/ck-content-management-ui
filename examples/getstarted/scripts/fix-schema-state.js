#!/usr/bin/env node

/**
 * Populates strapi_database_schema with all existing tables in the database schema.
 * Run this once when Strapi fails with "relation already exists" on startup.
 *
 * Usage: node scripts/fix-schema-state.js
 */

'use strict';

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const knex = require('knex');

const DB_SCHEMA = process.env.DATABASE_SCHEMA || 'public';

const db = knex({
  client: 'postgres',
  connection: {
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432', 10),
    database: process.env.DATABASE_NAME || 'strapi',
    user: process.env.DATABASE_USERNAME || 'strapi',
    password: process.env.DATABASE_PASSWORD || 'strapi',
    ssl: process.env.DATABASE_SSL === 'true',
  },
  searchPath: [DB_SCHEMA],
});

async function run() {
  console.log(`Connecting to schema "${DB_SCHEMA}" on ${process.env.DATABASE_HOST}...`);

  // 1. Get all existing table names in the target schema
  const rows = await db('information_schema.tables')
    .select('table_name')
    .where('table_schema', DB_SCHEMA)
    .andWhere('table_type', 'BASE TABLE');

  const tableNames = rows.map((r) => r.table_name);
  console.log(`Found ${tableNames.length} tables: ${tableNames.join(', ')}`);

  // 2. Build a minimal Schema JSON — just table names with empty columns/indexes/foreignKeys.
  //    Strapi uses this as "previousSchema" in the 3-way diff, so existing tables won't be
  //    re-created. Only ALTER TABLE statements (not CREATE TABLE) will run on next startup.
  const schema = {
    tables: tableNames.map((name) => ({
      name,
      columns: [],
      indexes: [],
      foreignKeys: [],
    })),
  };

  // 3. Ensure strapi_database_schema table exists
  const hasSchemaTable = await db.schema
    .withSchema(DB_SCHEMA)
    .hasTable('strapi_database_schema');

  if (!hasSchemaTable) {
    console.log('Creating strapi_database_schema table...');
    await db.schema.withSchema(DB_SCHEMA).createTable('strapi_database_schema', (t) => {
      t.increments('id');
      t.json('schema');
      t.datetime('time', { useTz: false });
      t.string('hash');
    });
  }

  // 4. Clear any existing entries and insert the new schema snapshot
  await db(`${DB_SCHEMA}.strapi_database_schema`).delete();

  await db(`${DB_SCHEMA}.strapi_database_schema`).insert({
    schema: JSON.stringify(schema),
    hash: require('crypto')
      .createHash('sha256')
      .update(JSON.stringify(schema))
      .digest('hex'),
    time: new Date(),
  });

  console.log('\n✅ strapi_database_schema populated successfully.');
  console.log('   Run "yarn develop" — Strapi will now ALTER tables instead of re-creating them.');
}

run()
  .catch((err) => {
    console.error('\n❌ Failed:', err.message);
    process.exit(1);
  })
  .finally(() => db.destroy());
