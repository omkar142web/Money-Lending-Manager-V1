# Balaji Store

Balaji Store is an Express + MongoDB repair dashboard for Balaji Mobile Shop. The current frontend UI in `views/index.html` is preserved, but its customer cards are now backed by MongoDB repair jobs instead of temporary client-side DOM changes.

## What This Migration Changed

- Replaced ShareInfo `name/info` entries with Balaji repair jobs.
- Split backend code into route, controller, service, middleware, config, and utility layers.
- Added separate MongoDB collections:
  - `usersBalaji`
  - `repairJobs`
- Added API endpoints for repair jobs:
  - `GET /api/repairs`
  - `POST /api/repairs`
  - `PATCH /api/repairs/:id`
  - `DELETE /api/repairs/:id`
- Added auth middleware, validation middleware, async error handling, centralized error responses, and response helpers.
- Moved MongoDB configuration to environment variables.
- Replaced legacy password cookies with an HTTP-only session token cookie.

## Environment

Create a local `.env` file:

```env
MONGO_URI=mongodb+srv://username:password@cluster0.example.mongodb.net/
MONGO_DB_NAME=balajiStore
PORT=3000
NODE_ENV=development
COOKIE_MAX_AGE_DAYS=30
```

## Run

```bash
npm install
npm run dev
```

For production:

```bash
npm start
```

## Current Folder Shape

```txt
config/
  env.js
  mongodb.js
controllers/
  auth.controller.js
  page.controller.js
  repair.controller.js
middleware/
  asyncHandler.js
  errorHandler.js
  requireAuth.js
  validate.js
routes/
  auth.routes.js
  page.routes.js
  repair.routes.js
services/
  auth.service.js
  repair.service.js
utils/
  ApiError.js
  objectId.js
  response.js
views/
  index.html
  login.ejs
  register.ejs
```

## Future Improvements

- Add edit customer/repair flow in the dashboard UI.
- Add role-based permissions for owner, admin, and staff users.
- Add request logging and rate limiting.
- Add tests for auth, validation, and repair APIs.
- Add CSRF protection if form posts expand beyond JSON API calls.
