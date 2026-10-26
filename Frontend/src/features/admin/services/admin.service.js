import axios from "axios";
import { apiBaseUrl } from "../../../services/apiBaseUrl.js";
import { attachCsrfHeader } from "../../../services/csrf.js";

const apiRootUrl = apiBaseUrl?.replace(/\/api\/auth\/?$/, "") ?? "";

const api = axios.create({
    baseURL: `${apiRootUrl}/api/v1/admin`,
    withCredentials: true,
});

api.interceptors.request.use((config) => attachCsrfHeader(config));


export async function login({
    username,
    password,
}) {
    const response = await api.post("/login", {
        username,
        password,
    });

    return response.data;
}

export async function getme() {
    const response = await api.get("/getme");
    return response.data;
}

export async function logout() {
    const response = await api.post("/logout");
    return response.data;
}
