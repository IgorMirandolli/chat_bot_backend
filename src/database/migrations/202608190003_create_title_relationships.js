export async function up(knex) {
  await knex.schema.createTable("title_genres", (table) => {
    table
      .integer("title_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("titles")
      .onDelete("CASCADE");
    table
      .integer("genre_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("genres")
      .onDelete("CASCADE");
    table.primary(["title_id", "genre_id"]);
    table.index("genre_id");
  });

  await knex.schema.createTable("title_moods", (table) => {
    table
      .integer("title_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("titles")
      .onDelete("CASCADE");
    table
      .integer("mood_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("moods")
      .onDelete("CASCADE");
    table.primary(["title_id", "mood_id"]);
    table.index("mood_id");
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists("title_moods");
  await knex.schema.dropTableIfExists("title_genres");
}
