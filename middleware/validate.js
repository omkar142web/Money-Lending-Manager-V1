import { ApiError } from "../utils/ApiError.js";
import {
  allowedPaymentStatuses,
  allowedRepairStatuses,
  filterablePaymentStatuses,
  paymentMethods,
  filterableRepairStatuses,
  repairFlags,
  repairStatuses,
} from "../config/repairWorkflow.js";

export const validate = (validator) => (req, res, next) => {
  const result = validator(req.body, req);

  if (result.errors.length) {
    throw new ApiError(400, "Validation failed.", result.errors);
  }

  req.validatedBody = result.value;
  next();
};

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function cleanMoney(value) {
  const digits = String(value ?? "").replace(/[^\d.]/g, "");
  return Number(digits);
}

function cleanBoolean(value) {
  return value === true || value === "true" || value === "on" || value === "1";
}

function cleanFlags(body) {
  const source = body.extraFlags || body.flags || body;

  return repairFlags.reduce((flags, flag) => {
    flags[flag] = cleanBoolean(source[flag]);
    return flags;
  }, {});
}

export function validateLogin(body) {
  const value = {
    email: cleanString(body.email).toLowerCase(),
    password: cleanString(body.password),
  };
  const errors = [];

  if (!value.email) errors.push({ field: "email", message: "Email is required." });
  if (!value.password) errors.push({ field: "password", message: "Password is required." });

  return { value, errors };
}

export function validateRegister(body) {
  const value = {
    name: cleanString(body.name),
    email: cleanString(body.email).toLowerCase(),
    password: cleanString(body.password),
  };
  const errors = [];

  if (!value.name) errors.push({ field: "name", message: "Name is required." });
  if (!value.email) errors.push({ field: "email", message: "Email is required." });
  if (!value.password || value.password.length < 6) {
    errors.push({ field: "password", message: "Password must be at least 6 characters." });
  }

  return { value, errors };
}

export function validateRepairCreate(body) {
  const totalAmount = cleanMoney(body.totalAmount ?? body.amount);
  const paidAmount = cleanMoney(body.paidAmount ?? body.advanceAmount ?? 0);
  const advanceAmount = cleanMoney(body.advanceAmount ?? (paidAmount > 0 ? paidAmount : 0));

  const value = {
    customerName: cleanString(body.customerName || body.name),
    device: cleanString(body.device),
    issue: cleanString(body.issue),
    whatsapp: cleanString(body.whatsapp || body.phone).replace(/\D/g, ""),
    totalAmount,
    advanceAmount,
    paidAmount,
    initialPaymentMethod: cleanString(body.initialPaymentMethod) || "Cash",
    initialPaymentNote: cleanString(body.initialPaymentNote) || "Initial payment / advance",
    delivery: cleanString(body.delivery),
    repairStatus: cleanString(body.repairStatus || body.status) || "Pending Work",
    extraFlags: cleanFlags(body),
  };
  const errors = [];

  if (!value.customerName) errors.push({ field: "customerName", message: "Customer name is required." });
  if (!value.device) errors.push({ field: "device", message: "Device is required." });
  if (!value.issue) errors.push({ field: "issue", message: "Issue is required." });
  if (value.whatsapp.length < 10) errors.push({ field: "whatsapp", message: "WhatsApp number must have at least 10 digits." });
  if (!Number.isFinite(value.totalAmount) || value.totalAmount <= 0) errors.push({ field: "totalAmount", message: "Total amount must be greater than 0." });
  if (!Number.isFinite(value.paidAmount) || value.paidAmount < 0) errors.push({ field: "paidAmount", message: "Paid amount cannot be negative." });
  if (!Number.isFinite(value.advanceAmount) || value.advanceAmount < 0) errors.push({ field: "advanceAmount", message: "Advance amount cannot be negative." });
  if (value.paidAmount > value.totalAmount) errors.push({ field: "paidAmount", message: "Paid amount cannot be greater than total amount." });
  if (value.advanceAmount > value.paidAmount) errors.push({ field: "advanceAmount", message: "Advance amount cannot be greater than paid amount." });
  if (value.paidAmount > 0 && !paymentMethods.includes(value.initialPaymentMethod)) errors.push({ field: "initialPaymentMethod", message: "Invalid payment method." });
  if (!value.delivery) errors.push({ field: "delivery", message: "Delivery is required." });
  if (body.repairStatus !== undefined && !repairStatuses.includes(value.repairStatus)) {
    errors.push({ field: "repairStatus", message: "Invalid repair status." });
  } else if (body.repairStatus === undefined && !allowedRepairStatuses.has(value.repairStatus)) {
    errors.push({ field: "repairStatus", message: "Invalid repair status." });
  }

  return { value, errors };
}

