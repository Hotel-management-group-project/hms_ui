# Hotel Management System (HMS)

**Module:** Advanced Software Development — UFCF8S-30-2  
**Institution:** University of the West of England (UWE) Bristol

---

## Team

| Student ID | Name | Role |
|---|---|---|
| S2401885 | Aiman Ahmed | Frontend — Angular, UI/UX, GSAP Animations, FullCalendar |
| WP1234567 | Mohamed Iyaadh Ahmed | Backend — ASP.NET Core API, Auth, Database, Emails, QR, PDF |

---

## Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| Angular 21 | SPA framework, standalone components, signals |
| Tailwind CSS | Utility-first styling + custom design tokens |
| GSAP 3 | Page and element animations |
| FullCalendar | Room availability calendar view |
| Chart.js / ng2-charts | Analytics and reports dashboard |
| ngx-scanner | QR code scanning at check-in |
| SignalR | Real-time occupancy updates |

### Backend
| Technology | Purpose |
|---|---|
| ASP.NET Core 10 | REST API |
| Entity Framework Core | ORM |
| PostgreSQL (Neon) | Database |
| ASP.NET Core Identity + JWT | Authentication and authorisation |
| QRCoder | QR code generation for bookings |
| Resend SDK | Transactional emails |

---

## Live URLs

| Service | URL |
|---|---|
| **Frontend** | https://hms.vercel.app |
| **Backend API** | https://hms-api-xf66.onrender.com |
| **API Health** | https://hms-api-xf66.onrender.com/health |

> **Note for markers:** The backend is hosted on Render's free tier and may take 30–60 seconds to wake up on the first request after a period of inactivity.

---

## Test Credentials (Marker Use)

| Role | Email | Password |
|---|---|---|
| **Guest** | guest@hms.com | Password1! |
| **Front Desk** | frontdesk@hms.com | Password1! |
| **Manager** | manager@hms.com | Password1! |
| **Admin** | admin@hms.com | Password1! |

Each role unlocks a different area of the application:

- **Guest** — search rooms, make/cancel bookings, download invoices
- **Front Desk** — QR check-in/out, room status management, payments
- **Manager** — reports (occupancy, revenue, demographics), room rates
- **Admin** — user management, hotel configuration, audit logs

---

## Running Locally

### Prerequisites
- Node.js 20+
- npm 9+
- Angular CLI (`npm install -g @angular/cli`)

### Frontend setup

```bash
# 1. Clone the repository
git clone <repo-url>
cd hms-frontend

# 2. Install dependencies
npm install

# 3. Start the development server
ng serve
```

The app will be available at **http://localhost:4200**.

By default the dev environment points to `http://localhost:5000`. To run against the hosted backend without spinning up the API locally, update `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  apiUrl: 'https://hms-api-xf66.onrender.com',
  signalRUrl: 'https://hms-api-xf66.onrender.com/hubs',
};
```

### Backend setup (optional — for full local stack)

```bash
# In the hms-api repository
cd hms-api

# Copy and populate the environment file
cp .env.example .env

dotnet restore
dotnet run
```

The API will start at **http://localhost:5000**.

---

## Environment Variables

### Frontend (`src/environments/environment.ts`)

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:5000',          // Backend API base URL
  signalRUrl: 'http://localhost:5000/hubs', // SignalR hub URL
};
```

### Backend (`.env`)

```env
DATABASE_URL=               # Neon PostgreSQL connection string
JWT_SECRET=                 # Secret used to sign JWTs (min 32 chars)
JWT_EXPIRY_MINUTES=15       # Access token lifetime
REFRESH_TOKEN_EXPIRY_DAYS=7 # Refresh token lifetime
RESEND_API_KEY=             # Resend API key for transactional email
FRONTEND_URL=               # Allowed CORS origin (e.g. http://localhost:4200)
```

---

## Running Tests

```bash
# Run all unit tests once (CI mode)
ng test --watch=false

# Run tests with file watcher
ng test
```

The project uses Angular TestBed backed by **Vitest**. Test files:

| File | Coverage |
|---|---|
| `auth.guard.spec.ts` | Unauthenticated redirect, authenticated pass-through |
| `staff.guard.spec.ts` | Role-based access (Guest blocked, FrontDesk/Manager/Admin allowed) |
| `room-detail.spec.ts` | Date validation, peak/off-peak pricing, booking submission |
| `my-bookings.spec.ts` | Booking list, cancellation fee tiers (free / 50% / 100%) |

---

## Branch Strategy

```
main        → production (auto-deploys to Vercel + Render)
dev         → staging (tested before merging to main)
feature/*   → individual features
docs/*      → documentation updates
```

### Commit format

```
feat: add room search with availability filter
fix: correct cancellation fee for <72h bookings
style: update navbar spacing
test: add unit tests for auth guard
docs: update README with live URLs
```

---

## Key Features

- JWT authentication with 15-minute access tokens and HttpOnly refresh cookies
- Role-based routing: Guest / Front Desk / Manager / Admin
- Room search with date-range availability filtering
- Multi-room bookings with ancillary services (airport transfer, breakfast, spa, late checkout)
- QR code generation and scanning for self-service check-in
- PDF invoice generation and email delivery
- Real-time room occupancy updates via SignalR
- Revenue, occupancy, and demographics reports with Chart.js
- Full dark mode support throughout the UI
- GSAP-powered page transitions and reveal animations
- Account lockout after 5 failed login attempts
- Automatic session logout after 15 minutes of inactivity
