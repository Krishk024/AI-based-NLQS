# Requirements Document

## Introduction

The Admin Panel is a dedicated administrative interface for the AI-Based Natural Language Data Analysis System. It extends the existing React + TypeScript + Vite frontend with a protected admin section that provides centralized control over users, datasets, query history, and AI-generated analytics. The panel introduces a Node.js + Express backend to support server-side dataset storage, user management, and persistent analytics. It integrates with the existing Gemini AI service for NL-to-SQL conversion and AI insights generation, and uses Recharts for all data visualizations. A sidebar-driven layout with dark mode and responsive design ensures consistency with the existing application.

---

## Glossary

- **Admin_Panel**: The protected administrative interface accessible only to authenticated admin users.
- **Admin_User**: A user account with elevated privileges that can access the Admin_Panel.
- **Regular_User**: A standard user account without admin privileges.
- **Dashboard**: The overview screen of the Admin_Panel showing system-wide statistics.
- **Query_Analyzer**: The NL query input panel within the Admin_Panel that converts natural language to SQL via the AI service.
- **Dataset_Manager**: The Admin_Panel section for uploading, viewing, and managing CSV/JSON datasets.
- **Dataset**: A structured data file (CSV or JSON) uploaded by an Admin_User.
- **Schema**: The column names and inferred data types derived from a Dataset.
- **Query_History**: The persistent log of all natural language queries, generated SQL, and execution metadata.
- **Analytics_Dashboard**: The Admin_Panel section displaying pre-built Recharts visualizations of aggregated data.
- **AI_Insights_Panel**: The Admin_Panel section where the Gemini service auto-generates business insights from available data.
- **User_Manager**: The Admin_Panel section for viewing and managing Regular_User accounts.
- **Sidebar**: The persistent left-side navigation component of the Admin_Panel.
- **Gemini_Service**: The existing `geminiService.ts` integration with the Google Gemini API.
- **History_Store**: The existing `historyDb.ts` localStorage-based query history store.
- **User_Store**: The existing `userDb.ts` IndexedDB-based user account store.
- **Express_Server**: The new Node.js + Express backend introduced for the Admin_Panel.
- **Voice_Input**: Optional speech-to-text input for natural language queries.
- **i18n**: Internationalization support for multiple languages including English and Indian languages.

---

## Requirements

### Requirement 1: Admin Authentication

**User Story:** As an admin, I want to log in with admin credentials and have my session protected, so that only authorized personnel can access the Admin_Panel.

#### Acceptance Criteria

1. THE Admin_Panel SHALL restrict access to all routes unless the current session belongs to an Admin_User.
2. WHEN an unauthenticated user navigates to any Admin_Panel route, THE Admin_Panel SHALL redirect the user to the admin login page.
3. WHEN an Admin_User submits valid credentials, THE Admin_Panel SHALL create an authenticated session and redirect to the Dashboard.
4. IF an Admin_User submits invalid credentials, THEN THE Admin_Panel SHALL display a descriptive error message without revealing which field is incorrect.
5. WHEN an Admin_User clicks logout, THE Admin_Panel SHALL clear the admin session and redirect to the admin login page.
6. THE Express_Server SHALL expose a POST `/api/admin/login` endpoint that validates admin credentials and returns a signed session token.
7. THE Express_Server SHALL expose a POST `/api/admin/logout` endpoint that invalidates the session token.
8. WHILE an admin session is active, THE Admin_Panel SHALL include the session token in all API requests to the Express_Server.

---

### Requirement 2: Dashboard Overview

**User Story:** As an admin, I want a high-level overview of system activity, so that I can monitor usage and health at a glance.

#### Acceptance Criteria

