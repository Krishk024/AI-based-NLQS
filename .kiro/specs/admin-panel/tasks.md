
# Implementation Plan: Admin Panel

## Overview

Implement the Admin Panel as a protected `/admin` section of the existing React + TypeScript + Vite SPA, backed by a new Node.js + Express server with SQLite persistence. Tasks are ordered to build the foundation first (types, backend, auth), then each admin page, then integration and optional tests.

## Tasks

- [x] 1. Set up shared types and project structure
  - Create `src/admin/` directory with all subdirectories (`pages/`, `components/`)
  - Create `server/` directory with subdirectories (`routes/`, `middleware/`, `db/`, `services/`)
  - Create `src/admin/types.ts` with all shared interfaces: `AdminTokenPayload`, `DatasetMeta`, `DatasetSchema`, `AnalyticsSummary`, `UserRecord`, `InsightCard`
  - Create `server/types.ts` mirroring the same interfaces
  - _Requirements: 1.1, 4.1, 7.1, 11.1_

- [x] 2. Set up Express server foundation
  - [x] 2.1 Initialize Express app with SQLite and middleware
    - Create `server/db/sqlite.ts` using `better-sqlite3`: open `datasets.db`, run `CREATE TABLE IF NOT EXISTS` for `datasets`, `dataset_columns`, `dataset_rows`, `revoked_tokens`, `analytics_cache`
    - Create `server/index.ts`: Express app, `cors`, `express.json()`, mount all route files, global error handler returning HTTP 500 with no stack trace in production
    - Add `server` scripts to `package.json` and install `express`, `better-sqlite3`, `jsonwebtoken`, `zod`, `multer`, `uuid`, `cors` and their `@types`
    - _Requirements: 11.1, 11.9, 11.10_

  - [ ]* 2.2 Write property test for invalid request bodies returning 400 with field errors
    - **Property 27: Invalid request bodies return 400 with field-level errors**
    - **Validates: Requirements 11.10**

- [x] 3. Implement authentication backend
  - [x] 3.1 Create auth middleware and auth routes
    - Create `server/middleware/authMiddleware.ts`: verify JWT from `Authorization: Bearer` header, check `revoked_tokens` table, attach `req.admin`; return HTTP 401 for missing/expired/revoked tokens
    - Create `server/middleware/validateBody.ts`: Zod-based validation helper returning HTTP 400 with `{ errors: [{ field, message }] }` on failure
    - Create `server/routes/auth.ts`: `POST /api/admin/login` using `crypto.timingSafeEqual` against `.env` credentials, issue signed JWT; `POST /api/admin/logout` inserting `jti` into `revoked_tokens`
    - _Requirements: 1.3, 1.4, 1.6, 1.7, 11.9_

  - [ ]* 3.2 Write property test for protected routes returning 401 without valid token
    - **Property 26: Protected API endpoints return 401 without valid token**
    - **Validates: Requirements 11.9**

  - [ ]* 3.3 Write property test for invalid credentials producing generic error
    - **Property 2: Invalid credentials produce generic error messages**
    - **Validates: Requirements 1.4**

  - [ ]* 3.4 Write property test for login-then-logout clearing session
    - **Property 3: Login then logout clears session**
    - **Validates: Requirements 1.5, 1.7**

- [x] 4. Implement dataset backend service and routes
  - [x] 4.1 Create dataset service and CRUD routes
    - Create `server/services/datasetService.ts`: parse CSV (using built-in string splitting) and JSON files, infer column types (`string | number | boolean | date`), store metadata + columns + rows in SQLite within a transaction; reject files > 10 MB (HTTP 413) or unparseable content (HTTP 400)
    - Create `server/routes/datasets.ts`: `POST /api/datasets` (multer upload, call service), `GET /api/datasets`, `GET /api/datasets/:id`, `DELETE /api/datasets/:id`; all routes behind `authMiddleware`
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.8, 11.2, 11.3, 11.4, 11.5_

  - [ ]* 4.2 Write property test for dataset upload round-trip preserving schema
    - **Property 11: Dataset upload round-trip preserves schema**
    - **Validates: Requirements 4.2, 4.3, 4.10**

  - [ ]* 4.3 Write property test for invalid file uploads being rejected
    - **Property 12: Invalid file uploads are rejected**
    - **Validates: Requirements 4.4, 4.5**

