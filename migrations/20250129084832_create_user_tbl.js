/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
 return knex.schema.createTable('users', (table) => {
  table.increments('user_id').primary();
  table.string('user_name', 255).notNullable();
  table.string('user_email', 255).notNullable();
  table.string('user_password', 500).notNullable();
  table.string('user_secret', 500);
  table.timestamp('created_at').defaultTo(knex.fn.now());
  table.timestamp('updated_at').defaultTo(knex.fn.now());
 })
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('users')
};
