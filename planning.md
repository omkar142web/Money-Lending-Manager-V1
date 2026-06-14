# Money Lending Manager — Project Roadmap

> **Base project:** Balaji Store (repair management dashboard)  
> **Target:** Money Lending Management System for a private lender  
> **Strategy:** Reuse existing architecture, UI shell, auth, middleware, and error pages — adapt domain logic instead of rebuilding from scratch.

---

## Table of Contents

1. [What This App Must Answer](#1-what-this-app-must-answer)
2. [What We Already Have (Balaji Store)](#2-what-we-already-have-balaji-store)
3. [File Migration Map](#3-file-migration-map)
4. [Tech Stack (Unchanged)](#4-tech-stack-unchanged)
5. [Phase 0 — Foundation & Rename](#5-phase-0--foundation--rename)
6. [Phase 1 — MVP (Core Lending)](#6-phase-1--mvp-core-lending)
7. [Phase 2 — Operations & Collection](#7-phase-2--operations--collection)
8. [Phase 3 — Team, Security & Reports](#8-phase-3--team-security--reports)
9. [Phase 4 — Automation & Scale](#9-phase-4--automation--scale)
10. [Database Design](#10-database-design)
11. [API Endpoints (Planned)](#11-api-endpoints-planned)
12. [Features You Hadn't Listed (Recommended)](#12-features-you-hadnt-listed-recommended)
13. [WhatsApp & UPI Integration Reference](#13-whatsapp--upi-integration-reference)
14. [Definition of Done (Per Phase)](#14-definition-of-done-per-phase)

---

## 1. What This App Must Answer

Every screen and feature should help the lender answer these questions quickly:

| Question | Where it lives |
| :--- | :--- |
| Who owes me money? | Customer list, loan list, defaulter report |
| How much do they owe? | Loan detail, dashboard outstanding card |
| When did I lend it? | Loan detail, transaction timeline |
| How much have they repaid? | Payment history, principal vs interest split |
| Which loans are overdue? | Dashboard overdue widget, filters |
| What is my total money out in the market? | Dashboard total lent / outstanding cards |
| Who should I call today? | Follow-up module, today's due widget |

---

## 2. What We Already Have (Balaji Store)

These pieces are **done or mostly done** — adapt, don't rewrite:

| Existing piece | Lending equivalent | Reuse level |
| :--- | :--- | :--- |
| `server.js` | App entry | Update route imports only |
| `services/auth.service.js` | Login, sessions, password hash | ~95% reuse |
| `middleware/requireAuth.js` | Protect API routes | 100% reuse |
| `middleware/validate.js` | Request validation | Extend with loan/customer schemas |
| `middleware/errorHandler.js` | 404/500 handling | 100% reuse |
| `middleware/asyncHandler.js` | Async wrapper | 100% reuse |
| `views/404.html`, `500.html`, `fserr.html` | Error pages | Rebrand text only |
| `views/login.ejs`, `register.ejs` | Auth UI | Rebrand + minor copy |
| `views/index.html` | Main dashboard | Heavy edit (domain + labels) |
| `services/repair.service.js` | `loan.service.js` | ~60% logic reuse (payments, balances, search) |
| `config/repairWorkflow.js` | `config/loanWorkflow.js` | Replace statuses, keep pattern |
| `controllers/repair.controller.js` | `loan.controller.js` | Same structure, new fields |
| `routes/repair.routes.js` | `loan.routes.js` + new routes | Extend |
| `utils/ApiError.js`, `response.js`, `objectId.js` | Helpers | 100% reuse |
| Payment history pattern in repairs | Loan payment log | Direct mapping |
| Search + filter on dashboard | Customer/loan search | Direct mapping |

**Key insight:** Repairs already track `totalAmount`, `paidAmount`, `remainingAmount`, `paymentStatus`, and `paymentHistory`. Loans need the same money math **plus** interest, installments, and customer KYC.

---

## 3. File Migration Map

### Phase 0 — Rename & scaffold

```
KEEP (no domain change)          RENAME / REPLACE                    CREATE NEW
─────────────────────────        ─────────────────                   ──────────
server.js (edit imports)    →    repair.service.js  → loan.service.js    customer.service.js
auth.service.js                  repair.controller  → loan.controller     customer.controller.js
requireAuth.js                   repair.routes      → loan.routes         customer.routes.js
errorHandler.js                  repairWorkflow.js  → loanWorkflow.js     settings.service.js
validate.js (extend)             index.html (rebrand)                      payment.service.js
404.html, 500.html               package.json name                         installment.service.js
login.ejs, register.ejs          .env.example MONGO_DB_NAME                models/ or schemas/ (optional)
```

### Suggested final structure (after Phase 1)

```text
Money_Lending_Manager/
├── config/
│   ├── env.js
│   ├── mongodb.js              # add collections: customers, loans, payments, settings
│   └── loanWorkflow.js         # loan statuses, interest types, payment methods
├── controllers/
│   ├── auth.controller.js
│   ├── customer.controller.js
│   ├── loan.controller.js
│   ├── payment.controller.js
│   └── page.controller.js
├── middleware/                 # unchanged
├── routes/
│   ├── auth.routes.js
│   ├── customer.routes.js
│   ├── loan.routes.js
│   ├── payment.routes.js
│   └── page.routes.js
├── services/
│   ├── auth.service.js
│   ├── customer.service.js
│   ├── loan.service.js
│   ├── payment.service.js
│   └── settings.service.js
├── utils/                      # unchanged
├── views/
│   ├── index.html              # main dashboard
│   ├── login.ejs
│   ├── register.ejs
│   ├── 404.html
│   ├── 500.html
│   └── fserr.html
└── server.js
```

---

## 4. Tech Stack (Unchanged)

| Layer | Choice | Notes |
| :--- | :--- | :--- |
| Runtime | Node.js 18+ | Already configured |
| Framework | Express 5 | Already configured |
| Database | MongoDB (native driver) | Already configured |
| Frontend | HTML/CSS/JS dashboard + EJS auth | Reuse `index.html` design system |
| Auth (MVP) | HTTP-only cookie sessions | Already in `auth.service.js` — **do not switch to JWT in Phase 1** |
| Auth (Phase 3) | JWT + refresh tokens, 2FA | Upgrade when multi-device / staff scaling is needed |

---

## 5. Phase 0 — Foundation & Rename

**Goal:** Turn the Balaji codebase into a blank lending skeleton without breaking auth or the dashboard shell.  
**Duration estimate:** 1–2 days  
**Do this first — everything else depends on it.**

### 5.1 Tasks

| # | Task | Details |
| :-: | :--- | :--- |
| 0.1 | Rename project metadata | `package.json` name/description, server console log, page titles |
| 0.2 | Update environment | `.env.example`: `MONGO_DB_NAME=moneyLendingManager`, add `BUSINESS_NAME`, `UPI_ID` placeholders |
| 0.3 | Register new collections | In `config/mongodb.js`: `customers`, `loans`, `payments`, `settings` (keep `users`) |
| 0.4 | Create `loanWorkflow.js` | Loan statuses, interest types, payment methods (mirror `repairWorkflow.js` pattern) |
| 0.5 | Scaffold loan module | Copy repair module → loan module; strip repair-specific fields (device, warranty, etc.) |
| 0.6 | Rebrand dashboard shell | `index.html`: title, nav labels, empty state copy — keep CSS/layout |
| 0.7 | Rebrand auth pages | `login.ejs`, `register.ejs`: business name and tagline |
| 0.8 | Wire routes in `server.js` | Replace `repairRoutes` with `loanRoutes`; add placeholder customer routes |
| 0.9 | Smoke test | Login works, dashboard loads, 404/500 pages render, API returns empty loan list |

### 5.2 Acceptance criteria

- [ ] App starts with zero errors
- [ ] Login/logout still works
- [ ] No references to "repair" or "Balaji" in user-facing UI
- [ ] Empty dashboard loads with lending-themed labels
- [ ] Old repair data untouched in DB (or migrated manually later)

---

## 6. Phase 1 — MVP (Core Lending)

**Goal:** Lender can register customers, create loans, record payments, and see totals on a dashboard.  
**Duration estimate:** 1–2 weeks  
**Priority:** Highest — ship this before anything in Phase 2+.

### 6.1 Build order (strict sequence)

Do these **in order**. Each step unlocks the next.

```
Step 1 ──► Step 2 ──► Step 3 ──► Step 4 ──► Step 5 ──► Step 6 ──► Step 7
Settings   Customers   Loans      Payments   Status     Dashboard  Timeline
```

---

### Step 1 — App Settings (do first)

**Why first:** UPI ID, business name, and default interest rate are needed by WhatsApp share and loan creation.

| Feature | Details |
| :--- | :--- |
| Business profile | Business name, owner name, phone, address |
| Payment settings | Default UPI ID, supported payment methods |
| Loan defaults | Default interest rate, default tenure, late penalty % |
| UI | Simple settings panel in dashboard (modal or sidebar section) |

**API:** `GET/PATCH /api/settings`

---

### Step 2 — Customer Management

| Feature | Details |
| :--- | :--- |
| Create customer | Name, phone (required); rest optional at first |
| Full profile | Alternate phone, address, city, state, pincode |
| KYC fields | Aadhaar, PAN (store masked in UI: `XXXX-XXXX-1234`) |
| Employment | Occupation, monthly income |
| Reference / guarantor | Reference person name + phone |
| Risk level | Low / Medium / High (manual tag for now) |
| Notes | Free-text field |
| List view | Paginated table with search by name or phone |
| Customer detail | Shows all loans + total outstanding for that customer |

**API:**
- `GET /api/customers` (search, pagination)
- `POST /api/customers`
- `GET /api/customers/:id`
- `PATCH /api/customers/:id`
- `DELETE /api/customers/:id` (soft delete — set `isActive: false`)

**Reuse from Balaji:** Search/filter pattern from `repair.service.js` `listRepairs`.

---

### Step 3 — Loan Management

| Feature | Details |
| :--- | :--- |
| Create loan | Link to existing customer (or quick-create inline) |
| Loan number | Auto-generate `LN-2026-001` (year + sequential) |
| Principal amount | Required |
| Interest rate | Monthly or daily; simple or flat (MVP: simple monthly only) |
| Dates | Lending date, due date (or tenure in months → auto-calc due date) |
| Purpose | Business, Medical, Education, Personal, Other |
| Fees | Processing fee (optional), late penalty % (from settings default) |
| EMI preview | Built-in calculator before save: monthly EMI, total interest, total repayment |
| Loan notes | Free text |
| Draft mode | Save as draft before activating |

**Interest calculation (MVP):**

```
Simple Monthly Interest:
  totalInterest = principal × (monthlyRate / 100) × numberOfMonths
  totalRepay    = principal + totalInterest + processingFee
  monthlyEMI    = totalRepay / numberOfMonths
```

> **Defer to Phase 2:** Reducing balance interest, daily interest, custom installment schedules.

**API:**
- `GET /api/loans` (filters: status, customer, overdue, search)
- `POST /api/loans`
- `GET /api/loans/:id`
- `PATCH /api/loans/:id`
- `DELETE /api/loans/:id`

**Reuse from Balaji:** CRUD structure from `repair.service.js`, amount field helpers (`calculateAmountFields`, `clampMoney`).

---

### Step 4 — Payment Collection

| Feature | Details |
| :--- | :--- |
| Record payment | Amount, date, method (Cash/UPI/Card/Bank Transfer) |
| Principal vs interest split | Auto-allocate: interest first, then principal (or manual override) |
| Transaction ID | Optional UPI/bank reference |
| Receipt number | Auto-generate `RCP-2026-00001` |
| Payment note | Optional |
| Payment history | Chronological list per loan (reuse repair `paymentHistory` pattern) |
| Edit/delete payment | Allow with confirmation; recalculate balances on change |

**API:**
- `POST /api/loans/:id/payments`
- `GET /api/loans/:id/payments`
- `PATCH /api/loans/:id/payments/:paymentId`
- `DELETE /api/loans/:id/payments/:paymentId`

**Reuse from Balaji:** `patchRepairPayment` flow — almost 1:1 mapping.

---

### Step 5 — Auto Loan Status

| Status | Rule |
| :--- | :--- |
| `Draft` | Loan created but not yet disbursed |
| `Active` | Disbursed, no payments yet |
| `Partially Paid` | At least one payment, balance remaining |
| `Paid` | `remainingAmount === 0` |
| `Overdue` | `dueDate < today` AND status is not Paid/Closed/Written Off |
| `Written Off` | Manually marked bad debt (requires reason) |
| `Closed` | Manually closed after full settlement |

**Implementation:** Central `recalculateLoan(loanId)` function called after every payment create/update/delete.  
**Reuse from Balaji:** `calculatePaymentStatus` in `repairWorkflow.js` — extend with overdue date check.

---

### Step 6 — Dashboard

| Widget | Data source |
| :--- | :--- |
| Total Lent | Sum of `principalAmount` for Active + Partially Paid + Overdue loans |
| Total Collected | Sum of all payments (all time) |
| Interest Earned | Sum of `interestPaid` across all payments |
| Outstanding Amount | Sum of `remainingAmount` for open loans |
| Active Loans | Count where status ∈ Active, Partially Paid |
| Overdue Loans | Count where status = Overdue |
| Today's Collection | Sum of payments where `paymentDate = today` |
| Recent activity | Last 10 payments / loans created |

**Reuse from Balaji:** Dashboard card layout and stat refresh pattern in `index.html`.

---

### Step 7 — Transaction Timeline

| Event type | Example |
| :--- | :--- |
| `LOAN_CREATED` | Loan LN-2026-003 created for ₹50,000 |
| `LOAN_ACTIVATED` | Loan disbursed |
| `PAYMENT_RECEIVED` | ₹5,000 received via UPI |
| `STATUS_CHANGED` | Active → Overdue |
| `LOAN_WRITTEN_OFF` | Marked bad debt: customer unreachable |
| `LOAN_CLOSED` | Fully settled |

Store as embedded array on loan document (MVP) or separate `timeline` collection (Phase 3).

---

### Step 8 — Document Upload (MVP-lite)

| Feature | Details |
| :--- | :--- |
| Upload per customer | Aadhaar, PAN, photo |
| Upload per loan | Signed agreement PDF |
| Storage (MVP) | Local `uploads/` folder or MongoDB GridFS |
| UI | File list with view/download on customer and loan detail |

> **Defer cloud storage (S3/Cloudinary) to Phase 2.**

---

### Step 9 — WhatsApp Quick-Share + UPI Link

| Feature | Details |
| :--- | :--- |
| Manual reminder button | On loan detail and overdue list |
| Message includes | Customer name, loan ID, amount due, due date |
| UPI deep link | Generated from settings UPI ID |
| Phone formatting | Indian number normalization (see Section 13) |

**No API needed** — client-side `window.open` to `wa.me` (same as reference snippet).

---

### Step 10 — Basic Reports (MVP)

| Report | Output |
| :--- | :--- |
| Loans given (date range) | Table + total principal |
| Money received (date range) | Table + total collected |
| Outstanding summary | By customer |

Export as **print-friendly HTML** in MVP. CSV/Excel in Phase 2.

---

### Phase 1 — Full checklist

| # | Feature | Priority |
| :-: | :--- | :---: |
| 1 | App settings (UPI, business name, defaults) | P0 |
| 2 | Customer CRUD + search | P0 |
| 3 | Loan CRUD + loan numbering | P0 |
| 4 | EMI calculator (preview before create) | P0 |
| 5 | Payment recording + principal/interest split | P0 |
| 6 | Auto loan status (incl. overdue) | P0 |
| 7 | Dashboard stats widgets | P0 |
| 8 | Transaction timeline | P1 |
| 9 | Document upload (local) | P1 |
| 10 | WhatsApp quick-share + UPI link | P1 |
| 11 | Basic reports (on-screen + print) | P1 |
| 12 | Error pages (404/500) — already done | Done |
| 13 | Auth (login/register/logout) — already done | Done |

---

## 7. Phase 2 — Operations & Collection

**Goal:** Day-to-day collection workflow — installments, follow-ups, receipts, exports.  
**Start after:** Phase 1 is deployed and used for at least a few real loans.

### 7.1 Features

| # | Feature | Details |
| :-: | :--- | :--- |
| 1 | **Installment schedule** | Auto-generate EMI rows on loan creation; track Pending / Paid / Overdue / Partial per installment |
| 2 | **Advanced search & filters** | By name, phone, loan ID, date range, status, risk level, "due this week" |
| 3 | **Follow-up module** | Log calls/visits, remarks, next follow-up date, outcome (Promised / Not reachable / Paid) |
| 4 | **Today's work queue** | Dashboard section: overdue + due today + follow-ups scheduled today |
| 5 | **PDF receipts** | Generate branded PDF per payment (use `pdfkit` or `puppeteer`) |
| 6 | **CSV / Excel export** | Customers, loans, payments, collections for a date range |
| 7 | **Backup** | Manual export + optional daily JSON dump |
| 8 | **Reminder system (manual)** | Bulk WhatsApp reminders for selected overdue loans |
| 9 | **Defaulter report** | Sorted by days overdue, amount outstanding |
| 10 | **Collateral tracking** | Record security against loan: gold, property docs, vehicle, etc. |
| 11 | **Loan renewal / top-up** | Close old loan, carry forward balance into new loan |
| 12 | **Reducing balance interest** | Second interest type alongside simple/flat |
| 13 | **Cloud document storage** | Move uploads to S3 or Cloudinary |

### 7.2 Build order

```
Installments → Search/Filters → Follow-ups → Today's Queue → PDF Receipts → Export/Backup → Reminders → Defaulter Report → Collateral → Loan Renewal
```

---

## 8. Phase 3 — Team, Security & Reports

**Goal:** Multiple users, accountability, and business intelligence.  
**Start after:** Phase 2 collection workflow is stable.

### 8.1 Features

| # | Feature | Details |
| :-: | :--- | :--- |
| 1 | **Roles & permissions** | Admin (full), Manager (approve/write-off), Staff (data entry), Collection Agent (assigned loans only) |
| 2 | **User management** | Admin can create/disable users, assign roles |
| 3 | **Collection agent assignment** | Assign loans/customers to specific agents |
| 4 | **Audit logs** | Every create/update/delete with userId, timestamp, before/after snapshot |
| 5 | **Advanced reports** | Collection (daily/weekly/monthly), interest revenue, loan aging, agent performance |
| 6 | **Guarantor management** | Separate guarantor entity linked to customer/loan (not just reference fields) |
| 7 | **Risk scoring** | Auto-score based on: past defaults, income ratio, loan amount vs income |
| 8 | **JWT + refresh tokens** | Replace cookie-only auth for multi-device |
| 9 | **2FA** | TOTP for admin/manager accounts |
| 10 | **Session management** | View/revoke active sessions |
| 11 | **Password reset** | Email-based reset flow |
| 12 | **Account lockout** | Lock after N failed login attempts |

### 8.2 Build order

```
Roles & User Mgmt → Agent Assignment → Audit Logs → Advanced Reports → Guarantors → Risk Scoring → JWT/2FA/Security
```

---

## 9. Phase 4 — Automation & Scale

**Goal:** Reduce manual work; optional customer-facing features.  
**Start after:** Phase 3 with real multi-user usage.

| # | Feature | Details |
| :-: | :--- | :--- |
| 1 | WhatsApp automation | Scheduled reminders via WhatsApp Business API (Twilio / Gupshup) |
| 2 | SMS reminders | Fallback for non-WhatsApp customers |
| 3 | QR payment collection | Generate dynamic QR per loan/installment |
| 4 | Customer portal | Borrower login to view balance, payment history (read-only) |
| 5 | Mobile-friendly PWA | Installable app for field collection agents |
| 6 | Multi-language | Hindi, Marathi, etc. for messages and UI labels |
| 7 | Bulk customer import | CSV upload |
| 8 | Accounting integration | Tally / export to standard ledger format |
| 9 | Notification center | In-app alerts for overdue, new payments, follow-up due |

---

## 10. Database Design

### Collections overview

```
users          → auth (exists)
settings       → singleton business config
customers      → borrower profiles
loans          → loan records + embedded timeline (MVP)
payments       → payment records (or embedded in loans for MVP)
installments   → Phase 2
followups      → Phase 2
guarantors     → Phase 3
auditlogs      → Phase 3
```

### `settings` (singleton document)

```js
{
  _id: "app_settings",
  businessName: "Balaji Finance",
  ownerName: "",
  phone: "",
  address: "",
  upiId: "name@upi",
  defaultInterestRate: 2,        // monthly %
  defaultTenureMonths: 12,
  latePenaltyPercent: 1,
  loanNumberPrefix: "LN",
  receiptNumberPrefix: "RCP",
  updatedAt
}
```

### `customers`

```js
{
  _id,
  name,                           // required
  phone,                          // required, unique
  alternatePhone,
  address, city, state, pincode,
  aadhaar, pan,                   // store full; display masked
  occupation, monthlyIncome,
  referencePerson, referencePhone,
  riskLevel: "Low" | "Medium" | "High",
  notes,
  documents: [{ type, filename, uploadedAt }],
  isActive: true,
  createdAt, updatedAt
}
```

### `loans`

```js
{
  _id,
  loanNumber,                     // "LN-2026-001"
  customerId,
  principalAmount,
  interestRate,                   // per month or per day
  interestRatePeriod: "monthly" | "daily",
  interestType: "simple" | "flat",  // MVP: simple only
  processingFee: 0,
  latePenaltyPercent,
  tenureMonths,
  installmentAmount,
  totalInstallments,
  totalInterest,
  totalAmountToRepay,
  paidAmount: 0,
  principalPaid: 0,
  interestPaid: 0,
  remainingAmount,
  lentDate,
  dueDate,
  nextPaymentDate,                // Phase 2 installments
  purposeOfLoan,
  status: "Draft" | "Active" | "Partially Paid" | "Paid" | "Overdue" | "Written Off" | "Closed",
  writeOffReason,
  writeOffDate,
  collateral: { type, description, value },  // Phase 2
  notes,
  timeline: [{ action, detail, createdAt, createdBy }],
  createdAt, updatedAt
}
```

### `payments`

```js
{
  _id,
  loanId,
  customerId,
  amount,
  principalPaid,
  interestPaid,
  paymentMethod: "Cash" | "UPI" | "Card" | "Bank Transfer",
  transactionId,
  receiptNumber,
  paymentDate,
  note,
  createdAt, createdBy
}
```

### `installments` (Phase 2)

```js
{
  _id,
  loanId,
  installmentNo,
  dueDate,
  amount,
  principalComponent,
  interestComponent,
  paidAmount: 0,
  status: "Pending" | "Partially Paid" | "Paid" | "Overdue"
}
```

### `followups` (Phase 2)

```js
{
  _id,
  customerId,
  loanId,
  type: "Call" | "Visit" | "WhatsApp",
  followUpDate,
  remarks,
  outcome: "Promised" | "Not Reachable" | "Paid" | "Dispute",
  nextFollowUpDate,
  createdBy,
  createdAt
}
```

### `auditlogs` (Phase 3)

```js
{
  _id,
  userId,
  action,                         // "CREATE" | "UPDATE" | "DELETE"
  module,                         // "loan" | "payment" | "customer"
  recordId,
  changes: { before, after },
  timestamp
}
```

### Indexes (add early)

```js
customers.createIndex({ phone: 1 }, { unique: true })
customers.createIndex({ name: "text", phone: "text" })
loans.createIndex({ loanNumber: 1 }, { unique: true })
loans.createIndex({ customerId: 1 })
loans.createIndex({ status: 1, dueDate: 1 })
payments.createIndex({ loanId: 1, paymentDate: -1 })
```

---

## 11. API Endpoints (Planned)

### Auth (exists)

| Method | Endpoint | Status |
| :--- | :--- | :---: |
| GET | `/login` | Done |
| POST | `/login` | Done |
| GET | `/logout` | Done |
| GET/POST | `/register` | Done |

### Settings (Phase 1 — Step 1)

| Method | Endpoint |
| :--- | :--- |
| GET | `/api/settings` |
| PATCH | `/api/settings` |

### Customers (Phase 1 — Step 2)

| Method | Endpoint |
| :--- | :--- |
| GET | `/api/customers` |
| POST | `/api/customers` |
| GET | `/api/customers/:id` |
| PATCH | `/api/customers/:id` |
| DELETE | `/api/customers/:id` |

### Loans (Phase 1 — Step 3)

| Method | Endpoint |
| :--- | :--- |
| GET | `/api/loans` |
| POST | `/api/loans` |
| GET | `/api/loans/:id` |
| PATCH | `/api/loans/:id` |
| DELETE | `/api/loans/:id` |
| POST | `/api/loans/:id/write-off` |
| POST | `/api/loans/:id/close` |

### Payments (Phase 1 — Step 4)

| Method | Endpoint |
| :--- | :--- |
| GET | `/api/loans/:id/payments` |
| POST | `/api/loans/:id/payments` |
| PATCH | `/api/loans/:id/payments/:paymentId` |
| DELETE | `/api/loans/:id/payments/:paymentId` |

### Dashboard (Phase 1 — Step 6)

| Method | Endpoint |
| :--- | :--- |
| GET | `/api/dashboard/stats` |
| GET | `/api/dashboard/recent-activity` |

### Phase 2+

| Method | Endpoint |
| :--- | :--- |
| GET | `/api/loans/:id/installments` |
| GET/POST | `/api/followups` |
| GET | `/api/reports/defaulters` |
| GET | `/api/reports/collections` |
| GET | `/api/export/:type` |

---

## 12. Features You Hadn't Listed (Recommended)

These are commonly needed for lending businesses. Suggested phase included.

| Feature | Why it matters | Phase |
| :--- | :--- | :---: |
| **App settings page** | UPI ID and business name needed everywhere | 1 |
| **Loan draft → activate flow** | Lender reviews terms before disbursing | 1 |
| **Write-off with reason** | Bad debt tracking for reports | 1 |
| **Soft delete customers** | Preserve history if customer returns | 1 |
| **Receipt auto-numbering** | Professional record-keeping | 1 |
| **Principal vs interest split** | Know actual profit vs capital recovery | 1 |
| **Collateral / security tracking** | Common in Indian private lending | 2 |
| **Today's work queue** | Daily operational view for collector | 2 |
| **Loan renewal / top-up** | Customers often re-borrow | 2 |
| **Print-friendly views** | Many lenders still keep physical files | 2 |
| **Customer loan history** | See repeat borrower behavior | 1 |
| **Overdue days counter** | "45 days overdue" is more useful than just a flag | 2 |
| **Bulk WhatsApp reminders** | Save time on collection day | 2 |
| **Data validation** | Aadhaar (12 digits), PAN (`AAAAA0000A`), phone (10 digits) | 1 |
| **Pagination** | Performance when customer list grows | 1 |
| **Onboarding empty states** | Guide first-time user: "Add your first customer" | 1 |
| **Disbursement confirmation** | Explicit step when money actually leaves lender's hand | 1 |

---

## 13. WhatsApp & UPI Integration Reference

Client-side only for MVP — no WhatsApp API key needed.

```javascript
/* ── WhatsApp Formatting & Messaging ── */
function formatWhatsAppNumber(number) {
  let digits = String(number || "")
    .replace(/[+\s\-()]/g, "")
    .replace(/\D/g, "");

  while (digits.startsWith("9191") && digits.length > 12) {
    digits = digits.slice(2);
  }

  if (digits.length === 10 && /^[6-9]\d{9}$/.test(digits)) {
    return `91${digits}`;
  }

  if (digits.length === 12 && digits.startsWith("91") && /^[6-9]\d{9}$/.test(digits.slice(2))) {
    return digits;
  }

  return "";
}

function sendWhatsApp(customerName, rawAmount, phone, loanDetails) {
  const upiId = "your-upi-id@bank";       // from /api/settings
  const merchantName = "Your Business Name"; // from /api/settings
  const transactionId = "TXN" + Date.now();

  const paymentLink = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(merchantName)}&am=${rawAmount}&cu=INR&tn=${encodeURIComponent(loanDetails)}&tr=${transactionId}`;

  const formattedPhone = formatWhatsAppNumber(phone);

  if (!formattedPhone) {
    alert("Please enter a valid WhatsApp number.");
    return;
  }

  const message = `*Hello ${customerName}*%0A%0A` +
    `💰 *Payment Reminder*%0A` +
    `📌 Loan: ${loanDetails}%0A` +
    `💵 Amount Due: ₹${rawAmount}%0A%0A` +
    `💳 *Pay Instantly via UPI:*%0A${encodeURIComponent(paymentLink)}%0A%0A` +
    `Thank you for your business! 🙏`;

  window.open(`https://wa.me/${formattedPhone}?text=${message}`, "_blank");
}
```

---

## 14. Definition of Done (Per Phase)

### Phase 0 done when
- App runs as Money Lending Manager (no Balaji/repair references in UI)
- Loan module scaffolded; API returns empty arrays
- Auth and error pages work

### Phase 1 done when
- Lender can: add customer → create loan → record payment → see updated dashboard
- Overdue loans auto-flagged
- WhatsApp reminder sends with correct UPI link from settings
- Basic reports show correct totals
- Works on mobile viewport (responsive dashboard)

### Phase 2 done when
- Installment schedule generates correctly for new loans
- Follow-ups can be logged and appear in today's queue
- PDF receipt downloads for any payment
- CSV export works for customers and payments

### Phase 3 done when
- Two users with different roles see different access levels
- Every loan edit is in audit log
- Advanced reports match manual calculations

### Phase 4 done when
- Automated reminders send on schedule
- Customer portal shows correct balance (read-only)

---

## Quick Reference — What to Build When

```
NOW          → Phase 0 (rename, scaffold, rebrand)
NEXT         → Phase 1 Steps 1–7 (settings → customers → loans → payments → status → dashboard → timeline)
THEN         → Phase 1 Steps 8–10 (documents, WhatsApp, basic reports)
AFTER MVP    → Phase 2 (installments, follow-ups, receipts, exports)
WHEN SCALING → Phase 3 (roles, audit, advanced reports, security)
LATER        → Phase 4 (automation, portal, mobile, multi-language)
```

---

*Last updated: June 2026*