- [x] 5. Implement analytics and users backend routes
  - [x] 5.1 Create analytics service and route
    - Create `server/services/analyticsService.ts`: query SQLite for dataset counts and row aggregations (`salesByCity`, `salesByCategory`, `monthlyTrend`); accept client-supplied history metrics (total, successCount) to compute `querySuccessRate`; write result to `analytics_cache` with TTL
    - Create `server/routes/analytics.ts`: `GET /api/analytics/summary` behind `authMiddleware`; return cached value if within TTL, else recompute
    - _Requirements: 2.1, 2.2, 2.4, 2.6, 6.4, 11.6_

  - [ ]* 5.2 Write property test for analytics summary computed correctly
    - **Property 28: Analytics summary values are computed correctly**
    - **Validates: Requirements 11.6, 2.1, 2.2, 2.3, 2.4**

  - [x] 5.3 Create users route
    - Create `server/routes/users.ts`: `GET /api/users` reads from SQLite users mirror; `PATCH /api/users/:id/status` updates `is_active` flag; add `users` mirror table to `sqlite.ts` schema init
    - _Requirements: 7.1, 7.4, 7.5, 11.7, 11.8_

- [x] 6. Checkpoint — Ensure all backend tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Set up frontend admin foundation
  - [x] 7.1 Install React Router and configure Vite proxy
    - Install `react-router-dom` v6
    - Add `/api` proxy to `vite.config.ts` pointing to `http://localhost:4000`
    - Create `src/admin/adminApi.ts`: typed `fetch` wrapper that reads JWT from `localStorage`, injects `Authorization: Bearer` header on every request, throws typed errors on non-2xx responses
    - _Requirements: 1.8, 11.1_

  - [ ]* 7.2 Write property test for active session including auth header
    - **Property 4: Active session token is included in all API requests**
    - **Validates: Requirements 1.8**

  - [x] 7.3 Create auth context and protected route
    - Create `src/admin/AdminAuthContext.tsx`: React context holding `token`, `adminUser`, `login()`, `logout()` helpers; persist token in `localStorage`
    - Create `src/admin/components/ProtectedAdminRoute.tsx`: reads context token, redirects to `/admin/login` if absent
    - _Requirements: 1.1, 1.2, 1.5_

  - [ ]* 7.4 Write property test for protected routes redirecting without token
    - **Property 1: Protected routes require authentication**
    - **Validates: Requirements 1.1, 1.2**

  - [x] 7.5 Create AdminApp router and theme sync
    - Create `src/admin/AdminApp.tsx`: `<BrowserRouter>` with routes for all 8 pages wrapped in `<ProtectedAdminRoute>` (except `/admin/login`); read `theme` key from `localStorage` on mount and apply dark class; sync on toggle
    - Wire `/admin` entry point into the root `App.tsx` or `index.tsx`
    - _Requirements: 9.2, 10.1, 10.4_

  - [ ]* 7.6 Write property test for dark mode persisting in localStorage
    - **Property 25: Dark mode preference persists in localStorage**
    - **Validates: Requirements 10.4**

- [x] 8. Implement shared layout components
  - [x] 8.1 Create AdminSidebar and AdminNavbar
    - Create `src/admin/components/AdminSidebar.tsx`: 7 nav links (Dashboard, Query Analyzer, Datasets, History, Analytics, Users, AI Insights); highlight active link via `useLocation`; collapse to hamburger drawer below 768 px with overlay
    - Create `src/admin/components/AdminNavbar.tsx`: display logged-in admin name from context; dark mode toggle button that writes `theme` to `localStorage`
    - _Requirements: 9.1, 9.3, 9.4, 9.5, 9.6, 10.2, 10.3_

  - [ ]* 8.2 Write property test for sidebar navigation rendering correct section
    - **Property 24: Sidebar navigation renders the correct section**
    - **Validates: Requirements 9.2, 9.3**

  - [x] 8.3 Create reusable MetricCard and InsightCard components
    - Create `src/admin/components/MetricCard.tsx`: displays a label and numeric value
    - Create `src/admin/components/InsightCard.tsx`: displays title, summary, explanation, impact badge (High/Medium/Low color-coded), recommended actions list, follow-up query chips
    - Create `src/admin/components/DatasetSchemaTable.tsx`: renders a two-column table of column name + inferred type
    - _Requirements: 4.9, 8.2, 8.5_

  - [ ]* 8.4 Write property test for schema pretty-printer rendering all columns
    - **Property 15: Schema pretty-printer renders all columns and types**
    - **Validates: Requirements 4.9**

