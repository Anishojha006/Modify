export function getCsrfToken() {
    const tokenCookie = document.cookie
        .split("; ")
        .find((cookie) => cookie.startsWith("csrf_token="));

    if (!tokenCookie) {
        return "";
    }

    const [, rawToken] = tokenCookie.split("=");
    return rawToken ? decodeURIComponent(rawToken) : "";
}

export function attachCsrfHeader(config = {}) {
    const method = String(config.method ?? "get").toLowerCase();

    if (!["post", "put", "patch", "delete"].includes(method)) {
        return config;
    }

    const csrfToken = getCsrfToken();

    if (!csrfToken) {
        return config;
    }

    return {
        ...config,
        headers: {
            ...(config.headers ?? {}),
            "X-Csrf-Token": csrfToken,
        },
    };
}
