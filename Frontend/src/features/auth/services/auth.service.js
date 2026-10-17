import axios from "axios";
import { apiBaseUrl } from "../../../services/apiBaseUrl.js";


const api = axios.create({
    baseURL: apiBaseUrl,
    withCredentials:true,
});


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

export async function logout() {
    const response = await api.get("/logout");

    return response.data;
}