export async function up(knex) {
  await knex.schema.createTable("genres", (table) => {
    table.increments("id").primary();
    table.string("name", 80).notNullable();
    table.string("slug", 80).notNullable().unique();
  });

  await knex.schema.createTable("moods", (table) => {
    table.increments("id").primary();
    table.string("name", 80).notNullable();
    table.string("slug", 80).notNullable().unique();
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists("moods");
  await knex.schema.dropTableIfExists("genres");
}
