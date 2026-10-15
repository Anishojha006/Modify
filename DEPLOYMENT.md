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
- Configure the variables from [`Backend/.env.example`](Backend/.env.example):
  `MONGO_URI`, `SECRET_KEY`, `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`,
  `IMAGEKIT_PRIVATE_KEY`, `IMAGEKIT_PUBLIC_KEY`, and `IMAGEKIT_URL_ENDPOINT`.
- Set `NODE_ENV=production`. If the frontend and API share an origin,
  `CORS_ORIGIN` is not needed; otherwise set it to the exact frontend origin
  (scheme and hostname, with no trailing slash). Multiple origins can be
  comma-separated. The hosting platform should provide `PORT`.
- Configure the platform health check to request `/health`.

Production builds default `VITE_API_URL` to `/api/auth`, so the same-origin
API works without extra frontend configuration. Override it at build time only
if the API is hosted at a different origin. Keep HTTPS enabled in production
for secure authentication cookies.
