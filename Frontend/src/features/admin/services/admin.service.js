import axios from "axios";
import { apiBaseUrl } from "../../../services/apiBaseUrl.js";


const api = axios.create({
    baseURL: apiBaseUrl,
    withCredentials:true,
});


export async function login({
    username,
    password,
}) {
    const response = await api.post("api/v1/admin/login", {
        username,
        password,
    });

    return response.data;
}

