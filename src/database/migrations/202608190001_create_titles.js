export async function up(knex) {
  await knex.schema.createTable("titles", (table) => {
    table.increments("id").primary();
    table.string("slug", 160).notNullable().unique();
    table.string("title", 180).notNullable();
    table.enum("type", ["movie", "series"]).notNullable().index();
    table.text("synopsis").notNullable();
    table.smallint("duration_minutes").unsigned().notNullable();
    table.smallint("release_year").unsigned().notNullable().index();
    table.string("age_rating", 10).notNullable();
    table.timestamps(true, true);
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists("titles");
}
