import {
  calculatePaymentStatus,
  flagsFromLegacyStatus,
  normalizeRepairStatus,
} from "../config/repairWorkflow.js";
import { collections, getCollection } from "../config/mongodb.js";
import { ApiError } from "../utils/ApiError.js";
import { toObjectId } from "../utils/objectId.js";

function repairsCollection() {
  return getCollection(collections.repairs);
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function numberOrZero(value) {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number : 0;
}

function clampMoney(value, max = Number.POSITIVE_INFINITY) {
  return Math.min(Math.max(numberOrZero(value), 0), max);
}

function deriveAmounts(repair) {
  const totalAmount = numberOrZero(repair.totalAmount ?? repair.amount);
  const paidAmount = clampMoney(
    repair.paidAmount ?? (repair.status === "Paid" ? totalAmount : 0),
    totalAmount,
  );
  const advanceAmount = clampMoney(repair.advanceAmount ?? (paidAmount > 0 ? paidAmount : 0), paidAmount);
  const remainingAmount = Math.max(totalAmount - paidAmount, 0);
  const paymentStatus = repair.paymentStatus || calculatePaymentStatus(totalAmount, paidAmount, advanceAmount);

  return {
    totalAmount,
    advanceAmount,
    paidAmount,
    remainingAmount,
    paymentStatus,
  };
}

function deriveFlags(repair) {
  return {
    ...flagsFromLegacyStatus(repair.status),
    warrantyClaim: Boolean(repair.extraFlags?.warrantyClaim ?? repair.warrantyClaim ?? flagsFromLegacyStatus(repair.status).warrantyClaim),
    loanerDeviceGiven: Boolean(repair.extraFlags?.loanerDeviceGiven ?? repair.loanerDeviceGiven ?? flagsFromLegacyStatus(repair.status).loanerDeviceGiven),
    returned: Boolean(repair.extraFlags?.returned ?? repair.returned ?? flagsFromLegacyStatus(repair.status).returned),
    urgent: Boolean(repair.extraFlags?.urgent ?? repair.urgent),
  };
}

function normalizeRepairPayload(data, existingRepair = {}) {
  const totalAmount = numberOrZero(data.totalAmount ?? existingRepair.totalAmount ?? existingRepair.amount);
  const paidAmount = clampMoney(data.paidAmount ?? existingRepair.paidAmount ?? 0, totalAmount);
  const advanceAmount = clampMoney(data.advanceAmount ?? existingRepair.advanceAmount ?? (paidAmount > 0 ? paidAmount : 0), paidAmount);
  const remainingAmount = Math.max(totalAmount - paidAmount, 0);

  return {
    repairStatus: normalizeRepairStatus(data.repairStatus ?? existingRepair.repairStatus ?? existingRepair.status),
    totalAmount,
    advanceAmount,
    paidAmount,
    remainingAmount,
    paymentStatus: calculatePaymentStatus(totalAmount, paidAmount, advanceAmount),
    extraFlags: {
      ...deriveFlags(existingRepair),
      ...(data.extraFlags || {}),
    },
  };
}

function serializeRepair(repair) {
  if (!repair) return repair;

  const amountFields = deriveAmounts(repair);
  const repairStatus = normalizeRepairStatus(repair.repairStatus || repair.status);

  return {
    id: repair._id.toString(),
    customerName: repair.customerName,
    device: repair.device,
    issue: repair.issue,
    whatsapp: repair.whatsapp,
    totalAmount: amountFields.totalAmount,
    advanceAmount: amountFields.advanceAmount,
    paidAmount: amountFields.paidAmount,
    remainingAmount: amountFields.remainingAmount,
    paymentStatus: amountFields.paymentStatus,
    amount: amountFields.totalAmount,
    delivery: repair.delivery,
    repairStatus,
    status: repairStatus,
    extraFlags: deriveFlags(repair),
    createdAt: repair.createdAt,
    updatedAt: repair.updatedAt,
    createdBy: repair.createdBy?.toString?.() || repair.createdBy,
  };
}

function addRepairStatusFilter(andClauses, repairStatus) {
  if (!repairStatus) return;

  const legacyMatches = [];

  if (repairStatus === "Ready for Pickup") legacyMatches.push("Done");
  if (repairStatus === "Delivered") legacyMatches.push("Paid", "Payment Pending", "Returned");
  if (repairStatus === "Pending Work") legacyMatches.push("Warranty Claim", "Borrowed Phone Given");

  andClauses.push({
    $or: [
      { repairStatus },
      { repairStatus: { $exists: false }, status: repairStatus },
      ...legacyMatches.map((status) => ({ repairStatus: { $exists: false }, status })),
    ],
  });
}

function addPaymentStatusFilter(andClauses, paymentStatus) {
  if (!paymentStatus) return;

  if (paymentStatus === "Paid") {
    andClauses.push({
      $or: [
        { paymentStatus },
        { status: "Paid" },
      ],
    });
    return;
  }

  if (paymentStatus === "Unpaid") {
    andClauses.push({
      $or: [
        { paymentStatus },
        { paymentStatus: { $exists: false }, paidAmount: { $exists: false } },
        { paidAmount: 0 },
      ],
    });
    return;
  }

  andClauses.push({ paymentStatus });
}

export async function listRepairs(filters = {}) {
  const andClauses = [];

  addRepairStatusFilter(andClauses, filters.repairStatus);
  addPaymentStatusFilter(andClauses, filters.paymentStatus);

  if (filters.search) {
    const regex = new RegExp(escapeRegex(filters.search), "i");
    andClauses.push({
      $or: [
        { customerName: regex },
        { whatsapp: regex },
        { device: regex },
      ],
    });
  }

  const query = andClauses.length ? { $and: andClauses } : {};
  const sort = filters.sort === "oldest"
    ? { createdAt: 1 }
    : filters.sort === "delivery"
      ? { delivery: 1, createdAt: -1 }
      : { createdAt: -1 };

  let cursor = repairsCollection().find(query).sort(sort);

  if (filters.limit) {
    cursor = cursor.skip((filters.page - 1) * filters.limit).limit(filters.limit);
  }

  const repairs = await cursor.toArray();
  return repairs.map(serializeRepair);
}

export async function createRepair(data, user) {
  const now = new Date();
  const normalized = normalizeRepairPayload(data);
  const result = await repairsCollection().insertOne({
    customerName: data.customerName,
    device: data.device,
    issue: data.issue,
    whatsapp: data.whatsapp,
    delivery: data.delivery,
    ...normalized,
    createdBy: user._id,
    createdAt: now,
    updatedAt: now,
  });

  const repair = await repairsCollection().findOne({ _id: result.insertedId });
  return serializeRepair(repair);
}

export async function updateRepair(id, updateData) {
  const _id = toObjectId(id);
  const existingRepair = await repairsCollection().findOne({ _id });

  if (!existingRepair) {
    throw new ApiError(404, "Repair job not found.");
  }

  const normalized = normalizeRepairPayload(updateData, existingRepair);
  const updates = {
    ...updateData,
    ...normalized,
    updatedAt: new Date(),
  };

  delete updates.status;
  delete updates.amount;

  const result = await repairsCollection().findOneAndUpdate(
    { _id },
    { $set: updates },
    { returnDocument: "after" },
  );

  return serializeRepair(result.value || result);
}

export async function deleteRepair(id) {
  const result = await repairsCollection().deleteOne({ _id: toObjectId(id) });

  if (!result.deletedCount) {
    throw new ApiError(404, "Repair job not found.");
  }

  return { deleted: true };
}