- [x] 9. Implement LoginPage
  - [x] 9.1 Create LoginPage component
    - Create `src/admin/pages/LoginPage.tsx`: email + password form; on submit call `POST /api/admin/login` via `adminApi`; on success store token via auth context and redirect to `/admin`; on failure display generic error message that does not distinguish email vs password
    - _Requirements: 1.3, 1.4_

  - [ ]* 9.2 Write unit tests for LoginPage
    - Test form submission with valid credentials redirects
    - Test form submission with invalid credentials shows generic error
    - _Requirements: 1.3, 1.4_

- [x] 10. Implement DashboardPage
  - [x] 10.1 Create DashboardPage with metric cards
    - Create `src/admin/pages/DashboardPage.tsx`: on mount read `historyDb.getAll()` and `userDb.getAllUsers()` client-side, then call `GET /api/analytics/summary` passing history counts; render four `<MetricCard>` components for total queries, total datasets, total users, query success rate; show yellow warning banner if fetch fails and display cached values
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_

  - [ ]* 10.2 Write property test for dashboard metric counts matching actual data
    - **Property 5: Dashboard metric counts match actual data**
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4**

- [x] 11. Implement QueryAnalyzerPage
  - [x] 11.1 Create QueryAnalyzerPage
    - Create `src/admin/pages/QueryAnalyzerPage.tsx`: text input for NL query; optional dataset context selector (dropdown of stored datasets); on submit call `processNaturalLanguageQuery` from existing `geminiService.ts`, passing dataset schema as context when selected; display generated SQL + optimization feedback; render result rows in `<ResultsTable>`-style table; render Recharts chart matching `visualizationSuggestion`; on error display message and preserve input; on success record entry in `historyDb`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_

  - [ ]* 11.2 Write property test for query results rendering table and feedback
    - **Property 6: Query results are always rendered in tabular format**
    - **Validates: Requirements 3.3, 3.8**

  - [ ]* 11.3 Write property test for visualization type matching Gemini suggestion
    - **Property 7: Visualization type matches Gemini suggestion**
    - **Validates: Requirements 3.4**

  - [ ]* 11.4 Write property test for query errors preserving user input
    - **Property 8: Query errors preserve user input**
    - **Validates: Requirements 3.5**

  - [ ]* 11.5 Write property test for successful queries recorded with all fields
    - **Property 9: Successful queries are recorded in history with all required fields**
    - **Validates: Requirements 3.6**

  - [ ]* 11.6 Write property test for active dataset context replacing default schema
    - **Property 10: Active dataset context replaces default schema in Gemini prompts**
    - **Validates: Requirements 3.7**

  - [x] 11.7 Add optional voice input (Web Speech API)
    - Show microphone button only when `window.SpeechRecognition` or `window.webkitSpeechRecognition` is available; on activation show recording indicator; on result populate text input; on error show descriptive message; hide button silently when API absent
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [x] 12. Implement DatasetsPage
  - [x] 12.1 Create DatasetsPage with upload and list
    - Create `src/admin/pages/DatasetsPage.tsx`: file input accepting `.csv` and `.json`; client-side size check (reject > 10 MB before upload); `POST /api/datasets` on valid file; display dataset list from `GET /api/datasets` with name, format, row count, column count, upload date; on row click fetch `GET /api/datasets/:id` and render schema in `<DatasetSchemaTable>`; delete button with confirmation dialog calling `DELETE /api/datasets/:id`
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9_

  - [ ]* 12.2 Write property test for dataset list rendering all metadata fields
    - **Property 13: Dataset list renders all required metadata fields**
    - **Validates: Requirements 4.6**

  - [ ]* 12.3 Write property test for dataset deletion removing entry from list
    - **Property 14: Dataset deletion removes entry from list**
    - **Validates: Requirements 4.8**

