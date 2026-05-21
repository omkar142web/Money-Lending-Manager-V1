# 🛠️ Balaji Store - Repair Management Dashboard

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![Framework](https://img.shields.io/badge/framework-Express.js-blue)](https://expressjs.com/)
[![Database](https://img.shields.io/badge/database-MongoDB-green)](https://www.mongodb.com/)

Balaji Store is a robust, full-stack repair management dashboard designed for **Balaji Mobile Shop**. It simplifies the process of tracking customer repair jobs, managing workflows, and handling payments with a streamlined, real-time interface.

---

## 🚀 Key Features

- **Repair Tracking**: Manage repair jobs from "Pending" to "Delivered" or "Cancelled".
- **Dynamic Dashboard**: Search repairs by customer name, phone number, or device.
- **Workflow Management**: Separate states for repair progress and payment status.
- **Payment History**: Record partial payments, track remaining balances, and maintain a detailed payment log.
- **Secure Authentication**: HTTP-only session tokens for secure, cookie-based authentication.
- **Clean Architecture**: Modular codebase following Controller-Service-Repository patterns.
- **Automated Validation**: Rigorous schema validation for all incoming API requests.

---

## 🛠️ Tech Stack

- **Backend**: [Node.js](https://nodejs.org/) & [Express.js](https://expressjs.com/)
- **Database**: [MongoDB](https://www.mongodb.com/) (using native driver)
- **Frontend**: HTML/CSS/JS (Dashboard) & [EJS](https://ejs.co/) (Auth Pages)
- **Security**: Cookie-parser for session management, hashed passwords (implied by service), and validated inputs.

---

## 📂 Project Structure

```text
balaji/
├── config/             # Configuration files (DB, Env, Workflows)
├── controllers/        # Request handlers (logic orchestration)
├── middleware/         # Custom Express middlewares (Auth, Validation, Errors)
├── public/             # Static assets (CSS, client-side JS)
├── routes/             # API and Page route definitions
├── services/           # Business logic and database interactions
├── utils/              # Helper functions and custom error classes
├── views/              # UI templates (EJS and HTML)
└── server.js           # Application entry point
```

---

## ⚙️ Installation & Setup

### 1. Prerequisites
- Node.js (v18+)
- MongoDB Atlas account or local MongoDB instance.

### 2. Clone the Repository
```bash
git clone <repository-url>
cd balaji
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Configure Environment Variables
Create a `.env` file in the root directory and add the following:

```env
PORT=3000
MONGO_URI=your_mongodb_connection_string
MONGO_DB_NAME=balajiStore
NODE_ENV=development
COOKIE_MAX_AGE_DAYS=30
```

### 5. Start the Application
**Development Mode:**
```bash
npm run dev
```

**Production Mode:**
```bash
npm start
```

---

## 🔌 API Documentation

All API endpoints are prefixed with `/api` and require authentication.

### Repairs
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/repairs` | List all repair jobs (supports filtering/search) |
| `POST` | `/api/repairs` | Create a new repair job |
| `PATCH` | `/api/repairs/:id` | Update repair details or status |
| `PATCH` | `/api/repairs/:id/payment` | Add a payment record to a job |
| `DELETE` | `/api/repairs/:id` | Remove a repair job |

### Filtering & Search
- `search`: Search by customer name, phone, or device.
- `repairStatus`: Filter by `Pending Work`, `In Progress`, `Waiting for Parts`, `Ready for Pickup`, `Delivered`, `Cancelled`.
- `paymentStatus`: Filter by `Unpaid`, `Partially Paid`, `Paid`.

---

## 🔐 Authentication

- **Login**: `GET /login` & `POST /login`
- **Logout**: `GET /logout`
- **Registration**: Currently restricted (internal use only).

---

## 📜 License

This project is licensed under the **ISC License**.

Developed with ❤️ by [Omkar P](https://github.com/omkar-p)
