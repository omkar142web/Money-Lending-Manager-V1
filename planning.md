# Money Lending Manager — Project Roadmap

> **Version 2.1** | June 2026  
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
| One lender, one user | Phase 1 assumes a single operator; multi-user waits for Phase 3 |
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
| `services/auth.service.js` | Login, sessions, password hash (scrypt) | ~95% reuse |
| `middleware/requireAuth.js` | Protect API routes | 100% reuse |
| `middleware/validate.js` | Request validation | Extend with loan/customer validators |
| `middleware/errorHandler.js` | 404/500 handling | 100% reuse |
| `middleware/asyncHandler.js` | Async wrapper | 100% reuse |
| `utils/response.js` | `{ success, message, data }` envelope | 100% reuse |
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
│   ├── loan.controller.js          # includes payment handlers in MVP
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
| Frontend | HTML/CSS/JS dashboard + EJS auth | Reuse `index.html` design system |
| Validation | Extend `middleware/validate.js` | **Do not** add zod/joi for MVP |
| Auth (MVP) | HTTP-only cookie sessions (scrypt passwords) | Already works — keep it |
| Auth (Phase 3) | JWT + refresh tokens, 2FA | Only when multi-user scaling is needed |
| Testing (Phase 1) | Jest — unit tests for `interestCalc.js` only | Integration tests in Phase 2 |
| Logging (Phase 0) | Optional `morgan` dev logger | Structured logging (pino) deferred to Phase 3 |

---

## 5. Phase 0 — Foundation & Rename

**Goal:** Blank lending skeleton — auth and dashboard shell intact.  
**Duration:** 1–2 days

| # | Task | Details |
| :-: | :--- | :--- |
| 0.1 | Rename project metadata | `package.json`, server log, page titles |
| 0.2 | Update environment | `MONGO_DB_NAME=moneyLendingManager`, `BUSINESS_NAME`, `UPI_ID` in `.env.example` |
| 0.3 | Register collections | `customers`, `loans`, `payments`, `settings` in `mongodb.js` |
| 0.4 | Create `loanWorkflow.js` | Statuses, interest types, payment methods, status transition rules |
| 0.5 | Scaffold loan module | Copy repair → loan; strip device/warranty fields |
| 0.6 | Rebrand dashboard | `index.html`: title, nav, empty states — keep CSS/layout |
| 0.7 | Rebrand auth pages | `login.ejs`, `register.ejs` |
| 0.8 | Wire routes | Replace `repairRoutes` with `loanRoutes`; placeholder customer/settings routes |
| 0.9 | Settings upsert | On startup, create `app_settings` doc with defaults if missing |
| 0.10 | DB indexes | Create all indexes from Section 10 |
| 0.11 | Login rate limit | `express-rate-limit` on `POST /login` — 10 attempts/min per IP |
| 0.12 | Smoke test | Login, dashboard, 404/500, empty loan list API |

### Acceptance criteria

- [ ] App starts with zero errors
- [ ] Login/logout works
- [ ] No "repair" or "Balaji" in user-facing UI
- [ ] `app_settings` doc exists after first run
- [ ] All DB indexes created

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
| Grace period | Days after `dueDate` before status becomes `Overdue` (default: 3) |
| Counters | `loanCounter`, `receiptCounter` for atomic numbering |

**API:** `GET /api/settings` | `PATCH /api/settings`

**Implementation:** Singleton `_id: "app_settings"`. Upsert on app start (Phase 0). Loan/receipt numbers via `$inc` on counter fields.

---

### Step 2 — Customer Management

| Feature | Details |
| :--- | :--- |
| Create | Name + phone required; rest optional |
| Profile | Address, city, state, pincode, occupation, income |
| KYC | Aadhaar, PAN — **optional**; masked in UI; never return full values in list API |
| Reference | Reference person name + phone (not a separate guarantor entity) |
| Risk level | Manual: Low / Medium / High |
| List | Paginated; search by name or phone |
| Summary card | Active loan count + total outstanding per customer |
| Soft delete | `isActive: false`, set `deletedAt` |

**Validation (extend `validate.js`):**

```
phone:    /^[6-9]\d{9}$/
aadhaar:  /^\d{12}$/          (optional field)
pan:      /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/  (optional field)
pincode:  /^\d{6}$/
```

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
| Interest | Simple monthly only (MVP) |
| Dates | Tenure in months → auto-calc `dueDate`; `lentDate` set on activation |
| Purpose | Business, Medical, Education, Personal, Other |
| Fees | Processing fee (optional); late penalty % copied from settings at creation |
| EMI preview | Use `interestCalc.js` before save |
| Draft → Active | `POST /api/loans/:id/activate` sets `lentDate`, status `Active` |
| Write-off / Close | Manual endpoints with required reason/note |
| Soft delete | Only when `status === "Draft"` |

