import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL.replace(/\/api\/auth\/?$/, ""),
    withCredentials:true,
});

export async function getSongs({mood}){
   const response = await api.get("/api/songs", { params: { mood } });
   return response.data;
}