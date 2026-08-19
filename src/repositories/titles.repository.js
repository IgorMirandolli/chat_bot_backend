import { readFileSync } from "node:fs";

const catalogPath = new URL("../data/titles.json", import.meta.url);
const titles = JSON.parse(readFileSync(catalogPath, "utf8"));

export function getAllTitles() {
  return titles;
}

export function getTitleById(id) {
  return titles.find((title) => title.id === id);
}
