import { asyncHandler } from "../middleware/asyncHandler.js";
import {
  createRepair,
  deleteRepair,
  listRepairs,
  updateRepair,
} from "../services/repair.service.js";
import { sendSuccess } from "../utils/response.js";

export const getRepairs = asyncHandler(async (req, res) => {
  const repairs = await listRepairs(req.validatedQuery);
  return sendSuccess(res, repairs, "Repair jobs loaded.");
});

export const postRepair = asyncHandler(async (req, res) => {
  const repair = await createRepair(req.validatedBody, req.user);
  return sendSuccess(res, repair, "Repair job created.", 201);
});

export const patchRepair = asyncHandler(async (req, res) => {
  const repair = await updateRepair(req.params.id, req.validatedBody);
  return sendSuccess(res, repair, "Repair job updated.");
});

export const removeRepair = asyncHandler(async (req, res) => {
  const result = await deleteRepair(req.params.id);
  return sendSuccess(res, result, "Repair job deleted.");
});