1. THE Dashboard SHALL display the total number of queries executed across all users.
2. THE Dashboard SHALL display the total number of Datasets currently stored in the system.
3. THE Dashboard SHALL display the count of Regular_Users registered in the User_Store.
4. THE Dashboard SHALL display the query success rate as a percentage, calculated as successful queries divided by total queries multiplied by 100.
5. WHEN the Dashboard is loaded, THE Dashboard SHALL fetch all metric values from the Express_Server within 3 seconds.
6. IF the Express_Server is unreachable, THEN THE Dashboard SHALL display the last cached metric values and show a connectivity warning.
7. THE Dashboard SHALL update all displayed metrics without requiring a full page reload when the admin navigates back to the Dashboard.

---

### Requirement 3: Natural Language Query Analyzer

**User Story:** As an admin, I want to run natural language queries against datasets from within the Admin_Panel, so that I can analyze data without writing SQL manually.

#### Acceptance Criteria

1. THE Query_Analyzer SHALL provide a text input field for entering natural language queries.
2. WHEN an Admin_User submits a natural language query, THE Query_Analyzer SHALL send the query to the Gemini_Service and display the generated SQL.
3. WHEN the Gemini_Service returns a response, THE Query_Analyzer SHALL display the result data in a tabular format.
4. WHEN the Gemini_Service returns a visualization suggestion, THE Query_Analyzer SHALL render the appropriate Recharts chart type (bar, line, pie, or area).
5. IF the Gemini_Service returns an error, THEN THE Query_Analyzer SHALL display a descriptive error message and preserve the user's input.
6. WHEN a query completes successfully, THE Query_Analyzer SHALL record the query, generated SQL, result row count, and execution time in the History_Store.
7. WHEN an active Dataset context is selected, THE Query_Analyzer SHALL pass the Dataset Schema as context to the Gemini_Service instead of the default DB_SCHEMA.
8. THE Query_Analyzer SHALL display the AI optimization feedback returned by the Gemini_Service alongside the generated SQL.

---

### Requirement 4: Dataset Management

**User Story:** As an admin, I want to upload, view, and delete datasets, so that I can manage the data available for analysis.

#### Acceptance Criteria

1. THE Dataset_Manager SHALL accept file uploads in CSV and JSON formats.
2. WHEN an Admin_User uploads a valid CSV file, THE Dataset_Manager SHALL parse the file, infer the Schema, and store the Dataset via the Express_Server.
3. WHEN an Admin_User uploads a valid JSON file, THE Dataset_Manager SHALL parse the file, infer the Schema, and store the Dataset via the Express_Server.
4. IF an uploaded file is not valid CSV or JSON, THEN THE Dataset_Manager SHALL reject the file and display a descriptive validation error.
5. IF an uploaded file exceeds 10 MB, THEN THE Dataset_Manager SHALL reject the file and inform the Admin_User of the size limit.
6. THE Dataset_Manager SHALL display a list of all stored Datasets including name, format, row count, column count, and upload date.
7. WHEN an Admin_User selects a Dataset from the list, THE Dataset_Manager SHALL display the full Schema including column names and inferred data types.
8. WHEN an Admin_User confirms deletion of a Dataset, THE Dataset_Manager SHALL remove the Dataset and its Schema from the Express_Server and update the displayed list.
9. THE Pretty_Printer SHALL format Dataset Schema objects into a human-readable table view within the Dataset_Manager.
10. FOR ALL valid Dataset uploads, parsing then displaying the Schema then re-parsing the Schema SHALL produce an equivalent Schema object (round-trip property).

---

### Requirement 5: Query History

**User Story:** As an admin, I want to view, search, and filter all past queries, so that I can audit usage and identify patterns.

#### Acceptance Criteria

1. THE Query_History SHALL display all stored history entries including the natural language query, generated SQL, execution time in milliseconds, timestamp, and status (success or error).
2. THE Query_History SHALL load history entries from the History_Store on initial render.
3. WHEN an Admin_User enters text in the search field, THE Query_History SHALL filter displayed entries to those whose natural language query or generated SQL contains the search text, case-insensitively.
4. WHEN an Admin_User selects a date range filter, THE Query_History SHALL display only entries whose timestamp falls within the selected range.
5. WHEN an Admin_User selects a status filter (success or error), THE Query_History SHALL display only entries matching the selected status.
6. THE Query_History SHALL support combining search text, date range, and status filters simultaneously.
7. WHEN an Admin_User clicks a history entry, THE Query_History SHALL expand the entry to show the full generated SQL and result summary.
8. THE Query_History SHALL display entries in reverse chronological order by default.

