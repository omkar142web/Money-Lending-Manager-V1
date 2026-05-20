import express from "express";
import {
  getRepairs,
  patchRepair,
  postRepair,
  removeRepair,
} from "../controllers/repair.controller.js";
import { requireAuth } from "../middleware/requireAuth.js";
import {
  validate,
  validateRepairCreate,
  validateRepairUpdate,
} from "../middleware/validate.js";

const router = express.Router();

router.use(requireAuth);

router.get("/repairs", getRepairs);
router.post("/repairs", validate(validateRepairCreate), postRepair);
router.patch("/repairs/:id", validate(validateRepairUpdate), patchRepair);
router.put("/repairs/:id", validate(validateRepairUpdate), patchRepair);
router.delete("/repairs/:id", removeRepair);

export default router;