export function validateRepairUpdate(body) {
  const value = {};
  const errors = [];

  if (body.customerName !== undefined || body.name !== undefined) value.customerName = cleanString(body.customerName || body.name);
  if (body.device !== undefined) value.device = cleanString(body.device);
  if (body.issue !== undefined) value.issue = cleanString(body.issue);
  if (body.whatsapp !== undefined || body.phone !== undefined) value.whatsapp = cleanString(body.whatsapp || body.phone).replace(/\D/g, "");
  if (body.totalAmount !== undefined || body.amount !== undefined) value.totalAmount = cleanMoney(body.totalAmount ?? body.amount);
  if (body.advanceAmount !== undefined) value.advanceAmount = cleanMoney(body.advanceAmount);
  if (body.paidAmount !== undefined) value.paidAmount = cleanMoney(body.paidAmount);
  if (body.delivery !== undefined) value.delivery = cleanString(body.delivery);
  if (body.repairStatus !== undefined || body.status !== undefined) value.repairStatus = cleanString(body.repairStatus || body.status);
  if (body.extraFlags !== undefined || body.flags !== undefined || repairFlags.some((flag) => body[flag] !== undefined)) {
    value.extraFlags = cleanFlags(body);
  }

  if (!Object.keys(value).length) errors.push({ field: "body", message: "At least one field is required." });
  if (value.whatsapp !== undefined && value.whatsapp.length < 10) errors.push({ field: "whatsapp", message: "WhatsApp number must have at least 10 digits." });
  if (value.totalAmount !== undefined && (!Number.isFinite(value.totalAmount) || value.totalAmount <= 0)) errors.push({ field: "totalAmount", message: "Total amount must be greater than 0." });
  if (value.paidAmount !== undefined && (!Number.isFinite(value.paidAmount) || value.paidAmount < 0)) errors.push({ field: "paidAmount", message: "Paid amount cannot be negative." });
  if (value.advanceAmount !== undefined && (!Number.isFinite(value.advanceAmount) || value.advanceAmount < 0)) errors.push({ field: "advanceAmount", message: "Advance amount cannot be negative." });
  if (value.repairStatus !== undefined && body.repairStatus !== undefined && !repairStatuses.includes(value.repairStatus)) {
    errors.push({ field: "repairStatus", message: "Invalid repair status." });
  } else if (value.repairStatus !== undefined && body.repairStatus === undefined && !allowedRepairStatuses.has(value.repairStatus)) {
    errors.push({ field: "repairStatus", message: "Invalid repair status." });
  }

  return { value, errors };
}

export function validateRepairPayment(body) {
  const value = {
    amount: cleanMoney(body.amount),
    note: cleanString(body.note),
    method: cleanString(body.method),
  };
  const errors = [];

  if (!Number.isFinite(value.amount)) errors.push({ field: "amount", message: "Payment amount must be a valid number." });
  if (value.amount <= 0) errors.push({ field: "amount", message: "Payment amount must be greater than 0." });
  if (!paymentMethods.includes(value.method)) errors.push({ field: "method", message: "Invalid payment method." });

  return { value, errors };
}

export const validateQuery = (validator) => (req, res, next) => {
  const result = validator(req.query, req);

  if (result.errors.length) {
    throw new ApiError(400, "Validation failed.", result.errors);
  }

  req.validatedQuery = result.value;
  next();
};

export function validateRepairListQuery(query) {
  const legacyStatus = cleanString(query.status);
  const repairStatus = cleanString(query.repairStatus || (allowedPaymentStatuses.has(legacyStatus) ? "" : legacyStatus));
  const paymentStatus = cleanString(query.paymentStatus || (allowedPaymentStatuses.has(legacyStatus) ? legacyStatus : ""));
  const search = cleanString(query.search || query.q);
  const sort = cleanString(query.sort) || "newest";
  const page = Number(query.page || 1);
  const limit = Number(query.limit || 0);
  const errors = [];

  if (query.repairStatus !== undefined && repairStatus && !filterableRepairStatuses.includes(repairStatus)) {
    errors.push({ field: "repairStatus", message: "Invalid repair status filter." });
  } else if (query.repairStatus === undefined && repairStatus && !filterableRepairStatuses.includes(repairStatus) && !allowedRepairStatuses.has(repairStatus)) {
    errors.push({ field: "repairStatus", message: "Invalid repair status filter." });
  }

  if (query.paymentStatus !== undefined && paymentStatus && !filterablePaymentStatuses.includes(paymentStatus)) {
    errors.push({ field: "paymentStatus", message: "Invalid payment status filter." });
  } else if (query.paymentStatus === undefined && paymentStatus && !filterablePaymentStatuses.includes(paymentStatus) && !allowedPaymentStatuses.has(paymentStatus)) {
    errors.push({ field: "paymentStatus", message: "Invalid payment status filter." });
  }

  if (!["newest", "oldest", "delivery"].includes(sort)) {
    errors.push({ field: "sort", message: "Invalid sort option." });
  }

  if (!Number.isInteger(page) || page < 1) {
    errors.push({ field: "page", message: "Page must be a positive number." });
  }

  if (limit && (!Number.isInteger(limit) || limit < 1 || limit > 100)) {
    errors.push({ field: "limit", message: "Limit must be between 1 and 100." });
  }

  return {
    value: {
      repairStatus: repairStatus && repairStatus !== "All" ? repairStatus : undefined,
      paymentStatus: paymentStatus && paymentStatus !== "All" ? paymentStatus : undefined,
      search,
      sort,
      page,
      limit,
    },
    errors,
  };
}
