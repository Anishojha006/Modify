import axios from "axios";
import { apiBaseUrl } from "../../../services/apiBaseUrl.js";

const api = axios.create({
    baseURL: apiBaseUrl.replace(/\/api\/auth\/?$/, ""),
    withCredentials:true,
});

export async function getSongs({mood}){
   const response = await api.get("/api/songs", { params: { mood } });
   return response.data;
}