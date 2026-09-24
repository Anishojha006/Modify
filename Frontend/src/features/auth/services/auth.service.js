import api from "./api.js";


export async function register({
    username,
    email,
    password,
}) {
    const response = await api.post("/register", {
        username,
        email,
        password,
    });

    return response.data;
}


export async function login({
    username,
    email,
    password,
}) {
    const response = await api.post("/login", {
        username,
        email,
        password,
    });

    return response.data;
}


export async function getme() {
    const response = await api.get("/get-me");

    return response.data;
}