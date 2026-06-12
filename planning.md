# Money Lending Management System - Project Plan

Since you're already comfortable with **Node.js + Express + MongoDB** and you've worked on payment tracking before, I'd keep the stack the same and design this as a proper **Money Lending Management System**.

---

# 1. Main Goal

Your client lends money to people. The app should answer:

* Who owes me money?
* How much do they owe?
* When did I lend it?
* How much have they repaid?
* Which loans are overdue?
* What is my total money currently out in the market?

---

# 2. MVP Features (Phase 1)

## Dashboard
Show cards with real-time statistics:
* **Total Lent Amount**
* **Total Collected**
* **Interest Earned** (Split from principal)
* **Outstanding Amount** (Remaining)
* **Active Loans**
* **Overdue Loans**
* **Today's Collection Widget**

## Customer Management
Detailed profile tracking:
* Full Name, Phone, Alternate Phone
* Address, City, State, Pincode
* Aadhaar, PAN (KYC)
* Occupation & Monthly Income
* Reference Person & Reference Phone (Guarantor details)
* Notes & Risk Level (Low/Medium/High)

## Loan Management
* **Loan Creation:** Principal, Interest Rate (Monthly/Daily), Interest Type (Simple/Flat), Lending Date, Due Date.
* **Loan Numbering:** Unique IDs like `LN-2026-001`.
* **Purpose of Loan:** Business, Medical, Education, Personal, etc.
* **EMI Calculator:** Built-in tool to show Monthly EMI, Total Interest, and Total Repayment before creation.
* **Auto Status:** Draft, Active, Partially Paid, Paid, Overdue, Written Off, Closed.

## Payment Collection
* Record payments with split: **Principal Paid vs Interest Paid**.
* Payment Method, Transaction ID, Receipt Number.
* Auto-update Loan Status and remaining balance.

## WhatsApp Quick-Share & UPI Integration
* **One-Click Reminders:** Manual button to send a formatted WhatsApp message with loan details, installment amount, and due date.
* **UPI Deep-Linking:** Automatically generate a UPI payment link (`upi://pay?pa=...`) and include it in the message so customers can pay instantly via any UPI app (GPay, PhonePe, etc.).

## Transaction Timeline
* A full history of every action taken on a loan (Created → Payment Received → Status Changed).

## Document Management
* Upload and store: Aadhaar, PAN, Agreement PDF, Customer Photo.
* Structured storage by Customer/Loan ID.

---

# 3. Phase 2 Features

## Installment Tracking
* Generate installment schedules (Pending, Paid, Overdue, Partially Paid).
* Track specific due dates for each EMI.

## Search & Filters
* Advanced search by Name, Phone, Loan ID.
* Filters for Overdue, This Month's Due, etc.

## Follow-Up Module
* Log calls and visits: "Called customer, promised payment on Friday".
* Set Next Follow-Up Date.

## Reminder System
* Automated or manual WhatsApp/SMS reminders for upcoming/overdue payments.

## PDF Receipts
* Generate professional receipts for every payment collected.

## Backup & Export
* Export data to Excel/CSV.
* Auto daily backups to cloud storage.

---

# 4. Phase 3 Features

## Multiple Staff & Roles
* **Admin:** Full access.
* **Manager:** Loan approval and payment management.
* **Staff:** Data entry and collection only.
* **Collection Agent:** View assigned loans, add payments, and log follow-ups.

## Audit Logs
* Track every change: "Loan Updated", "Payment Deleted", "Customer Modified" with User ID and Timestamp.

## Advanced Reports
* **Collection Report:** Daily/Weekly/Monthly.
* **Defaulter Report:** List of overdue accounts.
* **Interest Report:** Revenue generated from interest.
* **Loan Aging Report:** How long loans have been outstanding.

## Security Features
* JWT Authentication with Refresh Tokens.
* 2FA & Session Management.
* Password reset & Account lockout after failed attempts.

---

# 5. Database Design (MongoDB)

### Users
```js
{
  _id,
  name,
  email,
  password,
  role: ['Admin', 'Manager', 'Staff', 'Collection Agent'],
  activeSessions: []
}
```

### Customers
```js
{
  _id,
  name,
  phone,
  alternatePhone,
  address, city, state, pincode,
  aadhaar, pan,
  occupation, monthlyIncome,
  referencePerson, referencePhone,
  riskLevel,
  notes,
  createdAt
}
```

### Loans
```js
{
  _id,
  loanNumber,
  customerId,
  principalAmount,
  interestRate,
  interestType,
  processingFee,
  latePenalty,
  loanDuration,
  installmentType,
  installmentAmount,
  totalInstallments,
  nextPaymentDate,
  lentDate,
  dueDate,
  purposeOfLoan,
  totalAmountToRepay,
  paidAmount,
  remainingAmount,
  status: ['Draft', 'Active', 'Partially Paid', 'Paid', 'Overdue', 'Written Off', 'Closed'],
  writeOffReason,
  writeOffDate,
  notes
}
```

