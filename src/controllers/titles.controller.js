import {
  findTitleById,
  findTitles,
  InvalidTitleFiltersError,
  TitleNotFoundError,
} from "../services/titles.service.js";

export function listTitles(request, response, next) {
  try {
    const titles = findTitles(request.query);

    response.json({
      count: titles.length,
      titles,
    });
  } catch (error) {
    if (error instanceof InvalidTitleFiltersError) {
      response.status(400).json({ error: error.message });
      return;
    }

    next(error);
  }
}

export function getTitle(request, response, next) {
  try {
    const title = findTitleById(request.params.id);
    response.json({ title });
  } catch (error) {
    if (error instanceof TitleNotFoundError) {
      response.status(404).json({ error: error.message });
      return;
    }

    next(error);
  }
}