**Interest (MVP)** — see Section 16 for edge cases.

**API:**
- `GET /api/loans` — `?status=&customerId=&search=&page=&limit=`
- `POST /api/loans`
- `GET /api/loans/:id`
- `PATCH /api/loans/:id`
- `DELETE /api/loans/:id` — Draft only
- `POST /api/loans/:id/activate`
- `POST /api/loans/:id/write-off` — body: `{ reason }`
- `POST /api/loans/:id/close` — body: `{ settlementNote }`

---

### Step 4 — Payment Collection

| Feature | Details |
| :--- | :--- |
| Record payment | Amount, date, method, optional transaction ID |
| Allocation | Interest first, then principal (auto); manual override allowed if sum matches |
| Receipt number | `RCP-2026-00001` via atomic counter |
| History | Chronological per loan |
| Edit / delete | Allowed with confirmation; always call `recalculateLoan()` after |
| Excess payment | If amount > `remainingAmount`, accept payment but set `excessAmount` flag for review |

**Data integrity (MVP):** Insert payment → run `recalculateLoan()` → if recalculate fails, delete the payment and throw. See Section 17.

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
| `Overdue` | `today > dueDate + gracePeriodDays` and not terminal status |
| `Written Off` | Manual; requires reason |
| `Closed` | Manual; after settlement |

**Overdue detection (Phase 1):** Run inside `recalculateLoan()` and on loan list/detail queries — **no cron yet**.  
**Phase 2:** Add `node-cron` midnight job when loan volume makes on-read checks costly.

**Store `overdueDate`** when status first flips to `Overdue` (needed for "X days overdue" in Phase 2).

**Valid transitions:** See Section 17.

---

### Step 6 — Dashboard

| Widget | Source |
| :--- | :--- |
| Total Lent | Sum `principalAmount` for Active + Partially Paid + Overdue |
| Total Collected | Sum all payment amounts |
| Interest Earned | Sum `interestPaid` across payments |
| Outstanding | Sum `remainingAmount` for open loans |
| Overdue Amount | Sum `remainingAmount` where status = Overdue |
| Active / Overdue counts | Count by status |
| Today's Collection | Payments where `paymentDate = today` |
| Profit Today | `interestPaid` where `paymentDate = today` |
| Recent activity | Last 10 payments + loans created |

**Performance:** Multiple aggregation queries are fine for MVP (< 500 loans). Optimize with `$facet` in Phase 2 if slow.

---

### Step 7 — Transaction Timeline

Embedded array on loan document. Include `createdBy` (userId) from day one.

| Event | Example |
| :--- | :--- |
| `LOAN_CREATED` | LN-2026-003 created for ₹50,000 |
| `LOAN_ACTIVATED` | Disbursed on [date] |
| `PAYMENT_RECEIVED` | ₹5,000 via UPI (RCP-2026-00012) |
| `PAYMENT_DELETED` | Payment removed; balance recalculated |
| `STATUS_CHANGED` | Active → Overdue |
| `LOAN_WRITTEN_OFF` | Bad debt: [reason] |
| `LOAN_CLOSED` | Fully settled |

---

### Step 8 — WhatsApp Quick-Share + UPI

Client-side only. Pull `upiId` + `businessName` from settings once (cache in JS). See Section 13.

---

### Step 9 — Basic Reports

| Report | Output |
| :--- | :--- |
| Loans given (date range) | Table + total principal |
| Collections (date range) | Table + total collected |
| Outstanding by customer | Summary table |

Print-friendly HTML in MVP. CSV export in Phase 2.

---

### Phase 1 checklist

| # | Feature | Priority |
| :-: | :--- | :---: |
| 1 | Settings + grace period + atomic counters | P0 |
| 2 | Customer CRUD + validation + pagination | P0 |
| 3 | Loan CRUD + activate + EMI preview | P0 |
| 4 | Payments + principal/interest split + excess flag | P0 |
| 5 | Auto status + on-read overdue check | P0 |
| 6 | Dashboard widgets | P0 |
| 7 | `interestCalc.js` unit tests | P0 |
| 8 | Timeline with `createdBy` | P1 |
| 9 | WhatsApp + UPI share | P1 |
| 10 | Basic reports (screen + print) | P1 |
| 11 | KYC masking in UI/API | P1 |
| 12 | Login rate limit | P0 (Phase 0) |
| 13 | Auth + error pages | Done |

---