- [x] 13. Implement HistoryPage
  - [x] 13.1 Create HistoryPage with filters
    - Create `src/admin/pages/HistoryPage.tsx`: load entries from `historyDb.getAll()` on mount; display in reverse chronological order; show NL query, generated SQL, execution time, timestamp, status per row; text search input filtering by query or SQL (case-insensitive); date range picker filtering by timestamp; status dropdown (all/success/error); all three filters applied conjunctively; click to expand full SQL and result summary
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8_

  - [ ]* 13.2 Write property test for combined history filters being conjunctive
    - **Property 16: Combined history filters are conjunctive**
    - **Validates: Requirements 5.3, 5.4, 5.5, 5.6**

  - [ ]* 13.3 Write property test for history entries in reverse chronological order
    - **Property 17: History entries are displayed in reverse chronological order**
    - **Validates: Requirements 5.8**

  - [ ]* 13.4 Write property test for history list rendering all required fields
    - **Property 18: History list renders all required fields**
    - **Validates: Requirements 5.1**

- [x] 14. Implement AnalyticsPage
  - [x] 14.1 Create AnalyticsPage with Recharts charts
    - Create `src/admin/pages/AnalyticsPage.tsx`: fetch `GET /api/analytics/summary`; render bar chart for `salesByCity`, bar chart for `salesByCategory`, line chart for `monthlyTrend` using Recharts; responsive grid layout; apply dark-mode-compatible colors when dark mode is active; show placeholder charts with upload prompt when no data available
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

- [x] 15. Implement UsersPage
  - [x] 15.1 Create UsersPage with search and deactivation
    - Create `src/admin/pages/UsersPage.tsx`: fetch `GET /api/users`; display total count; render list with name, email, registration date, last login, status badge; case-insensitive search by name or email; deactivate button with confirmation calling `PATCH /api/users/:id/status`; reflect updated status immediately in list
    - Also update `userDb.ts` `login()` to check `isActive` flag and reject inactive users with an account-suspended message
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

  - [ ]* 15.2 Write property test for user list rendering all required fields
    - **Property 19: User list renders all required fields including status**
    - **Validates: Requirements 7.1, 7.2, 7.6**

  - [ ]* 15.3 Write property test for user search being case-insensitive
    - **Property 20: User search filter is case-insensitive**
    - **Validates: Requirements 7.3**

  - [ ]* 15.4 Write property test for deactivated users being unable to log in
    - **Property 21: Deactivated users cannot log in**
    - **Validates: Requirements 7.4, 7.5**

- [x] 16. Implement InsightsPage
  - [x] 16.1 Create InsightsPage with AI insight cards
    - Create `src/admin/pages/InsightsPage.tsx`: on mount call `processNaturalLanguageQuery` (or a dedicated `generateInsights` wrapper) with a structured prompt requesting top product insights, sales trend analysis, and anomaly detection; when a dataset is active include its schema + sample rows in the prompt; render each insight as `<InsightCard>`; show retry button on error; clicking a follow-up query chip navigates to QueryAnalyzerPage with that query pre-populated (via router state or context)
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

  - [ ]* 16.2 Write property test for insight cards rendering all required fields
    - **Property 22: Insight cards render all required fields**
    - **Validates: Requirements 8.2, 8.5**

  - [ ]* 16.3 Write property test for dataset context included in insights prompt
    - **Property 23: Dataset context is included in AI insights prompts**
    - **Validates: Requirements 8.4**

- [ ] 17. Add user sync and i18n (optional)
  - [x] 17.1 Wire user registration sync to Express server
    - Update `userDb.ts` `registerUser()` to also call `POST /api/users/sync` with the new user record so the SQLite mirror stays current
    - Add `POST /api/users/sync` route to `server/routes/users.ts` (upsert into mirror table)
    - _Requirements: 7.1, 11.7_

  - [ ] 17.2 Add multi-language support with react-i18next (optional)
    - Install `react-i18next` and `i18next`
    - Create locale files `src/admin/i18n/en.json`, `hi.json`, `ta.json` with all UI label keys
    - Add language switcher to `AdminNavbar`; persist selection in `localStorage`; fall back to English for missing keys
    - _Requirements: 13.1, 13.2, 13.3, 13.4_

- [x] 18. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Property tests use `fast-check` with a minimum of 100 iterations each; tag each with `// Feature: admin-panel, Property N: <text>`
- The Express server runs on port 4000; Vite proxies `/api` to it during development
- Admin credentials live only in `.env` (`ADMIN_EMAIL`, `ADMIN_PASSWORD`, `JWT_SECRET`) — never committed
- The SQLite users mirror is the server-authoritative source for user management; IndexedDB remains the client-side source for the main app