---

### Requirement 6: Analytics Dashboard

**User Story:** As an admin, I want to see pre-built charts of key business metrics, so that I can identify trends without writing queries.

#### Acceptance Criteria

1. THE Analytics_Dashboard SHALL render a bar chart showing total sales grouped by city using Recharts.
2. THE Analytics_Dashboard SHALL render a bar chart showing performance metrics grouped by product category using Recharts.
3. THE Analytics_Dashboard SHALL render a line chart showing monthly sales or query volume trends over the most recent 12 months using Recharts.
4. WHEN the Analytics_Dashboard is loaded, THE Analytics_Dashboard SHALL fetch aggregated data from the Express_Server to populate all charts.
5. IF no Dataset data is available, THEN THE Analytics_Dashboard SHALL display placeholder charts with a message indicating that data upload is required.
6. THE Analytics_Dashboard SHALL render all charts in a responsive grid layout that adapts to screen width.
7. WHILE dark mode is active, THE Analytics_Dashboard SHALL apply dark-mode-compatible colors to all Recharts chart elements.

---

### Requirement 7: User Management

**User Story:** As an admin, I want to view and manage Regular_User accounts, so that I can oversee who has access to the system.

#### Acceptance Criteria

1. THE User_Manager SHALL display a list of all Regular_Users retrieved from the User_Store including name, email, registration date, and last login date.
2. THE User_Manager SHALL display the total count of Regular_Users at the top of the list.
3. WHEN an Admin_User searches by name or email, THE User_Manager SHALL filter the displayed list to matching Regular_Users, case-insensitively.
4. WHEN an Admin_User confirms deactivation of a Regular_User, THE User_Manager SHALL mark the account as inactive in the User_Store and reflect the updated status in the list.
5. IF a Regular_User account is inactive, THEN THE Admin_Panel SHALL prevent that user from logging in and display an account-suspended message.
6. THE User_Manager SHALL display each Regular_User's account status (active or inactive) in the list.

---

### Requirement 8: AI Insights Panel

**User Story:** As an admin, I want the system to automatically generate business insights from available data, so that I can surface trends and anomalies without manual analysis.

#### Acceptance Criteria

1. WHEN an Admin_User opens the AI_Insights_Panel, THE AI_Insights_Panel SHALL send a structured prompt to the Gemini_Service requesting top product insights, sales trend analysis, and anomaly detection.
2. WHEN the Gemini_Service returns insights, THE AI_Insights_Panel SHALL display each insight as a titled card with a summary, explanation, impact level, and recommended actions.
3. IF the Gemini_Service returns an error, THEN THE AI_Insights_Panel SHALL display a descriptive error message and provide a retry button.
4. WHEN an active Dataset is selected, THE AI_Insights_Panel SHALL include the Dataset Schema and a sample of the Dataset rows as context in the Gemini_Service prompt.
5. THE AI_Insights_Panel SHALL display the impact level of each insight using a visual indicator (High, Medium, or Low).
6. WHEN an Admin_User clicks a follow-up query suggestion within an insight card, THE AI_Insights_Panel SHALL pre-populate the Query_Analyzer input with that query.

---

### Requirement 9: Sidebar Navigation and Layout

**User Story:** As an admin, I want a consistent sidebar navigation, so that I can move between Admin_Panel sections efficiently.

#### Acceptance Criteria