## 7. Phase 2 — Operations & Collection

**Start after:** Phase 1 used for real loans for 1–2 weeks.

| # | Feature | Details |
| :-: | :--- | :--- |
| 1 | Installment schedule | Auto-generate EMI rows; Pending/Paid/Overdue/Partial |
| 2 | Advanced search/filters | Date range, risk level, due this week |
| 3 | Follow-up module | Calls/visits; outcome; next date |
| 4 | Today's work queue | Overdue + due today + follow-ups due |
| 5 | Overdue days counter | Display "45 days overdue" using `overdueDate` |
| 6 | Daily overdue cron | `node-cron` midnight check |
| 7 | PDF receipts | `pdfkit` per payment |
| 8 | CSV export | Customers, loans, payments |
| 9 | Manual backup | JSON dump (admin) |
| 10 | Bulk WhatsApp reminders | Select overdue → batch open |
| 11 | Defaulter report | By days overdue + outstanding |
| 12 | Document upload | `multer` → local `uploads/` |
| 13 | Bounce tracking | Mark payment bounced; record fee |
| 14 | Part-prepayment | Reduce tenure or reduce EMI (lender chooses) |
| 15 | Collateral tracking | Type, description, estimated value |
| 16 | Loan renewal / top-up | Close old → new loan with carried balance |
| 17 | Reducing balance interest | Second interest type |
| 18 | KYC encryption at rest | AES-256-GCM for Aadhaar/PAN |
| 19 | Split `payment.service.js` | Extract when loan.service.js grows |
| 20 | Dashboard `$facet` | Single-query stats if performance needs it |
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
| 4 | Audit logs | All changes with before/after |
| 5 | Advanced reports | Collection, interest revenue, loan aging, agent performance |
| 6 | Guarantor entity | Separate from reference person |
| 7 | Risk auto-scoring | Based on repayment history + income ratio |
| 8 | Optimistic locking | `version` field on loans for concurrent edits |
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
| 5 | PWA for field agents |
| 6 | Multi-language (Hindi, Marathi) |
| 7 | Bulk customer CSV import |
| 8 | Tally / ledger export |
| 9 | In-app notification center |
| 10 | Cloud document storage (S3 / Cloudinary) |

---

## 10. Database Design

### Collections

```
users, settings, customers, loans, payments     → Phase 1
installments, followups                         → Phase 2
guarantors, auditlogs                           → Phase 3
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
  loanCounter: 0,
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
  aadhaar, pan,             // optional; masked in API responses
  occupation, monthlyIncome,
  referencePerson, referencePhone,
  riskLevel: "Low" | "Medium" | "High",
  notes,
  documents: [],           // populated Phase 2
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
  latePenaltyPercent,
  gracePeriodDays,          // copied from settings at creation
  tenureMonths,
  installmentAmount,
  lastInstallmentAmount,    // absorbs EMI rounding
  totalInstallments,
  totalInterest,
  totalAmountToRepay,
  paidAmount: 0,
  principalPaid: 0,
  interestPaid: 0,
  remainingAmount,
  lentDate,
  dueDate,
  overdueDate,
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
  excessAmount: 0,
  paymentMethod: "Cash" | "UPI" | "Card" | "Bank Transfer",
  transactionId,
  receiptNumber,
  paymentDate,
  note,
  isBounced: false,          // Phase 2
  createdAt, createdBy
}
```

### Indexes (create in Phase 0)

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

### Response envelope (matches existing `utils/response.js`)

```js
// Success
{ success: true, message: "...", data: { ... } }

// List endpoints also include:
{ success: true, data: [...], pagination: { page, limit, total } }

// Error (via ApiError)
{ success: false, message: "...", errors: [{ field, message }] }
```

### Auth — Done

`GET/POST /login` | `GET /logout` | `GET/POST /register`

### Settings — Phase 1 Step 1

`GET /api/settings` | `PATCH /api/settings`

### Customers — Phase 1 Step 2

`GET /api/customers` | `POST /api/customers` | `GET /api/customers/:id` | `GET /api/customers/:id/loans` | `PATCH /api/customers/:id` | `DELETE /api/customers/:id`

### Loans — Phase 1 Step 3

`GET /api/loans` | `POST /api/loans` | `GET /api/loans/:id` | `PATCH /api/loans/:id` | `DELETE /api/loans/:id` | `POST /api/loans/:id/activate` | `POST /api/loans/:id/write-off` | `POST /api/loans/:id/close`

### Payments — Phase 1 Step 4

`GET /api/loans/:id/payments` | `POST /api/loans/:id/payments` | `PATCH /api/loans/:id/payments/:paymentId` | `DELETE /api/loans/:id/payments/:paymentId`

