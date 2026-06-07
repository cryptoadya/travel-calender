# Travel Calendar

Travel Calendar is an MVP for employee travel-day tracking, built for user testing and stakeholder feedback. It helps validate the workflow for calendar entry, monthly locking, admin review, reporting, reminders, and compliance-oriented overviews.

This is not a production-grade compliance system yet. Production use would require stronger identity, backend enforcement, auditability, hardened data access, and operational controls.

## Current MVP Features

- Firebase Auth with Email/Password and Cloud Firestore storage.
- Employee calendar for daily location and activity tracking.
- Day Split entries for separate morning and afternoon location/activity values.
- Month completion tracking and month locking.
- Empty Saturdays/Sundays are treated as covered Non-Working Day / Kein Arbeitstag by default, with no country stored; employees can manually override weekends when they worked, travelled, or had another activity.
- Training is included under Business Travel / Dienstreise rather than a separate selectable activity.
- Vacation and Non-Working Day entries do not require or store a country.
- Employee dashboard warnings for incomplete or unlocked months.
- Admin Travel Data overview with Jan-Dec month status boxes:
  - Red: incomplete and unlocked.
  - Orange: complete and unlocked.
  - Green: complete and locked.
- Future months cannot be locked before the month starts.
- Admins can lock eligible complete employee months.
- Bulk Entry is blocked when the selected range overlaps locked months.
- Bulk Entry opens with the currently viewed month prefilled as the date range.
- Admin Travel Data includes an MVP lock log for month lock events.
- Monthly submitted/locked overview in Admin Travel Data.
- Exact submitted and not submitted months per employee.
- Employee CSV export supports a selected month or a custom date range.
- Excel and HTML/PDF reports with submitted/not submitted status based on locked months and country summaries:
  - Aufenthaltstage / Stay Days by country.
  - Arbeitstage / Working Days by country.
- Admin all-employees monthly report.
- Employee comments in Management.
- Company and employee filters in Admin Travel Data and Management.
- Compliance overview with transfer type, home country, and host country.
- UI-only reminder settings, employee reminder banners, and admin reminder warning blocks.
- Simplified login page without the animated globe.

## Reminder MVP Limitation

Reminders are dashboard-only in this MVP.

- No emails are sent.
- No Firebase Functions, Scheduler, SendGrid, Mailgun, SMTP, or other backend delivery service is used.
- Test users do not need real email addresses for reminder delivery.

## Local Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure Firebase:
   - Create a Firebase project.
   - Enable Firebase Authentication with the Email/Password provider.
   - Enable Cloud Firestore.
   - Create a `.env` file with the Firebase web app values.

3. Example `.env` variables:
   ```bash
   VITE_FIREBASE_API_KEY=...
   VITE_FIREBASE_AUTH_DOMAIN=...
   VITE_FIREBASE_PROJECT_ID=...
   VITE_FIREBASE_STORAGE_BUCKET=...
   VITE_FIREBASE_MESSAGING_SENDER_ID=...
   VITE_FIREBASE_APP_ID=...
   VITE_ADMIN_CODE=...
   ```

4. Deploy Firestore rules if using a real Firebase project:
   ```bash
   npx firebase-tools deploy --only firestore:rules --project YOUR_PROJECT_ID
   ```

5. Run locally:
   ```bash
   npm run dev
   ```

6. Build:
   ```bash
   npm run build
   ```

## Data Model

The MVP uses the existing `window.storage` abstraction and stores calendar data as JSON strings in Firestore documents.

| Path | Contents |
|---|---|
| `users/{uid}` | Employee/admin profile, including `role`, `status`, `company`, `transferType`, `homeCountry`, `hostCountry`, and `comment`. |
| `data/e-{uid}` | JSON calendar entries keyed by date, for example `{"2026-05-01": {...}}`. |
| `data/l-{uid}` | JSON locked month list, for example `["2026-05"]`. |
| `data/ll-{uid}` | JSON per-employee lock log entries for month lock events. |
| `meta/rem-settings` | UI-only reminder settings: `enabled`, `firstReminderDay`, `dailyReminderStartDay`, `adminAlertDay`, and `msg`. |

Firestore rules must be deployed after rule changes, especially for employee writes to `data/ll-{uid}` lock log documents.

## Manual Testing Flow

1. Register or log in as an admin.
2. Create or invite an employee.
3. Log in as the employee.
4. Fill calendar days.
5. Create a Day Split entry.
6. Complete and lock a month.
7. Return as admin and check Admin > Travel Data.
8. Verify month status colors, admin locking, and the lock log.
9. Export CSV, Excel, HTML/PDF, and the all-employees monthly report.
10. Check the Compliance overview.
11. Check Reminder Settings and verify dashboard warning blocks.

## Known Production Gaps

- Admin role handling should use server-side authorization and Firebase Auth custom claims in production.
- There is no real automatic email reminder delivery.
- There is an MVP lock log for month lock events, but no full production-grade append-only audit trail for calendar, admin, or profile changes.
- Month locks are MVP app-level behavior and should be backend-enforced in production.
- JSON blob storage is MVP-friendly but should be normalized for production reporting and audit needs.
- Firestore access rules should be hardened before production use.
- SSO, HR integration, monitoring, backups, retention policy, and privacy workflows still need production design.
