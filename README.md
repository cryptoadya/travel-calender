# Travel Calendar

Employee travel day tracking for tax compliance — pilot/MVP.

This is a functional pilot/MVP for a Travel Calendar app. The purpose is to let a small group of users test the workflow and then hand the concept over to the internal IT department for a proper production implementation.

## Local Setup

1. **Clone and install**
   ```bash
   git clone https://github.com/cryptoadya/travel-calender.git
   cd travel-calender
   npm install
   ```

2. **Configure Firebase**
   - Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
   - Enable **Authentication** (Email/Password provider)
   - Enable **Cloud Firestore**
   - Go to Project Settings → General → Your apps → Web app → Config
   - Copy `.env.example` to `.env` and fill in your Firebase values:
     ```bash
     cp .env.example .env
     ```

3. **Deploy Firestore Rules**
   You need to deploy the security rules to your Firebase project:
   ```bash
   npx firebase-tools deploy --only firestore:rules --project YOUR_PROJECT_ID
   ```

4. **Run locally**
   ```bash
   npm run dev
   ```

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `VITE_FIREBASE_API_KEY` | Yes | Firebase API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Yes | Firebase Auth domain |
| `VITE_FIREBASE_PROJECT_ID` | Yes | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | No | Firebase storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | No | Firebase messaging sender ID |
| `VITE_FIREBASE_APP_ID` | No | Firebase app ID |
| `VITE_ADMIN_CODE` | Yes | Code required for admin registration (client-side gate) |

## Firestore Data Model

This MVP uses a simple data model optimized for minimal code changes from the original `localStorage` prototype:

| Collection | Document ID | Contents |
|---|---|---|
| `users` | `{auth_uid}` | User profile (name, role, company, invite code, status). Auth handles credentials. |
| `data` | `e-{uid}` | JSON string of calendar entries for an employee (`{"2026-05-01": {...}}`) |
| `data` | `l-{uid}` | JSON string array of locked months for an employee (`["2026-01"]`) |
| `meta` | `rem-settings` | JSON string of reminder settings (`{enabled, day, msg}`) |

> Note: Storing data as JSON strings (`{ value: "..." }`) inside Firestore documents was an MVP tradeoff to maintain exact compatibility with the original app's `window.storage` abstraction without refactoring all UI components.

## Role Model

- **Employee**: Can read and write their own calendar entries. Cannot edit locked months. Can read their own user profile.
- **Admin**: Can view all employees. Can read and write all users, calendars, locks, and settings. Can generate invite codes for new employees.
- Roles are stored in `users/{uid}.role`.

## Known MVP Limitations & Production Checklist

The following limitations exist in this pilot and **must be addressed by IT before production launch**:

- [ ] **SSO Integration**: Currently uses Firebase Email/Password. Needs SAML/SSO integration with corporate identity.
- [ ] **Data Model Overhaul**: The JSON-string-in-Firestore workaround should be replaced with proper typed Firestore sub-collections (e.g., `users/{uid}/entries/{date}`).
- [ ] **Robust Security Rules**:
  - The admin role check relies on the client providing a correct admin code and writing `{role: 'admin'}`. Production must use Firebase Auth Custom Claims for roles.
  - Locked months are enforced in the UI, not in Firestore rules. A user could technically overwrite a locked month via API. Needs a Cloud Function or complex rules.
  - `users` collection is currently readable by any authenticated user so the Admin dashboard can load the list. Production should restrict this.
- [ ] **Audit Logging**: Missing tracking for who changed what (important for tax compliance).
- [ ] **GDPR & Privacy**: Needs data retention policies, right-to-be-forgotten deletion workflows, and data residency checks.
- [ ] **HR Integration**: Employee list should sync from HR system automatically, rather than manual admin invites.
- [ ] **Monitoring & Backups**: Set up automated Firestore backups and alerting.