### Dashboard — Phase 1 Step 6

`GET /api/dashboard/stats` | `GET /api/dashboard/recent-activity`

### Phase 2+

`GET /api/loans/:id/installments` | `GET/POST /api/followups` | `GET /api/reports/defaulters` | `GET /api/reports/collections` | `GET /api/export/:type` | `POST /api/loans/:id/payments/:paymentId/bounce`

---

## 12. Recommended Features by Phase

| Feature | Why | Phase |
| :--- | :--- | :---: |
| Settings singleton + upsert | Prevents first-run crash | 0 |
| Grace period | Standard in Indian lending | 1 |
| Atomic loan/receipt counters | No duplicate numbers | 1 |
| Draft → activate flow | Review before disbursing | 1 |
| `interestCalc.js` | Money bugs cost real rupees | 1 |
| Excess payment flag | Don't lose overpayments silently | 1 |
| KYC masking | Privacy without encryption complexity | 1 |
| On-read overdue check | Good enough for single-user MVP | 1 |
| `overdueDate` field | Enables days-overdue reporting later | 1 |
| Pagination | Performance as data grows | 1 |
| Empty state onboarding | Guide first-time setup | 1 |
| Document upload | Needs multer + storage — not core lending | 2 |
| Bounce tracking | Edge case; most early payments are cash/UPI | 2 |
| KYC encryption | Worth it once real production data exists | 2 |
| Daily overdue cron | Needed when loan count grows | 2 |
| Collateral, renewal, part-prepay | Operational maturity features | 2 |
| Roles, audit, JWT | Multi-user accountability | 3 |

---

## 13. WhatsApp & UPI Integration Reference

Client-side only for MVP.

