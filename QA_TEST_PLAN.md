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
| POST | `/api/auth/logout` | Clear and blacklist user JWT |
| POST | `/api/v1/admin/login` | Authenticate admin |
| GET | `/api/v1/admin/getme` | Restore admin session |
| POST | `/api/v1/admin/logout` | Revoke admin session |
| POST | `/api/songs` | Upload a song |
| DELETE | `/api/songs/:id` | Delete a song and stored files |
| GET | `/api/songs?mood=...` | Fetch one song for a mood |
| GET | `/api/csrf-token` | Issue a CSRF token |
| GET | `/ready` | Report MongoDB and Redis readiness |

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

## Environment and coverage limits

- Integration tests use an ephemeral MongoDB database named
  `modify_qa_test`, an in-memory rate-limit store, and mocked Redis and
  ImageKit behavior. They do not verify the production Redis store or external
  service availability.
- Browser E2E tests mock API responses. They validate selected frontend flows,
  not deployed end-to-end behavior.
- Production limits are backed by Redis; configure `TRUST_PROXY` only for the
  deployment's actual proxy topology.
- No automated backup, restore, load, or production monitoring checks are
  provided by this repository.
- Do not use production credentials or data during local test runs.
