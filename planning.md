# Money Lending Manager — Project Roadmap

> **Version 2.2** | June 2026  
> **Base project:** Balaji Store (repair management dashboard)  
> **Target:** Money Lending Management System for a private lender  
> **Strategy:** Reuse existing architecture, UI shell, auth, middleware, and error pages — adapt domain logic instead of rebuilding from scratch.

---

## How to Use This Document

- Feed this file as context at the start of each dev session.
- Prefix prompts with **Phase + Step**: e.g. `Phase 1 Step 2: Build customer.service.js`
- Build **one module at a time** — settings → customers → loans → payments.
- If context is lost, re-paste **Sections 10 (DB)** and **11 (API)** before asking for service/controller code.
- Use **Section 14 (Definition of Done)** as your acceptance checklist per phase.

### Principles (read before adding features)

| Principle | Rule |
| :--- | :--- |
| MVP first | Ship core lending loop before collection automation |
| Reuse Balaji | Extend `validate.js`, `response.js`, repair payment patterns — don't introduce parallel systems |
| One lender, one user | Phase 1 assumes single operator; multi-user = Phase 3 |
| Money math is sacred | Isolate in `utils/interestCalc.js` and unit-test it |
| No premature infra | No JWT, cron, encryption, or PDF pipelines until the phase that needs them |

---

## Table of Contents