### Payments
```js
{
  _id,
  loanId,
  customerId,
  amount,
  principalPaid,
  interestPaid,
  paymentMethod,
  transactionId,
  receiptNumber,
  paymentDate,
  note
}
```

### Installments
```js
{
  _id,
  loanId,
  installmentNo,
  dueDate,
  amount,
  paidAmount,
  status: ['Pending', 'Partially Paid', 'Paid', 'Overdue']
}
```

### FollowUps
```js
{
  _id,
  customerId,
  loanId,
  followUpDate,
  remarks,
  nextFollowUpDate,
  status
}
```

### AuditLogs
```js
{
  _id,
  userId,
  action,
  module,
  recordId,
  timestamp
}
```

---

# 6. Updated Development Order

### PHASE 1 (MVP)
1.  **Authentication:** JWT, Roles, Login/Register.
2.  **Dashboard:** Total Lent, Collected, Interest, Overdue, Today's Collection.
3.  **Customers:** Full profile management with KYC fields.
4.  **Loans:** Creation with Loan Number, Purpose, and EMI Calculator.
5.  **Payments:** Record payments with Principal/Interest split.
6.  **Auto Loan Status:** Real-time status updates based on payments.
7.  **Transaction Timeline:** View loan history.
8.  **Document Upload:** Basic file storage for KYC.
9.  **WhatsApp Quick-Share:** Manual reminders with UPI links.
10. **Basic Reports:** Loans given, Money received.

### PHASE 2
11. **Installment Tracking:** Detailed EMI schedules.
12. **Search & Filters:** Advanced lookup.
12. **PDF Receipts:** Automated receipt generation.
13. **Backup & Export:** Excel/CSV exports.
14. **Follow-Ups:** Collection tracking module.
15. **Reminder System:** WhatsApp/SMS integration.
16. **Defaulter Reports:** Specialized tracking for late payments.

### PHASE 3
17. **Multiple Staff:** Role-based access control.
18. **Collection Agents:** Field staff module.
19. **Audit Logs:** Full system transparency.
20. **Advanced Reports:** Aging, Staff performance, Interest revenue.
21. **Risk Scoring:** Automated customer risk calculation.
22. **Guarantor Management:** Detailed tracking of 3rd party guarantees.

### PHASE 4
23. **WhatsApp Automation:** Fully automated reminders.
24. **QR Payments:** Integrated payment collection.
25. **Mobile App:** For field agents.
26. **Multi-language:** Support for regional languages.
27. **Customer Portal:** View-only access for borrowers.

---

# 7. Technical Reference: WhatsApp & UPI Integration

This code snippet (extracted from the reference dashboard) shows how to format Indian phone numbers, generate a UPI deep-link, and trigger a WhatsApp message with the payment link.

```javascript
/* ── WhatsApp Formatting & Messaging ── */
function formatWhatsAppNumber(number) {
  let digits = String(number || "")
    .replace(/[+\s\-()]/g, "")
    .replace(/\D/g, "");

  // Handle redundant prefixing
  while (digits.startsWith("9191") && digits.length > 12) {
    digits = digits.slice(2);
  }

  // Ensure 91 prefix for Indian numbers
  if (digits.length === 10 && /^[6-9]\d{9}$/.test(digits)) {
    return `91${digits}`;
  }

  if (digits.length === 12 && digits.startsWith("91") && /^[6-9]\d{9}$/.test(digits.slice(2))) {
    return digits;
  }

  return "";
}

function sendWhatsApp(customerName, rawAmount, phone, loanDetails) {
  const upiId = "your-upi-id@bank"; // Dynamic from settings
  const merchantName = "Your Business Name";
  const transactionId = "TXN" + Date.now();
  
  // Generate UPI Deep Link
  const paymentLink = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(merchantName)}&am=${rawAmount}&cu=INR&tn=${encodeURIComponent(loanDetails)}&tr=${transactionId}`;
  
  const formattedPhone = formatWhatsAppNumber(phone);
  
  if (!formattedPhone) {
    alert("Please enter a valid WhatsApp number.");
    return;
  }

  // Formatted Message
  const message = `*Hello ${customerName}*%0A%0A` +
    `💰 *Payment Reminder*%0A` +
    `📌 Loan: ${loanDetails}%0A` +
    `💵 Amount Due: ₹${rawAmount}%0A%0A` +
    `💳 *Pay Instantly via UPI:*%0A${encodeURIComponent(paymentLink)}%0A%0A` +
    `Thank you for your business! 🙏`;

  window.open(`https://wa.me/${formattedPhone}?text=${message}`, "_blank");
}
```

