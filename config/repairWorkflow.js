export const repairStatuses = [
  "Pending Work",
  "In Progress",
  "Waiting for Parts",
  "Ready for Pickup",
  "Delivered",
  "Cancelled",
];

export const paymentStatuses = [
  "Unpaid",
  "Partially Paid",
  "Paid",
];

export const legacyPaymentStatuses = ["Advance Paid"];

export const paymentMethods = [
  "Cash",
  "UPI",
  "Card",
  "Bank Transfer",
];

export const repairFlags = [
  "warrantyClaim",
  "loanerDeviceGiven",
  "returned",
  "urgent",
];

export const legacyRepairStatuses = [
  "Done",
  "Payment Pending",
  "Paid",
  "Returned",
  "Warranty Claim",
  "Borrowed Phone Given",
];

export const filterableRepairStatuses = ["All", ...repairStatuses];
export const filterablePaymentStatuses = ["All", ...paymentStatuses];

export const allowedRepairStatuses = new Set([
  ...repairStatuses,
  ...legacyRepairStatuses,
]);

export const allowedPaymentStatuses = new Set([
  ...paymentStatuses,
  ...legacyPaymentStatuses,
]);

export function normalizeRepairStatus(status = "Pending Work") {
  if (repairStatuses.includes(status)) return status;
  if (status === "Done") return "Ready for Pickup";
  if (status === "Paid" || status === "Payment Pending") return "Delivered";
  if (status === "Returned") return "Delivered";
  if (status === "Warranty Claim" || status === "Borrowed Phone Given") return "Pending Work";
  return "Pending Work";
}

export function flagsFromLegacyStatus(status) {
  return {
    warrantyClaim: status === "Warranty Claim",
    loanerDeviceGiven: status === "Borrowed Phone Given",
    returned: status === "Returned",
    urgent: false,
  };
}

export function calculatePaymentStatus(totalAmount, paidAmount) {
  if (!paidAmount || paidAmount <= 0) return "Unpaid";
  if (paidAmount >= totalAmount) return "Paid";
  return "Partially Paid";
}
