import { Router } from "express";
import {
  getTitle,
  listTitles,
} from "../controllers/titles.controller.js";

const titlesRouter = Router();

titlesRouter.get("/", listTitles);
titlesRouter.get("/:id", getTitle);

export default titlesRouter;
