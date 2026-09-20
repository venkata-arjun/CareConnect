# CareConnect

A React-based post-discharge follow-up portal for coordinating patient outreach, reviewing call outcomes, and monitoring follow-up activity.

**Post-Discharge Follow-Up**

---

## Overview

CareConnect helps care coordinators manage patient outreach after hospital discharge. Coordinators can track a prioritized worklist, log calls, review AI-assisted summaries, and monitor program-wide performance from a single dashboard.

## Features

- Backend JWT coordinator login
- Follow-up worklist with search, filtering, and risk-based sorting
- Patient details with readmission risk information
- Call logging with outcome, notes, and next action
- AI-assisted review workflow through the backend Groq service
- Activity review and follow-up history
- Fallback screens for AI-unavailable and save-error states
- Operational dashboard with patient-driven metrics
- Responsive layouts for desktop and mobile
- Toast notifications for key actions

## Tech Stack

| Layer         | Technology             |
| ------------- | ---------------------- |
| Framework     | React + Vite           |
| Routing       | React Router           |
| Styling       | Tailwind CSS (via CDN) |
| Icons         | Lucide React           |
| Notifications | React Hot Toast        |
| Font          | Inter                  |

---

## Getting Started

### Requirements

- Node.js 18+
- npm

### Installation

```bash
npm install
```

### Run the development server

```bash
npm run dev
```

The app will be available at `http://localhost:5173` (or the URL Vite prints in your terminal).

### Available Scripts

| Command           | Description                          |
| ----------------- | ------------------------------------ |
| `npm run dev`     | Start the development server         |
| `npm run build`   | Create a production build            |
| `npm run preview` | Preview the production build locally |
| `npm run lint`    | Run ESLint                           |

---

## Backend Login

The frontend authenticates through the Express backend. The development seed user is:

```text
Email:    coordinator@careconnect.com
Password: Coordinator@20810
```

The JWT is stored as `accessToken` in localStorage for this client-side architecture. The API service adds it to protected requests and clears it on a 401 response.

---

## Routes

| Route                                  | Screen                       |
| -------------------------------------- | ---------------------------- |
| `/`                                    | Login                        |
| `/worklist`                            | Follow-Up Worklist           |
| `/dashboard`                           | Operational Dashboard        |
| `/patient/:patientId`                  | Patient Details              |
| `/patient/:patientId/call`             | Call Logging                 |
| `/patient/:patientId/ai-review`        | AI-Assisted Follow-Up Review |
| `/patient/:patientId/activity-review`  | Activity Review              |
| `/patient/:patientId/activity-history` | Follow-Up Activity History   |
| `/patient/:patientId/ai-unavailable`   | AI Assistance Unavailable    |
| `/patient/:patientId/save-error`       | Save Error                   |

---

## Project Structure

```text
src/
  components/
    call/        Call workflow components
    common/      Shared badges, cards, and stats components
    layout/      Shared application header
    patient/     Patient detail components
    worklist/    Worklist controls and table components
  services/      Centralized backend API client
  pages/         Route-level screens
  routes/        React Router configuration
  services/      Reserved for future API integration
  utils/         Shared utility functions
```

## Browser Storage

| Key             | Purpose                                                   |
| --------------- | --------------------------------------------------------- |
| `accessToken`   | Backend JWT for the current session                       |
| `user`          | Authenticated user display information                    |
| `followUpDraft` | Unsaved call/AI review state while moving between screens |

Persisted calls, statuses, patients, follow-ups, dashboard metrics, and AI results come from the backend APIs.

---

## Backend Integration

Requests are centralized in `src/services/api.js` and use `VITE_API_BASE_URL`:

```text
POST /api/auth/login
GET  /api/patients
GET  /api/patients/:patientId
GET  /api/patients/:patientId/calls
GET  /api/follow-ups
POST /api/calls
GET  /api/dashboard
POST /api/ai/follow-up-summary
```

**Integration checklist:**

1. Use an HTTP-only cookie instead of localStorage for production authentication.
2. Run the backend and Neon database before opening protected screens.

---

## Design Notes

- Consistent healthcare portal visual language throughout.
- Inter is the global font.
- Tailwind CSS is loaded via CDN in `index.html`.
- No Redux or additional state-management library is used.
- The frontend does not call Groq directly; AI requests pass through the authenticated Express backend.

## Validation

Before submitting changes, run:

```bash
npm run lint
npm run build
```

Then manually verify the affected route at both desktop and mobile widths.

---

## License

Internal project — license terms to be defined.
