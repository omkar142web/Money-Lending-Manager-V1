import { ApiError } from "../utils/ApiError.js";

export const validate = (validator) => (req, res, next) => {
  const result = validator(req.body, req);

  if (result.errors.length) {
    throw new ApiError(400, "Validation failed.", result.errors);
  }

  req.validatedBody = result.value;
  next();
};

const allowedStatuses = new Set(["Pending Work", "In Progress", "Done"]);

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function cleanMoney(value) {
  const digits = String(value ?? "").replace(/[^\d.]/g, "");
  return Number(digits);
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
  const value = {
    customerName: cleanString(body.customerName || body.name),
    device: cleanString(body.device),
    issue: cleanString(body.issue),
    whatsapp: cleanString(body.whatsapp || body.phone).replace(/\D/g, ""),
    amount: cleanMoney(body.amount),
    delivery: cleanString(body.delivery),
    status: cleanString(body.status) || "Pending Work",
  };
  const errors = [];

  if (!value.customerName) errors.push({ field: "customerName", message: "Customer name is required." });
  if (!value.device) errors.push({ field: "device", message: "Device is required." });
  if (!value.issue) errors.push({ field: "issue", message: "Issue is required." });
  if (value.whatsapp.length < 10) errors.push({ field: "whatsapp", message: "WhatsApp number must have at least 10 digits." });
  if (!Number.isFinite(value.amount) || value.amount <= 0) errors.push({ field: "amount", message: "Amount must be greater than 0." });
  if (!value.delivery) errors.push({ field: "delivery", message: "Delivery is required." });
  if (!allowedStatuses.has(value.status)) errors.push({ field: "status", message: "Invalid repair status." });

  return { value, errors };
}

export function validateRepairUpdate(body) {
  const value = {};
  const errors = [];

  if (body.customerName !== undefined || body.name !== undefined) value.customerName = cleanString(body.customerName || body.name);
  if (body.device !== undefined) value.device = cleanString(body.device);
  if (body.issue !== undefined) value.issue = cleanString(body.issue);
  if (body.whatsapp !== undefined || body.phone !== undefined) value.whatsapp = cleanString(body.whatsapp || body.phone).replace(/\D/g, "");
  if (body.amount !== undefined) value.amount = cleanMoney(body.amount);
  if (body.delivery !== undefined) value.delivery = cleanString(body.delivery);
  if (body.status !== undefined) value.status = cleanString(body.status);

  if (!Object.keys(value).length) errors.push({ field: "body", message: "At least one field is required." });
  if (value.whatsapp !== undefined && value.whatsapp.length < 10) errors.push({ field: "whatsapp", message: "WhatsApp number must have at least 10 digits." });
  if (value.amount !== undefined && (!Number.isFinite(value.amount) || value.amount <= 0)) errors.push({ field: "amount", message: "Amount must be greater than 0." });
  if (value.status !== undefined && !allowedStatuses.has(value.status)) errors.push({ field: "status", message: "Invalid repair status." });

  return { value, errors };
}