```javascript
function formatWhatsAppNumber(number) {
  let digits = String(number || "").replace(/[+\s\-()]/g, "").replace(/\D/g, "");
  while (digits.startsWith("9191") && digits.length > 12) digits = digits.slice(2);
  if (digits.length === 10 && /^[6-9]\d{9}$/.test(digits)) return `91${digits}`;
  if (digits.length === 12 && digits.startsWith("91") && /^[6-9]\d{9}$/.test(digits.slice(2))) return digits;
  return "";
}

function sendWhatsAppReminder(customerName, amountDue, phone, loanId, upiId, businessName) {
  const txnId = "TXN" + Date.now();
  const paymentLink = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(businessName)}&am=${amountDue}&cu=INR&tn=${encodeURIComponent("Loan " + loanId)}&tr=${txnId}`;
  const formattedPhone = formatWhatsAppNumber(phone);
  if (!formattedPhone) { alert("Invalid WhatsApp number."); return; }

  const message =
    `*Hello ${customerName}*%0A%0A` +
    `💰 *Payment Reminder*%0A` +
    `📌 Loan: ${loanId}%0A` +
    `💵 Amount Due: ₹${amountDue}%0A%0A` +
    `💳 *Pay via UPI:*%0A${encodeURIComponent(paymentLink)}%0A%0A` +
    `Thank you! 🙏`;

  window.open(`https://wa.me/${formattedPhone}?text=${message}`, "_blank");
}
```

Cache settings after first `GET /api/settings` — don't fetch on every click.

---

## 14. Definition of Done (Per Phase)

### Phase 0
- [ ] App runs as Money Lending Manager
- [ ] Loan API returns empty arrays
- [ ] Auth + error pages work
- [ ] `app_settings` upserted; indexes created
- [ ] Login rate-limited

### Phase 1
- [ ] Full loop: customer → loan → activate → payment → dashboard updates
- [ ] Loan numbers never duplicate (atomic counter)
- [ ] Overdue flips after grace period (on-read)
- [ ] Excess payments flagged, not silently dropped
- [ ] `interestCalc.js` tests pass
- [ ] WhatsApp reminder uses settings UPI ID
- [ ] KYC masked in UI; full values not in list API
- [ ] Responsive on mobile viewport

### Phase 2
- [ ] Installment schedule correct for new loans
- [ ] Follow-ups appear in today's queue
- [ ] PDF receipt downloads
- [ ] CSV export works
- [ ] Documents upload locally

### Phase 3
- [ ] Role-based access enforced
- [ ] Audit log captures before/after on edits
- [ ] Reports match manual calculations

### Phase 4
- [ ] Scheduled reminders run without manual trigger
- [ ] Customer portal shows correct read-only balance

---

## 15. Security Checklist (Pragmatic)

**Phase 0–1 (do now):**
- [ ] Sessions: HTTP-only cookies (already in auth flow)
- [ ] Passwords: scrypt hashing (already implemented — do not migrate to bcrypt)
- [ ] Login rate limit: 10/min per IP
- [ ] `.env` in `.gitignore`; never commit `MONGO_URI`
- [ ] Validate all POST/PATCH bodies in `validate.js`
- [ ] Validate ObjectId params before DB queries
- [ ] KYC: mask in UI; omit from list API responses
- [ ] Never log passwords or full KYC values

**Phase 2 (before production with real data):**
- [ ] Encrypt Aadhaar/PAN at rest (AES-256-GCM, key in `.env`)
- [ ] File upload: MIME check, 5MB max

**Phase 3 (multi-user):**
- [ ] Account lockout after 5 failed logins
- [ ] 2FA for admin accounts
- [ ] Audit logs on all mutations

---

## 16. Interest Calculation Edge Cases

All math lives in `utils/interestCalc.js`.

### Simple monthly (MVP)

```
totalInterest       = principal × (rate / 100) × months
totalRepay          = principal + totalInterest + processingFee
regularEMI          = Math.ceil(totalRepay / months)     // round UP
lastInstallment     = totalRepay - (regularEMI × (months - 1))
```

**Example:** ₹50,000 @ 2%/month × 12, ₹500 fee → total ₹62,500 → EMI ₹5,209 × 11 + ₹5,201 last.

### Edge cases

| Case | MVP handling |
| :--- | :--- |
| Zero interest | `rate = 0` → EMI = principal / months |
| Single month | `tenure = 1` → one payment = totalRepay |
| Rounding | Absorb into **last** installment, not first |
| Partial month | Ignore in MVP; lending date is reference only |
| Prepayment | Phase 2: reduce tenure or EMI |
| Late penalty | Show as separate "penalty due" line; don't auto-add to `paidAmount` |
| Reducing balance | Phase 2 |

### Payment allocation (MVP)

1. Outstanding interest first  
2. Then principal  
3. If amount > remaining → set `excessAmount`

---

## 17. Error Handling & Data Integrity

### Payment + loan update

**MVP (no transactions):**
1. Insert payment
2. Run `recalculateLoan(loanId)` in try/catch
3. On failure → delete inserted payment → throw `ApiError`

**Phase 2+ (Atlas replica set):** Wrap in MongoDB `withTransaction` when available.

### Standard error codes

```
CUSTOMER_NOT_FOUND | CUSTOMER_PHONE_DUPLICATE
LOAN_NOT_FOUND | LOAN_INVALID_STATUS_TRANSITION | LOAN_ALREADY_PAID
PAYMENT_NOT_FOUND
VALIDATION_ERROR | INVALID_OBJECT_ID
```

### Status transitions (enforce in `loanWorkflow.js`)

```
Draft          → Active           (activate only)
Active         → Partially Paid   (auto: partial payment)
Active         → Paid             (auto: full payment)
Active         → Overdue          (auto: past grace)
Partially Paid → Paid | Overdue   (auto)
Overdue        → Partially Paid | Paid  (auto: payment)
Any open       → Written Off | Closed  (manual)
Paid/Closed/Written Off → *       NEVER
Draft          → * except Active   NEVER (can't un-disburse)
```

---

## 18. Testing Strategy (Lean)

**Phase 1 — unit tests only (`utils/interestCalc.js`):**
- Standard simple interest
- Zero interest rate
- Single-month loan
- EMI rounding (last installment absorbs difference)
- Payment allocation: interest-first
- Payment allocation: exact remaining
- Payment allocation: excess amount

```bash
npm install --save-dev jest
# package.json: "test": "node --experimental-vm-modules node_modules/jest/bin/jest.js"
```

Use `moneyLendingManager_test` DB for any future integration tests.

**Phase 2 — add supertest integration tests:**
- Customer duplicate phone → 409
- Loan number auto-increments
- Payment recalculates loan balance
- Payment delete reverses balance

**Do not block MVP launch on integration test coverage.**

---

## Quick Reference — What to Build When

```
NOW     → Phase 0 (rename, scaffold, indexes, rate limit, settings upsert)
NEXT    → Phase 1 Steps 1–6 (settings → customers → loans → payments → status → dashboard)
THEN    → Phase 1 Steps 7–9 (timeline, WhatsApp, reports)
AFTER   → Phase 2 (installments, follow-ups, documents, exports, cron, encryption)
SCALE   → Phase 3 (roles, audit, JWT, advanced reports)
LATER   → Phase 4 (automation, portal, PWA, multi-language)
```

---

*Last updated: June 2026 | Version 2.1*
