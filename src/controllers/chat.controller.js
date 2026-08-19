import {
  InvalidChatRequestError,
  processChatMessage,
} from "../services/chat.service.js";

export async function createChatMessage(request, response, next) {
  try {
    const result = await processChatMessage(request.body);
    response.json(result);
  } catch (error) {
    if (error instanceof InvalidChatRequestError) {
      response.status(400).json({ error: error.message });
      return;
    }

    next(error);
  }
}