1. [What This App Must Answer](#1-what-this-app-must-answer)
2. [What We Already Have (Balaji Store)](#2-what-we-already-have-balaji-store)
3. [File Migration Map](#3-file-migration-map)
4. [Tech Stack](#4-tech-stack)
5. [Phase 0 — Foundation & Rename](#5-phase-0--foundation--rename)
6. [Phase 1 — MVP (Core Lending)](#6-phase-1--mvp-core-lending)
7. [Phase 2 — Operations & Collection](#7-phase-2--operations--collection)
8. [Phase 3 — Team, Security & Reports](#8-phase-3--team-security--reports)
9. [Phase 4 — Automation & Scale](#9-phase-4--automation--scale)
10. [Database Design](#10-database-design)
11. [API Endpoints (Planned)](#11-api-endpoints-planned)
12. [Recommended Features by Phase](#12-recommended-features-by-phase)
13. [WhatsApp & UPI Integration Reference](#13-whatsapp--upi-integration-reference)
14. [Definition of Done (Per Phase)](#14-definition-of-done-per-phase)
15. [Security Checklist (Pragmatic)](#15-security-checklist-pragmatic)
16. [Interest Calculation Edge Cases](#16-interest-calculation-edge-cases)
17. [Error Handling & Data Integrity](#17-error-handling--data-integrity)
18. [Testing Strategy (Lean)](#18-testing-strategy-lean)

---

## 1. What This App Must Answer

| Question | Where it lives |
| :--- | :--- |
| Who owes me money? | Customer list, loan list, defaulter report (Phase 2) |
| How much do they owe? | Loan detail, dashboard outstanding card |
| When did I lend it? | Loan detail, transaction timeline |
| How much have they repaid? | Payment history, principal vs interest split |
| Which loans are overdue? | Dashboard overdue widget, filters |
| What is my total money out in the market? | Dashboard total lent / outstanding cards |
| Who should I call today? | Follow-up module, today's work queue (Phase 2) |
| What profit have I made? | Interest earned card on dashboard |

---

## 2. What We Already Have (Balaji Store)

| Existing piece | Lending equivalent | Reuse level |
| :--- | :--- | :--- |
| `server.js` | App entry | Update route imports only |
| `services/auth.service.js` | Login, sessions, scrypt passwords | ~95% reuse |
| `middleware/requireAuth.js` | Protect API routes | 100% reuse |
| `middleware/validate.js` | Request validation | Extend with new schemas |
| `middleware/errorHandler.js` | 404/500 handling | 100% reuse |
| `middleware/asyncHandler.js` | Async wrapper | 100% reuse |
| `utils/response.js` | `{ success, message, data }` | 100% reuse — do not change format |
| `views/404.html`, `500.html`, `fserr.html` | Error pages | Rebrand text only |
| `views/login.ejs`, `register.ejs` | Auth UI | Rebrand + minor copy |
| `views/index.html` | Main dashboard | Heavy edit (domain + labels) |
| `services/repair.service.js` | `loan.service.js` | ~60% logic reuse |
| `config/repairWorkflow.js` | `config/loanWorkflow.js` | Replace statuses, keep pattern |
| `controllers/repair.controller.js` | `loan.controller.js` | Same structure, new fields |
| `routes/repair.routes.js` | `loan.routes.js` + new routes | Extend |

**Key insight:** Repairs already track `totalAmount`, `paidAmount`, `remainingAmount`, `paymentStatus`, and `paymentHistory`. Loans need the same money math **plus** interest, installments, and customer KYC.

---

## 3. File Migration Map

### Phase 0 — Rename & scaffold

```
KEEP (no domain change)          RENAME / REPLACE                    CREATE NEW
─────────────────────────        ─────────────────                   ──────────
server.js (edit imports)    →    repair.service.js → loan.service.js   customer.service.js
auth.service.js                  repair.controller → loan.controller    customer.controller.js
requireAuth.js                   repair.routes     → loan.routes        customer.routes.js
errorHandler.js                  repairWorkflow.js → loanWorkflow.js    settings.service.js
validate.js (extend)             index.html (rebrand)                   utils/interestCalc.js
response.js, ApiError.js         package.json name
404.html, 500.html               .env.example
login.ejs, register.ejs
```

### Suggested structure (after Phase 1)

```text
Money_Lending_Manager/
├── config/
│   ├── env.js
│   ├── mongodb.js
│   └── loanWorkflow.js
├── controllers/
│   ├── auth.controller.js
│   ├── customer.controller.js
│   ├── loan.controller.js          # payment handlers live here in MVP
│   ├── settings.controller.js
│   └── page.controller.js
├── middleware/
│   ├── requireAuth.js
│   ├── validate.js
│   ├── errorHandler.js
│   ├── asyncHandler.js
│   └── rateLimit.js                # Phase 0: login only
├── routes/
│   ├── auth.routes.js
│   ├── customer.routes.js
│   ├── loan.routes.js
│   ├── settings.routes.js
│   └── page.routes.js
├── services/
│   ├── auth.service.js
│   ├── customer.service.js
│   ├── loan.service.js             # payments live here until Phase 2 split
│   └── settings.service.js
├── utils/
│   ├── ApiError.js
│   ├── response.js
│   ├── objectId.js
│   └── interestCalc.js
├── tests/
│   └── unit/
│       └── interestCalc.test.js    # add in Phase 1 Step 4
├── views/
│   ├── index.html
│   ├── login.ejs, register.ejs
│   ├── 404.html, 500.html, fserr.html
└── server.js
```

> **Deferred:** `payment.service.js`, `models/` folder, `loanNumberGen.js` — counters live in `settings.service.js`; numbering logic in `loan.service.js`.

---

## 4. Tech Stack

| Layer | Choice | Notes |
| :--- | :--- | :--- |
| Runtime | Node.js 18+ | Already configured |
| Framework | Express 5 | Already configured |
| Database | MongoDB (native driver) | Already configured |
| Frontend | HTML/CSS/JS + EJS auth | Reuse `index.html` design system |
| Validation | Extend `middleware/validate.js` | Do **not** add zod/joi for MVP |
| Auth (MVP) | HTTP-only cookie sessions | scrypt passwords — keep as-is |
| Auth (Phase 3) | JWT + refresh tokens, 2FA | Only when multi-user needed |
| Testing (Phase 1) | Jest — unit tests for `interestCalc.js` | Integration tests in Phase 2 |
| Logging (Phase 0) | Optional `morgan` dev logger | Structured logging deferred to Phase 3 |

---

## 5. Phase 0 — Foundation & Rename

**Goal:** Blank lending skeleton — auth and dashboard shell intact.  
**Duration:** 1–2 days

| # | Task | Details |
| :-: | :--- | :--- |
| 0.1 | Rename metadata | `package.json`, server log, page titles |
| 0.2 | Update `.env.example` | `MONGO_DB_NAME=moneyLendingManager`, `BUSINESS_NAME`, `UPI_ID` |
| 0.3 | Register collections | `customers`, `loans`, `payments`, `settings` in `mongodb.js` |
| 0.4 | Create `loanWorkflow.js` | Statuses, interest types, payment methods, transition rules (Section 17) |
| 0.5 | Scaffold loan module | Copy repair → loan; strip device/warranty fields |
| 0.6 | Rebrand dashboard | `index.html`: title, nav, empty states — keep CSS/layout |
| 0.7 | Rebrand auth pages | `login.ejs`, `register.ejs` |
| 0.8 | Wire routes | Replace `repairRoutes` with `loanRoutes`; placeholder routes |
| 0.9 | Settings upsert | On startup, create `app_settings` with defaults if missing |
| 0.10 | DB indexes | Create all indexes from Section 10 |
| 0.11 | Login rate limit | `express-rate-limit` on `POST /login` — 10/min per IP |
| 0.12 | Smoke test | Login, dashboard, 404/500, empty loan list API |

### Acceptance criteria

- [ ] App starts with zero errors
- [ ] Login/logout works
- [ ] No "repair" or "Balaji" in user-facing UI
- [ ] `app_settings` doc exists after first run
- [ ] All DB indexes created
- [ ] Login rate-limited (verify with 11 rapid attempts → blocked)

---

## 6. Phase 1 — MVP (Core Lending)

**Goal:** Add customer → create loan → disburse → record payment → see dashboard.  
**Duration:** 1–2 weeks

### Build order (strict)

```
Step 1 → Step 2 → Step 3 → Step 4 → Step 5 → Step 6 → Step 7 → Step 8 → Step 9
Settings  Customers  Loans   Payments  Status   Dashboard Timeline WhatsApp Reports
```

---

### Step 1 — App Settings

| Feature | Details |
| :--- | :--- |
| Business profile | Name, owner, phone, address |
| Payment settings | Default UPI ID |
| Loan defaults | Interest rate %, tenure months, late penalty % |
| Grace period | Days after `dueDate` before status → `Overdue` (default: 3) |
| Counters | `loanCounter`, `receiptCounter` — incremented atomically only |

**API:** `GET /api/settings` | `PATCH /api/settings`

**Atomic numbering** (only safe pattern for unique sequential IDs):

```js
const settings = await settingsCol.findOneAndUpdate(
  { _id: "app_settings" },
  { $inc: { loanCounter: 1 } },
  { returnDocument: "after" }
);
// Format: `${loanNumberPrefix}-${year}-${String(settings.loanCounter).padStart(3, "0")}`
```

Never set counters directly via PATCH — only `$inc` inside loan/payment creation.

---

### Step 2 — Customer Management

| Feature | Details |
| :--- | :--- |
| Create | Name + phone required; rest optional |
| Profile | Address, city, state, pincode, occupation, income |
| KYC | Aadhaar + PAN optional; **masked everywhere in list API**; detail view returns masked form only (`XXXX-XXXX-1234`, `AAAAA****F`) |
| Reference | Reference person name + phone (not a guarantor entity) |
| Risk level | Manual: Low / Medium / High |
| List | Paginated; search by name or phone |
| Summary card | Active loan count + total outstanding per customer |
| Soft delete | `isActive: false`, set `deletedAt` — never hard-delete |

**Validation (extend `validate.js`):**

| Field | Rule | Required |
| :--- | :--- | :---: |
| phone | `/^[6-9]\d{9}$/` | Yes |
| aadhaar | `/^\d{12}$/` | No |
| pan | `/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/` | No |
| pincode | `/^\d{6}$/` | No |

**API:**
- `GET /api/customers` — `?search=&page=&limit=&riskLevel=`
- `POST /api/customers`
- `GET /api/customers/:id`
- `GET /api/customers/:id/loans`
- `PATCH /api/customers/:id`
- `DELETE /api/customers/:id` — soft delete

---

### Step 3 — Loan Management

| Feature | Details |
| :--- | :--- |
| Create | Link to customer; principal required |
| Loan number | `LN-2026-001` via atomic `$inc` on `settings.loanCounter` |
| Interest | Simple monthly only (MVP); see Section 16 |
| Dates | Tenure → auto-calc `dueDate`; `lentDate` set on **activation**, not creation |
| Purpose | Business, Medical, Education, Personal, Other |
| Fees | Processing fee optional; `latePenaltyPercent` and `gracePeriodDays` **copied from settings at creation** (frozen on loan — future settings changes don't affect existing loans) |
| EMI preview | `POST /api/loans/preview` — runs `interestCalc.js`, **no DB write**; frontend shows preview before confirm |
| Draft → Active | `POST /api/loans/:id/activate` sets `lentDate`, status `Active` |
| Write-off / Close | Manual; body must include reason/note; **reject if status = Draft** |
| Soft delete | `DELETE` only when `status === "Draft"`; return `400` otherwise |

**API:**
- `POST /api/loans/preview` — calculate EMI fields, no save
- `GET /api/loans` — `?status=&customerId=&search=&page=&limit=`
- `POST /api/loans`
- `GET /api/loans/:id`
- `PATCH /api/loans/:id`
- `DELETE /api/loans/:id` — Draft only
- `POST /api/loans/:id/activate`
- `POST /api/loans/:id/write-off` — body: `{ reason }`; rejects Draft → `LOAN_ACTION_NOT_ALLOWED`
- `POST /api/loans/:id/close` — body: `{ settlementNote }`; rejects Draft → `LOAN_ACTION_NOT_ALLOWED`

---

### Step 4 — Payment Collection

| Feature | Details |
| :--- | :--- |
| Record payment | Amount, date, method, optional `transactionId` (max 50 chars) |
| Allocation | Interest first, then principal (auto) |
| Manual override | Allowed only if `principalPaid + interestPaid === amount` exactly — validate in `validate.js` |
| Receipt number | `RCP-2026-00001` via atomic `$inc` on `settings.receiptCounter` |
| History | Chronological per loan |
| Edit / delete | Allowed with confirmation; always call `recalculateLoan()` after |
| Excess payment | If `amount > remainingAmount`: accept payment, set `excessAmount = amount - remainingAmount`; flag in UI — **never reject, never silently discard** |
| `createdBy` | Always set from `req.session.userId` in service layer — **never accept from request body** |

**Data integrity (MVP):**
1. Insert payment
2. `recalculateLoan(loanId)` in try/catch
3. On failure → delete inserted payment → throw `ApiError`

**API:**
- `GET /api/loans/:id/payments`
- `POST /api/loans/:id/payments`
- `PATCH /api/loans/:id/payments/:paymentId`
- `DELETE /api/loans/:id/payments/:paymentId`

---

### Step 5 — Auto Loan Status

| Status | Rule |
| :--- | :--- |
| `Draft` | Created, not disbursed |
| `Active` | Disbursed, no payments yet |
| `Partially Paid` | Payment received; `remainingAmount > 0` |
| `Paid` | `remainingAmount === 0` |
| `Overdue` | `today > dueDate + gracePeriodDays` AND not terminal status |
| `Written Off` | Manual; requires reason |
| `Closed` | Manual; after settlement |

**Overdue (Phase 1):** Check inside `recalculateLoan()` and on list/detail handlers. No cron yet.  
**On first flip to Overdue:** set `overdueDate` (needed for Phase 2 "X days overdue").  
**Phase 2:** `node-cron` midnight job when loan count > ~500.

Valid transitions: Section 17.

---

### Step 6 — Dashboard

| Widget | Source |
| :--- | :--- |
| Total Lent | Sum `principalAmount` for Active + Partially Paid + Overdue |
| Total Collected | Sum all payment amounts |
| Interest Earned | Sum `interestPaid` |
| Outstanding | Sum `remainingAmount` for open loans |
| Overdue Amount | Sum `remainingAmount` where status = Overdue |
| Active / Overdue counts | Count by status |
| Today's Collection | Payments where `paymentDate = today` |
| Profit Today | `interestPaid` where `paymentDate = today` |
| Recent Activity | Last 10 payments + loans created, sorted by date |

**Performance:** Separate aggregation queries fine for MVP (< 500 loans). Single `$facet` pipeline in Phase 2 if slow.

---

### Step 7 — Transaction Timeline

Embedded array on loan document (~200 events max per loan). Include `createdBy` from session on every entry.

| Event | Example |
| :--- | :--- |
| `LOAN_CREATED` | LN-2026-003 created for ₹50,000 |
| `LOAN_ACTIVATED` | Disbursed on [date] |
| `PAYMENT_RECEIVED` | ₹5,000 via UPI (RCP-2026-00012) |
| `PAYMENT_EDITED` | Payment amount updated ₹4,000 → ₹5,000 |
| `PAYMENT_DELETED` | Payment removed; balance recalculated |
| `STATUS_CHANGED` | Active → Overdue (grace period expired) |
| `LOAN_WRITTEN_OFF` | Bad debt: [reason] |
| `LOAN_CLOSED` | Fully settled |

**Phase 3:** Move to separate collection if document size or cross-loan audit queries become a concern.

---

### Step 8 — WhatsApp Quick-Share + UPI

Client-side only. Cache `upiId` + `businessName` from `GET /api/settings` on page load. See Section 13.

---

### Step 9 — Basic Reports

| Report | Output |
| :--- | :--- |
| Loans given (date range) | Table + total principal |
| Collections (date range) | Table + total collected |
| Outstanding by customer | Summary table |

Print-friendly HTML in Phase 1. CSV export in Phase 2.

---

### Phase 1 checklist

| # | Feature | Priority |
| :-: | :--- | :---: |
| 1 | Settings + grace period + atomic counters | P0 |
| 2 | Customer CRUD + validation + pagination | P0 |
| 3 | Loan CRUD + preview endpoint + activate | P0 |
| 4 | Payments + interest-first split + excess flag | P0 |
| 5 | Auto status + on-read overdue + `overdueDate` | P0 |
| 6 | Dashboard widgets | P0 |
| 7 | `interestCalc.js` unit tests | P0 |
| 8 | Timeline with `createdBy` | P1 |
| 9 | WhatsApp + UPI share | P1 |
| 10 | Basic reports (screen + print) | P1 |
| 11 | KYC masking (UI + list API) | P1 |
| 12 | Login rate limit | P0 (Phase 0) |
| 13 | Auth + error pages | Done |

---

## 7. Phase 2 — Operations & Collection

**Start after:** Phase 1 used for real loans for 1–2 weeks.

| # | Feature | Details |
| :-: | :--- | :--- |
| 1 | Installment schedule | Auto-generate EMI rows; Pending/Paid/Overdue/Partial |
| 2 | Advanced search/filters | Date range, risk level, due this week |
| 3 | Follow-up module | Log calls/visits; outcome; next date |
| 4 | Today's work queue | Overdue + due today + follow-ups due |
| 5 | Overdue days counter | "45 days overdue" using `overdueDate` |
| 6 | Daily overdue cron | `node-cron` midnight check |
| 7 | PDF receipts | `pdfkit` per payment |
| 8 | CSV export | Customers, loans, payments (separate endpoints) |
| 9 | Manual backup | JSON dump (admin only) |
| 10 | Bulk WhatsApp reminders | Select overdue → batch open |
| 11 | Defaulter report | By days overdue + outstanding |
| 12 | Document upload | `multer` → local `uploads/` |
| 13 | Bounce tracking | Uses `isBounced`, `bounceReason`, `bounceCharge` fields (schema ready in Phase 1) |
| 14 | Part-prepayment | Reduce tenure or reduce EMI (lender chooses) |
| 15 | Collateral tracking | Type, description, estimated value |
| 16 | Loan renewal / top-up | Close old → new loan with carried balance |
| 17 | Reducing balance interest | Second interest type |
| 18 | KYC encryption at rest | AES-256-GCM; `ENCRYPTION_KEY` in `.env` |
| 19 | Split `payment.service.js` | Extract when `loan.service.js` grows large |
| 20 | Dashboard `$facet` | Single-query stats if dashboard gets slow |
| 21 | Integration tests | supertest for core API flows |

**Build order:** Installments → Search → Follow-ups → Work queue → Overdue cron → PDF → Export → Documents → Bounce → Collateral → Renewal

---

## 8. Phase 3 — Team, Security & Reports

**Start after:** Phase 2 stable with daily use.

| # | Feature | Details |
| :-: | :--- | :--- |
| 1 | Roles & permissions | Admin / Manager / Staff / Collection Agent |
| 2 | User management | Create, disable, assign roles |
| 3 | Agent assignment | Assign loans to field staff |
| 4 | Audit logs | All changes with before/after snapshot |
| 5 | Advanced reports | Collection, interest revenue, loan aging, agent performance |
| 6 | Guarantor entity | Separate from reference person |
| 7 | Risk auto-scoring | Repayment history + income ratio |
| 8 | Optimistic locking | `version` field on loans |
| 9 | JWT + refresh tokens | Multi-device auth |
| 10 | 2FA, session mgmt, password reset, lockout | Security hardening |
| 11 | Timeline collection | Move embedded timeline to separate collection |

---

## 9. Phase 4 — Automation & Scale

| # | Feature |
| :-: | :--- |
| 1 | WhatsApp Business API automation |
| 2 | SMS reminders |
| 3 | QR payment collection |
| 4 | Customer portal (read-only borrower view) |
| 5 | PWA for field collection agents |
| 6 | Multi-language (Hindi, Marathi) |
| 7 | Bulk customer CSV import |
| 8 | Tally / ledger export |
| 9 | In-app notification center |
| 10 | Cloud document storage (S3 / Cloudinary) |

---

## 10. Database Design

### Collections by phase

```
Phase 1:  users, settings, customers, loans, payments
Phase 2:  installments, followups
Phase 3:  guarantors, auditlogs
```

### `settings`

```js
{
  _id: "app_settings",
  businessName: "",
  ownerName: "",
  phone: "",
  address: "",
  upiId: "",
  defaultInterestRate: 2,
  defaultTenureMonths: 12,
  latePenaltyPercent: 1,
  gracePeriodDays: 3,
  loanNumberPrefix: "LN",
  receiptNumberPrefix: "RCP",
  loanCounter: 0,        // $inc only — never PATCH directly
  receiptCounter: 0,
  updatedAt
}
```

### `customers`

```js
{
  _id,
  name,                    // required
  phone,                   // required, unique
  alternatePhone,
  address, city, state, pincode,
  aadhaar, pan,             // optional; plain text MVP; encrypted Phase 2
  occupation, monthlyIncome,
  referencePerson, referencePhone,
  riskLevel: "Low" | "Medium" | "High",
  notes,
  documents: [],            // Phase 2
  isActive: true,
  deletedAt,
  createdAt, updatedAt
}
```

### `loans`

```js
{
  _id,
  loanNumber,
  customerId,
  principalAmount,
  interestRate,
  interestRatePeriod: "monthly",
  interestType: "simple",
  processingFee: 0,
  latePenaltyPercent,       // frozen at creation
  gracePeriodDays,          // frozen at creation
  tenureMonths,
  installmentAmount,        // regular EMI (rounded up)
  lastInstallmentAmount,    // final EMI (absorbs rounding; may be < installmentAmount)
  totalInstallments,
  totalInterest,
  totalAmountToRepay,
  paidAmount: 0,
  principalPaid: 0,
  interestPaid: 0,
  remainingAmount,
  lentDate,                 // set on activation
  dueDate,
  overdueDate,              // set when status first becomes Overdue
  purposeOfLoan,
  status: "Draft" | "Active" | "Partially Paid" | "Paid" | "Overdue" | "Written Off" | "Closed",
  writeOffReason, writeOffDate,
  collateral: {},            // Phase 2
  notes,
  timeline: [{ action, detail, createdAt, createdBy }],
  isActive: true,
  deletedAt,
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
  excessAmount: 0,          // amount beyond remainingAmount; flag for review
  paymentMethod: "Cash" | "UPI" | "Card" | "Bank Transfer",
  transactionId,
  receiptNumber,
  paymentDate,
  note,
  isBounced: false,         // Phase 2 feature; field present now for schema stability
  bounceReason: "",         // Phase 2
  bounceCharge: 0,          // Phase 2
  createdAt,
  createdBy                  // always from session
}
```

### `installments` (Phase 2)

```js
{
  _id, loanId, installmentNo, dueDate, amount,
  principalComponent, interestComponent,
  paidAmount: 0, paidDate,
  status: "Pending" | "Partially Paid" | "Paid" | "Overdue"
}
```

### `followups` (Phase 2)

```js
{
  _id, customerId, loanId,
  type: "Call" | "Visit" | "WhatsApp",
  followUpDate, remarks,
  outcome: "Promised" | "Not Reachable" | "Paid" | "Dispute",
  nextFollowUpDate, createdBy, createdAt
}
```

### `auditlogs` (Phase 3)

```js
{
  _id, userId,
  action: "CREATE" | "UPDATE" | "DELETE",
  module: "loan" | "payment" | "customer" | "settings",
  recordId,
  changes: { before, after },
  timestamp
}
```

### Indexes (create in Phase 0, task 0.10)

```js
customers.createIndex({ phone: 1 }, { unique: true })
customers.createIndex({ name: "text", phone: "text" })
customers.createIndex({ isActive: 1 })

loans.createIndex({ loanNumber: 1 }, { unique: true })
loans.createIndex({ customerId: 1 })
loans.createIndex({ status: 1, dueDate: 1 })
loans.createIndex({ isActive: 1, status: 1 })

payments.createIndex({ loanId: 1, paymentDate: -1 })
payments.createIndex({ receiptNumber: 1 }, { unique: true })
```

---

## 11. API Endpoints (Planned)

### Response envelope (matches `utils/response.js` — do not change)

```js
// Success
{ success: true, message: "...", data: { ... } }

// List
{ success: true, data: [...], pagination: { page, limit, total } }

// Error (ApiError)
{ success: false, message: "...", errors: [{ field, message }] }
```

### Auth — Done

`GET/POST /login` | `GET /logout` | `GET/POST /register`

### Settings — Phase 1 Step 1

`GET /api/settings` | `PATCH /api/settings`

### Customers — Phase 1 Step 2

| Method | Endpoint | Notes |
| :--- | :--- | :--- |
| GET | `/api/customers` | `?search=&page=&limit=&riskLevel=` |
| POST | `/api/customers` | |
| GET | `/api/customers/:id` | KYC masked |
| GET | `/api/customers/:id/loans` | All loans for customer |
| PATCH | `/api/customers/:id` | |
| DELETE | `/api/customers/:id` | Soft delete |

### Loans — Phase 1 Step 3

| Method | Endpoint | Notes |
| :--- | :--- | :--- |
| POST | `/api/loans/preview` | EMI calc only — no DB write |
| GET | `/api/loans` | `?status=&customerId=&search=&page=&limit=` |
| POST | `/api/loans` | Creates Draft loan |
| GET | `/api/loans/:id` | |
| PATCH | `/api/loans/:id` | |
| DELETE | `/api/loans/:id` | Draft only → else `LOAN_DELETE_NOT_ALLOWED` |
| POST | `/api/loans/:id/activate` | Draft → Active |
| POST | `/api/loans/:id/write-off` | `{ reason }`; rejects Draft |
| POST | `/api/loans/:id/close` | `{ settlementNote }`; rejects Draft |

### Payments — Phase 1 Step 4

`GET/POST /api/loans/:id/payments` | `PATCH/DELETE /api/loans/:id/payments/:paymentId`

### Dashboard — Phase 1 Step 6

`GET /api/dashboard/stats` | `GET /api/dashboard/recent-activity`

### Phase 2+

| Method | Endpoint |
| :--- | :--- |
| GET | `/api/loans/:id/installments` |
| GET | `/api/followups` — `?date=today&status=` |
| POST | `/api/followups` |
| PATCH | `/api/followups/:id` |
| GET | `/api/reports/defaulters` |
| GET | `/api/reports/collections` — `?from=&to=` |
| GET | `/api/export/customers` |
| GET | `/api/export/loans` |
| GET | `/api/export/payments` |
| POST | `/api/loans/:id/payments/:paymentId/bounce` — `{ reason, charge }` |

---

## 12. Recommended Features by Phase

| Feature | Why | Phase |
| :--- | :--- | :---: |
| Settings singleton + upsert | Prevents first-run crash | 0 |
| Grace period | Standard in Indian lending | 1 |
| Atomic loan/receipt counters | No duplicates under concurrency | 1 |
| `POST /api/loans/preview` | Server-side EMI before save | 1 |
| Draft → activate flow | Review before disbursing | 1 |
| Frozen penalty/grace on loan | Settings changes don't rewrite history | 1 |
| `interestCalc.js` isolated | Money bugs cost real rupees | 1 |
| Excess payment flag | Don't silently discard overpayments | 1 |
| `createdBy` on payments/timeline | Cheap now; painful in Phase 3 | 1 |
| Write-off/close guard on Draft | Draft was never disbursed | 1 |
| KYC masking (not encryption) | Privacy without MVP complexity | 1 |
| On-read overdue check | Enough for single-user MVP | 1 |
| `overdueDate` + `lastInstallmentAmount` | Reporting + rounding correctness | 1 |
| Pagination + empty states | UX as data grows | 1 |
| Document upload | Not core lending math | 2 |
| Bounce tracking | Edge case for early cash/UPI ops | 2 |
| Daily overdue cron | When loan count grows | 2 |
| KYC encryption | Before real production KYC data | 2 |
| Collateral, renewal, prepay | Operational maturity | 2 |
| Roles, audit, JWT | Multi-user accountability | 3 |

---

## 13. WhatsApp & UPI Integration Reference

Client-side only for MVP.

```javascript
function formatWhatsAppNumber(number) {
  let digits = String(number || "").replace(/[+\s\-()]/g, "").replace(/\D/g, "");
  while (digits.startsWith("9191") && digits.length > 12) digits = digits.slice(2);
  if (digits.length === 10 && /^[6-9]\d{9}$/.test(digits)) return "91" + digits;
  if (digits.length === 12 && digits.startsWith("91") && /^[6-9]\d{9}$/.test(digits.slice(2))) return digits;
  return "";
}

function sendWhatsAppReminder(customerName, amountDue, phone, loanId, upiId, businessName) {
  const txnId = "TXN" + Date.now();
  const paymentLink =
    "upi://pay?pa=" + upiId +
    "&pn=" + encodeURIComponent(businessName) +
    "&am=" + amountDue + "&cu=INR" +
    "&tn=" + encodeURIComponent("Loan " + loanId) + "&tr=" + txnId;
  const formattedPhone = formatWhatsAppNumber(phone);
  if (!formattedPhone) { alert("Invalid WhatsApp number."); return; }
  const message =
    "*Hello " + customerName + "*%0A%0A💰 *Payment Reminder*%0A" +
    "📌 Loan: " + loanId + "%0A💵 Amount Due: ₹" + amountDue + "%0A%0A" +
    "💳 *Pay via UPI:*%0A" + encodeURIComponent(paymentLink) + "%0A%0AThank you! 🙏";
  window.open("https://wa.me/" + formattedPhone + "?text=" + message, "_blank");
}
```

Fetch settings once on page load — do not call `/api/settings` per click.

---

## 14. Definition of Done (Per Phase)

### Phase 0
- [ ] App runs as Money Lending Manager (no Balaji/repair in UI)
- [ ] Loan API returns empty arrays
- [ ] Auth + error pages work
- [ ] `app_settings` upserted on start
- [ ] All DB indexes created
- [ ] Login rate-limited (11 rapid attempts → blocked)

### Phase 1
- [ ] Full loop: customer → loan → activate → payment → dashboard updates
- [ ] Loan numbers never duplicate (atomic counter verified)
- [ ] `POST /api/loans/preview` returns correct EMI without DB write
- [ ] `lastInstallmentAmount` differs from `installmentAmount` when rounding applies
- [ ] Overdue flips after grace period (on-read); `overdueDate` stored on first flip
- [ ] Excess payments accepted and flagged (`excessAmount > 0`)
- [ ] Write-off/close reject Draft loans (`LOAN_ACTION_NOT_ALLOWED`)
- [ ] `createdBy` populated on payments and timeline from session
- [ ] `interestCalc.js` unit tests pass
- [ ] WhatsApp reminder uses UPI ID from settings
- [ ] KYC masked in UI; full Aadhaar/PAN absent from list API
- [ ] Basic reports show correct totals
- [ ] Responsive on mobile viewport

### Phase 2
- [ ] Installment schedule correct for new loans
- [ ] Follow-ups appear in today's work queue
- [ ] PDF receipt downloads per payment
- [ ] CSV export works for customers, loans, payments
- [ ] Documents upload and list locally
- [ ] Bounce recordable with reason and charge

### Phase 3
- [ ] Role-based access enforced on all routes
- [ ] Audit log captures before/after on all mutations
- [ ] Advanced reports match manual calculations
- [ ] JWT refresh flow works across browser tabs

### Phase 4
- [ ] Scheduled reminders run without manual trigger
- [ ] Customer portal shows correct read-only balance

---

## 15. Security Checklist (Pragmatic)

**Phase 0–1:**
- [ ] HTTP-only session cookies (already in auth — do not change)
- [ ] scrypt password hashing (already implemented — do not migrate to bcrypt)
- [ ] Login rate limit: 10/min per IP
- [ ] `.env` in `.gitignore`; never commit `MONGO_URI`
- [ ] Validate all POST/PATCH in `validate.js`
- [ ] Validate ObjectId params before DB queries
- [ ] KYC masked in UI; full values omitted from list API
- [ ] `createdBy` from session only — never from request body
- [ ] Never log passwords or KYC values
- [ ] Counter fields (`loanCounter`, `receiptCounter`) not writable via PATCH settings

**Phase 2 (real KYC data):**
- [ ] Encrypt Aadhaar/PAN at rest (AES-256-GCM; `ENCRYPTION_KEY` in `.env`)
- [ ] File uploads: MIME check + 5MB max

**Phase 3 (multi-user):**
- [ ] Account lockout after 5 failed logins; 30-min auto-unlock
- [ ] 2FA (TOTP) for admin accounts
- [ ] Audit logs on all mutations

---

## 16. Interest Calculation Edge Cases

All math in `utils/interestCalc.js` — no inline calculations in services.

### Simple monthly (MVP)

```
totalInterest       = principal × (rate / 100) × months
totalRepay          = principal + totalInterest + processingFee
regularEMI          = Math.ceil(totalRepay / months)           // round UP
lastInstallment     = totalRepay - (regularEMI × (months - 1))  // may be < regularEMI
```

**Example:** ₹50,000 @ 2%/month × 12, ₹500 fee  
→ totalInterest ₹12,000 → totalRepay ₹62,500 → regularEMI ₹5,209 → lastEMI ₹5,201

### Edge cases

| Case | MVP handling |
| :--- | :--- |
| Zero interest | `rate = 0`; EMI = principal / months |
| Single month | `tenure = 1`; one payment = totalRepay |
| Rounding | Absorb into **last** installment only |
| Partial month | Ignore; `lentDate` is reference only |
| Prepayment | Phase 2: reduce tenure or EMI |
| Late penalty | Display-only "penalty due" line; lender records manually — **no auto-calc in MVP** |
| Reducing balance | Phase 2 |

### Payment allocation (interest-first)

1. Outstanding interest first  
2. Remainder to principal  
3. If `amount > remainingAmount` → `excessAmount = amount - remainingAmount`

---

## 17. Error Handling & Data Integrity

### Payment + loan update (two-write problem)

**MVP:**
1. Insert payment
2. `recalculateLoan(loanId)` in try/catch
3. On failure → delete payment → throw `ApiError`

**Phase 2+:** MongoDB `withTransaction()` on Atlas replica set.

### Excess payment resolution (Phase 1)

No automated resolution. Surface `excessAmount > 0` in UI. Lender manually:
- Notes a refund in loan notes, or
- Applies credit via a new payment on another loan

### Standard error codes

```
CUSTOMER_NOT_FOUND | CUSTOMER_PHONE_DUPLICATE
LOAN_NOT_FOUND | LOAN_INVALID_STATUS_TRANSITION | LOAN_ALREADY_PAID
LOAN_DELETE_NOT_ALLOWED        (delete non-Draft loan)
LOAN_ACTION_NOT_ALLOWED        (write-off/close on Draft)
PAYMENT_NOT_FOUND
VALIDATION_ERROR | INVALID_OBJECT_ID
```

### Status transitions (enforce in `loanWorkflow.js`)

| From | To | How |
| :--- | :--- | :--- |
| Draft | Active | `POST /activate` only |
| Active | Partially Paid | Auto: partial payment |
| Active | Paid | Auto: payment clears balance |
| Active | Overdue | Auto: past grace period |
| Partially Paid | Paid | Auto: `remainingAmount = 0` |
| Partially Paid | Overdue | Auto: date check |
| Overdue | Partially Paid | Auto: payment recorded |
| Overdue | Paid | Auto: payment clears balance |
| Any open | Written Off | Manual; reason required |
| Any open | Closed | Manual; settlementNote required |

**Never allowed:**
- Draft → anything except Active (delete Draft instead)
- Write-off or close on Draft → `LOAN_ACTION_NOT_ALLOWED`
- Paid / Closed / Written Off → any other status

---

## 18. Testing Strategy (Lean)

### Phase 1 — unit tests (`utils/interestCalc.js` only)

- Standard simple interest (all output fields)
- Zero interest rate
- Single-month loan
- EMI rounding: `lastInstallment` absorbs difference
- `lastInstallment <= regularEMI`
- Payment allocation: interest-first partial
- Payment allocation: exact remaining (`excessAmount = 0`)
- Payment allocation: overpayment (`excessAmount` correct)

```bash
npm install --save-dev jest
```

```json
"scripts": {
  "test": "node --experimental-vm-modules node_modules/jest/bin/jest.js",
  "test:watch": "node --experimental-vm-modules node_modules/jest/bin/jest.js --watch"
}
```

Use `MONGO_DB_NAME=moneyLendingManager_test` for integration tests. Never test against production DB.

### Phase 2 — integration tests (supertest)

- Duplicate phone → `409 CUSTOMER_PHONE_DUPLICATE`
- Sequential loans → `loanNumber` increments
- Activate → status `Active`
- Payment → balance recalculated
- Delete payment → balance reversed
- Write-off on Draft → `LOAN_ACTION_NOT_ALLOWED`

**Do not block Phase 1 launch on integration test coverage.**

---

## Quick Reference — What to Build When

```
NOW     → Phase 0 (rename, scaffold, indexes, rate limit, settings upsert)
NEXT    → Phase 1 Steps 1–6 (settings → customers → loans → payments → status → dashboard)
THEN    → Phase 1 Steps 7–9 (timeline, WhatsApp, reports)
AFTER   → Phase 2 (installments, follow-ups, documents, exports, cron, encryption, bounce)
SCALE   → Phase 3 (roles, audit, JWT, advanced reports)
LATER   → Phase 4 (automation, portal, PWA, multi-language)
```

---

*Last updated: June 2026 | Version 2.2*
