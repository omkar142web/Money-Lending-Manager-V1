import { collections, getCollection } from "../config/mongodb.js";
import { ApiError } from "../utils/ApiError.js";
import { toObjectId } from "../utils/objectId.js";

function repairsCollection() {
  return getCollection(collections.repairs);
}

function serializeRepair(repair) {
  if (!repair) return repair;

  return {
    id: repair._id.toString(),
    customerName: repair.customerName,
    device: repair.device,
    issue: repair.issue,
    whatsapp: repair.whatsapp,
    amount: repair.amount,
    delivery: repair.delivery,
    status: repair.status,
    createdAt: repair.createdAt,
    updatedAt: repair.updatedAt,
    createdBy: repair.createdBy?.toString?.() || repair.createdBy,
  };
}

export async function listRepairs() {
  const repairs = await repairsCollection().find({}).sort({ createdAt: -1 }).toArray();
  return repairs.map(serializeRepair);
}

export async function createRepair(data, user) {
  const now = new Date();
  const result = await repairsCollection().insertOne({
    customerName: data.customerName,
    device: data.device,
    issue: data.issue,
    whatsapp: data.whatsapp,
    amount: data.amount,
    delivery: data.delivery,
    status: data.status || "Pending Work",
    createdBy: user._id,
    createdAt: now,
    updatedAt: now,
  });

  const repair = await repairsCollection().findOne({ _id: result.insertedId });
  return serializeRepair(repair);
}

export async function updateRepair(id, updateData) {
  const _id = toObjectId(id);
  const result = await repairsCollection().findOneAndUpdate(
    { _id },
    {
      $set: {
        ...updateData,
        updatedAt: new Date(),
      },
    },
    { returnDocument: "after" },
  );

  const updatedRepair = result.value || result;

  if (!updatedRepair) {
    throw new ApiError(404, "Repair job not found.");
  }

  return serializeRepair(updatedRepair);
}

export async function deleteRepair(id) {
  const result = await repairsCollection().deleteOne({ _id: toObjectId(id) });

  if (!result.deletedCount) {
    throw new ApiError(404, "Repair job not found.");
  }

  return { deleted: true };
}
