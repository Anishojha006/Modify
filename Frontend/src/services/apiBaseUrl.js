const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();

const isLocalApiUrl = configuredApiUrl
    ? ["localhost", "127.0.0.1", "[::1]"].includes(
        new URL(configuredApiUrl, window.location.origin).hostname
    )
    : false;

export const apiBaseUrl = import.meta.env.PROD
    && (!configuredApiUrl || isLocalApiUrl)
    ? "/api/auth"
    : configuredApiUrl;
