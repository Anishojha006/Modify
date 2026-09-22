const API_URL = import.meta.env.VITE_API_URL;

const request = async (path, body) => {
    const response = await fetch(`${API_URL}${path}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "Request failed");
    }

    return data;
};

export async function register({ username, email, password }) {

    return request("/register", { username, email, password });
}

export async function login({ username, email, password }) {
    return request("/login", { username, email, password });
}