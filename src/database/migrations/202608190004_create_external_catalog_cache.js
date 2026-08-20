export async function up(knex) {
  await knex.schema.createTable("external_catalog_cache", (table) => {
    table.string("cache_key", 191).primary();
    table.string("source", 32).notNullable();
    table.json("payload").notNullable();
    table.dateTime("expires_at").notNullable().index();
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    table.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists("external_catalog_cache");
}
