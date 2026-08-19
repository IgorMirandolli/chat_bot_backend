import {
  findTitleById,
  findTitles,
  InvalidTitleFiltersError,
  TitleNotFoundError,
} from "../services/titles.service.js";

export async function listTitles(request, response, next) {
  try {
    const titles = await findTitles(request.query);

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

export async function getTitle(request, response, next) {
  try {
    const title = await findTitleById(request.params.id);
    response.json({ title });
  } catch (error) {
    if (error instanceof TitleNotFoundError) {
      response.status(404).json({ error: error.message });
      return;
    }

    next(error);
  }
}
