<h1 align = 'center'>Dhaka Tesla Pool</h1>

Share a seat. Split the fare. Survive Dhaka traffic.

Dhaka Tesla Pool is a ride-pooling MVP for Dhaka. Passengers request a trip between supported zones; online drivers can accept requests into a capacity-limited ride. The application includes account verification, fare estimates, pooled fare allocation, ride status flows, and separate passenger and driver dashboards.

## Product Overview

- Passengers register, verify their email, estimate a fare, request a ride, and view or cancel an active request.
- Drivers go online or offline, review waiting requests, accept requests, and progress an active ride through its lifecycle.
- Multiple passenger requests can be assigned to one ride, subject to vehicle capacity. The driver accepts requests; matching is not an automatic dispatch algorithm.
- Each passenger's solo fare, pooled fare, and savings are tracked separately in integer paisa.
- Dhaka locations are represented by a fixed list of zones with latitude and longitude.

## Features

### Accounts and security

- Passenger and driver registration with role-specific views.
- Email verification by six-digit code or emailed link before normal sign-in.
- Login with a signed JWT access token, password hashing with `bcryptjs`, and authenticated, role-protected API routes.
- Forgot-password and reset-password email flows using expiring, single-use tokens.
- Profile updates and authenticated account details.

### Passenger experience

- Fare estimation by pickup zone, dropoff zone, and seat count.
- The selected zones' stored coordinates are used.
- Ride request creation, active request/ride view, cancellation where the trip has not started, and passenger history.
- Fare details include a solo comparison, pooled estimate, and estimated savings.
- Stripe checkout for completed rides, with payment status and settlement details in ride history.
- Post-ride reviews with an optional 1–5 star rating and written comment or complaint; passengers can update their feedback.

### Driver experience

- Online/offline availability.
- List of waiting requests with fit and pickup-compatibility indicators.
- Transactional request acceptance, vehicle-capacity enforcement, and adding passengers to a shared ride.
- Ride lifecycle controls: matched, driver arrived, started, completed, or cancelled.
- Active ride passenger details and driver ride history.
- Driver rating summaries and passenger reviews/comments in trip history.

### Payments and feedback

- Stripe PaymentIntents are created for completed passenger rides and verified server-side before payment is recorded.
- Successful payment settlement updates the ride request and credits the driver's wallet.
- Passenger feedback is associated with the ride and shown to drivers as an average rating, rating count, complaint count, and recent reviews.

## Fare Logic

All money values are calculated and stored as integer paisa (100 paisa = 1 BDT). This avoids floating-point currency arithmetic. Fare calculation in `backend/src/utils/fare.calculator.js`.

### Distance

Distance is calculated between pickup and dropoff coordinates using the **Haversine formula** and an Earth radius of 6,371 km. The result is rounded to one decimal place, with a minimum billable distance of 1.0 km.

### Solo estimate

The undiscounted per-passenger fare is:

```text
raw solo fare = base fare + distance charge + additional-seat charge
solo fare     = raw solo fare
pooled quote  = raw solo fare - 10% pool discount
```

Current constants:

| Component | Amount |
| --- | ---: |
| Base fare | 5,000 paisa (50 BDT) |
| Distance | 2,500 paisa (25 BDT) per km |
| Each seat after the first | 2,000 paisa (20 BDT) |
| Pool discount | 10% |
| Maximum pooled driver earnings | 2,500 paisa (25 BDT) per route km, plus one base fare |

For example, one seat over a 5.0 km route has a solo fare of `5,000 + (5 × 2,500) = 17,500 paisa` (175 BDT). The estimated pooled fare for that request is 10% lower: 15,750 paisa (157.50 BDT), a saving of 1,750 paisa (17.50 BDT).

### Pool allocation

The estimate endpoint returns a solo estimate and a per-request pooled estimate. When a driver accepts a request into a ride, the backend recalculates the fare for all passengers currently in that pool:

1. Calculate each passenger's solo fare from their own route distance and seat count, without a pool discount.
2. Sum those solo fares and apply the 10% pool discount to the sum.
3. Calculate the pool revenue cap as `base fare + (longest passenger route distance × maximum earnings per km)`.
4. Set the pooled ride total to the lower of the discounted sum and the revenue cap.
5. Split that total among passengers in proportion to their solo fares. Any leftover single paisa is assigned by largest fractional remainder, so the allocated passenger fares add up exactly to the pooled total.

