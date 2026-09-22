import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

console.log(API_URL);

const request = async (path, body) => {
    try {
        const response = await axios.post(
            `${API_URL}${path}`,
            body,
            {
                withCredentials: true,
                headers: {
                    "Content-Type": "application/json",
                },
            }
        );

        return response.data;

    } catch (error) {
        console.error("Auth request failed:", error);

        throw new Error(
            error.response?.data?.message ||
            error.message ||
            "Request failed"
        );
    }
};


export async function register({
    username,
    email,
    password
}) {
    return request("/register", {
        username,
        email,
        password
    });
}


export async function login({
    username,
    email,
    password
}) {
    return request("/login", {
        username,
        email,
        password
    });
}