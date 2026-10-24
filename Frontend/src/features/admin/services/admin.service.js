import axios from "axios";
import { apiBaseUrl } from "../../../services/apiBaseUrl.js";


const apiRootUrl = apiBaseUrl?.replace(/\/api\/auth\/?$/, "") ?? "";

const api = axios.create({
    baseURL: `${apiRootUrl}/api/v1/admin`,
    withCredentials: true,
});


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

// export async function logout(){
//     const 
// }
