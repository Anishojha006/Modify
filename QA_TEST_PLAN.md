# QA test plan

## Application map

- **Frontend:** React 19 SPA built with Vite; React Router owns user and admin routes.
- **Backend:** Express 5 app mounted by `Backend/server.js`; JSON and cookie parsing, CORS, static frontend hosting, and health checks are configured in `Backend/src/app.js`.
- **Authentication:** User and admin login issue separate HTTP-only JWT cookies. User logout blacklists its token in Redis. User session restoration uses `/api/auth/get-me`.
- **Persistence and integrations:** Mongoose models cover users, admins, songs, and token blacklist records. Song uploads use in-memory Multer buffers and ImageKit; Redis handles logout revocation.

### API routes

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/health` | Health check |
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | Authenticate user |
| GET | `/api/auth/get-me` | Restore user session; user JWT required |
| GET | `/api/auth/logout` | Clear and blacklist user JWT |
| POST | `/api/v1/admin/login` | Authenticate admin |
| GET | `/api/v1/admin/getme` | Restore admin session |
| POST | `/api/songs` | Upload a song |
| GET | `/api/songs?mood=...` | Fetch one song for a mood |

### Models

- `modify-users`: username, email, password hash (excluded from normal queries).
- `Admin`: username and password hash.
- `songs`: title, song URL, poster URL, and validated mood.
- `tokenblacklisting`: token and timestamps.

## Test matrix

| Area | Coverage |
| --- | --- |
| Frontend unit | Login by email/username, successful navigation, rejected login, registration validation, API error display, successful registration navigation |
| Backend integration | Health response, registration, duplicate and invalid input, login, cookie/session restoration, invalid credentials, admin login/session, song lookup |
| Authorization/security | Unauthenticated song-upload rejection; HTTP-only auth cookie; password not returned to clients; no default admin password |
| Browser E2E | Login to protected dashboard; registration form blocks mismatched passwords before sending a request |
| Database safety | Backend integration tests use an ephemeral MongoDB instance with database name `modify_qa_test`; no configured or production database URI is used |

## Test layout

```text
Frontend/
  e2e/auth.spec.js
  playwright.config.js
  src/test/setup.js
  src/features/auth/pages/Login.test.jsx
  src/features/auth/pages/Register.test.jsx
  vitest.config.js
Backend/
  test/integration/api.test.js
QA_TEST_PLAN.md
```

## Run tests

From `Frontend/`:

```sh
npm install
npm test
npx playwright install chromium
npm run test:e2e
npm run lint
npm run build
```

From `Backend/`:

```sh
npm install
npm test
```

`Backend/test/integration/api.test.js` starts and stops its own in-memory MongoDB instance. It mocks Redis and does not upload files to ImageKit.

## Known gaps observed during inspection

- Song upload is currently mounted without an admin authentication middleware. Its regression test is expected to fail until server-side authorization is added.
- Backend user registration does not validate required fields before querying/hashing; the incomplete-input regression test is expected to fail until input validation returns a 4xx response.
- The admin schema currently supplies `"admin"` as a default password hash. Its regression test is expected to fail until admin credentials are always explicitly provisioned as a password hash.
- Admin login and song management pages are currently UI-only; they do not call the admin or song APIs. E2E coverage does not claim those admin journeys work.
- This test suite does not replace real-service tests for MongoDB, Redis, or ImageKit. No production credentials or data should be used for local test runs.
