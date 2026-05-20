import express from "express";
import { getDashboard } from "../controllers/page.controller.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = express.Router();

router.get("/", requireAuth, getDashboard);

export default router;
