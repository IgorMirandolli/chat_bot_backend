import { Router } from "express";
import { createChatMessage } from "../controllers/chat.controller.js";

const chatRouter = Router();

chatRouter.post("/", createChatMessage);

export default chatRouter;