1. THE Sidebar SHALL display navigation links for: Dashboard, Query Analyzer, Datasets, History, Analytics, Users, and AI Insights.
2. WHEN an Admin_User clicks a Sidebar navigation link, THE Admin_Panel SHALL render the corresponding section without a full page reload.
3. THE Sidebar SHALL visually highlight the currently active navigation link.
4. WHEN the viewport width is below 768px, THE Sidebar SHALL collapse into a hamburger-menu-triggered drawer.
5. WHEN the drawer is open on mobile, THE Admin_Panel SHALL display an overlay behind the Sidebar that closes the drawer when clicked.
6. THE Admin_Panel SHALL display the logged-in Admin_User's name in the Sidebar.

---

### Requirement 10: Dark Mode

**User Story:** As an admin, I want the Admin_Panel to support dark mode, so that the interface is consistent with the existing application's theme preference.

#### Acceptance Criteria

1. THE Admin_Panel SHALL detect the existing application's dark mode state and apply the same theme on initial load.
2. WHEN dark mode is active, THE Admin_Panel SHALL apply dark background and light text colors to all Admin_Panel components.
3. WHEN dark mode is toggled, THE Admin_Panel SHALL update all Admin_Panel component styles without requiring a page reload.
4. THE Admin_Panel SHALL persist the dark mode preference in localStorage under the same key used by the existing application.

---

### Requirement 11: Express Backend API

**User Story:** As a developer, I want a Node.js + Express backend, so that the Admin_Panel has server-side persistence and API endpoints for datasets, analytics, and admin auth.

#### Acceptance Criteria

1. THE Express_Server SHALL expose a RESTful API with a base path of `/api`.
2. THE Express_Server SHALL expose POST `/api/datasets` to accept and store an uploaded Dataset file.
3. THE Express_Server SHALL expose GET `/api/datasets` to return the list of all stored Datasets with metadata.
4. THE Express_Server SHALL expose GET `/api/datasets/:id` to return a specific Dataset's Schema and row data.
5. THE Express_Server SHALL expose DELETE `/api/datasets/:id` to remove a stored Dataset.
6. THE Express_Server SHALL expose GET `/api/analytics/summary` to return aggregated metrics for the Dashboard and Analytics_Dashboard.
7. THE Express_Server SHALL expose GET `/api/users` to return all Regular_User account records from the User_Store.
8. THE Express_Server SHALL expose PATCH `/api/users/:id/status` to update a Regular_User's active/inactive status.
9. IF a request to a protected endpoint is made without a valid session token, THEN THE Express_Server SHALL return HTTP 401 with a descriptive error message.
10. THE Express_Server SHALL validate all incoming request bodies and return HTTP 400 with field-level error details for invalid payloads.

---

### Requirement 12: Voice-Based Query Input (Optional)

**User Story:** As an admin, I want to speak my query instead of typing it, so that I can interact with the Query_Analyzer hands-free.

#### Acceptance Criteria

1. WHERE the browser supports the Web Speech API, THE Query_Analyzer SHALL display a microphone button alongside the text input.
2. WHEN an Admin_User activates the microphone button, THE Query_Analyzer SHALL begin capturing speech and display a recording indicator.
3. WHEN speech capture ends, THE Query_Analyzer SHALL populate the text input with the transcribed text.
4. IF the browser does not support the Web Speech API, THEN THE Query_Analyzer SHALL hide the microphone button without displaying an error.
5. IF speech recognition fails, THEN THE Query_Analyzer SHALL display a descriptive error message and leave the text input unchanged.

---

### Requirement 13: Multi-Language Support (Optional)

**User Story:** As an admin, I want the Admin_Panel UI to support English and Indian languages, so that it is accessible to a broader range of administrators.

#### Acceptance Criteria

1. WHERE i18n is enabled, THE Admin_Panel SHALL support English and at least two Indian languages (Hindi and Tamil) for all UI labels, navigation items, and static text.
2. WHEN an Admin_User selects a language from the language switcher, THE Admin_Panel SHALL re-render all UI text in the selected language without a full page reload.
3. THE Admin_Panel SHALL persist the selected language preference in localStorage.
4. IF a translation key is missing for the selected language, THEN THE Admin_Panel SHALL fall back to the English translation for that key.
