# Deployment

This project deploys as one Node.js service. The Vite frontend is built into
`Frontend/dist/` and copied into `Backend/src/public/`, where Express serves it
alongside the API. Use managed MongoDB, Redis, and ImageKit services; the
application does not include production instances of these dependencies.

## Build and run

- Build the frontend by running `npm ci` and `npm run build` from `Frontend/`.
  The build copies the generated site into `Backend/src/public/`.
- Install the API dependencies with `npm ci` from `Backend/`, then start it
  with `npm start`.
- Use Node.js 20.19 or newer.
- Configure `MONGO_URI`, `SECRET_KEY`, `REDIS_HOST`, `REDIS_PORT`,
  `REDIS_PASSWORD`, and `IMAGEKIT_PRIVATE_KEY` as environment variables for the
  backend service in your hosting provider. A local `Backend/.env` file is not
  automatically uploaded or loaded by the host.
- If the machine's default DNS resolver refuses MongoDB Atlas SRV lookups, set
  `MONGODB_DNS_SERVERS` to a comma-separated list of DNS resolver IPs permitted
  by your network (for example, `1.1.1.1,8.8.8.8`). This changes Node's DNS
  resolvers for the backend process; prefer fixing the machine/network DNS
  configuration when possible.
- Use a randomly generated `SECRET_KEY` of at least 32 characters. Never commit
  secrets or use production credentials in local tests.
- Set `NODE_ENV=production`. If the frontend and API use different origins,
  set `CORS_ORIGIN` to the exact frontend origin (scheme and hostname, with no
  trailing slash); multiple origins can be comma-separated. It can be omitted
  when the frontend and API share an origin. The hosting platform should
  provide `PORT`.
- Production rate limits use Redis. Keep Redis reachable by every application
  instance so authentication and API counters are shared.
- If the service is behind a reverse proxy, set `TRUST_PROXY` to the exact
  trusted proxy hop count or trusted proxy subnet(s). Do not set it to `true`
  unless the backend is inaccessible except through a trusted proxy.
- Configure the platform liveness check to request `/health` and its readiness
  check to request `/ready`. The server waits for Redis and MongoDB at startup
  and closes both connections during graceful shutdown.

Production builds default `VITE_API_URL` to `/api/auth`, so the same-origin
API works without extra frontend configuration. Override it at build time only
if the API is hosted at a different origin. Localhost API URLs are ignored by
production builds and resolve to the same-origin API instead. Keep HTTPS
enabled in production for secure authentication cookies.

## Release checklist

- Run `npm ci`, `npm audit --omit=dev`, `npm test`, `npm run lint`, and
  `npm run build` from the relevant backend and frontend directories.
- Run the browser E2E suite against the intended deployment configuration.
- Confirm the application can connect to the production MongoDB and Redis
  services, and verify `/ready` changes to `503` when either dependency is
  unavailable.
- Enable automated, encrypted MongoDB backups and perform a restore exercise
  before launch. This repository does not configure backups.
- Configure centralized logs, error alerts, uptime monitoring, and a process
  restart policy. This repository does not include an observability provider.
- Verify the hosting provider's TLS, firewall, trusted-proxy chain, Redis
  persistence, and ImageKit access policies.
- Test upload rejection, API rate limits, authentication, CSRF protection, and
  session revocation against a staging environment before public release.

Helmet response headers are enabled; Content Security Policy is intentionally
not enabled yet because the face-analysis feature loads assets from external
CDNs. Pin and review those origins before defining and enforcing a CSP.
