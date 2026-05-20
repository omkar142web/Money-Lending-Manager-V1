import { ObjectId } from "mongodb";
import { ApiError } from "./ApiError.js";

export function toObjectId(id) {
  if (!ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid id.");
  }

  return new ObjectId(id);
}
