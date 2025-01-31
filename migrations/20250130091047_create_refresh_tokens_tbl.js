/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema.createTable('refresh_tokens', (table) => {
        table.bigIncrements('token_id').primary();
        table.integer('user_id').notNullable();
        table.string('token', 500).notNullable();
        table.timestamp('expires_at').notNullable();
        table.foreign('user_id').references('users.user_id').onDelete('CASCADE');
    })
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('refresh_tokens');
};