Each passenger's final allocated fare and savings versus their solo fare are stored on the ride membership record. A new acceptance triggers recalculation for the whole pool, so earlier allocations can change as passengers join. The estimate is not a payment authorization.

## Technologies

| Area | Technologies |
| --- | --- |
| Frontend | React 19, Vite, React Router, Tailwind CSS, Base UI, Lucide icons |
| Maps and coordinates | Mapbox GL / `react-map-gl` and Leaflet dependencies; fare distance uses the Haversine formula |
| Backend | Node.js (ES modules), Express 4 |
| API validation | Zod |
| Database | PostgreSQL with `pg` and parameterized SQL |
| Schema management | Versioned SQL migrations and a database seed script |
| Authentication | JWT (`jsonwebtoken`), `bcryptjs`, hashed verification and reset tokens |
| Payments | Stripe PaymentIntents and Stripe Elements |
| Email | Nodemailer with Gmail SMTP configuration |
| API protection | Helmet, CORS configuration, and `express-rate-limit` |
| Local orchestration | Docker Compose |
| Deployment | Render for the frontend and backend; Neon for hosted PostgreSQL |

## Deployment

The deployed application is available at [dhaka-tesla-pool-sdfe.onrender.com](https://dhaka-tesla-pool-sdfe.onrender.com/).

- **Frontend:** hosted on Render.
- **Backend API:** hosted on Render.
- **Database:** PostgreSQL hosted by Neon; the backend connects using its configured database connection string.

Deployment secrets and environment-specific settings are configured in the hosting providers and should not be committed to the repository.

### Render backend environment

Set these variables in the Render backend service. Use the connection string copied from the Neon dashboard for `DATABASE_URL`; do not commit real values.

```dotenv
NODE_ENV=production
DATABASE_URL=<Neon PostgreSQL connection string>
JWT_SECRET=<long-random-secret>
JWT_EXPIRES_IN=7d
FRONTEND_URL=https://domain.onrender.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=<your-email-address>
SMTP_PASS=<your-gmail-app-password>
MAIL_FROM=<sender-name-and-email>
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_DUMMY_MODE=false
```

`SMTP_*` and `MAIL_FROM` are only needed for email delivery. Render provides `PORT` to the backend automatically; do not hard-code it. The frontend currently calls same-origin `/api` and `/health` paths, so its Render web server must proxy those paths to the backend service. No frontend environment variable is currently read by the app.

## Architecture

```mermaid
flowchart LR
  People[Passengers and drivers] --> Browser
  Stripe[Stripe]

  subgraph Frontend[Browser: React + Vite]
    Browser[Web app]
    Screens[Landing, auth, dashboards, profile]
    PaymentUI[Stripe payment form]
    FeedbackUI[Ratings and comments]
    AuthState[Auth state and API client]
    Browser --> Screens --> AuthState
    Screens --> PaymentUI
    Screens --> FeedbackUI
  end

  AuthState -->|REST JSON requests + JWT bearer token| API
  PaymentUI -->|Stripe.js payment confirmation| Stripe

  subgraph Backend[Node.js + Express API]
    API[HTTP API]
    Middleware[Helmet, CORS, auth/role checks,
    auth rate limits, Zod validation]
    Routes[Auth, zones, rides, drivers, payments, feedback]
    Services[Controllers and application services]
    Fare[Distance and fare calculator]
    PaymentService[Payment intent and settlement]
    FeedbackService[Review and rating service]
    API --> Middleware --> Routes --> Services
    Services -->|Fare estimates and pool allocation| Fare
  end

  Services -->|Parameterized SQL and transactions| Database[(PostgreSQL)]
  Services --> PaymentService
  Services --> FeedbackService
  PaymentService -->|Create and verify PaymentIntents| Stripe
  PaymentService -->|Record payment and wallet credit| Database
  FeedbackService -->|Store ratings and comments| Database
  Services -->|Nodemailer over SMTP| Mail[Email provider]
  Mail -->|Verification and password-reset messages| People
```

Ride acceptance and pooled fare updates run in a database transaction. The API locks the driver's Tesla and the selected waiting request while checking status and capacity, which prevents concurrent acceptances from silently exceeding vehicle capacity.

```mermaid
erDiagram
  users {
    uuid id PK
    text email UK
    text full_name
    text phone UK
    user_role role
    timestamptz email_verified_at
  }
  email_verification_tokens {
    uuid id PK
    uuid user_id FK
    text code_hash
    text token_hash
    timestamptz expires_at
    timestamptz consumed_at
  }
  password_reset_tokens {
    uuid id PK
    uuid user_id FK
    text token_hash
    timestamptz expires_at
    timestamptz consumed_at
  }
  teslas {
    uuid id PK
    uuid driver_id FK,UK
    text name
    smallint capacity
    tesla_ops_status ops_status
  }
  zones {
    uuid id PK
    text slug UK
    text name UK
    numeric latitude
    numeric longitude
  }
  ride_requests {
    uuid id PK
    uuid passenger_id FK
    uuid pickup_zone_id FK
    uuid dropoff_zone_id FK
    smallint seats
    request_status status
    integer estimated_fare_paisa
    integer solo_fare_paisa
    numeric pickup_lat
    numeric pickup_lng
    numeric dropoff_lat
    numeric dropoff_lng
  }
  rides {
    uuid id PK
    uuid tesla_id FK
    uuid driver_id FK
    ride_status status
    smallint occupied_seats
    timestamptz arrived_at
    timestamptz started_at
    timestamptz completed_at
  }
  ride_passengers {
    uuid id PK
    uuid ride_id FK
    uuid request_id FK,UK
    uuid passenger_id FK
    uuid pickup_zone_id FK
    uuid dropoff_zone_id FK
    smallint seats
    integer fare_paisa
    integer solo_fare_paisa
    integer pool_savings_paisa
    passenger_on_ride_status status
  }
  ride_events {
    uuid id PK
    uuid ride_id FK
    uuid request_id FK
    uuid actor_id FK
    text event_type
    text from_status
    text to_status
    jsonb payload
  }
  payments {
    uuid id PK
    uuid ride_passenger_id FK
    integer amount_paisa
    payment_method method
    payment_status status
  }
  ride_feedback {
    uuid id PK
    uuid request_id FK
    uuid ride_id FK
    uuid ride_passenger_id FK
    uuid passenger_id FK
    uuid driver_id FK
    uuid submitted_by FK
    smallint rating
    text complaint
    timestamptz created_at
  }

  users ||--o{ email_verification_tokens : receives
  users ||--o{ password_reset_tokens : receives
  users ||--o| teslas : drives
  users ||--o{ ride_requests : requests
  users ||--o{ rides : drives
  users ||--o{ ride_passengers : rides_as_passenger
  teslas ||--o{ rides : assigned_to
  rides ||--o{ ride_passengers : carries
  ride_requests ||--o| ride_passengers : matched_into
  zones ||--o{ ride_requests : pickup_zone
  zones ||--o{ ride_requests : dropoff_zone
  zones ||--o{ ride_passengers : pickup_zone
  zones ||--o{ ride_passengers : dropoff_zone
  rides o|--o{ ride_events : records
  ride_requests o|--o{ ride_events : records
  users o|--o{ ride_events : acts_in
  ride_passengers ||--o{ payments : has_payment_records
  ride_requests ||--o{ ride_feedback : receives
  rides o|--o{ ride_feedback : gets_reviews
  users ||--o{ ride_feedback : submits
```


## Repository Layout

```text
backend/
  migrations/       PostgreSQL schema and incremental migrations
  src/config/       Environment configuration
  src/db/           Connection pool, migration runner, and seed script
  src/middleware/   Authentication, role checks, and error handling
  src/modules/      Auth, drivers, rides, and zones API modules
  src/utils/        Fare calculations, tokens, and email delivery
frontend/
  src/components/   Passenger/driver dashboards and shared UI
  src/pages/        Landing, registration, sign-in, and recovery pages
  src/              API client, auth state, and application styles
docker-compose.yml  Local multi-service configuration
```

## API Summary

Authenticated endpoints expect `Authorization: Bearer <token>`. Driver and passenger endpoints additionally enforce the matching account role.

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| `POST` | `/api/auth/register` | Public | Register a passenger or driver; initialize wallet and, for a driver, Tesla |
| `POST` | `/api/auth/login` | Public | Sign in and receive an access token |
| `POST` | `/api/auth/verify-email` | Public | Verify using `{ email, code }` |
| `GET` | `/api/auth/verify-email?token=...` | Public | Verify using the emailed link |
| `POST` | `/api/auth/resend-verification` | Public | Resend a verification message |
| `POST` | `/api/auth/forgot-password` | Public | Start password recovery |
| `POST` | `/api/auth/reset-password` | Public | Set a new password using `{ token, password }` |
| `GET` | `/api/auth/me` | Signed in | Read the current user |
| `PATCH` | `/api/auth/profile` | Signed in | Update profile details |
| `GET` | `/api/zones` | Public | List supported service zones |
| `POST` | `/api/rides/estimate` | Signed in | Estimate solo and pooled fares |
| `POST` | `/api/rides/requests` | Passenger | Create a ride request |
| `GET` | `/api/rides/requests/active` | Passenger | Read the current active request or ride |
| `POST` | `/api/rides/requests/:id/cancel` | Passenger | Cancel an eligible request |
| `GET` | `/api/rides/requests/history` | Passenger | Read passenger ride history |
| `GET` | `/api/payments/config` | Public | Read Stripe publishable-key and payment-mode configuration |
| `POST` | `/api/payments/create-intent` | Passenger | Create or retrieve a payment intent for a completed ride |
| `POST` | `/api/payments/confirm` | Passenger | Verify and settle a Stripe payment |
| `POST` | `/api/feedback` | Signed in passenger or driver | Submit or update ride feedback |
| `GET` | `/api/feedback/request/:requestId` | Signed in | Read the current user's feedback for a ride request |
| `GET` | `/api/feedback/driver` | Driver | Read driver rating summary and recent passenger feedback |
| `GET` / `PATCH` | `/api/drivers/tesla` | Driver | Read or update vehicle settings |
| `POST` | `/api/drivers/status` | Driver | Change availability |
| `GET` | `/api/drivers/available-requests` | Driver | List waiting requests and capacity/compatibility information |
| `POST` | `/api/drivers/rides/accept` | Driver | Accept a request into a ride/pool |
| `GET` | `/api/drivers/active-ride` | Driver | Read the active ride |
| `POST` | `/api/drivers/rides/transition` | Driver | Advance or cancel a ride |
| `GET` | `/api/drivers/history` | Driver | Read driver ride history |
| `GET` | `/health` | Public | Check API health |

Request bodies are validated at the API boundary. See the route validators and controller/service modules for the precise fields and response shapes.

## Screenshots

Add images later by replacing each HTML comment with an image link, for example `![Caption](docs/screenshots/filename.png)`. Keep each caption as written or adjust it to match the screenshot.

### Landing Page

<img width="1897" height="873" alt="landing" src="https://github.com/user-attachments/assets/5f841e1e-9d5d-4e47-aeed-5a6b5bedca67" />

*Caption: Public landing page for Dhaka Tesla Pool.*

### Registration and Email Verification

<img width="1015" height="863" alt="register" src="https://github.com/user-attachments/assets/3b7ee183-c447-443b-828f-b999f6ac44ae" />

<img width="1437" height="870" alt="login" src="https://github.com/user-attachments/assets/82865d87-4cb8-4d67-8561-90151f9580fc" />

<img width="662" height="587" alt="verify_code" src="https://github.com/user-attachments/assets/07a6bd69-cb68-4e03-bd7b-abdf1229d3fd" />

<img width="1208" height="586" alt="reset_pass" src="https://github.com/user-attachments/assets/6bb85e60-ba60-434b-a2a8-e283fff74c05" />


*Caption: Passenger/driver registration and email verification flow.*

### Passenger Fare Estimate and Ride Request

<img width="1920" height="872" alt="passanger dash2" src="https://github.com/user-attachments/assets/9116bfb8-a3bd-411b-9776-3a7f56597ed8" />

<img width="1920" height="881" alt="req_ pool" src="https://github.com/user-attachments/assets/4228ec09-7eb7-4d6f-87d7-27a7c6c18922" />

*Caption: Passenger selects a route, reviews the fare estimate, and requests a ride.*

### Fare Division

<img width="1920" height="891" alt="fare_distributed" src="https://github.com/user-attachments/assets/361bc2f6-0fa3-43e7-9602-3000ad1b4ec5" />


*Caption: Passenger view of an active request or matched ride, including their fare status.*

### Stripe Payment and Settlement

<img width="1918" height="873" alt="stripe" src="https://github.com/user-attachments/assets/f16f08d5-5c71-4d34-bf0e-6a08ebfe589f" />

*Caption: Passenger pays the completed ride fare and sees the payment confirmation.*

### Ride Reviews and Comments

<img width="1013" height="712" alt="review, comment" src="https://github.com/user-attachments/assets/8d6a79a8-5a3e-43d8-bcea-ca74228f8ead" />

*Caption: Passenger submits a star rating and optional ride comment.*

### Driver Dashboard

<img width="1920" height="873" alt="driver dash" src="https://github.com/user-attachments/assets/589d5990-55ff-46fd-8ec9-15272ad503cb" />

*Caption: Driver availability, vehicle capacity, and requests eligible for acceptance.*

### Profile, History

<img width="1920" height="867" alt="profile_dash" src="https://github.com/user-attachments/assets/a06e3900-9b46-47c6-a1b8-d21942235e4f" />

<img width="1255" height="783" alt="history" src="https://github.com/user-attachments/assets/be6ea0bd-7878-4185-bf21-fd5e0930ef1f" />

*Caption: Signed-in user profile and account details.*

## Local Development

### Prerequisites

- Node.js 22 or newer and npm.
- PostgreSQL (the project was developed against PostgreSQL 18). Docker Desktop is optional if using a local database.
- A Gmail account with an [App Password](https://myaccount.google.com/apppasswords) if you want email delivery.

### Configure the backend

Create a PostgreSQL database named `dhaka_tesla_pool`, then create `backend/.env` for local development:

```dotenv
NODE_ENV=development
PORT=4000
DATABASE_URL=postgres://postgres:postgres@localhost:5432/dhaka_tesla_pool
JWT_SECRET=<replace-with-a-local-random-secret>
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=<your-email-address>
SMTP_PASS=<your-gmail-app-password>
MAIL_FROM="Dhaka Tesla Pool <your-email-address>"
```

SMTP settings are optional for local development; without them, verification details are available through the development flow. Never commit `.env` or real credentials.

For live or Stripe test-mode payments, configure `STRIPE_SECRET_KEY` and `STRIPE_PUBLISHABLE_KEY` in the backend environment. In local development, payments can use the simulated flow when Stripe keys are omitted; `STRIPE_DUMMY_MODE=true` explicitly selects that mode. Simulated payments are disabled in production.

Install dependencies, apply migrations, and start the API:

```bash
cd backend
npm i
npm run migrate
npm run seed
npm run dev
```

The API starts on the configured backend port (default: `3000`). The seed script inserts the supported zone data needed for estimates and ride requests.

### Start the frontend

In another terminal:

```bash
cd frontend
npm i
npm run dev
```

Open `http://localhost:5173`. Register with an inbox you can access and follow the verification code.

### Docker Compose

When Docker Desktop is available and the Compose configuration is set up with the required environment, run:

```bash
docker compose up --build
```

The Docker path has not been verified on the original Windows development machine; local PostgreSQL is the documented development path.

## Data and Design Notes

- One Tesla belongs to each driver. A new driver receives a default vehicle with capacity 3.
- Money is stored as integer paisa in ride requests, passenger allocations, and payment records.
- SQL migrations define users and roles, vehicles, zones, ride requests, rides, passenger memberships, audit events, payments, feedback, and token records.
- Foreign keys, unique constraints, checks, and indexes enforce core integrity rules in PostgreSQL.
- Ride status changes and passenger/vehicle occupancy are represented separately so a shared vehicle ride can contain multiple passenger requests.
- Email verification and password-reset tokens are stored hashed, expire, and are consumed after use.
- Authentication and verification responses are designed to avoid revealing whether an email is registered where practical.

## AI Usage

- **Tool:** Cursor, Claude, Copilot, Windsurf, Antigravity, Qwen.
- **Used for:** Assistance with scaffolding and iterating on the React application, SQL schema, and authentication flows.
- **Design decisions retained:** Integer paisa for money and hashed email-verification/password-reset tokens instead of storing raw token values.
- **Development environment:** Local PostgreSQL was used.
